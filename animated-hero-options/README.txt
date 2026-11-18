TAMIDZAMIN - ANIMATED HERO OPTIONS
18 November 2026

These are three original animated 3D scenes, not real people or stock footage.
They replace the earlier photographic video concepts, not the current website.
The existing production homepage has not been edited or published.

1. MESSAGE PLAYGROUND
A small friendly robot, a dimensional phone and animated message bubbles.
Closest to the agency's WhatsApp/phone intake story.

2. LITTLE SERVICE STREET
A miniature neighborhood, a service van and animated conversations.
Connects the agency to the world of small service businesses.

3. HELPFUL WORKSHOP
A tactile miniature toolbox/workshop with repair tools and a helpful robot.
More playful and craftsman-oriented.

FILES
videos\<name>.mp4
  1920 x 1080 desktop hero background. Quiet left side for the existing Hebrew
  headline; main activity is on the right. No text is baked into this export.

videos\<name>-mobile.mp4
  960 x 960 centered composition for the visual area above the mobile headline.
  No text is baked into this export.

videos\<name>-phone-preview.mp4
  720 x 1280 preview for choosing on a phone. Animation above the existing Hebrew
  headline and sample call to action. This is a review video, not the website
  background file; its text is baked in.

posters\
  First-frame fallback JPEGs for desktop and square mobile.

All films are 12-second silent loops, H.264 MP4, 24 fps and fast-start.
The animated objects illustrate a concept, not real conversations, successful
handoffs, bookings, actual customers or verified product capabilities.

ACTUAL INTERACTION
A video cannot respond to mouse/touch. The accompanying web version can.
Open a terminal in this folder and run:
  node serve.mjs
Then open http://127.0.0.1:4319/

Move the pointer, tap the artwork, or use the keyboard-accessible "Make it react"
button. The scene responds gently. Pause is always available, and nonessential
animation pauses offscreen or in a hidden tab. Reduced-motion and data-saving
preferences start the scene paused. A still poster remains if WebGL fails.
This is a local preview, not a publicly deployed site.

WEBSITE INTEGRATION
Use one selected option, not all three at once. Keep the existing headline and
CTA as HTML. For a lightweight production hero, use the MP4 plus poster and
pause control. If genuine interaction is preferred, integrate the selected scene
module with engine.mjs/art-kit.mjs and its locally hosted vendor files.
The desktop camera reserves the left side for copy; the mobile camera centers
the miniature scene above the copy. Do not cover controls with the canvas.
Pause when offscreen/hidden, respect reduced-motion and data-saving preferences,
and retain a poster fallback. Keep all existing noindex and launch safeguards.

EDITING AND REPRODUCING
The scene modules and shared art kit are included. Three.js is pinned in the
package manifest; browser vendor files are included for the preview.
Rendering/verification scripts use the existing website's Playwright and Sharp
dependencies, the installed Edge browser, and FFmpeg on PATH.
Run the local server, then:
  node render.mjs --stills
  node render.mjs
  node verify.mjs
To render a single option, append 0, 1 or 2.

RIGHTS
The 3D models and choreography were authored for this task.
No Broccoli footage, stock people, external textures, logos or testimonials are
used in the scenes. The TamidZamin logo and Heebo font come from the existing
site. Three.js's MIT license is in vendor\three-license.txt.
The Heebo font license is in assets\heebo-license.txt.
