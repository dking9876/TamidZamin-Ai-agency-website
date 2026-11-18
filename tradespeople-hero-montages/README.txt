TAMIDZAMIN - PEOPLE AT WORK
Original animated human tradespeople | 18 November 2026

This revision replaces the miniature/robot concept with full-environment,
hand-drawn-style character animation. It uses Broccoli's short, multi-shot
home-service storytelling as a reference, not its footage or artwork.
All scene artwork and character animation in this package are original.
No actual people, identifiable customers or real conversations appear.

THREE EDITS, SHARING FOUR ORIGINAL ANIMATED SCENES

1. A service day - recommended all-round hero.
   Doorstep greeting > plumber working under a sink > HVAC technician working
   on equipment > homeowner using a phone.

2. Hands at work - more emphasis on the trades.
   Closer plumbing work > closer HVAC work > doorstep greeting.

3. From home to help - starts with the homeowner.
   Homeowner using a phone > doorstep greeting > plumbing > HVAC.

Each edit is exactly 12 seconds, 24 fps, silent and looping. These are three
alternative cuts of the same original animation, not three unrelated films.
The editing is a conceptual montage, not an actual sequence of customer events.
It does not demonstrate diagnosis, quotes, booking, payments or a completed
automated handoff.

FILES TO USE

videos/<name>.mp4
  1920 x 1080 H.264 website hero background.
  No headline or CTA burned in. A dark left-side treatment is included for
  the current desktop headline position. Action is concentrated on the right.

videos/<name>-mobile.mp4
  960 x 960 H.264 mobile background.
  Reframed around people and their work without the desktop left-side scrim.
  Intended above the mobile headline, following the current website layout.

videos/<name>-phone-preview.mp4
  720 x 1280 phone-review video.
  Animation above the current Hebrew headline and a sample CTA.
  FOR REVIEW ONLY: the text and sample button are baked into these files.

posters/
  Desktop and mobile fallback images for each edit.

index.html
  Responsive comparison preview with pause, video-only mode and downloads.
  Respects reduced motion, pauses offscreen/in a hidden tab, reports playback
  errors and uses locally supplied Heebo fonts and the existing brand logo.
  Open the file locally, or run: node serve.mjs
  Local preview address: http://127.0.0.1:4320/
  That local address is not remotely accessible from a phone. Use Drive.

WEBSITE INTEGRATION NOTES

Use the clean desktop/mobile MP4, never the phone-review file, as background.
Use muted, loop, playsinline and an appropriate poster. Respect reduced motion,
provide a pause mechanism, and keep the headline/CTA as accessible HTML.
These MP4s are noninteractive. Review-player buttons work; the artwork itself
does not react to mouse or touch. The sample CTA does not submit anything.

The current website source has NOT been changed, published or deployed.
Choose an edit before integrating it.

REPRODUCING THE EXPORTS

The source animation uses the browser's native Canvas 2D API, no remote assets.
Rendering uses Node.js, installed Edge, FFmpeg and the website's existing
@playwright/test and sharp dependencies.

1. node serve.mjs
2. node render.mjs --stills
3. node render.mjs
4. node verify.mjs

You may render a single edit with: node render.mjs 0 (or 1, 2).
The standalone video preview needs none of the rendering dependencies.

LICENSES

Scene artwork and animation were authored for TamidZamin.
The existing brand logo is reused from the project, not newly licensed here.
Heebo's license is included with its local font assets.
Broccoli's reference video is not included in this package.
