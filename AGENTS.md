# DMU Maker

Internal app for PRIME Education's graphic design team. A DMU is the ad unit for a CME activity that runs on MedPage Today.

## Before changing the app

1. Read the doc for the area you are changing.
2. If the change would make a sentence in `docs/`, `README.md`, or this file false or incomplete, update that file in the same change.
3. Do not invent Synapse paths, auth, or payloads. Live calls are documented in `docs/activity-data.md`. The mock catalog in `src/services/mockDataService.ts` is used when `VITE_API_BASE_URL` is empty or `VITE_USE_MOCK_DATA` is `true`.

## Docs

| Area | Doc | Code |
| --- | --- | --- |
| Audience, DMU, MedPage Today, Coolify, Synapse | `docs/product.md` | — |
| Screens, state, fetch flow | `docs/architecture.md` | `src/App.tsx`, `src/components/`, `src/context/` |
| Activity shape, mock catalog, Synapse API | `docs/activity-data.md` | `src/types/dmu.ts`, `src/services/` |
| Preview HTML, colors, zip | `docs/dmu-output.md` | `src/templates/` |
| Scripts, GitHub Pages, Coolify | `docs/deployment.md` | `package.json`, `vite.config.ts`, `.github/workflows/` |

## Rules

`.cursor/rules/` holds the Cursor project rules. `keep-docs-current.mdc` applies to every session.
