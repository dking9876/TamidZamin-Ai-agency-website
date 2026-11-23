# TamidZamin website

A real Hebrew RTL company website built with Astro and official Node/Vercel
adapters. All nine public content pages, including contact, are prerendered.
The retired lead endpoint returns HTTP 410 without reading its body.
No client framework, analytics, advertising, remote fonts or
live AI service is included.

**Selected release: direct WhatsApp and telephone contact.** The owner has
supplied the business facts and requested a production launch. Indexing still
requires explicit approval flags on the production environment; previews stay
noindex. There is no contact form or automatic message sending.

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
- `/contact/`: direct WhatsApp/telephone actions, operator and next steps.
- `/privacy/`, `/accessibility/`: actual direct-contact practices and reporting
  channels; owner-approved wording is not legal/accessibility certification.
- Custom 404 with real HTTP 404 status.
- `/robots.txt`, `/sitemap.xml`: environment-aware crawl controls.

The PRD `..\this master demo prd.txt` is **not empty**. It specifies the
TrisMaster electric-shutter intake demo, not proof of deployed functionality.
It excludes diagnosis, pricing, appointment booking and payment. The language
rules mix Hebrew/Russian with an English summary rule; resolve that separately.

The homepage's WhatsApp phone plays the owner's screen recording at 3x speed.
The other phone plays the owner's supplied call recording on request; neither
is a live agent.
No customer testimonials, installed-client logos, prices or measured client
results were fabricated. Supplied people are labeled illustrative.

## Navigation

`src/lib/navigation.ts` is the shared page registry for the header, mobile menu,
footer and launch-gated sitemap. All nine public content pages are linked;
API endpoints, crawler files and the 404 page are intentionally not menu items.

The desktop header has Home, Services (overview, WhatsApp and phone), About,
FAQ, Privacy and accessibility, and Contact. Homepage section shortcuts remain
inside Services and are explicitly labeled as links within the homepage.
The mobile menu shows six concise, full-width page links and a full-width
Contact action. WhatsApp and phone sit underneath the service overview; the
long descriptions are desktop-only. All seven primary destinations fit without
scrolling even at 320x568. A labeled More information disclosure contains
privacy, accessibility and homepage shortcuts. It starts expanded on a legal
page so the current link remains visible, and resets on other pages when the
outer menu closes. No page or shortcut was removed.

The header stays reachable while scrolling on all pages with JavaScript,
except short viewports up to 500px tall; anchors account for its measured height.
The footer repeats all page links in labeled groups. Exact current pages and
their containing desktop group are highlighted.

Menus use native `details`/`summary`, including without JavaScript. Enhancement
adds Escape/focus return, outside-click and focus-leave dismissal, closing after
following a link, and resetting open state when switching between layouts.
They are navigation disclosures, not ARIA application menus or modal dialogs.
Run `npx tsx --test tests/navigation.test.ts` for page coverage, and
`npx playwright test navigation.spec.ts` against a running preview for route
reachability, keyboard behavior, mobile sizing, enlarged text, accessibility
and no-JavaScript coverage.

## Motion

The hero uses the owner's 14-second, silent H.264 montage as a full-bleed
background. Desktop retains the exact supplied film; portrait phones get a
dedicated 9:16 edit of the same shots. Video and poster use `object-fit: cover`;
the existing Hebrew headline and actions stay on top, protected by restrained
black contrast scrims. The 19 November Broccoli-inspired layout uses transparent
overlaid navigation, light white type and two compact side-by-side actions on
desktop and phone. Two headline lines resolve into focus on full load/reload;
the blue edge is removed. Actions never wait for media. The approved service
summary introduces the channels below the hero.

`src/scripts/hero-video.ts` starts muted inline playback while the hero is
visible and provides a keyboard-operable play/pause control. Playback pauses
offscreen, in hidden tabs and on pagehide. A manual pause survives re-entry.
Initial reduced motion and no JavaScript display the poster without downloading
video. Live reduced-motion changes restore the poster; switching back requires
manual play. Blocked autoplay offers manual play; download/codec failures keep
the poster and announce the fallback. No external video player or Drive request
is used. A matching native `picture` supplies the phone poster without JS.
Only the appropriate video is downloaded. Rotation switches versions while
retaining the scene position and the visitor's pause choice.

Both demo figures enter once without starting playback. WhatsApp's former
illustrative chat/summary sequence has been replaced by the screen recording.
The phone's waveform moves only while the visitor plays the call recording;
it is a playback indicator, not an audio-amplitude visualization.

`src/scripts/home-motion.ts` pauses effects offscreen/in hidden tabs, cancels
them when reduced motion is requested, and leaves all content readable without
JavaScript. Navigation, menu and FAQ feedback are CSS-based; native disclosure
and keyboard behavior remain. Unsupported FAQ transition features fall back to
normal native toggles. The design contract is in `../DESIGN.md`.

Run `npx playwright test hero.spec.ts motion.spec.ts refinement.spec.ts` against a running
local production preview to test timing, interruption, replay, reduced motion,
keyboard behavior and existing layout/navigation safeguards.

## Recorded WhatsApp demo

`src/components/WhatsAppDemo.astro` and `src/scripts/whatsapp-demo.ts` display
the owner's supplied screen recording at `/#whatsapp-demo`, linked from the
WhatsApp service page. The full phone screen remains visible without cropping
or stretching, with play/pause, a seek slider, restart, fullscreen and a 3x label.
Mobile uses one channel per row; tablet/narrow desktop uses two stacked articles
up through 1100px. Wider desktop keeps the central connector and side copy with
larger devices than the former illustrative layout.

`public/media/demo-whatsapp-3x.mp4` is a same-origin H.264/yuv420p MP4 with
fast-start metadata: 720x1600, 24fps, 45.708 seconds, 3,405,953 bytes. The entire
137.183-second source is accelerated using `setpts=(PTS-STARTPTS)/3`; speed
is baked into the file rather than dependent on browser playback-rate support.
The source audio track was verified silent and omitted. No conversation content
was rewritten or trimmed. The original downloaded recording is untouched.
`provenance.json` records its source, hashes and transform. The poster is a
representative frame at 16 seconds of the accelerated recording.

The player never autoplays or loops, and `preload="none"` defers video requests
until activation. A poster remains visible before play. Hidden tabs and page
exit pause without automatic resumption; scrolling alone does not interrupt
viewing. Reduced motion still permits requested playback. Fullscreen switches
to native controls, with a native iOS-video fallback; unsupported browsers omit
the action. No JavaScript retains native controls, the already accelerated
asset and a direct recording link. Loading can be cancelled; errors offer
explicit Hebrew recovery instructions, retry and a direct file.

This is a staged recording, not a live WhatsApp integration or customer
endorsement. The owner confirms that he created the material and authorizes
public use. Playing it does not send a message or initiate a real handoff.

Run `npx playwright test whatsapp-demo.spec.ts motion.spec.ts mobile-layout.spec.ts call-demo.spec.ts call-transcript.spec.ts refinement.spec.ts`
against a freshly started local production build. The checks include actual
decoding, accelerated duration, keyboard/touch controls, seek/end/replay,
failed-load recovery, cancellation, fullscreen, no JavaScript, responsive
layouts, enlarged text, accessibility and existing call-transcript behavior.

## Recorded phone demo

`src/components/CallDemo.astro` and `src/scripts/call-demo.ts` replace the old
silent phone illustration at `/#phone-demo`. Clicking or tapping the phone
plays/pauses the original 2:15 recording. The owner's Hebrew transcript is
displayed inside the phone, with separate agent/customer bubbles and a
highlight on the currently spoken phrase. Elapsed/total time, a native seek
slider and a restart button remain visible below the transcript. The phone
service page links directly to the player.

`public/media/demo-call.mp3` is the exact owner-supplied attachment, not
re-encoded or trimmed. Its format, size and SHA-256 are in
`public/media/provenance.json`. No audio is downloaded or played before user
activation (`preload="none"`); all media stays same-origin. Switching tabs or
leaving the page pauses playback without automatically resuming it. Scrolling
does not interrupt listening. Reduced motion keeps the waveform static without
disabling requested audio. No JavaScript leaves native audio controls and a
direct file link. Loading can be cancelled; playback/download failures show a
Hebrew recovery message, retry action and direct recording link.

This is a staged recording, not a live call or a claim that the agent is
connected to the visitor's business. The owner confirms it is his voice and
authorizes public use. No live telephony or automated inquiry intake is enabled.

### Synchronized transcript

`src/data/call-transcript.json` contains the timed phrases from the owner's
19 November transcript. Text and speaker order are preserved verbatim,
including unclear wording; the recording itself is not edited. Long replies
are divided into readable phrases rather than squeezing the full summary into
one screen. The text is a quotation of the recorded demo, not independent
verification of a booked visit, received request or delivered handoff.

The highlight follows `audio.currentTime`, using animation frames only during
playback and media events for pauses and seeks. It has no independent elapsed
timer. Silence gaps have no active speaker. Seeking and restarting immediately
restore the appropriate transcript context; playback stalls cannot make the
text run ahead of the sound.

Only the inner transcript scrolls; playback never scrolls the page or moves
keyboard focus. Manual scrolling/keyboard reading suspends automatic following
until the visitor uses the Hebrew return-to-call action, resumes, seeks or restarts.
Reduced motion retains synchronization with immediate rather than animated
scrolling. The complete transcript remains readable without JavaScript, and
screen readers are not interrupted by a live announcement of every phrase.

Run `npx tsx --test tests/call-transcript.test.ts` for text integrity, timeline
boundaries and recording identity.
Run `npx playwright test call-demo.spec.ts call-transcript.spec.ts motion.spec.ts mobile-layout.spec.ts`
against a running preview for real MP3 decoding/playback, seeking, replay,
failed-download recovery, rapid input, keyboard/touch, reduced motion,
no-JavaScript fallback, cue-by-cue synchronization, manual reading,
accessibility and responsive regression coverage.

## Configuration and launch

No secrets or delivery service are needed. `src/data/business.json` contains
the approved public identity, canonical origin, number and exact WhatsApp
draft. `scripts/deployment.mjs` centralizes links and indexability.
Optional `PUBLIC_*` overrides are documented in `.env.example`; empty or
invalid contacts fail the launch gate instead of silently disappearing.

The canonical origin defaults to `https://www.tamidzamin.com` in every
environment. `SITE_URL` may explicitly override it for isolated tests.
Never use a generated Vercel URL as the production canonical.

For an approved launch, set these on Vercel's **Production target only**:

```text
SITE_URL=https://www.tamidzamin.com
SITE_LAUNCHED=true
POLICY_CONTENT_APPROVED=true
CAPABILITIES_APPROVED=true
ASSET_RIGHTS_CONFIRMED=true
LAUNCH_APPROVED=true
LEAD_DELIVERY_ENABLED=false
```

Policy approval confirms the operator's public facts and wording, not
professional legal review, incorporation or accessibility certification.
`PUBLIC_LEGAL_NAME` is the responsible person's name, not a claim that the
brand is a registered company. Do not invent a registration ID or office.

`npm run verify:launch` checks the same gates as an indexable production build.
Leave flags unset/false in ordinary local previews. `VERCEL_ENV` is supplied
by Vercel: only `production` can be indexed, even if flags leak to previews.
Robots allows page crawling so noindex can be read; preview sitemaps are empty.
Production lists all nine public pages, omitting API and 404 routes.

Rebuild after public configuration changes. Canonicals, social tags, contacts,
Organization/WebSite/Service/Breadcrumb structured data and sitemap then agree.
No schema ratings, prices, registered legal entity, office address or staffed
24/7 support claim is invented.

## Direct contact and retired intake

WhatsApp links open a visitor-editable draft; only the visitor can send it in
WhatsApp. Telephone links open the device's dialer. Checks validate the exact
destinations without sending messages or placing calls. Email remains available
for privacy/accessibility requests. Contacts are possible 24/7; immediate human
response is not promised.

`/contact/` is static and contains no form, token, session cookie or submit
script. `/api/lead/` returns HTTP 410 with `ok:false`, no-store and noindex.
It never reads, persists or forwards the body, even if old delivery settings
are supplied. Astro's default cross-origin guard may reject cross-site
form-shaped requests with 403 before they reach that retired endpoint.

The unused `src/server` modules remain as historical implementation, with
isolated unit tests. Reintroducing a form would require a separately approved
design, policies, durable protection storage and actual delivery verification.
There is no environment flag that reconnects those modules to the website.
The historical `test:delivery` command now verifies **zero delivery** through
the actual Node app using a local trap receiver and synthetic data.

## Deployment and Google Search

Vercel: Root Directory **`website`**, framework **Astro**, Node **24.x**,
install `npm ci`, build `npm run build`, no output-directory override.
The connected project already hosts the website. Git pushes to `main` trigger
deployments; only push when publication is approved.

`VERCEL=1` selects the official adapter. `vercel.json` applies security headers
to static and dynamic routes, no-store to the retired API, and noindex to
`*.vercel.app`, API and 404 URLs. Preview builds also contain noindex metadata.
The static contact page contains only public information, has no session, and
uses ordinary public-page caching. Analytics, image optimization and ISR
remain off. The routing override and
the repaired npm12-compatible lockfile must be preserved.

`npm run build:vercel` and `npm run test:vercel` validate generated output
locally without publishing. For production-mode checks, supply the launch
flags and `VERCEL_ENV=production` in that shell only. To check a preview with
copied flags, use `VERCEL_ENV=preview`: output must stay noindex.

The standalone Node target still works: rebuild using `npm run build` before
`npm start`, and restart after rebuilding. Behind a reverse proxy, apply
headers to static files too; Astro middleware alone does not cover them.
Docker/Caddy files are optional examples, not evidence that Docker was tested
or a separate server was deployed. No SQLite volume is needed for this release.

After the live domain passes checks, use `tamidzaminai@gmail.com` to own the
Search Console Domain property `tamidzamin.com`. Add only Google's supplied
verification TXT record with owner authorization; preserve existing DNS.
Verify ownership, submit `https://www.tamidzamin.com/sitemap.xml`, and use URL
Inspection to request indexing of the key public pages. Submission is not
proof that Google has indexed or ranked a page; monitor Search Console.

When DNS access is unavailable, the URL-prefix property
`https://www.tamidzamin.com/` can be verified independently using Google's
downloaded file at `public/googleea35bb1e8014c8cb.html`, issued for
`tamidzaminai@gmail.com`. Keep its filename and verification content unchanged
and retain it after verification; Google periodically rechecks ownership.
It is a public ownership proof, not a password or tracking script. It does not
belong in the page navigation or sitemap. Check its live URL returns HTTP 200
with Google's verification text before pressing Verify in Search Console.
This method covers the canonical HTTPS www site, not the entire Domain
property; the separate apex TXT record is still needed for domain-wide access.
See `VERIFICATION.md` for the latest confirmed Google setup status.

Google Business Profile/Maps is intentionally deferred. It is not required
for ordinary Search indexing. No home address or fake local listing should
be created. Future business registration, legal/tax advice, client agreements
and AI data-processing arrangements are separate owner responsibilities.

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
- `src/styles/hero.css`, loaded after navigation styles, owns the hero and
  homepage-only header overrides. The transparent header overlays the film.
  Hero minimum height is `max(820px, 100svh)`, or `max(720px, 100svh)` up to
  880px; content starts at 280/200px with a measured-header safety allowance.
  Supporting-page header behavior is unchanged.
- Native anchors and history remain untouched. Homepage scroll padding is
  16px; supporting pages account for their sticky header. No wheel/touch
  interception or scroll snap.
- `src/scripts/home-motion.ts` is homepage-only progressive enhancement:
  the two bounded headline arrivals (never hidden headline/CTA), one 1760ms process/handoff
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

### Hero video assets

`public/media/hero-film.mp4` is an unchanged copy of the owner's supplied
`tamidzamin-original-photos-film.mp4`: 1280x720, 24fps, 14 seconds, 3,643,628 bytes,
silent H.264 with fast-start metadata. The first frame supplies
`hero-poster.webp`. `public/media/provenance.json` records its source and SHA-256;
the poster sidecar records its derivation. No baked-in text, desktop scrim or
phone-preview render is used. Do not replace the source with a Drive viewing URL.
`npm run assets` regenerates the older image derivatives, not these video assets.

`hero-film-mobile.mp4` is a dedicated **720x1280 (9:16)** portrait adaptation,
selected at `(max-width: 600px) and (orientation: portrait)`. It uses the same
five original animation clips, scene timings, dissolves and 14-second loop.
Each shot uses a 396x704 focal crop at y=8, proportionally scaled to 720x1280.
Sharp real footage fills the entire frame; there is no blurred extension,
padding, baked dark area, new generation, text or change to the original film.
Its matching poster is `hero-poster-mobile.webp`. The mobile film is
3,020,386 bytes; phones do not also download the desktop film or poster.

To reproduce the mobile film and poster using the committed source clips
and an installed FFmpeg:

```powershell
node scripts\prepare-hero-mobile.mjs
```

The script verifies the approved desktop hash, records source clip/output
hashes and transforms in `public/media/provenance.json`, and leaves desktop
and original assets untouched. Re-embed the mobile poster's provenance with
Impeccable after regeneration.

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
Canonical origin defaults to `https://www.tamidzamin.com` even when testing a
local or Vercel preview. Set `TEST_SITE_LAUNCHED=true` only when testing an
indexable production build; otherwise tests expect preview noindex.

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
