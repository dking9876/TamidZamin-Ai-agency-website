---
name: TamidZamin
description: "The implemented Hebrew RTL website: blue-black marketing bands, pale reading surfaces, electric-blue accents, and supplied trade imagery."
colors:
  blue: "#086bdf"
  blue-hover: "#0963c9"
  cyan: "#37bbff"
  navy: "#08162c"
  navy-soft: "#102340"
  navy-deep: "#061123"
  ink: "#11213c"
  muted: "#52617a"
  paper: "#ffffff"
  wash: "#f3f6fa"
  line: "#dce3ed"
  on-dark: "#c8d5e7"
  error: "#a91e36"
  success: "#16643d"
  home-navy: "#081721"
  home-navy-deep: "#05121d"
  home-on-dark: "#d3e1ed"
  home-wash: "#f5f9fe"
  pill-paper: "#f5faff"
  pill-ink: "#0a1a2c"
  pill-hover: "#d5edff"
  pill-outline-hover: "#123451"
  pill-border: "#d7e9f7"
  pill-outline-border: "#94b2cc"
  pill-icon: "#0f73d7"
  input-line: "#94a3b8"
  input-placeholder: "#65748b"
  faq-paper: "#f8fbff"
  faq-line: "#e0eaf5"
typography:
  display:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "clamp(2.75rem, 5.2vw, 4.75rem)"
    fontWeight: 850
    lineHeight: 1.1
    letterSpacing: "-.025em"
  display-mobile:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "clamp(2.5rem, 10.5vw, 3.1rem)"
    fontWeight: 850
    lineHeight: 1.1
    letterSpacing: "-.025em"
  headline-reading:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "clamp(2.35rem, 4.5vw, 3.7rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-.025em"
  headline:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "clamp(1.9rem, 3.1vw, 2.75rem)"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-.02em"
  headline-process:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.16
    letterSpacing: "-.02em"
  title:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "1.4rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label-button:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.5
  label-pill:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "1rem"
    fontWeight: 750
    lineHeight: 1.4
  label-field:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.7
  label-nav:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  field: "5px"
  button: "6px"
  panel: "9px"
  faq-home: "16px"
  pill: "99px"
  circle: "50%"
spacing:
  gap-small: "6px"
  gap-medium: "10px"
  gap-action: "14px"
  gap-form: "20px"
  gap-panel: "28px"
  gutter-mobile: "18px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
  section-reading: "55px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    typography: "{typography.label-button}"
    rounded: "{rounded.button}"
    padding: "12px 25px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label-button}"
    rounded: "{rounded.button}"
    padding: "12px 25px"
  button-secondary-hover:
    backgroundColor: "{colors.wash}"
  pill-primary:
    backgroundColor: "{colors.pill-paper}"
    textColor: "{colors.pill-ink}"
    typography: "{typography.label-pill}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  pill-primary-hover:
    backgroundColor: "{colors.pill-hover}"
  pill-outline:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.label-pill}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  pill-outline-hover:
    backgroundColor: "{colors.pill-outline-hover}"
  pill-icon:
    backgroundColor: "{colors.pill-icon}"
    textColor: "{colors.paper}"
    rounded: "{rounded.circle}"
    width: "28px"
    height: "28px"
  header-cta:
    backgroundColor: "{colors.pill-paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
  header-cta-home:
    textColor: "{colors.home-navy}"
  service-card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "32px"
  contact-panel:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "30px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    width: "100%"
  faq-home:
    backgroundColor: "{colors.faq-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.faq-home}"
  faq-reading:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
  navigation:
    textColor: "{colors.on-dark}"
    typography: "{typography.label-nav}"
  notice:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "22px 25px"
---

# Design System: TamidZamin

## Overview

**Creative North Star: "Approved TamidZamin reference"**

This is an observed authority label, not a newly chosen metaphor. The supplied TamidZamin reference owns the visual direction: deep blue-black bands, pale surfaces, electric-blue decoration, heavy Hebrew headings, supplied trade photographs, and rounded actions. Professional, plain Hebrew and correct RTL are confirmed commitments in `PRODUCT.md`. On 18 November 2026 the owner approved spacious website proportions instead of the reference's compressed poster proportions.

The implemented system has two related scopes, not one flattened theme. The homepage uses viewport-scale photographic compositions, light pill actions, and authored raster light edges. Supporting service, reading, and contact pages use the shared navy palette, content-led heights, conventional blue buttons, and bordered panels. This document records source; it does not establish service capabilities or certify launch readiness.

**Key Characteristics:**
- Hebrew RTL text with deliberately LTR visual groups and isolated Latin names.
- Homepage blue-black and pale-wave bands; supporting navy and white reading surfaces.
- One self-hosted variable typeface, heavy compact headings, and visible action hierarchy.
- Supplied photographic assets, inline SVG icons, and reusable raster decoration.
- Explicit focus, native disclosure controls, and reduced-motion overrides.

Authority: `website design assets\אתר TamidZamin_ סוכני AI לעסקים בישראל.webp`. The pinned contract is `.impeccable\surfaces\website.md`; page strategy remains there. Neither file is replaced by this record.

## Colors

### Primary

Electric blue (`blue`) is the shared action and field-focus color; `blue-hover` serves hover/open states and readable text links. Cyan (`cyan`) is the shared keyboard-focus and dark-surface accent. These are roles within one blue accent family, not additional brand palettes.

Homepage pills have separate `pill-paper`, `pill-ink`, hover, border, outline-border, and icon-circle colors. The filled hero action is pale, not electric blue; the second hero action is transparent with white text and a blue icon circle.

### Neutral

- Supporting pages: `navy` for headings and closing CTA, `navy-soft` for mobile navigation, and `navy-deep` for the footer.
- Homepage: `home-navy` and `home-navy-deep` replace inherited navy values only under the homepage body. `home-wash` and `home-on-dark` likewise replace the supporting wash and light text.
- `paper`, `ink`, `muted`, `wash`, `line`, and `on-dark` provide the shared reading, panel, and text hierarchy.
- Inputs use the stronger `input-line` stroke and `input-placeholder` text. Homepage FAQ rows use their own `faq-paper` and `faq-line`; supporting FAQ rows retain paper and line.

Error and success colors are semantic form states, not decorative accents. Their styles exist even while the preview form is disabled. Illustrative chat greens, call red, and individual blue icon tints remain local illustration details rather than site-wide semantic tokens.

**The Scope Before Swatch Rule.** Resolve the route and the final cascade before selecting a color; homepage overrides do not replace the supporting-page palette.

The sidecar's generated tonal strips are panel-only visualizations, not a shipped tonal scale or permission to introduce new colors.

## Typography

**Display Font:** Heebo Variable, with sans-serif fallback.
**Body Font:** Heebo Variable, with sans-serif fallback.

The layout imports `@fontsource-variable/heebo` before both stylesheets. The running preview loads self-hosted variable faces supporting weights 100 through 900. There is no separate display, Latin, icon, or monospace family.

### Hierarchy

- **Display:** homepage hero uses `display`, weight 850 and 1.1 leading. Up to 880px it uses `clamp(2.75rem, 6.5vw, 3.75rem)`; up to 600px it uses `display-mobile`. The closing section has a separate editorial headline capped at 6rem.
- **Headline:** `headline-reading` remains the supporting page title. Homepage `--home-title` is `clamp(2.25rem, 4vw, 3.75rem)`, weight 800 and 1.16 leading; up to 600px it becomes `clamp(2rem, 8.5vw, 2.75rem)`. Channel titles are smaller to support the device composition.
- **Title:** `title` remains the shared h3 baseline; process labels use 1.35rem, benefits 1.3rem, and About values 1.15rem.
- **Body:** `body` is the shared reading/input baseline. Homepage paragraphs use 1.65 leading with 1-1.25rem copy depending on role. Reading columns max out at 800px; page title and intro measures remain 24ch and 63ch.
- **Labels:** navigation is .875rem; primary homepage pills 1rem, secondary channel actions .875rem. Miniature illustrative phone copy is not the body type scale.

Headings use balanced wrapping and allow long-word breaks; paragraphs use pretty wrapping. Text uses rem-based sizes so user text enlargement is respected.

**The Hebrew First Rule.** Keep Hebrew text RTL and preserve deliberate LTR composition wrappers and bdi isolation; do not reverse the entire layout to reposition one element.

## Layout

`Layout.astro` imports `global.css`, then `home.css`, on every page. The body receives the homepage class only at `/`. Consequently, unscoped navigation rules and the pale rounded header CTA from the second stylesheet also affect supporting pages.

Shared containers use `min(1180px, calc(100% - 64px))`, then 48px total gutter up to 1100px and 36px up to 680px. Homepage widths up to 600px use a 40px total gutter.

Only direct homepage `main > section` elements get the composition rules. At desktop widths of at least 1024px, each main section has a minimum block size of `100svh - actual header height`. The hero has that minimum at every width, so the in-flow header plus hero fill the initial small viewport. No section has a fixed height or scroll snap. Expanded text and FAQs can exceed the minimum. Footer, legal pages, supporting pages and nested components are excluded.

The header reserves 4.75rem on desktop and 4.25rem up to 880px. A ResizeObserver writes its actual height, including wrapping or text enlargement, to `--header-height`. Progressive enhancement makes the homepage header sticky; without JavaScript it remains in flow so an open native menu does not cover an anchor destination. At heights up to 500px it is nonsticky, even with JavaScript. Supporting headers remain nonsticky.

`--section-space` is `clamp(3rem, 6vw, 6rem)` (3.5rem on phones). It is not the mechanism used to fill the viewport: flex/grid composition and minimum height are. `--composition-gap` is `clamp(2rem, 4vw, 4rem)`. Large and tight intervals distinguish sections from their internal groups.

- **Hero:** copy occupies the left 49%, with the worker/van photograph behind the right. Image height is bounded by 55vw, object position is 80%, and a top mask blends it into navy without stretching the image. At up to 880px the photograph sits above centered copy; short/zoomed content grows naturally. A static, focusable scroll cue links to channels.
- **Channels:** larger illustrative phones anchor the center of two service explanations. Tablet moves devices beneath the explanations; phones stack the two explanations around the device group. Both nearby labeling and the section disclaimer state this is illustrative, not live.
- **Process:** four generously spaced nodes joined right-to-left. Tablet uses two rows; phones use one vertical reading column. Step order remains the existing factual order.
- **Trades:** the supplied angled photographs form a larger gallery beneath a heading/intro row. Five desktop columns become three on tablet and two on phones.
- **Benefits:** a large heading beside five open, ruled value groups in two columns; the human responsibility value spans the last row. No generic card grid is added.
- **Human/About:** larger imagery and two-column editorial compositions replace strips. Human handoff symbols remain decorative; About keeps its oblique frame. Both stack on phones.
- **Evidence:** requirements copy is typeset as a clearly bounded specification, not a testimonial or active demo. No new capability claims.
- **FAQ:** a two-column title/list composition, with one full-width question per list row, makes the content substantial at desktop size. Multiple native disclosures may remain open.
- **Closing:** an oversized headline and horizontal action compose the last full-height section. The compact footer remains content-sized.

The earlier 17 November scoped fix review and compressed section measurements are historical, not acceptance thresholds for this approved refinement. Current measured geometry and verification limits live in `website/VERIFICATION.md`. This is not a pixel-match or accessibility certification.

## Elevation & Depth

Depth combines tonal bands, photographic overlays, raster blue light edges, subtle control shadows, and dimensional illustrative device frames. Supporting service/contact panels are flat, bordered containers; they are not floating cards.

### Shadow Vocabulary

- **Pill rest:** flat pale/outlined controls; feedback uses color and a small arrow translation, not floating shadows.
- **Shared button hover:** `0 5px 16px #00000018`; disabled buttons remove it.
- **Homepage FAQ:** pale surface with a visible border, no floating shadow.
- **Mobile navigation:** `0 12px 25px #00000030`.

The phone-frame glow, inset light, and layered photographic masks are signature illustration construction, not a generic card shadow. Raster wave edges are supplied through background images; do not substitute CSS gradients for those images. The hero's CSS contrast overlay is a separate, actually implemented layer.

**The Depth Has a Job Rule.** Keep service and form panels flat; reserve the observed soft shadows for controls, disclosures, navigation, and illustrative materials.

## Shapes

Pills use the fully rounded treatment, field/menu controls use small corners, and service/contact/notice panels use the shared panel radius. Homepage FAQ containers are rounder than supporting FAQ containers.

The homepage also uses clipped and counter-skewed imagery: trades and About skew -6deg, with counter-skewed contents; About retains asymmetric 26px/10px corners. These are image-frame treatments, not transformations for text, forms, or general cards.

SVG icons share a 24-unit viewBox, no fill, currentColor strokes of 1.7, and rounded caps/joins. Their dimensions vary with context. Decorative icons are aria-hidden; meaningful wording remains real text. No glyph icon font is used.

## Components

### Buttons

**Two deliberately distinct families.** Supporting blue buttons use the shared button tokens, 50px minimum height, and a 14px icon gap. Their secondary variant is transparent with a line-colored border and wash hover, as used on the 404 page.

Homepage pills use 50px minimum height, a 12px gap, and a pale filled or outlined surface. Hero actions share the blue 28px circular arrow container; the secondary action remains outlined. The final action has a 60px minimum height.

The shared header action is a hybrid: it keeps the button's typography/transition, but takes the pale surface and pill radius from the later stylesheet. Its navy text follows route scope. Its higher-specificity background remains pale on hover while the button hover shadow applies.

Buttons retain 160ms feedback. Pills transition color/border/pressed position over 160ms. Hover and focus both translate the directional arrow 3px toward the destination; pressing moves the control down 1px. Reduced motion removes translations but retains legible state colors. A disabled button retains the existing not-allowed cursor and .65 opacity; the disabled contact fieldset independently applies .65 opacity. Intake behavior is unchanged.

### Cards / Containers

Service cards have line-colored borders and generous padding; contact panels use the same radius with different padding. Notices use wash, a line border, and smaller text. There is no shared hover elevation for static panels.

### Inputs / Fields

Persistent labels sit above native inputs, selects, and textareas. Fields have a 48px minimum height, stronger borders, and 16px text. Textareas have a 120px minimum height and vertical resizing. Phone/email inputs are explicitly LTR; surrounding labels remain RTL.

Invalid controls use an error border and associated error text. Empty error/status containers are hidden. Status messages use a bordered wash panel with semantic text colors. The current preview disables the fieldset and explains that no inquiry can be sent; styled success states do not establish an active backend.

### Navigation

Logo left, centered RTL links, and the pale action right are achieved with an LTR header wrapper. Desktop links have 44px minimum height; hover/current-page treatment is an underline accented in cyan with white text.

The mobile menu is a native details/summary disclosure with a 44px square trigger and a navy-soft overlay below the header. The overlay has a viewport-bounded, scrollable maximum height. Escape closes it and restores trigger focus; outside clicks, following links, leaving the menu by keyboard, and switching to desktop close it too. It is not a modal and has no focus trap. Native hash navigation and history are not intercepted. Homepage anchor padding uses the measured sticky-header height plus 16px; short nonsticky layouts use 16px.

### FAQ

Both variants use native details/summary, visible question text, and a plus SVG rotating 45deg when open. The open question turns blue-hover. Multiple rows can remain open; there is no exclusive-accordion script.

Homepage rows use the rounded bordered variant in a single question column beside the title, stacking below it at narrower widths. Summary height is at least 76px on desktop and 64px on phones. Hover, focus-within and open states strengthen the border; native plus rotation remains. Supporting FAQs retain their smaller-radius reading layout.

### Imagery and illustration

`Picture.astro` renders WebP srcsets: hero 768/1280/1920, support/About 640/960, logo 300/600, and trade images 320/640. Hero sizing is 100vw; logo sizing is declared as 190px; other images declare 92vw on mobile and 45vw otherwise. These are the existing source hints, not a new universal layout rule. Images have dimensions, async decoding, and lazy loading except eager hero/header logo.

Nine numbered PNG originals are preserved. The shipping image directory contains 27 rasters: 19 photographic/logo WebP derivatives, six code-authored decorative WebPs, a logo-derived icon, and a hero-derived social image. The sidecar links their actual manifest, companion records, and preparation code rather than inventing model-generation provenance. People and device conversations remain explicitly illustrative.

### Focus and reduced motion

Shared interactive focus is a 3px cyan outline with 5px offset. Fields use blue with a 2px offset. The skip link becomes visible on focus.

`website/src/scripts/home-motion.ts` enhances only the homepage, with no dependency:

- The hero photograph arrives over 520ms; headline, copy and CTA are never hidden or delayed.
- One inquiry -> AI -> confirmed summary -> human sequence pulses the four process nodes and traces the RTL connectors. It lasts at most 1760ms and settles; it does not repeat on re-entry.
- Devices enter over 620ms with 16px travel. About imagery opens through a small 650ms crop reveal. Other sections stay still rather than repeating fade-up effects everywhere.
- `--motion-feedback` is 160ms; image hover is 260ms. Authored arrivals use `cubic-bezier(0.16, 1, 0.3, 1)`.
- IntersectionObserver pauses animations offscreen. Visibility changes pause them in hidden tabs; page lifecycle events cover back/forward restoration. No animation loop, wheel/touch listener, scroll timer, custom cursor or live phone control is added.
- With reduced motion, authored sequences do not start; changing the preference cancels active ones and shows their static base composition. Smooth anchor scrolling becomes instant. State colors and native FAQ disclosure still explain interactions.

Meaningful content is visible and crawlable before JavaScript; no reveal stylesheet hides it. Phone waveforms are static illustrations. Brief one-shot sequences need no persistent playback control.

## Do's and Don'ts

### Do:
- **Do** preserve the homepage/supporting-page scopes and the global-then-home import order.
- **Do** keep the first hero action pale and the second outlined, including their blue circular arrows.
- **Do** preserve readable Hebrew, logical-direction layout, visible focus, and native disclosure semantics.
- **Do** reuse supplied imagery and documented derivatives without modifying the nine originals.
- **Do** keep illustrative content labeled and let real copy and controls determine section height.

### Don't:
- **Don't** use legacy hero/channel selectors as the current homepage authority.
- **Don't** infer active services, customer identities, results, or delivery from illustrative UI or styled states.
- **Don't** turn raster blue edges, photo skew, or device glow into generic treatment for every panel.
- **Don't** promote miniature phone text into the reusable typography scale or force the reference's heights by clipping content.
- **Don't** treat synthesized tonal ramps as shipped palette values or this record as a final-review or accessibility certification.
