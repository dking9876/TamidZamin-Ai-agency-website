TAMIDZAMIN - ORIGINAL WEBSITE PHOTOS IN MOTION

This video uses the existing website artwork, not newly drawn characters,
stock footage, or the earlier cartoon scenes.

SOURCE IMAGES
  01_hero_background.png - current sunset arrival hero
  02_trade_plumber.png
  03_trade_electrician.png
  04_trade_repair_technician.png
  05_trade_hvac_technician.png

The original PNGs are untouched. SHA-256 hashes, frame crops, prompts and
generation details are recorded in sources.json.
Video-ready crops are in frames/. The HVAC frame is horizontally flipped
to place the working hands on the appropriate side of the composition.

The supplied photographs were animated with Google Flow, using Veo 3.1 Lite
and free credits only, with the user's permission. Help improve Flow was
off before uploading. The service's visible watermark setting was already
off; invisible AI provenance/SynthID was not deliberately removed.

Two initial trade generations failed during audio generation and their
credits were refunded. Those scenes were retried with Return silent videos
enabled. An additional appliance generation did not produce an available
clip and its credits were returned; a simpler retry completed.
The five retained clips used 50 free credits in total. No subscription,
paid credit top-up or AI upscale was purchased.

The people remain illustrative, not identified staff or customers. This is
an AI-animated brand montage, not documentation of a real service visit or
proof of product capabilities.

DELIVERABLES

videos/tamidzamin-original-photos-film.mp4
  The unobstructed 1280x720 film. Best for watching the complete animation.

videos/tamidzamin-hero-desktop.mp4
  1920x1080 website-ready background, with right-side framing and a dark
  left-side treatment for the current Hebrew headline. No text is burned in.
  The 720p source generations are conventionally scaled to 1080p, not
  natively generated at 1080p and not AI-upscaled.

videos/tamidzamin-hero-mobile.mp4
  960x960 reframed background for use above the mobile headline.

videos/tamidzamin-hero-phone-preview.mp4
  720x1280 phone-review video with the existing Hebrew headline and a sample
  CTA below the animation. Do not use this baked-text file as a website
  background; use the clean desktop/mobile versions.

All four final videos are 14 seconds, 24 fps, silent H.264 MP4s with
fast-start metadata. The opening scene is blended back into the ending for
looping. Fallback posters are included.

generated-clips/
  The original eight-second Flow clips, retained for future edits.

sources.json
  Source provenance and reproducible editing details.

prepare.mjs / assemble.mjs / verify.mjs
  Preparation, editing and media checks. These reuse the website's existing
  sharp and Playwright packages, installed Edge and FFmpeg.
  Generation in Flow is a separate, account-authorized step.

The live website has not been edited, committed, pushed or deployed.
When integrating, keep the headline/CTA in accessible HTML, use muted,
playsinline and loop, respect reduced motion, provide a pause control and
use the appropriate poster.
