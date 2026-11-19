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

The owner's selected release is **WhatsApp/telephone contact only**, with no
on-site form, delivery credentials, database, analytics or paid integration.
Approved public facts live in `website\src\data\business.json`. Canonical URLs
always use `https://www.tamidzamin.com`, not a generated deployment hostname.
The existing apex-to-www redirect should be retained.

After owner approval and verification, configure these values on the Vercel
project's **Production target only** and redeploy:

```text
SITE_URL=https://www.tamidzamin.com
SITE_LAUNCHED=true
POLICY_CONTENT_APPROVED=true
CAPABILITIES_APPROVED=true
ASSET_RIGHTS_CONFIRMED=true
LAUNCH_APPROVED=true
LEAD_DELIVERY_ENABLED=false
```

`POLICY_CONTENT_APPROVED` means the operator approved the public facts and
wording; it does not assert professional legal review or business registration.
Preview/development builds remain noindex even if these flags are copied.
The `*.vercel.app` hosts receive an additional noindex response header.
Robots permits crawling so crawlers can actually read the noindex directive.
The production sitemap lists the nine public pages; preview sitemaps are empty.

The old `/api/lead/` endpoint is retired (HTTP 410) and cannot be reactivated
with environment variables. Preserved legacy intake modules are not wired to
the public website. Use Vercel deployment protection for private previews:
noindex is not access control. Git pushes to connected `main` auto-deploy.

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
