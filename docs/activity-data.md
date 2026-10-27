# Activity data

Describes `src/types/dmu.ts`, `src/services/mockDataService.ts`, `src/services/synapseApiService.ts`, `src/services/activitySource.ts`, and the fetch path in `src/context/DmuContext.tsx`.

## `DmuActivity`

| Field | Use |
| --- | --- |
| `activityCode` | Lookup key, export filename, register URL, live-webinar rule |
| `title` | DMU `<title>` and `<h1>` |
| `date` | Date line under the header |
| `cme_credits` | Number or string. Rendered as `FREE {credits} CME/CE` |
| `overview` | HTML inserted as-is into the overview section. Not escaped |
| `artwork_url` | Hero image URL. Left as a remote URL in the zip |
| `commercial_support_statement` | Footer support line. Escaped |
| `faculty` | Ordered list of `{ id?, role, name, titles, photo_url, isReplaced? }` |

`id` is the Synapse faculty id. Mock members omit it. A live photo upload sends it as `faculty_id`. `isReplaced` is app state, not a Synapse or mock field. A fetch leaves it unset. A successful photo replacement sets it to `true` on that member.

`titles` is plain text. Newlines become `<br>` in the DMU. Live faculty turn `<br>`, `<br/>`, and `<br />` (any case) in `title` and `affiliations` into newlines, drop carriage returns, collapse consecutive breaks into one newline, trim each field, drop blanks, then join the two fields with a newline. `photo_url` is a remote image URL, a `blob:` URL from a mock replacement, or the `https://` URL returned by a Synapse upload. A non-empty live `artwork_url` or faculty `photo_url` from the activity payload also gets `?t=` plus the fetch timestamp so a replaced file at the same URL is not served from the browser cache. An upload URL is stored as returned.

Default colors, also the CSS fallbacks:

| Token | Default | DMU variables |
| --- | --- | --- |
| Primary | `#388f69` | `--headerbg`, `--flexfiller` |
| Secondary | `#444444` | `--snapshotBG` |
| CTA | `#358e27` | `--ctabutton` |

## Which source is used

`usesMockActivityData` is true when `VITE_USE_MOCK_DATA` is `true`, or when `VITE_API_BASE_URL` is empty. Otherwise `fetchActivity` calls Synapse. A GitHub Pages build sets neither variable, so that deploy stays on the mock catalog.

Env var names are listed in `docs/deployment.md`. Values stay in `.env.local`.

## Mock catalog

`fetchMockActivity` waits 400ms, uppercases the code, and returns a clone. Unknown or blank codes throw (`Activity not found.` / `Activity code is required.`).

| Code | Live webinar badge |
| --- | --- |
| `13WC2610` | Yes (`WC` in the code) |
| `13LV258` | No |
| `13WC261` | Yes |
| `23LV261` | No |

The sidebar lists these four codes while the mock catalog is active. Adding or removing a mock activity means updating this table and that hint.

## Synapse

Both calls send `Accept: application/json`, `X-Client-Id` (`VITE_API_CLIENT_ID`), and `X-Client-Secret` (`VITE_API_CLIENT_SECRET`). `npm run dev` requests same-origin paths starting with `/client`. The Vite proxy forwards them to `VITE_API_BASE_URL`. A production build calls `VITE_API_BASE_URL` directly.

### Activity

`GET /client/integrations/dmu-maker/activities/{activityCode}`

The JSON body has a `data` object. Mapped fields:

| `DmuActivity` | Payload |
| --- | --- |
| `activityCode` | `data.activity_code`. A blank value uses the code that was requested |
| `title` | `data.title` |
| `overview` | `data.marketing_overview`. `null` becomes `""`. HTML is stored as returned |
| `date` | `data.event_date`, then `data.release_date`, then `""` |
| `cme_credits` | `data.cme_credits.amount`, or `""` when missing |
| `artwork_url` | `data.artwork_url`. `null` or blank becomes `""`. A non-empty URL gains `?t=` plus the fetch timestamp |
| `commercial_support_statement` | `data.commercial_support_statement`. `null` becomes `""` |
| `faculty[].id` | `faculty.id` when it is an integer |
| `faculty[].name` | `faculty.name` |
| `faculty[].role` | `faculty.role` |
| `faculty[].titles` | `faculty.title` and `faculty.affiliations`. `<br>`, `<br/>`, and `<br />` (any case) become newlines, carriage returns are removed, consecutive newlines collapse to one, each field is trimmed, blanks are dropped, then the fields are joined with a newline |
| `faculty[].photo_url` | `faculty.photo_url`. `null` or blank becomes `""`. A non-empty URL gains `?t=` plus the same fetch timestamp as `artwork_url` |

`project_code`, `marketing_copy`, `expiration_date`, `email_header_artwork_url`, `consent`, and `sow_status` are not stored.

### Faculty photo upload

`POST /client/integrations/dmu-maker/upload`

`multipart/form-data`. The client does not set `Content-Type`, so the browser can add the boundary.

| Field | Value |
| --- | --- |
| `file` | PNG, JPEG, or WebP, at most 10MB |
| `kind` | `faculty_photo` |
| `activity_code` | Current activity code |
| `faculty_id` | That member's `id` |

The client rejects a missing `id`, a disallowed type, or a file over 10MB before the request. Those messages stay on that faculty row.

HTTP 201 returns `data.url`. That URL replaces `photo_url`, and the client sets `isReplaced` to `true` on that member. The flag is not sent to Synapse. `file_id` and `file_key` are ignored. The preview and the zip use that remote URL. No `blob:` URL is created for a successful upload.

While an upload is in flight, activity search and export stay disabled.

### Errors

| Status | Message |
| --- | --- |
| 404 | `Activity not found in Synapse.` |
| 401 or 403 | `Authentication failed. The client id or secret is invalid or not allowlisted.` |
| 422 | A string `message`, plus string entries under `errors`, when the JSON body has them. Otherwise `The file was rejected. Use a PNG, JPEG, or WebP image that is 10MB or smaller.` |
| Other HTTP status | `Synapse request failed ({status}).` |
| `fetch` throws | `Could not reach the Synapse QA API. Check that you are on VPN and that QA is reachable.` |

A failed activity fetch clears the activity and shows the message in the preview pane. A failed upload leaves the current photo and shows the message on that faculty row.
