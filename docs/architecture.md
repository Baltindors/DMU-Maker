# Architecture

Single-page React app. Vite, TypeScript, Tailwind CSS 4. No router and no backend in this repo.

Describes `src/main.tsx`, `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/PreviewPane.tsx`, `src/context/DmuContext.tsx`, and `src/context/dmu-context.ts`.

## Layout

`App` wraps the screen in `DmuProvider`.

- `Sidebar` (fixed 360px) is the designer controls: activity code, preview size, colors, faculty photo replacement, export.
- `PreviewPane` renders the generated DMU in an iframe (`srcDoc`) and shows idle, loading, and error copy.

`App` holds the preview size (`desktop`, `tablet`, or `phone`, default desktop) and passes it to both components. The sidebar buttons sit under Fetch activity. The iframe is centered in the pane: desktop is 100% of the pane, tablet is 768px, and phone is 375px. The pane scrolls if that width is wider than the space beside the sidebar. 768px is inside the DMU's 810px `break-iPad-p` query, so the hero stacks. 375px is inside the 600px query, so the page stacks.

## State

`DmuProvider` owns:

| State | Role |
| --- | --- |
| `activity` | Current `DmuActivity`, or `null` |
| `status` | `idle`, `loading`, `success`, or `error` |
| `error` | Message after a failed fetch |
| `uploadingFacultyIndex` | Faculty row whose photo upload is in flight, or `null` |
| `uploadError`, `uploadErrorIndex` | Last photo upload failure, shown on that row |
| `primaryColor`, `secondaryColor`, `ctaColor` | Hex colors, defaulted in `src/types/dmu.ts` |

`useDmu()` throws if it is used outside `DmuProvider`.

`fetchActivity` ignores blank input, a fetch that is already in flight, and calls while a photo upload is in flight. `replaceFacultyPhoto` also ignores a fetch that is already in flight. `fetchActivity` increments a request id and drops responses from older requests. The source is `fetchSynapseActivity` or `fetchMockActivity`, chosen by `usesMockActivityData` in `src/services/activitySource.ts`. A new fetch clears the previous activity's `blob:` photo URLs and any upload error.

`replaceFacultyPhoto` takes the selected file. In mock mode it stores an object URL and revokes the previous `blob:` URL. An out-of-range index revokes the new URL and leaves state unchanged. In live mode it checks the file type and size, posts the file, and stores `data.url`. A successful mock or live replacement sets `isReplaced` on that faculty member. A missing faculty `id` or a rejected file sets `uploadError` and does not change the photo. A failed upload leaves the current photo. A new fetch replaces the activity, so loaded faculty do not have `isReplaced`. Activity search and export stay disabled while `uploadingFacultyIndex` is set.

Colors are not reset when a new activity loads.

## Preview

`PreviewPane` calls `generateDmuHtml`, then `withPreviewCss`, so the iframe has the stylesheet inlined. The export zip does not inline CSS. See `docs/dmu-output.md`.
