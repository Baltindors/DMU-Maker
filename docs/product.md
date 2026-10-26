# Product

DMU Maker is an internal tool for PRIME Education's graphic design team. Designers look up a CME activity, set brand colors and faculty photos, check a live preview, and download a zip. That zip is the DMU placed on MedPage Today.

MedPage Today is a sister company. The register link on every DMU points at PRIME (`primeinc.org`) and is tagged as coming from MedPage Today (`utm_source=MPT`, `utm_medium=DMU`).

## What a designer does

1. Enter an activity code (for example `13WC2610`).
2. Fetch the activity.
3. Adjust primary, secondary, and CTA colors.
4. Replace any faculty photo that should not use the source image.
5. Check the live preview.
6. Export a zip named `{activityCode}_DMU.zip`.

The app does not publish the DMU. Export is the handoff.

## Synapse

Activity content comes from Synapse when `VITE_API_BASE_URL` is set and `VITE_USE_MOCK_DATA` is not `true`. The activity call is `GET /client/integrations/dmu-maker/activities/{activityCode}`. A replacement faculty photo is `POST /client/integrations/dmu-maker/upload`. Header names, the field mapping, and error copy are in `docs/activity-data.md`. Otherwise the app uses the mock catalog in `src/services/mockDataService.ts`. Do not invent paths, auth, or payloads beyond that doc.

## Coolify

The long-term host is Coolify, on a network where the design team's browsers can call Synapse. There is no Dockerfile or Coolify config yet. GitHub Pages (`.github/workflows/pages.yml`) builds without Synapse env vars, so that deploy stays on the mock catalog. See `docs/deployment.md`.
