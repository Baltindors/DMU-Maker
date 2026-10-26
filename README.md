# DMU Maker

Internal tool for PRIME Education's graphic design team. It builds DMUs, the ad units for CME activities that run on MedPage Today.

A designer enters an activity code, adjusts colors and faculty photos, checks a live preview, and downloads `{activityCode}_DMU.zip`. Activity content comes from Synapse when `VITE_API_BASE_URL` is set. Otherwise it uses the local mock catalog. The intended host for the Synapse-backed app is Coolify. GitHub Pages keeps the mock build.

## Docs

Agents and people working in this repo should treat `docs/` as the source of truth and update it when behavior changes. Cursor rules in `.cursor/rules/` enforce that. Start at [AGENTS.md](AGENTS.md).

| Doc | Contents |
| --- | --- |
| [docs/product.md](docs/product.md) | Audience, DMU, MedPage Today, Synapse, Coolify |
| [docs/architecture.md](docs/architecture.md) | Screens, state, fetch flow |
| [docs/activity-data.md](docs/activity-data.md) | Activity fields, mock codes, Synapse mapping |
| [docs/dmu-output.md](docs/dmu-output.md) | Preview HTML, colors, zip layout |
| [docs/deployment.md](docs/deployment.md) | Scripts, GitHub Pages, Coolify target |

## Scripts

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run lint
```

Mock activity codes: `13WC2610`, `13LV258`, `13WC261`, `23LV261`.
