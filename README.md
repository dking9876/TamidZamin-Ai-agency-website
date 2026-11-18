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

## Impeccable design checks

The project-local skill and Copilot hook live in `.github\skills\impeccable`
and `.github\hooks\impeccable.json`. The hook scans design-relevant edits and
returns a reminder; it does not change the website or replace visual review.
Both Bash and Windows PowerShell launchers are configured.

Run these commands from the **repository root**, not `website`:

```powershell
& .\.github\skills\impeccable\scripts\impeccable.cmd hooks status
& .\.github\skills\impeccable\scripts\impeccable.cmd doctor --json --target website
& .\.github\skills\impeccable\scripts\impeccable.cmd detect --json website\src
```

On Linux/macOS, use `.github/skills/impeccable/scripts/impeccable` instead.
Commit the hook and skill to the default branch, then start a new Copilot
session in this repository so it loads the configuration. The Windows hook
requires PowerShell 7 (`pwsh`). Downloads of missing platform engines are
verified against the bundled checksums before execution.
Machine-specific binaries, local consent and detector cache stay out of Git.

`DESIGN.md` remains the normative design document. Its
`.impeccable\design.json` companion contains derived metadata and component
previews; refresh that companion after design-document changes. Installing
or updating the skill does not refresh these project-specific records.
When updating hook manifests, preserve the Windows `powershell` entry and
verify it again; the current installer generates only a Bash entry.

## Contents

- `website\`: source, lockfile, tests, optimized assets and deployment examples.
- `website design assets\`: preserved approved reference and original images.
- `PRODUCT.md`, `DESIGN.md`, `.impeccable\`: product truth and extracted design.
- `.github\skills`, `.github\agents`, `.github\hooks`: portable Impeccable
  guidance and automatic Copilot design checks.
- `this master demo prd.txt`: TrisMaster demo requirements, not proof of a
  deployed service or company-wide capabilities.
- `website\public\media`: the approved full-bleed hero video, its poster and
  provenance. Playback and accessibility behavior are in the application guide.
- The video-option directories and their dated ZIPs preserve the earlier
  creative work, included in the owner's 18 November "push everything" request.
  They are not served by the website application.

See [application setup](website/README.md) and
[verification and launch blockers](website/VERIFICATION.md).
Dependencies, credentials, data files, website-source ZIPs and Impeccable
review/cache directories remain excluded from Git.
