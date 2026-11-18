TAMIDZAMIN - HERO VIDEO OPTIONS
Created 18 November 2026

Open index.html to compare all three films behind the existing Hebrew headline.
The preview works locally, without a build or account. It does not change or
publish the existing website.

01 HOME SERVICE - 12.75 seconds
Home maintenance, plumbing and appliance inspection. The closest fit to the
current home-service audience. Cool, natural color and restrained dissolves.

02 CRAFT & CARE - 15 seconds
Woodworking, a tool detail and a craftsman's portrait. Warmer and more human,
with longer shots. Best for a broad trades/contractor positioning.

03 CONNECTED WORKDAY - 12 seconds
A repair workshop, tools and a worker checking his phone. Blue-toned and
slightly brisker. Broader repair-business imagery, specifically an auto workshop.

DELIVERY
- videos: 1920 x 1080 desktop MP4s and lighter 960 x 540 mobile MP4s
- posters: full-size and mobile fallback JPEGs
- H.264, 24 fps, no audio track, fast-start MP4 metadata
- Circular crossfades: the end returns to the opening shot without a black frame
- No headline, logo, UI or dark readability overlay baked into the video
- Preview controls: film selection, pause/play, footage-only, mobile composition
- Reduced-motion and data-saving preferences prevent automatic playback

These are custom edits of licensed stock footage, not AI-generated footage or
footage of TamidZamin staff/customers. They illustrate service work, not verified
customers, product actions, endorsements, appointments or business results.
No Broccoli footage or branding is included.

WEBSITE INTEGRATION (after choosing an option)
Keep the headline and calls to action as HTML. Use a decorative muted, loop,
playsinline video with the matching poster, a separate readability overlay,
and a visible pause/play control. Respect prefers-reduced-motion and save-data.
Use the mobile source on small screens; avoid loading all three options on
the public homepage. Retain the poster if playback is unavailable.
The mobile film is a lighter landscape export; the preview demonstrates the
cropped mobile composition, with imagery above the copy.

SOURCES AND RIGHTS
All nine source clips are listed with creator, source page and download URL in
sources.json. Pexels licensing was checked on 18 November 2026:
https://www.pexels.com/license/

Pexels permits website/marketing use and editing without required attribution.
Do not imply endorsement by depicted people/brands, portray people offensively,
resell unaltered footage, or redistribute it as stock. Incidental tool/vehicle
brands are not endorsements. Source availability and terms can change.

The Heebo font is from the existing site's dependency. Its license is included
in assets\heebo-license.txt. The logo is the existing supplied TamidZamin logo.

REPRODUCING THE EDITS
Requires Node.js and FFmpeg on PATH:
  node render.mjs
Or render just one:
  node render.mjs 01-home-service
Optional HERO_SOURCE_CACHE selects an existing source download folder.
The default .source-cache folder contains downloads and is not part of delivery.
The script downloads only the credited Pexels footage and writes local exports.
