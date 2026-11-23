# Verification and launch status

## Scroll-started demos and Super Tris trial links - 23 November 2026

The owner requested scroll-triggered playback and supplied `+972584017275`
for visitor-initiated Super Tris calls and WhatsApp conversations. The shared
trial contact sits directly beneath the two demos, with a displayed number,
separate telephone/WhatsApp actions and a request to use fictional test details.
TamidZamin's agency contact, exact inquiry draft and launch settings are unchanged.

Each recording starts silently once per page visit at 40% phone-frame
visibility, stops below 15% visibility or when the page is hidden, and does
not automatically restart. Manual input takes priority. Reduced motion keeps
playback manual. A visible call sound control explicitly enables or mutes
audio; browser refusals retain manual retry and direct-media recovery.
The unchanged MP3 uses an inline video media element because native audio
elements can block even muted playback before the first user gesture.
The transcript continues to follow the real media clock.

### Verified locally against the production build

- Astro/TypeScript checks and production build: zero errors, warnings or hints.
- All 37 existing unit tests pass; the supplied MP3 and transcript are unchanged.
- All 64 related browser checks pass without retries, including matching
  frames at 14 widths, 200% text, keyboard/touch controls, actual playback,
  transcript synchronization, no JavaScript and automated accessibility.
- The ten new autoplay/contact checks also pass twice consecutively.
  Their first-visit proof disables tracing, enforces document activation
  policy and uses CDP reads/scrolling with `userGesture: false`. Both media
  clocks advance without user activation before a real pointer enables sound.
  Tracing and ordinary automation evaluations can grant activation and were
  deliberately excluded from that initial proof.
- Manual pause/completion, cancelled pending loads, reduced-motion changes,
  hidden/restored pages and denied-autoplay recovery are covered.
- Exact Super Tris links are checked separately from all agency actions,
  including without JavaScript. No real call or message was made or sent.
- Final mobile/desktop production-layout captures were saved. The UI
  detector returned no findings; Git's whitespace check passed.

These are Edge/Chromium checks with emulated mobile viewports, not physical
iPhone/Android or Safari certification. Browser/device policy can still
require manual playback. The external trial's availability, responses, human
handoff and storage behavior have not been independently verified.
These results describe the local production build; hosted publication is a
separate verification step.

### Verified on the real domain

Source release `3e712fb` was pushed to `main` and served successfully at
`https://www.tamidzamin.com/`. All ten autoplay/contact browser checks pass
against that public domain, including genuine gesture-free muted playback
at 390px and 1440px, explicit sound activation, lifecycle/manual precedence,
recovery and exact separate Super Tris links. The tests do not initiate an
external call or send a WhatsApp message. Local and remote release commits
matched and the checkout was clean after publication.

## Direct-contact production release - 19 November 2026

The owner supplied the real domain, contact details, service scope and operator,
then explicitly approved the final privacy wording and production publication.
This release supersedes the preview-only restrictions in the historical
entries below. Registration/legal advice and Google account verification are
separate from the website implementation.

### Implemented

- Nine prerendered Hebrew pages with the canonical origin
  `https://www.tamidzamin.com`, consistent with the existing apex redirect.
- Direct WhatsApp and telephone actions using the exact approved number and
  Hebrew draft. No form, submission script or form/session cookie.
- Retired API returns 410 without reading, storing or forwarding its body,
  even with old delivery environment variables enabled. Astro still blocks
  cross-site form-shaped requests with 403.
- Real operator identity, full implementation/support offering, human
  follow-up by the client/staff, and privacy/accessibility contacts. No
  registered-company, language, integration, instant-response or retention
  guarantee was fabricated.
- Updated policy wording approved by the owner, not represented as a legal
  certification. No fixed automatic-deletion schedule is promised.
- Production-only indexing; copied flags cannot index Vercel previews.
  Host-specific noindex protects `*.vercel.app`. Robots allows crawling so
  noindex can actually be read; production sitemap contains nine URLs.
- Canonicals, unique titles/descriptions, social metadata and factual
  Organization/WebSite/WebPage/Service/Breadcrumb JSON-LD.
- Existing approved hero, media, phone dimensions and transcript preserved.
  Media controls' accessible names now include their visible labels. The
  WhatsApp recording has a linked text summary of its observed conversation,
  including no-JavaScript access; it is not claimed to be a verbatim transcript.
- Production-scoped Vercel environment configuration saved successfully.
  No new paid service, tracking, live agent or Maps profile was enabled.

### Final local checks

- Astro/TypeScript: zero errors, warnings or hints; Node and Vercel builds pass.
- **37 unit tests pass**, including exact public contact/message values,
  preview/production gates, lockfile regressions and retained legacy guards.
- **132 production-build browser cases pass without retries**. Coverage
  includes all nine pages, 320-1920px layouts, 200% text, keyboard/touch,
  navigation, forms absent, exact links, real media playback, reduced motion,
  no JavaScript, 404, crawler controls and automated accessibility checks.
- Vercel generated-output/handler tests pass in production and with production
  flags deliberately copied into a preview: only production is indexable.
- Node integration verifies zero receiver requests and no database creation
  with old intake settings deliberately enabled.
- Isolated launch-mode SEO fixture passes for all nine pages and sitemap URLs.
- Production dependency audit reports **0 known vulnerabilities**.
- Impeccable detector returns no findings; Git whitespace check passes.
- Final desktop/mobile contact-page captures were visually inspected together.

### Verified on the real domain

The source release `beeef49` was pushed to `main`; the remote commit matches
the clean local checkout and includes the public business configuration.
`https://www.tamidzamin.com/` serves the new indexable release over HTTPS.

- All **six hosted browser suites pass**, exercising all nine pages, canonical
  URLs, metadata, accessible content, internal links, contact destinations,
  responsive layouts, no JavaScript and the real retired API.
- Apex-to-www and HTTP-to-HTTPS redirects return **308**.
- The custom domain has no noindex response header. The Vercel alias still
  sends `X-Robots-Tag: noindex, nofollow`; the live sitemap contains nine URLs.
- Security headers are present on public pages. The now-static contact page
  is public/cacheable and has no form token or session cookie; the old
  session-bound no-store rule is no longer needed there.
- Live mobile Lighthouse measurement at **2026-11-19 13:47 UTC**:
  performance **99**, accessibility **100**, best practices **100**, SEO **100**.
  FCP/LCP **1.2 seconds**, total blocking time **102ms**, CLS **0**,
  transfer **3,286,562 bytes**. No run warnings or failed binary audits.

Lighthouse is a lab measurement, not field Core Web Vitals data or a prediction
of Google placement. The SEO score verifies technical checks, not indexing.

The complete browser run found undersized new footer contact targets; those
were increased to 44px before the final passing run. Superseded tests expecting
the removed form, old demo captions or former contact-page CTA destination
were updated to the owner's approved release behavior. WhatsApp navigation
tests intercept the destination locally and do not send a message or call.

These are Edge/Chromium checks with emulated devices, not physical-device,
Safari or assistive-technology certification. The WhatsApp text summary was
checked against sampled decoded frames, not a frame-by-frame transcription.
Do not treat automated scores or structured data as a ranking guarantee.

### Google setup dependency

Search Console must be owned by `tamidzaminai@gmail.com`. The available browser
session was signed into the personal account instead; the correct account's
sign-in was prepared and awaits the owner. No property was created in the
wrong account, no DNS verification record was added, and no sitemap/indexing
request was submitted. The live site's crawlability is independent of Google
Business Profile/Maps, which the owner deliberately deferred.

## Removing redundant demo copy - 19 November 2026

At the owner's request, both short text captions beneath the phones and the
shared explanatory paragraph beneath the demo grid are removed. Playback
controls, matching frame dimensions, accessible media labels, transcript,
error recovery and no-JavaScript links are preserved. The removed WhatsApp
description no longer has a dangling aria-describedby reference. The idle
call caption no longer reserves an empty top margin.

### Verified

- Production build and Astro/TypeScript check passed with zero diagnostics.
- All 43 related production browser tests passed: the copy-removal regression,
  preview safeguards, 14 responsive widths, 200% text, native fallbacks,
  accessibility, both players and transcript synchronization.
- Mobile and desktop captures were visually inspected. The UI detector
  returned no findings; Git's whitespace check passed.

Tests use Edge/Chromium with emulated mobile dimensions, not physical devices
or Safari. The owner explicitly approved committing and pushing all pending
website changes, including the matching phone dimensions, to the existing
Git branch and connected preview. Lead delivery and indexing remain disabled.
Hosted deployment status is separate from these local production-build checks.

## Matching demo phone dimensions - 19 November 2026

The WhatsApp and call demo phones now use shared responsive frame sizing:
a 9:20 aspect ratio with a text-scalable 32rem minimum height. Side-by-side
frames align at the top. The complete WhatsApp recording remains uncropped,
and the call transcript fills the remaining space without compressing controls.
Playback, recordings, supplied transcript and preview safeguards are unchanged.

### Verified

- Production build and Astro/TypeScript check passed with zero diagnostics.
- All 42 related production browser tests passed: responsive layout,
  WhatsApp playback, call playback and transcript synchronization.
- Matching widths/heights verified at 14 viewport widths from 320 to 1920px,
  including both sides of the layout breakpoints. Side-by-side tops align.
- Enlarged 200% text and no-JavaScript fallback frames remain equal without
  clipped controls or horizontal page overflow.
- Desktop and phone captures were visually inspected. The UI detector
  returned no findings; Git's whitespace check passed.

These are local production-build checks using Edge/Chromium with emulated
mobile dimensions, not physical-device or Safari certification. The owner
subsequently approved pushing this sizing change with the demo-copy removal.

## Full-frame Broccoli-reference hero - 19 November 2026

The owner clarified that real video must fill the entire mobile hero and
requested closer desktop/phone layout correspondence to Broccoli. The later
instruction explicitly requests a Git push. Separate WhatsApp-demo work is
preserved and is not part of this hero change.

### Implemented

- Transparent homepage navigation overlays the film, with no separate header
  band. Supporting-page navigation behavior is unchanged.
- Light white Hebrew headline, physically left-composed but semantically RTL,
  starts 280px down on desktop and 200px on smaller screens. Compact blue and
  outlined actions remain adjacent at ordinary phone text sizes.
- The exact explanatory paragraph moves below the hero. The blue decorative
  edge, repeated benefit row and scroll prompt are removed from the hero.
  No Broccoli assets, customer logos, claims or source implementation are used.
- Phone footage is rebuilt as genuine full-frame 9:16 focal crops of all five
  original clips. No blurred extension, padding or baked dark lower panel.
  Output is 720x1280, 24fps, 14 seconds, silent H.264, 3,020,386 bytes.
  The original desktop film's SHA-256 remains unchanged.
- Restrained black scrims preserve readability across scenes. A localized
  top fade protects transparent navigation without becoming a solid header.
  Play/pause, source selection, rotation and static fallbacks are retained.

### Verified

- Astro/TypeScript check: zero errors, warnings or hints. Standalone production
  build passed using an isolated output directory to avoid other local work.
- Vercel production build and deployment-package verification passed, including
  preview routing, static assets and disabled-delivery behavior.
- All 97 browser cases passed without retries: hero, refinement, navigation,
  mobile layout and site/accessibility. Covers 320-1920px, landscape, short
  screens, 200% text, keyboard/touch controls, menus, source rotation, media
  failures, reduced motion and no JavaScript.
- Pixel-sampled contrast passes over the poster and six video positions,
  including every scene: both title lines >=3:1; navigation/menu labels and
  both hero actions >=4.5:1 at tested desktop and phone sizes.
- Decoded lower halves were compared with the corresponding original focal
  crops in all five scenes. PSNR: 38.97, 42.72, 44.09, 41.20 and 39.94 dB,
  above the 28 dB verification threshold. This checks actual footage rather
  than merely the video element's rectangle.
- Desktop and phone screenshots were visually inspected across multiple
  scenes, including the bright repair scene after the final contrast fix.
  Impeccable's final layout scan returned `[]`.

The initial contrast expansion exposed weak mobile-menu contrast on a bright
scene; the top fade fixes it. Sampling now preserves button surfaces, removes
only text ink without transitions, and avoids scrolling during scene changes.
The final complete browser run passed after that correction.

Tests use installed Edge with emulated phone dimensions and touch, not physical
iPhone/Android or Safari certification. Preview noindex and disabled lead
delivery remain unchanged.

## Recorded WhatsApp demonstration - 19 November 2026

The supplied screen recording replaces the illustrative WhatsApp conversation
inside the existing phone. The original is unchanged. The full recording is
accelerated to 3x and converted locally from HEVC to broadly supported H.264:
720x1600, 24fps, 45.708333 seconds, 3,405,953 bytes, with fast-start metadata.
The 137.183447-second source divided by three matches the output within one
24fps frame. The original audio stream is silent (FFmpeg mean/max -91 dB) and
is omitted. The poster shows a representative conversation frame.

### Verified

- Production build and Astro/TypeScript check: 66 files, zero errors,
  warnings or hints. No added website dependencies.
- All 76 production browser cases passed across `whatsapp-demo`, `motion`,
  `mobile-layout`, `call-demo`, `call-transcript` and `refinement`.
  After selecting the final poster, the production build and all 10
  WhatsApp-specific cases passed again.
- Real H.264 decoding and video time advance; no video request before
  activation. Encoded 3x duration is verified, including no-JavaScript playback.
  Fullscreen uses native controls and returns to custom inline controls.
- Play/pause, keyboard seeking, end/replay, restart, loading cancellation,
  rapid input, download failure/retry, fullscreen rejection and direct-file
  recovery pass. Reduced motion permits intentional playback; synthetic hidden
  page and page-exit events pause without auto-resume.
- Responsive layouts pass at 320, 360, 390, 430, 600, 601, 768, 880, 881,
  1024, 1100, 1101 and 1440px. Existing landscape, short-screen and 200%-text
  checks remain green. All new controls have 44px minimum targets.
- Axe found no WCAG A/AA violations in the tested channels state. The changed
  UI detector returned `[]`. Existing call playback and all 48 transcript
  cues remain tested, with no source audio/transcript edits.
- Preview noindex and disabled lead delivery remain intact.
- Final desktop/phone render captures were visually inspected together.
  FFmpeg decoded the complete optimized recording without errors, and its
  byte count and SHA-256 match the stored provenance record.

The initial test attempt used a previously running stale preview and was
discarded; the clean production process passed all 76 cases. Tests use
installed Edge/Chromium, emulated phone sizes and synthesized taps, not
physical Android/iPhone or Safari certification. The iOS native-fullscreen
fallback is implemented but not verified on hardware. These checks cover
the local production build, not a hosted deployment. The owner subsequently
requested a GitHub push of the WhatsApp update only, excluding concurrent
hero changes. Recording contents and participant permissions remain the
owner's responsibility; lead delivery and indexing remain disabled.

## Synchronized phone transcript - 19 November 2026

The supplied Hebrew transcript is now displayed inside the demo phone as
48 timed phrases covering all 21 original speaker turns. User wording,
punctuation and order are preserved, including ambiguous transcription.
The source MP3 is unchanged. The owner requested a GitHub push after completion.

### Alignment evidence

Alignment ran locally with FFmpeg 8.1 and faster-whisper 1.2.1 / CTranslate2
4.9.0, using independent Hebrew word-timestamp passes from
`Systran/faster-whisper-small` and
`mobiuslabsgmbh/faster-whisper-large-v3-turbo`. Word timing was checked against
silence and RMS/peak-energy boundaries. No recording or transcript was sent
to a transcription service. Recognition differences were used for timing,
not to rewrite the supplied text.

Timing values have 0.01-second resolution, but practical acoustic boundary
uncertainty is about 0.10-0.25 seconds; this is signal/ASR alignment, not manual
listening or word-level karaoke. Cues are ordered, non-overlapping and preserve
silence gaps. The longest phrase is 45 characters.

### Verified

- Production build and Astro/TypeScript check: 63 files, zero errors,
  warnings or hints. No website dependency changes.
- Six unit tests pass: verbatim reconstruction of all turns, correct speaker
  order, ordered cue boundaries, exact-edge/silence selection, seek context,
  timestamp formatting and unchanged audio SHA-256.
- 62 related browser cases verified on the production build: 61 passed in
  the broad run; the no-JavaScript case passed after fixing its font-loading
  race. The final rerun of all nine transcript cases passed. No production
  code changed between these two production test runs.
- All 48 cues were sought and checked for the correct highlight and full
  visibility at 320, 768, 1024 and 1440px. Inner scrolling never moved the
  page. Normal playback follows the media clock; runtime highlight mismatch
  did not persist for 100ms. This runtime check is separate from acoustic
  timing uncertainty above.
- Pause, seek, replay, end, silence, manual reading, return-to-call, 200%
  text, native no-JavaScript reading, reduced motion and keyboard operation
  pass. Existing real playback, touch, failure/retry, navigation, hero,
  responsive and preview-safeguard checks remain green.
- Axe reported no A/AA violations in the tested phone state. Desktop, phone
  and narrow-desktop captures were inspected. The UI detector returned `[]`.

The transcript is not a live region that speaks over the audio. It does not
prove that statements made in the recording about receiving a request or
arranging a visit actually completed an integration. Browser tests use
installed Edge with emulated mobile viewports, not physical-device/Safari
certification. Hosted deployment verification is separate.

## Recorded phone demonstration - 18 November 2026

The homepage phone now plays the owner's exact 135-second MP3 on activation.
The blue phone frame is retained, with a large play/pause target, elapsed and
total time, a native seek slider and restart. The phone service page links to
`/#phone-demo`. Recorded-versus-live labels replace the obsolete silent-phone
disclosure; WhatsApp remains an illustration.

### Verified

- Production Node build and final Astro/TypeScript check: 60 files, zero
  errors, warnings or hints. No new dependencies.
- 53 cases covered across `call-demo`, `motion`, `mobile-layout` and
  `refinement`: 44 passed on the broad production run; the remaining nine
  passed after updating obsolete layout/motion test assumptions. No production
  code changed between these runs.
- Real browser MP3 playback advances, remains unmuted, seeks, pauses, reaches
  the end and replays. Keyboard and emulated mobile touch both operate it.
  Cancellation during a pending load, rapid toggles, failed-download retry,
  reduced motion, synthetic visibility/pagehide, and no-JavaScript fallback
  were exercised. No audio request was made before activation.
- Production HTTP response is `audio/mpeg`, 2,160,044 bytes, with SHA-256
  `363c48fa31ac18088552e84f92d39b4190e334519abd87e299e6f3e13a7cac59`,
  identical to the supplied attachment. FFmpeg decoded it without errors.
- Responsive layouts pass at 320, 360, 390, 430, 600, 601, 768, 880 and
  881px; broader 1024/1440px, landscape, 200%-text and text-containment checks
  also pass. Final desktop and phone captures were visually inspected.
- Axe found no WCAG A/AA violations in the channels section in the tested
  state. The changed-UI mechanical design detector returned `[]`.

These are installed Edge checks with emulated mobile input, not physical
iOS/Safari or full assistive-technology certification. No verified transcript
was supplied or invented. Review personal information and recording/publication
permissions before publishing. The initial implementation was local only.
The owner subsequently requested a GitHub push for the connected website
preview update. Lead activation and indexing remain disabled; the checks
above describe the local production build, not a hosted deployment check.

## Phone-sized portrait video - 18 November 2026

The owner's follow-up requested a phone-appropriate video fit and a Git push.
The new mobile asset is 720x1280, 24fps, 14 seconds, silent H.264 with
fast-start metadata, 2,510,750 bytes. It is an adaptation of the same five
existing animated shots, not newly generated footage. Per-scene square crops
preserve the person and work in the upper frame and blend into a softly
extended moving background under the copy. The desktop film is unchanged.

At portrait widths up to 600px, native picture selection loads the matching
portrait poster and the playback controller selects only the portrait film.
The mobile contrast scrim follows the actual text position instead of dimming
the whole scene. Rotation switches to the wide version and back, preserving
scene position and manual pause. Paused source changes defer video loading.
Full-hero coverage, overlaid Hebrew copy, touch targets, accessibility and
preview/noindex/disabled-delivery safeguards remain in place.

### Verified

- Node and Vercel builds: 53 files checked, zero errors, warnings or hints.
  `npm run test:vercel` passed. The packaged portrait film matches its source
  SHA-256; the desktop film retains the owner's original hash.
- 72 targeted browser cases passed, no retries: hero, refinement, mobile-layout
  and site suites. Includes actual decoded media dimensions and advancing
  playback, single-variant downloads, correct no-JS/reduced-motion posters,
  rotation while playing and paused, synthetic touch taps, failure fallbacks,
  and existing navigation/axe/200%-text safeguards.
- Video fills every hero edge at 320x568, 320x740, 360x800, 390x844, 430x932,
  600x844, 768x1024, 844x390, 1440x900 and 1920x1080.
- Full text-box contrast passes on posters and six film positions across
  every scene: large text >=3:1 and body >=4.5:1 at 320, 390, 1024 and 1440px.
  The test hides text ink, not the actual contrast scrim.
- All five scenes were visually inspected in 320px and 390px phone captures.
  Desktop/landscape still use the original 1280x720 film and framing.
- Impeccable's changed-UI detector returned `[]`.

These are installed Edge browser checks with emulated mobile screens/touch,
not physical-device or Safari certification. Hosted verification follows the
Git push.

## Full-bleed video hero - 18 November 2026

The owner supplied the original-photos film and requested a video background
covering the entire hero on desktop and phones, with text on top, plus a Git
push of all pending work. This authorizes the connected preview update, not
lead activation, indexing or real customer communications.

### Implemented

- The exact supplied 14-second, 1280x720 silent MP4 replaces the hero photograph.
  Video and first-frame poster cover every hero edge. The copy and actions
  remain accessible Hebrew HTML, over responsive contrast scrims.
- The previous split mobile photo/copy treatment and still-image zoom are
  removed. The existing headline arrival, blue edge, action hierarchy and
  all other sections are preserved. Minimum heights allow enlarged text and
  short landscape layouts to grow rather than clipping.
- Muted inline looping playback has a labeled keyboard-operable pause/play
  control. Manual pause survives scroll re-entry. Offscreen, visibility and
  page-lifecycle changes suspend playback.
- Initial reduced motion and disabled JavaScript show the poster without
  requesting video. A live reduced-motion change restores the poster and
  requires manual play if the preference is later disabled. Blocked autoplay
  offers manual play; failed media retains the poster and announces the
  fallback. Media is same-origin, not embedded from Google Drive.

### Verification

- Node build and Vercel build: passed, 52 checked files, zero errors,
  warnings or hints. `npm run test:vercel` passed. The packaged Vercel MP4
  matches the source SHA-256 exactly.
- All 71 browser tests passed with no retries, using installed Microsoft
  Edge: 50 hero/refinement cases plus 21 site/mobile-layout/motion cases.
- Real playback time advances, the clip loops, keyboard pause/resume works,
  and the media rectangle matches the full hero at 320, 390, 768, 844, 1440
  and 1920px. Poster-only paths request no MP4.
- Pixel-sampled contrast passes over full headline/body boxes on the poster
  and six film positions covering every scene, at 1440, 1024, 390 and 320px.
  Large text meets 3:1 and body text meets 4.5:1.
- Existing axe checks, Hebrew semantics, navigation, no-JavaScript behavior,
  200% text, motion cancellation, preview/noindex and disabled-delivery
  safeguards pass. Desktop/phone captures were visually inspected across
  three scenes; the video remains visible behind the overlay on both.
- The final changed-UI Impeccable detector returned `[]`.

These are desktop Edge tests with emulated screen sizes, not physical iPhone,
Android or Safari verification. Page-lifecycle events were synthesized;
real OS backgrounding and low-power autoplay restrictions remain unverified.
Hosted deployment status is checked separately after the push.

## Hero arrival and mobile simplification - 18 November 2026

This refinement was initially **local only**, after the earlier animation
commit. On 18 November 2026 the owner requested committing and pushing the
verified hero and mobile changes to the existing GitHub repository. This
authorizes the connected Vercel preview update, not live communications,
lead activation or indexing. Hosted deployment completion is separate from
the local checks below. Unrelated repository changes are excluded.

### Requested first-impression changes

- The supplied hero photograph now settles from a restrained zoom, rather
  than receiving only an opacity fade. Two headline lines resolve from
  bounded 3px blur and 18px travel, with the answer line in the existing cyan.
  The original raster blue edge uncovers right-to-left. These effects settle
  within 1020ms once the image is available and run again on full reload.
- Body copy and actions never wait for the sequence. A delayed image gets its
  own entrance after load without delaying the words or action. Switching to
  reduced motion cancels pending effects too, including when the image has
  not arrived yet; switching back does not revive that canceled entrance.
- The hero has a larger, clearer desktop headline, stronger photograph/copy
  separation, a quieter blue edge, one primary pill and a secondary text link.
- On phones the photograph is more prominent and copy is right-aligned.
  The primary action spans the available width with a 56px minimum height;
  the process link remains below it with a 48px target. The redundant benefit
  row and separate scroll prompt are hidden at widths up to 600px. Their
  information and destinations remain in the body, navigation and following
  sections. Factual wording and the other homepage sections are preserved.

### Final verification

- `npm run build`: passed; 51 files checked with zero errors, warnings or hints.
- Complete production-browser suite: **59 passed**, no retries, in Microsoft
  Edge. Eight new hero cases cover actual load/reload, delayed image loading,
  reduced-motion cancellation before and during image arrival, primary-action
  availability and mobile hierarchy. Existing responsive and motion tests were
  updated only for the intentional headline and action changes.
- Pixel-sampled contrast passes over the full boxes of both headline lines
  and body text at 1440, 1024, 390 and 320px. The test now evaluates the actual
  foreground color rather than assuming every headline glyph is white.
- Existing keyboard, no-JavaScript, reduced-motion, 200% text, mobile
  navigation, anchor/history, image-loading and axe checks all pass, as do
  the preview/noindex and disabled-delivery safeguards.
- Desktop, tablet and phone renders were inspected, including timed arrival
  frames and final production captures. At 1440x900, 390x844, 320x740 and
  768x1024, the header plus hero fill the initial viewport with no horizontal
  overflow. Both phone actions fit in the first viewport. Short/enlarged-text
  layouts grow rather than clipping.
- No JavaScript errors were captured. The production homepage motion bundle
  is 3423 bytes before compression, with no new dependency or asset.
- The finished changed-UI Impeccable detector returned `[]`; whitespace checks
  passed.
- Local desktop-browser frame samples during cached desktop reloads and the
  phone-sized entrance had approximately 16.7ms median and 17ms p95 intervals.
  Cold-browser desktop startup still showed frame stalls, also present in a
  static reduced-motion control; this is not a cold-load 60fps guarantee.

Production captures, the before/after hero, arrival storyboard, frame
profiles and test output are under:

`C:\Users\USER\AppData\Roaming\Lumi\copilot\session-state\3778e32d-b8ca-4ebb-8359-05b51f0a5cd1\files`

These are local browser-emulated viewports, not physical-device performance
measurements. Safari/Firefox, assistive-technology use and real background-tab
behavior remain unverified. No accessibility certification is implied.

## Authored motion refinement - 18 November 2026

The initial refinement was **local only**. The owner subsequently requested
committing and pushing these animation changes to the existing GitHub
repository on 18 November 2026. This authorizes the connected Vercel preview
update, not lead activation, indexing, live communications or changes to
production configuration. Hosted deployment completion is separate from the
local verification below. Unrelated repository changes are excluded.

### Implemented

- The existing chat illustration now sequences its three messages and uncovers
  the confirmation summary, settling within 2340ms. The voice illustration
  plays one waveform phrase, settling within 2580ms. Both remain explicitly
  labeled illustrations with no active conversation.
- Each illustration has a keyboard-operable 44px replay control. Rapid replay
  cancels the previous sequence; it does not move the device frame again.
  Space for controls is reserved, including when reduced motion hides them.
- Hero image arrival is 760ms, with a brief sequential accent on the existing
  channel/summary/human icons. Headline, body and calls to action are never
  delayed. Existing process and About motion are preserved.
- Desktop navigation draws its underline from the right. Pill icons provide
  subtle hover/focus feedback. The native mobile menu has a 220ms entrance,
  a state-changing menu/close icon, and immediate dismissal.
- Native FAQ disclosures interpolate their grid content over 260ms on
  supporting browsers, without JavaScript height measurement or toggle
  interception. Unsupported browsers retain native disclosure.
- Authored effects pause below 15% intersection and in hidden tabs. Reduced
  motion cancels them, removes spatial UI transitions and leaves content and
  state feedback available. No automatic looping, sound, new dependency,
  external request, fabricated claim or change to intake behavior.

### Verified against the production Node preview

- `npm run build`: passed, zero Astro/TypeScript diagnostics.
- Final `npm run check`: 50 files, zero errors, warnings or hints.
- Final complete Playwright run: **49 passed**, no retries, in Microsoft Edge.
  The six added cases verify desktop/mobile chat order, keyboard replay and
  rapid interruption, actual waveform movement and pause/resume, live
  reduced-motion changes, native FAQ interpolation/reversal and mobile menu
  feedback. Existing motion expectations now cover the new device sequence.
- Existing coverage passes for 320-1920px responsive routes, 200% text, loaded
  imagery, text containment, Hebrew/RTL semantics, native anchors/history,
  no-JavaScript usability, hero contrast and axe WCAG A/AA checks on nine
  routes. Preview/noindex and disabled lead-delivery safeguards still pass.
- Rendered checks include desktop/mobile hero and channels, timed chat
  storyboard frames, the voice illustration, expanded FAQs and the mobile
  menu. Captured pages emitted no JavaScript errors.
- A 120-frame sample during voice playback at each of 1440x900 and 390x844
  measured a median frame interval of about 16.7ms; p95 was at most 17ms.
  These are local desktop-browser rAF measurements, not physical-device
  performance guarantees or a replacement for a field benchmark.
- The generated homepage motion script is 3167 bytes before compression.
  The changed-UI Impeccable detector returned `[]`.

Screenshots, frame metrics and regression outputs are retained under:

`C:\Users\USER\AppData\Roaming\Lumi\copilot\session-state\3778e32d-b8ca-4ebb-8359-05b51f0a5cd1\files`

Physical iPhone/Android hardware, Safari/Firefox, real background-tab behavior
(the existing visibility test is synthetic), and assistive-technology use
remain unverified. No accessibility certification or launch approval is implied.

## Mobile layout refinement - 18 November 2026

This follow-up is **local only**. No commit, push, deployment, live demo,
contact delivery, indexing or production configuration change was made.

### Layout and reading order

- Each channel now owns a heading, figure, feature list and service action in
  that DOM order. At phone widths the entire WhatsApp group precedes the phone
  group. Both have visible illustration-only captions.
- Phone/tablet demo text is at least 14px at the default root size; each device
  is up to 280px wide and grows with enlarged text. Tablet pairs the articles;
  desktop retains the central two-device composition and brand connector.
- Equal-width hero actions stack when space or enlarged text requires it.
  Section spacing is 48-64px on phones, with smaller, consistent internal gaps.
- Process icons leave more room for copy. Trade photos scale proportionally;
  explicit tile widths prevent an unloaded image and minimum height from
  widening a small-screen grid. Benefits use one readable icon/text column.
- Human-handoff copy precedes its photograph; About principles stay together
  before their image. FAQ padding, evidence spacing, closing action and footer
  navigation are aligned with the mobile rhythm.
- All ten homepage sections, Hebrew/RTL content, imagery, colors, real
  navigation and preview safeguards remain. No tabs, carousel, simulated live
  interaction or new capability claims were introduced.

### Final verification

- `npm run build`: zero Astro/TypeScript errors, warnings or hints.
- `npm run test:browser`: **43 passed**, no retries, against the production
  Node preview in Microsoft Edge. This includes ten new layout regressions and
  all 33 existing browser tests, with device animation/disclosure expectations
  updated for two independently observed figures.
- New regressions cover 320, 360, 390, 430, 600, 601, 768, 880 and 881px:
  device readability and width, per-channel reading order, visible control
  heights of at least 44px, keyboard action order, aligned tablet actions,
  single-column benefits and no horizontal overflow. A 320px / 200% root-text
  case inspects actual text ranges inside both device frames.
- Existing coverage passes for 200% text and expanded FAQs, no-JavaScript
  fallbacks, reduced and one-shot motion, menu/history/anchor behavior, image
  loading, hero contrast and axe WCAG A/AA checks on all nine public routes.
  Responsive route checks extend through 1920px.
- Rendered review covered every mobile section, the two separate demos at
  320/390px, paired demos at 601/768px, desktop composition at 1440px, expanded
  FAQs, short landscape layouts and enlarged text. Captured layouts at
  360x800, 390x844, 768x1024, 1024x768, 1440x900, 1440x500 and 844x390 have no
  horizontal overflow or text outside their sections. The 360px hero now
  ends at 800px, without the prior extra wrapped-action height.
- The isolated baseline layout detector and final full changed-UI detector
  both returned `[]`. Diff whitespace validation passed.

Before/after screenshots and geometry are retained in the session artifacts:

`C:\Users\USER\AppData\Roaming\Lumi\copilot\session-state\59493c5a-2b1e-4889-9559-7f22e58257c6\files`

These are local browser-emulated viewports, not physical iPhone/Android tests.
Safari, Firefox, real device safe-area insets and assistive-technology reading
order remain unverified. No new performance benchmark or launch approval is
claimed by this layout pass.

## Git-linked deployment approval - 18 November 2026

After the local refinement was completed, the owner explicitly requested a
commit and push to update the existing connected Vercel deployment.
The local Vercel production build passes with zero Astro/TypeScript diagnostics.
`test:vercel` also passes for generated output, Node 24, static routes/assets,
404 routing, crawler safeguards, headers, SSR contact and disabled API behavior.
No environment variables, DNS, backend behavior or launch gates were changed.
This authorizes updating the hosted preview, not activating leads or indexing.

## Viewport and motion refinement - 18 November 2026

The initial work was a **local-only refinement**, not a rebuild or deployment. The repository
was clean before editing; the earlier production website chat was idle. No
existing user changes were reverted. No commit, push, deployment, DNS change,
purchase or real communication was performed during that initial phase.

The approved Hebrew/RTL identity, navy/white/electric-blue palette, original
imagery, ten-section homepage order, factual copy and safeguards remain.
The only new visitor copy is a scroll invitation and an explicit "illustration
only / no active call" label. The screenshot's compressed proportions were
expanded with the owner's explicit approval.

### Actual geometry, not just CSS declarations

Microsoft Edge 157.0.4341.60 / Playwright, production Node build, default 16px
root text and static reduced-motion captures:

| Viewport | Header | Hero bottom from document top | Result |
|---|---:|---:|---|
| 360 x 800 | 68px | 806.34px | Natural 6.34px growth for wrapped content; no clipping |
| 390 x 844 | 68px | 844px | Header and hero exactly fill the viewport |
| 768 x 1024 | 68px | 1024px | Header and hero exactly fill the viewport |
| 1024 x 768 | 76px | 768px | All 10 sections measure 692px, the available height |
| 1440 x 900 | 76px | 900px | All 10 sections measure 824px, the available height |
| 1440 x 500 | 76px, nonsticky | 681.52px | Content grows; section heights 456.50-737.27px, all above the 424px minimum |
| 844 x 390 | 68px, nonsticky | 904.06px | Short landscape layout grows naturally; all content remains reachable |

All seven captures have **no horizontal overflow and no text outside section
bounds**. At desktop widths the minimum applies only to direct homepage
sections. The footer remains content-sized (153px in the 1440px capture), and
supporting/legal pages retain their original content-led layout.

At 1440 x 1000, the unchanged baseline header/hero ended at 472px; the refined
version ends at 1000px. At 1024 x 768 it moved from 376px to 768px. These are
measured geometry comparisons, not vertically stretched reference images.

### Engineering and interaction verification

- Production build and Astro/TypeScript check: **0 errors, warnings or hints**.
- Existing unit tests: **26 passed**.
- Existing browser suites: **5 passed** on the production preview, including
  axe WCAG A/AA checks on all nine public routes, internal links, responsive
  images, keyboard menu/FAQ/skip-link behavior, no-JS FAQ, 404 and safeguards.
- New refinement regressions: **28 passed**. The final combined run passed
  **all 33 browser tests in 46.2 seconds**, with no retries. Coverage includes
  measured geometry/text containment, 200% root text plus all FAQs expanded
  at 390/1024/1440px, direct hashes and back/forward history, keyboard and
  synthesized touch, no-JS homepage/menu/FAQ, real WAAPI progress and offscreen
  pause/resume, one-shot completion, initial/live reduced motion and rendered
  photo contrast. The visibility-event case is explicitly synthetic.
- Existing responsive route checks pass at 320, 390, 680, 768, 1024, 1440 and
  1920px. New captures add 360px and both short viewports above.
- Local-only delivery integration: **5 verification groups passed**, including
  real browser correction/error/timeout paths against a loopback mock receiver.
- Isolated launch-mode SEO fixture passes. This does not enable indexing in the
  actual preview or contact an external service.
- `verify:launch` **fails as expected** on the unconfigured preview. Noindex,
  blocked robots, empty sitemap, disabled form and rejected lead submissions
  remain intact. Backend/configuration code and dependencies were not changed.
- A preliminary run against the development server encountered Astro toolbar
  headings inside shadow DOM. This was not an application failure; final tests
  run against production without the toolbar, rather than weakening assertions.

### Rendered contrast and motion inspection

Visual review covered desktop, tablet, phone, short screens, individual section
compositions, the mobile menu and expanded FAQs. A screenshot does not establish
animation behavior: live browser timelines were sampled as well.

- A real Lumi browser run at 508px recorded **140 animation frames**, **106
  distinct process-icon transform states**, then zero running process
  animations and all four icons back at their static transforms.
- A separate isolated headed Edge run sampled the desktop sequence and native
  wheel/PageDown scrolling. Median frame interval was **16.7ms**, p95 **17.3ms**.
  The sequence settled, a 233px wheel input remained a normal scroll, and
  PageDown advanced normally without snapping.
- These are local unthrottled lab samples, not a physical phone GPU, field INP
  measurement or universal 60fps guarantee.
- The attempted real background-tab/minimized-window tests continued reporting
  `document.visibilityState = visible` in this automation environment. Do not
  describe those attempts as a real hidden-tab pass. The implementation uses
  visibilitychange/document.hidden; synthetic lifecycle coverage is distinguished
  from physical browser visibility testing.
- The finishing pass found a text-over-photo contrast risk that automated axe
  did not detect. The left hero overlay was strengthened. With text temporarily
  hidden and its layout retained, conservative sampling of **every background
  pixel in the text bounding boxes** now gives body-copy contrast **6.90:1**
  at 1440px and **7.17:1** at 1024px; headline minima are **7.67:1** and
  **9.78:1**. Tablet/mobile text sits on navy (above 18:1 in those captures).
  These bounds are stricter than sampling only pixels behind glyph strokes.

### Before/after production performance

Same local machine, Edge and Lighthouse mobile simulation, fresh production
builds, noindex retained. Single runs are directional, not statistically
significant performance improvements:

| Metric | Unchanged baseline | Final refinement |
|---|---:|---:|
| Performance | 93 | 94 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 69 | 69 |
| LCP | 2.9s | 2.8s |
| TBT | 180ms | 160ms |
| CLS | 0 | 0.009 |
| Transfer size | 511,938 bytes | 415,249 bytes |

SEO remains intentionally limited by crawler blocking. LCP remains above the
2.5s "good" threshold in this simulated run; measure on the actual HTTPS host
and physical devices before launch. The new homepage-only motion module is
approximately 1.9KB uncompressed; no motion dependency, remote font, analytics,
continuous animation loop or new raster asset was added.

### Impeccable finishing checks

Native activation was unavailable. The installed SKILL.md, local setup notes,
context loader and layout/animate/adapt/optimize/harden/audit/polish/craft-floor
guidance were read directly. No hooks, live mode, permission bypass, installation
repair or automatic configuration changes were enabled.

The required one-time manual detector scanned the changed UI and returned
`[]` (zero findings). The source diff/whitespace check passed. Subsequent visual
polish addressed the photo seam and conservative text contrast; the detector
was not repeatedly run as a substitute for rendered verification.

| Technical audit dimension | Score / 4 | Evidence / limit |
|---|---:|---|
| Accessibility | 3 | Axe, keyboard, native disclosures and rendered hero contrast; no screen-reader certification |
| Performance | 3 | Small JS, no loops/dependencies, CLS 0.009; simulated LCP still 2.8s |
| Theming | 3 | Existing palette/font/materials retained; localized illustrative colors remain intentional |
| Responsive design | 3 | Measured widths, short screens and content growth; physical devices/Safari untested |
| Implementation integrity | 4 | Coherent reference identity, factual content, static fallback and unchanged launch gates |
| Total | **16 / 20** | Good; bounded remaining verification gaps, not a full accessibility certification |

No P0/P1 functional defect remains in the verified scope. The LCP target is a
remaining P2 performance concern; hardware/browser coverage is a verification
limit rather than a fabricated pass. This is an implementation finishing review,
not the earlier independent reference-reproduction verdict.

### Evidence and remaining limits

Before/after screenshots, measured geometry, expanded states, Lighthouse JSON,
pixel-contrast data and runtime motion evidence are kept locally in this Lumi
session's `files` directory:

`C:\Users\USER\AppData\Roaming\Lumi\copilot\session-state\9b8d1284-c7b4-41fb-b65d-8426ca77384b\files`

Reproduce current captures with `scripts\capture-refinement.mjs`; use
`TEST_BASE_URL` for the running production preview and `REVIEW_DIR` for output.
The matching desktop/mobile before-after PNGs are delivered separately.

Physical iPhone/Android browser controls, Safari/Firefox, assistive-technology
reading order, forced-colors mode and real hidden-tab visibility remain
unverified. `svh`, native disclosures, logical RTL layout and visible default
content are implementation safeguards, not substitutes for those device tests.
There is no public launch approval or claim that any illustrative phone is live.

## Historical verification

Checked locally on **17 November 2026** using Node 24.12.0, Astro 7.4.12,
Microsoft Edge, Playwright 1.65.1, axe-core integration and Lighthouse 13.6.0.
The original results below describe the local implementation. The clean-install
correction section also records the subsequently verified Vercel deployment.

## Clean-install correction

The first hosted Vercel build exposed four missing EMNAPI lockfile entries.
The exact error was reproduced with npm 12.2.2; npm 11.6.2 accepted the same
incomplete lockfile. npm regenerated the missing optional dependencies without
changing any existing package version or bypassing `npm ci`.

Correction checks on 17 November 2026:

- Two new lockfile regression cases fail against the original lockfile and pass
  after repair.
- An isolated clean install using Node 24.22.3 and npm 12.2.2 passes, followed by
  all **26 unit tests**, the Vercel production build and generated-function smoke
  checks. The lockfile is unchanged by the clean install/build.
- npm 12 also completes a separate clean Linux x64/glibc-targeted install with
  scripts disabled. This checks platform dependency resolution on Windows; it
  is not a claim that the Linux runtime was exercised locally.
- No application behavior, dependency versions, approval gates or Vercel install
  command were changed. npm's nonblocking esbuild install-script warning did
  not prevent the tested build; no permissive script-policy bypass was added.

Hosted follow-up: Vercel marked commit `551a28c` **Ready** after a 31-second
build. All five browser suites then passed against
`https://tamidzamin-ai-agency.vercel.app`, including accessibility checks on all
nine public routes, responsive images/layout, navigation, native FAQs, 404,
no-JavaScript behavior and noindex/disabled-intake safeguards. The suite accepts
an explicit `TEST_SITE_ORIGIN` so preview metadata is verified against the
unique Vercel deployment origin rather than a hard-coded local URL.
Live HTTP checks confirmed security headers on both static and SSR pages and
`Cache-Control: no-store` on contact. This is a working hosted **preview**, not
approval to enable intake, indexing or unsupported company claims.

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
blocked there until a durable backend is implemented and approved. The initial
preparation performed no hosting deployment, DNS update, spending or real
communication; the later owner-initiated Vercel deployment is recorded above.

## Verified engineering results

| Check | Result |
|---|---|
| Production build and Astro/TypeScript check | Pass; 0 errors, 0 warnings, 0 hints |
| Unit tests | 26 passed: 19 backend cases, unpublished launch gate, 4 deployment cases, 2 lockfile cases |
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
