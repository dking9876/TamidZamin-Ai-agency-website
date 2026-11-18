# TamidZamin website

A real Hebrew RTL company website built with Astro and official Node/Vercel
adapters. Content pages are prerendered; the contact page and lead endpoint run
on the server. No client framework, analytics, advertising, remote fonts or
live AI service is included.

**Current state: preview only, not approved for lead activation or indexing.** Real lead
delivery is disabled. The site is noindex, robots blocks crawling, and the
sitemap intentionally contains no public URLs until launch is configured.

## Source and local preview

Source is now the `website` directory in this Git repository on local disk.
The earlier Google Drive/local-mirror workaround is no longer needed. Run from
the repository root:

```powershell
Set-Location .\website
npm ci
npm run build
$env:HOST = '127.0.0.1'
$env:PORT = '4321'
npm start
```

Open `http://localhost:4321/`. Stop/restart the Node process after each
production build: an old process retains references to the old generated
server and CSS chunks. `npm run dev` is available for normal editing.

Use Node **24.12+ in the
24.x line**, then `npm ci`, `npm run build`, `npm start`. The lockfile is included.
Dependencies are not included in the source archive.

The old `sync-preview.ps1` is a historical migration helper, not part of the
current Git/Vercel workflow. Do not copy from the old Google Drive folder over
this repository.

## Pages and content

- `/`: approved visual reference implemented as responsive components.
- `/services/`, `/services/whatsapp/`, `/services/phone/`: useful service
  explanations, constraints, trades and internal links.
- `/about/`, `/faq/`: company approach and keyboard-operable native FAQs.
- `/contact/`: server-rendered form; explicit unavailable state by default.
- `/privacy/`, `/accessibility/`: implementation-specific drafts requiring
  business/legal review, not invented compliance certifications.
- Custom 404 with real HTTP 404 status.
- `/robots.txt`, `/sitemap.xml`: environment-aware crawl controls.

The PRD `..\this master demo prd.txt` is **not empty**. It specifies the
TrisMaster electric-shutter intake demo, not proof of deployed functionality.
It excludes diagnosis, pricing, appointment booking and payment. The language
rules mix Hebrew/Russian with an English summary rule; resolve that separately.

The homepage's conversations are illustrative HTML, not a working agent.
No customer testimonials, installed-client logos, prices or measured client
results were fabricated. Supplied people are labeled illustrative.

## Motion

The hero uses the owner's exact 14-second, silent H.264 montage as a full-bleed
background on phones and computers. Video and poster use `object-fit: cover`;
the existing Hebrew headline, copy and actions stay on top, protected by
responsive navy scrims. The two headline lines resolve into focus on each full
load/reload and the existing blue edge draws across the scene. The body and
CTA are available immediately, even while media loads. Phones retain one
full-width primary action and a quiet process link, without redundant badges
or the extra scroll prompt.

`src/scripts/hero-video.ts` starts muted inline playback while the hero is
visible and provides a keyboard-operable play/pause control. Playback pauses
offscreen, in hidden tabs and on pagehide. A manual pause survives re-entry.
Initial reduced motion and no JavaScript display the poster without downloading
video. Live reduced-motion changes restore the poster; switching back requires
manual play. Blocked autoplay offers manual play; download/codec failures keep
the poster and announce the fallback. No external video player or Drive request
is used.

The homepage enhances its illustrative conversations with short chat/summary
and voice-waveform sequences. Each runs once on entry; the visitor can replay
an individual illustration with its labeled button. These are not live agents.
No animation dependency, audio or external request is added. Only the explicitly
approved hero background loops; the existing illustrative sequences still settle.

`src/scripts/home-motion.ts` pauses effects offscreen/in hidden tabs, cancels
them when reduced motion is requested, and leaves all content readable without
JavaScript. Navigation, menu and FAQ feedback are CSS-based; native disclosure
and keyboard behavior remain. Unsupported FAQ transition features fall back to
normal native toggles. The design contract is in `../DESIGN.md`.

Run `npx playwright test hero.spec.ts motion.spec.ts refinement.spec.ts` against a running
local production preview to test timing, interruption, replay, reduced motion,
keyboard behavior and existing layout/navigation safeguards.

## Configuration

Copy `.env.example` to `.env` on the runtime/deployment machine, not into source
control. `npm start` loads that file. Astro config loads it for prerendering.

Public/build values:

- `SITE_URL`: exact approved HTTPS origin. Local default is
  `http://localhost:4321`.
- `SITE_LAUNCHED=false`: keep false until publication is expressly approved.
- `PUBLIC_LEGAL_NAME`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_PHONE`,
  `PUBLIC_WHATSAPP`, `PUBLIC_BOOKING_URL`: real approved public details.
  Empty optional values omit the corresponding action; they never become fake
  links. Use an international WhatsApp number, an email address, and an HTTPS
  booking URL.
- `LEGAL_REVIEW_APPROVED`, `CAPABILITIES_APPROVED`, `ASSET_RIGHTS_CONFIRMED`,
  `LAUNCH_APPROVED`: explicit launch gates, not substitutes for actual review.

Rebuild after changing public values so canonical URLs, Open Graph tags,
Organization structured data, sitemap and static page contact details agree.
Structured data contains no ratings, prices or unverified business addresses.
It is withheld while unpublished.

Server-only values and delivery details are documented in `.env.example` and
the server modules. The essential values are `FORM_SECRET`,
`LEAD_DELIVERY_ENABLED`, `LEAD_WEBHOOK_URL`, `LEAD_WEBHOOK_TOKEN`, and `DATA_DIR`.
**Never expose webhook credentials in a `PUBLIC_` variable.**

Run `npm run verify:launch`. It must fail for the current unconfigured preview.
Setting `SITE_LAUNCHED=true` also runs the public configuration gate at build
time. Runtime secrets are deliberately not required during a Docker build and
must never be copied into image layers.

## Lead delivery

This is a real server-side form, not a fake success toast or mailto form.
Disabled configuration returns an honest unavailable response and never
transmits the visitor's data.

When explicitly enabled, the backend validates field lengths and types,
phone/email formats, consent, same-origin submission, an HMAC-signed expiring
form token bound to an HttpOnly SameSite cookie, a honeypot, minimum completion
time and persistent request limits. Request bodies are bounded during reading.

The receiver must accept authenticated JSON and deduplicate `Idempotency-Key`.
A 2xx HTTP response alone is not success: it must return JSON
`{"accepted": true}`. Only then does the UI report receiver acceptance.
That is **not** a promise that a human has read the request or booked a call.
Timeout/uncertain outcomes do not trigger automatic duplicate deliveries.

SQLite stores protection/idempotency metadata, not the full form message.
Use a writable persistent local disk volume, backed up and restricted to the
service account. Run **one Node instance per data directory**. Do not deploy
unchanged to an ephemeral/serverless filesystem or independently scaled replicas.

The form enhances a normal HTML POST: it works without JavaScript when enabled.
With JavaScript, errors preserve input and receive keyboard focus. Native
POSTs return a Hebrew status/error page. API logs must remain free of message
contents and secrets.

Before enabling delivery:

1. Obtain permission to contact the approved receiver and select its operator.
2. Establish retention, access, deletion and security responsibilities.
3. Configure HTTPS, a strong secret and the receiver's bearer credential.
4. Run an **approved real** delivery test and confirm downstream receipt.
5. Verify proxy trust/IP behavior, rate limits, persistence and recovery.

The implementation tests use only a loopback mock receiver. They do not
constitute verification of a real CRM, email inbox or WhatsApp account.

## Deployment

### Vercel preview

Import the GitHub repository with **Root Directory `website`**, framework
**Astro**, **Node 24.x**, install command `npm ci`, build command `npm run build`,
and no output-directory override. See the [root guide](../README.md).

Vercel's `VERCEL=1` environment selects the official `@astrojs/vercel` adapter.
The initial preview needs no secrets. Do not set `SITE_URL` to the placeholder
from `.env.example`; when unset, Vercel's generated deployment URL is used.
The approved canonical origin can later be provided explicitly with `SITE_URL`.
Keep `SITE_LAUNCHED=false` and `LEAD_DELIVERY_ENABLED=false`.

`vercel.json` sets security headers for prerendered files as well as dynamic
routes, and no-store for contact/API routes. Analytics, image optimization and
ISR are not enabled. The adapter emits `.vercel\output` for Vercel Functions.
The lockfile pins `path-to-regexp` 6.3.0 within Vercel's routing utilities to
avoid the vulnerable 6.1.0 transitive dependency; route generation is tested.
`npm run build:vercel` generates that output locally; `npm run test:vercel`
checks its structure and exercises the generated function without publishing.
Rebuild with `npm run build` before starting the standalone Node server again.

**Lead delivery is blocked on Vercel**, even if its flag is accidentally enabled.
Local SQLite cannot provide durable, shared protection/idempotency state across
Vercel Functions. The launch gate rejects this target until an approved durable
store or a separately hosted intake backend is implemented and tested. No
`/tmp` database, in-memory bypass or success-shaped fallback is used.

Vercel hosting itself has not been exercised. No deployment, hosting purchase,
domain attachment or DNS change is part of the Git push. Use deployment access
protection as appropriate; noindex does not make an accessible URL private.

### Dedicated Node with persistent lead storage

For enabled delivery, use a small Node 24 service with persistent disk behind an HTTPS
reverse proxy. The included `Dockerfile` is a portable deployment example;
the Docker image and public hosting have not been exercised here.

- Build on CI/local disk with `npm ci && npm run build`.
- Supply public build variables before compiling.
- Run the server as an unprivileged user, with runtime secrets injected.
- Bind Node to loopback when using the supplied Caddy reverse-proxy example.
- Provision `DATA_DIR`; preserve it across restarts/deployments.
- Add HTTPS and security/compression/cache headers at the proxy for **both
  static and dynamic responses**. Astro middleware alone does not add headers
  to prerendered files in the standalone adapter.
- The example Caddyfile is not live and contains an intentionally invalid
  hostname. Configure trusted client IP handling only for a verified proxy;
  never trust arbitrary inbound forwarded-IP headers.
- Do not cache `/contact/` or `/api/`. Fingerprinted assets can be cached long
  term; image names are stable and use a short cache policy.
- Restart after deploying a build. Back up configuration and SQLite metadata.

No DNS, hosting, certificates, public deployment, analytics or paid services
were configured.

## Assets and design

Approved reference:
`..\website design assets\אתר TamidZamin_ סוכני AI לעסקים בישראל.webp`.
The nine numbered originals are unchanged. Optimized WebP derivatives, a
favicon and social image are in `public\images`.

`npm run assets` regenerates the derivatives from the original asset directory.
For a different location set `SOURCE_ASSET_DIR`. Re-embed provenance with the
project-local Impeccable `embed-prompt` command after regeneration.
`public\images\provenance.json` records original hashes, paths and transforms;
Impeccable also keeps WebP source sidecars and embedded PNG/JPEG source notes.
There are no identifying claims about people in these assets. Usage rights
still require the owner's confirmation before launch.

Heebo Variable is self-hosted through the Fontsource package under its
distributed OFL license, included verbatim at `public\licenses\Heebo-OFL.txt`.
No visitor request is sent to Google Fonts.

The pinned reference governs layout and colors, not unsupported claims.
Readable responsive copy, native FAQ behavior and truthful service descriptions
can change line wrapping and height relative to the single reference image.
The site is intentionally not a screenshot rendered as a page.

Project design records: `..\PRODUCT.md`, `..\DESIGN.md`,
`..\.impeccable\surfaces\website.md`, `..\.impeccable\design.json`.
Impeccable was activated natively for the original implementation. During the
18 November refinement, native activation was unavailable; its installed
SKILL.md, setup instructions and layout/animate/adapt/optimize/harden/audit/polish
playbooks were read directly from the earlier Google Drive installation.
The Windows context loader and manual finishing detector were used. No hooks,
permission-bypassing editing features or live mode were enabled.

### Homepage composition and motion

The approved image still defines the visual identity, not fixed poster heights.
The owner approved spacious proportions on 18 November. All ten main desktop
sections use a viewport-based **minimum** height; the footer and supporting
pages do not. Longer copy, expanded FAQs and enlarged text can grow.

- `src/styles/home.css` owns homepage composition, 600/880/1024px adaptations
  and restrained interaction feedback. Keep new fullscreen rules scoped to
  direct homepage sections, not global `section` selectors.
- The hero uses `100svh` minus actual header height. `Layout.astro` measures
  the header with ResizeObserver. Its 4.75rem/4.25rem CSS fallback reserves
  space before enhancement. Homepage stickiness is enhanced only with JS;
  no-JS and short (<=500px high) headers remain nonsticky.
- Native anchors and history remain untouched. Scroll padding accounts for
  the measured header. Do not introduce wheel/touch interception or scroll snap.
- `src/scripts/home-motion.ts` is homepage-only progressive enhancement:
  the bounded headline/blue-edge arrival (never hidden headline/CTA), one 1760ms process/handoff
  sequence, 620ms device entrance and 650ms About-photo reveal.
- Animations run once, pause offscreen/in hidden tabs, and settle. Live reduced-
  motion changes cancel them. Default HTML/CSS is visible without JavaScript.
  Keep the phones clearly labeled illustrative. The separate hero-video
  controller is the documented looping exception above.
- Native menu and FAQ disclosures stay usable without JS. JS adds menu closing
  on Escape, link following, outside click, focus exit and desktop resize.

No motion library, dependency, backend change or business claim was added.
Do not regenerate supplied assets to adjust layout; use the existing responsive
derivatives and check focal subjects at each viewport.

### Hero video asset

`public/media/hero-film.mp4` is an unchanged copy of the owner's supplied
`tamidzamin-original-photos-film.mp4`: 1280x720, 24fps, 14 seconds, 3,643,628 bytes,
silent H.264 with fast-start metadata. The first frame supplies
`hero-poster.webp`. `public/media/provenance.json` records its source and SHA-256;
the poster sidecar records its derivation. No baked-in text, desktop scrim or
phone-preview render is used. Do not replace the source with a Drive viewing URL.
`npm run assets` regenerates the older image derivatives, not these video assets.

Hero tests cover actual advancing playback, looping, cover geometry from
320px through 1920px, keyboard pause/resume, offscreen and page lifecycle
behavior, slow/failed media, blocked autoplay, no-JavaScript and reduced-motion
fallbacks. Contrast tests sample the poster and six positions across the film,
covering every scene, at desktop and phone widths.

## Verification

```powershell
npm run build
npm test
npm run test:delivery
npm run test:seo
# With the production preview running at localhost:4321:
npm run test:browser
node scripts\capture.mjs
node scripts\capture-refinement.mjs
npm run verify:launch
```

Browser tests use the installed Microsoft Edge via Playwright. On a machine
without Edge, install a supported Playwright browser and change the channel.
See `VERIFICATION.md` for measured results and remaining limitations.
The refinement capture accepts `TEST_BASE_URL` and `REVIEW_DIR`; use a production
preview for final evidence, not the Astro development toolbar. The targeted
`refinement.spec.ts` browser tests measure actual section bounds, anchor behavior
and animation lifecycle instead of treating CSS declarations as proof.
Before/after screenshots and Lighthouse reports are local review artifacts,
not publication or a new approval to launch.
For a deployed preview, set `TEST_BASE_URL` to the URL being visited and
`TEST_SITE_ORIGIN` to its configured canonical origin before `test:browser`.
Without an explicit `SITE_URL`, Vercel uses its unique deployment URL for the
canonical origin, even when the visit URL is the stable project alias.

After dependency changes, verify `npm ci` in a fresh checkout with npm 12 and a
supported Node 24 release, then run `npm test`, `npm run build:vercel` and
`npm run test:vercel`. An existing `node_modules` tree and npm 11 can hide missing
optional-package lock entries that npm 12 rejects. The lockfile regression tests
cover the exact EMNAPI dependencies used by the WASM compiler bindings.
Do not replace Vercel's `npm ci` with `npm install` to bypass a lockfile error.

`test:seo` builds an isolated, clearly fictitious `.test`-domain fixture to
verify launch-mode canonical URLs, structured data and sitemap output. It does
not publish, contact that domain, enable the real preview, or save approval flags.
The fixture's generated output is removed after validation.

### Visual review

The independent first review rejected the initial section interpretation.
The homepage was rebuilt to restore the approved order: hero/channels, light
process, dark trades, light benefits, dark human handoff, light About, dark
factual demo-evidence band, light two-column FAQ, horizontal dark CTA and footer.
The unverified testimonial position is retained with truthful requirements
evidence instead of a fabricated endorsement.

The subsequent fix pass restored exposed blue connector rings, process
medallions, trade icons, oblique About framing, filled/outlined hero pills and
tighter photographic/device geometry. To regenerate exact current reference
comparisons from a running local build:

```powershell
$env:PROJECT_ROOT = (Resolve-Path '..').Path
node scripts\reference-evidence.mjs
```

These are review-only crops and comparisons, never shipping page images.
The source reference and project-level `.impeccable` measurement files must be
available for this optional visual-evidence command.
Generated captures and historical review reports remain local and are excluded
from Git. The original delivery archive contains the previous review evidence;
it is also intentionally not duplicated in Git.
