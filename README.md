# TamidZamin

Hebrew RTL company website for TamidZamin, built with Astro. The application is
in **`website`**, not the repository root.

## Import into Vercel

Import this GitHub repository through Vercel's **Add New > Project**:

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Root Directory | `website` |
| Node.js version | 24.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the Astro preset default; do not override it |

No secrets are needed for the initial preview. Leave `SITE_LAUNCHED` and
`LEAD_DELIVERY_ENABLED` unset or `false`. Do not upload `.env.example` values
wholesale: its placeholder domain is deliberately not a real deployment URL.
On Vercel, the app selects the Vercel adapter and uses the deployment URL for
preview metadata automatically. Set `SITE_URL` explicitly only when an approved
canonical domain is known.

**Important: this is a preview deployment, not a fully launched lead service.**
The existing anti-spam/idempotency database needs persistent storage. Vercel
Functions do not provide persistent SQLite storage, so this version explicitly
blocks lead delivery there, even if somebody sets the delivery flag to `true`.
It does not replace persistence with `/tmp`, in-memory state, or fake success.
Before activating the form on Vercel, migrate that store to an approved durable
service and verify real receiver delivery. The original dedicated-Node
deployment remains supported.

The preview remains noindex with an honest disabled-form notice. Use Vercel's
deployment protection when sharing unpublished business material: noindex is
not access control. Import/deployment can create a publicly reachable URL;
review that choice in Vercel before proceeding. This preparation does not create
or deploy a Vercel project. Once connected, future Git pushes may trigger Vercel
deployments automatically.

## Run locally

```powershell
Set-Location .\website
npm ci
npm run build
npm start
```

Open `http://localhost:4321/`. For live development use `npm run dev`.

To validate Vercel output locally without publishing or a Vercel account:

```powershell
npm run build:vercel
npm run test:vercel
```

Use `npm run build` again before `npm start` to return to the standalone Node
build. The Vercel build writes `.vercel\output`; it is not committed.

## Contents

- `website\`: source, lockfile, tests, optimized assets and deployment examples.
- `website design assets\`: preserved approved reference and original images.
- `PRODUCT.md`, `DESIGN.md`, `.impeccable\`: product truth and extracted design.
- `this master demo prd.txt`: TrisMaster demo requirements, not proof of a
  deployed service or company-wide capabilities.

See [application setup](website/README.md) and
[verification and launch blockers](website/VERIFICATION.md).
Dependencies, credentials, data files, source ZIPs and generated screenshots are
intentionally excluded from Git.
