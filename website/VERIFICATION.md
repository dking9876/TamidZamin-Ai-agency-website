# Verification and launch status

Checked locally on **17 November 2026** using Node 24.12.0, Astro 7.4.12,
Microsoft Edge, Playwright 1.65.1, axe-core integration and Lighthouse 13.6.0.
These results describe this local build, not a deployed service.

## Local Git migration and Vercel preparation

The canonical source is now in the local Git repository, not Google Drive.
The Vercel preparation was checked locally on the same date:

- Dedicated Node production build and Vercel production build pass with
  0 Astro/TypeScript errors, warnings or hints.
- All **24 unit tests** pass, including platform selection, preview origin,
  fail-closed Vercel delivery and the serverless launch blocker.
- The generated Vercel function was actually imported and exercised locally:
  SSR contact returns 200 with a disabled form and no cookie; native/JSON POSTs
  return honest 503 errors, GET returns 405, no database is created and no
  receiver is contacted, even with synthetic delivery credentials enabled.
- The Build Output API artifact specifies Node 24, has contact/API function
  routes, a custom 404 fallback, eight static content routes, valid local asset
  paths, noindex metadata, blocked robots and an empty sitemap.
- Vercel header configuration is checked locally. Its actual CDN behavior and
  deployment environment have not been verified on Vercel.
- All five existing local-only delivery groups and the launch-mode SEO fixture
  pass again after the adapter changes.
- All five browser suites pass again against the relocated Node build, including
  accessibility checks on all nine public routes, responsive layout and no-JS
  behavior. The no-JS test now honors the configured preview URL instead of
  hard-coding the old local port.
- Production dependency audit: **0 reported vulnerabilities**. A scoped
  `path-to-regexp` 6.3.0 override fixes the older transitive dependency introduced
  by Vercel routing utilities.
- Source ignores exclude private environment files, databases, dependencies,
  generated output, local review captures and the duplicate source archive.

Vercel is **preview-only** for this version: persistent SQLite cannot safely be
used across serverless instances. Delivery and public launch gates remain
blocked there until a durable backend is implemented and approved. No hosting
deployment, DNS update, spending or real communication was performed.

## Verified engineering results

| Check | Result |
|---|---|
| Production build and Astro/TypeScript check | Pass; 0 errors, 0 warnings, 0 hints |
| Unit tests | 24 passed: 19 backend cases, unpublished launch gate, 4 deployment cases |
| Browser suites | 5 passed |
| Automated WCAG A/AA checks | 0 violations across all 9 public routes |
| Responsive checks | No horizontal overflow at 320, 390, 680, 768, 1024, 1440 and 1920px on homepage, services and contact |
| Navigation | Internal links and hash destinations return real pages/sections |
| Keyboard behavior | Skip link, mobile menu, Escape focus return and native FAQs pass |
| No-JavaScript/text scaling | Native FAQ and 200% root text-size check pass |
| Error route | Unknown URL returns the custom page with HTTP 404 |
| Unpublished mode | Form disabled, API rejects submission, robots disallows crawling, page metadata is noindex |
| Local delivery integration | 5/5 verification groups passed |
| HTTP delivery coverage | 26 POST probes |
| Real browser delivery coverage | 5 Edge submissions: invalid data, corrected success, rejection, unconfirmed response, timeout |
| Duplicate prevention | 9 unique mock-receiver requests, no duplicate per request ID |
| Indexable SEO fixture | 8 static pages, 9 sitemap URLs, canonical/Organization metadata/robots/404 behavior passed |
| Production dependency audit | 0 reported vulnerabilities at verification time |
| Original asset integrity | All 9 originals matched their recorded SHA-256 |
| Raster provenance | 27/27 shipping rasters have source metadata |

The delivery integration sends only to a loopback mock receiver. It verifies
the application behavior, **not** receipt by a real CRM, email inbox, phone
service or WhatsApp account. No real communications were sent.

Security regression coverage includes hostile/malformed/oversize input,
duplicate fields, Origin and Host spoofing, forged/expired/session-mismatched
tokens, minimum completion time, honeypot, rate limiting, trusted-proxy
boundaries, SQLite persistence and concurrency, explicit receiver rejection,
uncertain timeouts and HTML response escaping.

## Measured mobile Lighthouse run

| Measurement | Value |
|---|---|
| Performance | 95 / 100 |
| Accessibility | 100 / 100 |
| Best practices | 100 / 100 |
| SEO | 69 / 100 |
| First contentful paint | 1.1 s |
| Largest contentful paint | 2.9 s |
| Total blocking time | 10 ms |
| Cumulative layout shift | 0.013 |
| Total transferred page size | 500 KiB |

The SEO score is intentionally reduced by **noindex/crawler blocking**. Those
protections must remain until launch approval. The separate `.test`-domain
fixture verifies that an approved launch build emits indexable metadata,
real-domain canonicals, sitemap URLs and truthful Organization JSON-LD.

The decorative edge image was measured as an LCP bottleneck. Payload reduction
and preloading improved the measured mobile performance score from 90 to 95;
the visual review subsequently refined the edge geometry as well. LCP remains above
the 2.5-second "good" threshold in this simulated run; remeasure over the
actual HTTPS host/CDN before launch. These are lab results, not field Core Web
Vitals, an accessibility certification or a ranking guarantee.

Full Lighthouse HTML/JSON evidence is in
`..\.impeccable\review\lighthouse-mobile.report.*`.

## Reference and Impeccable checks

Native skill activation and context loading succeeded. Local
`.github\IMPECCABLE.md` was read. Hooks and live mode remained disabled.

- The manual source detector returned no findings on the initial implementation.
  It was not rerun after the structural rebuild, following the skill's
  single-detector-run workflow; the final visual review is a separate check.
- The first independent review returned **rebuild**, finding omitted process
  and benefits bands and incorrectly interpreted backgrounds.
- The homepage was rebuilt to restore the approved section order, angled
  imagery, light/dark rhythm, device composition, pill actions, blue edge
  material, two-column FAQ and horizontal closing CTA.
- The testimonial position now contains clearly labeled TrisMaster
  requirements evidence, not a fabricated quote or endorsement.
- Captures include desktop 1440px, mobile 390px, reference width 1024px and
  the actual Lumi viewport 508px, plus menu, hero and contact states.
- Reference region measurements are preserved in
  `..\.impeccable\review\reference-regions.json`.
- The first rebuild review returned **fix**, not another structural rebuild.
  Its seven requested fixes covered exposed lighting rings, lighter grounds,
  medallions/trade icons/oblique framing, paired hero pills, non-text density
  and current comparison evidence.
- The fix batch reduced the desktop trade strip from about 232px to 164px at
  1024px width, while keeping readable text and 44px controls. The final full
  page is 2421px tall at 1440px, and 2205px at 1024px. The reference image is
  1024x1536; this is **not a pixel-identical reproduction**.
- Obsolete stretched comparisons are historical only. Current source/capture
  hashes, actual DOM region bounds and eleven unstretched named comparison
  pairs live in `..\.impeccable\review\comparison-current\report.json`.
  In each pair, the reference is on the left and the live build on the right.
  Neither side is vertically squeezed to manufacture agreement.
- Current engine hero/full comparisons are in
  `..\.impeccable\review\diff\current-hero` and `current-full`. The full comparison
  uses the actual engine-generated measured section spec.
- `..\.impeccable\build\spec.json` is a coarse **section-container diagnostic**,
  not an element-level raster-production plan. Its mixed-content/painted-region
  flags are acknowledged; actual photographs remain supplied image assets.
- Formal historical comp-led build-phase/hero gates were not run. Current
  `hero-repro.png`, `quality-bar.json` and `build-evidence.json` provide
  reproducible present evidence without inventing retrospective passes.

**Final independent disposition: ship, at fix-verification scope.** The reviewer
scored all seven material fixes resolved. A final reviewer-requested correction
restored the reference's outlined secondary hero action; that correction was
also verified resolved across desktop/mobile, with current capture hashes
matching. This verdict does **not** certify whole-surface pixel identity or
historical engine-gate passes. The result is recorded in
`..\.impeccable\review\finish-verdict.json`; the extracted design system lives in
the root design records.

## Still required before public launch

1. **Business identity and contacts:** legal operator, approved public email,
   phone/WhatsApp number if wanted, privacy/accessibility contact.
2. **Domain and hosting:** approved domain, HTTPS proxy and a persistent private
   Node data directory. Configure headers for static files as well as SSR.
3. **Delivery:** receiver operator, HTTPS URL, bearer secret, strong form secret,
   deduplication agreement, retention/access policy and an authorized real test.
4. **Capabilities and demo:** confirm channels, languages, integrations and
   actual service availability. No public live demo or booking URL is approved.
5. **Legal/content approval:** privacy wording, data retention/processors,
   accessibility statement and rights to the supplied imagery.
6. **Human accessibility and cross-browser QA:** keyboard checks are automated/
   emulated here; screen readers, physical devices, Safari and Firefox have
   not been independently tested.
7. **Visual approval:** the independent material-fix review is complete; the
   owner should approve the actual build before public release. The raw image
   comparison is not an exact-match pass.
8. **Explicit launch authorization:** no publication, spending, DNS change or
   customer communication has been authorized.

`npm run verify:launch` correctly fails on the current blank configuration.
Do not turn approval flags on merely to bypass the checks.

## Scope limits

The Dockerfile and Caddyfile are supplied deployment examples, not a tested
public deployment. Node's built-in SQLite API emits an experimental warning on
the pinned Node 24.12 runtime; the tested Node major is constrained in
`package.json`. Use one application instance per persistent data directory.

The earlier Google Drive npm extraction failed. Source has since been moved to
local Git and dependencies were installed and tested there successfully. Neither
dependencies nor the previous duplicate source archive are committed.
Historical review captures remain local; the initial archive retains that
evidence. No original user assets were removed.
