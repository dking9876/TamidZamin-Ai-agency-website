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
    fontSize: "clamp(2.45rem, 4.25vw, 3.7rem)"
    fontWeight: 850
    lineHeight: 1.03
    letterSpacing: "-.025em"
  display-mobile:
    fontFamily: "'Heebo Variable', sans-serif"
    fontSize: "clamp(2.4rem,9vw,3.2rem)"
    fontWeight: 850
    lineHeight: 1.08
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
    fontSize: "1.9rem"
    fontWeight: 800
    lineHeight: 1.2
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
    fontSize: "15px"
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
    padding: "9px 22px"
  pill-primary-hover:
    backgroundColor: "{colors.pill-hover}"
  pill-outline:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.label-pill}"
    rounded: "{rounded.pill}"
    padding: "9px 22px"
  pill-outline-hover:
    backgroundColor: "{colors.pill-outline-hover}"
  pill-icon:
    backgroundColor: "{colors.pill-icon}"
    textColor: "{colors.paper}"
    rounded: "{rounded.circle}"
    width: "25px"
    height: "25px"
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

This is an observed authority label, not a newly chosen metaphor. The supplied TamidZamin reference owns the visual direction: deep blue-black bands, pale surfaces, electric-blue decoration, compact Hebrew headings, supplied trade photographs, and rounded actions. Professional, plain Hebrew and correct RTL are confirmed commitments in `PRODUCT.md`.

The implemented system has two related scopes, not one flattened theme. The homepage uses compact photographic bands, light pill actions, and authored raster light edges. Supporting service, reading, and contact pages use the shared navy palette, roomier content, conventional blue buttons, and bordered panels. This document records finished source; it does not establish service capabilities or certify launch readiness.

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

- **Display:** homepage hero, represented by `display`; the two-line source heading uses the heavy 850 weight. At widths up to 1100px it becomes 44px, up to 880px 37px, and up to 680px uses `display-mobile`. These are explicit overrides, not one uninterrupted fluid scale.
- **Headline:** `headline-reading` is the supporting page title. At mobile widths up to 680px it becomes 2.45rem. The shared `headline` is the h2 baseline; compact homepage section headings frequently override it with 24-30px sizes and weight 800. `headline-process` records a reused heading treatment, not a universal homepage h2.
- **Title:** `title` is the shared h3 baseline. Homepage process and benefit labels use compact 16-17px bold treatments.
- **Body:** `body` is the shared reading/input baseline. Homepage paragraphs commonly tighten leading to 1.4-1.5; supporting introductory copy is larger and roomier. Reading columns max out at 800px; page title and intro measures are 24ch and 63ch.
- **Labels:** separate button, pill, field, and navigation roles preserve their actual weights and leading. Desktop navigation becomes 13px at widths up to 1100px.

Headings use balanced wrapping and allow long-word breaks; paragraphs use pretty wrapping. No fixed modular ratio is evident. Tiny embedded phone copy is not part of this reusable type ramp.

**The Hebrew First Rule.** Keep Hebrew text RTL and preserve deliberate LTR composition wrappers and bdi isolation; do not reverse the entire layout to reposition one element.

## Layout

`Layout.astro` imports `global.css`, then `home.css`, on every page. The body receives the homepage class only at `/`. Consequently, unscoped navigation rules and the pale rounded header CTA from the second stylesheet also affect supporting pages.

Shared containers use `min(1180px, calc(100% - 64px))`. At widths up to 1100px they use `calc(100% - 48px)`; at widths up to 680px, `calc(100% - 36px)`. Shared reading sections have larger vertical padding than homepage strips. The spacing tokens describe observed reusable gaps and gutters, not an invented base grid.

- **Desktop homepage:** left-hand hero copy occupies 47% of its container, with the supplied worker/van image across the band. Mixed-direction three-part channel, human, and About groups preserve the reference's visual placement. Process is four columns; trades and benefits are five; FAQ rows are two columns beside a title; the closing CTA is horizontal.
- **Up to 1100px:** homepage header minimum height becomes 56px, hero minimum height 320px, copy width 45%, and channel devices shrink. Supporting containers and contact gaps also contract.
- **Up to 880px:** all routes switch to the native disclosure menu. Homepage devices move below the channel descriptions; supporting art and multi-part strips simplify. This overrides the older global navigation switch at 680px.
- **Up to 820px:** the supporting contact layout becomes one column. This is distinct from the homepage's 880px breakpoint.
- **Up to 680px:** homepage hero photograph is 290px high above centered copy, with 235px top padding on the section; actions wrap. Process, trades, and benefits use two columns, with final odd trade/benefit items spanning both. Human, About, evidence, FAQ, and closing CTA stack. Service panels and form fields also become single-column; contact padding becomes 21px 18px.
- **Up to 360px:** device widths and connectors compress further. The old global hero rules do not describe the current homepage.

The default homepage header minimum height is 62px, then 56px at up to 1100px and 64px at up to 680px. Supporting header dimensions remain separately governed by global rules.

**Measured limitation:** at a 1024px viewport the running build's header plus hero ends at 376px (56px + 320px), versus the contract's reference anchor at 317px. This is an observation, not a target token. Typography, factual copy, and usable controls expand the composition; reference anchors must not become clipping heights. This documentation pass makes no pixel-perfect or historical comp-gate claim.

**Finish-review status:** the user supplied the final verdict on 2026-11-17: **SHIP at scoped fix-verification level**. All seven prior material fixes and the corrected hero-outline regression are resolved; captures and hashes are valid, with no direct regression reported. This records the supplied review result, not a new review performed by the documenter, a whole-surface pixel-match certification, or a historical engine-gate certification.

## Elevation & Depth

Depth combines tonal bands, photographic overlays, raster blue light edges, subtle control shadows, and dimensional illustrative device frames. Supporting service/contact panels are flat, bordered containers; they are not floating cards.

### Shadow Vocabulary

- **Pill rest:** `0 3px 9px #00000012`; outlined pills explicitly remove it.
- **Shared button hover:** `0 5px 16px #00000018`; disabled buttons remove it.
- **Homepage FAQ:** `0 2px 5px #345c7820`.
- **Mobile navigation:** `0 12px 25px #00000030`.

The phone-frame glow, inset light, and layered photographic masks are signature illustration construction, not a generic card shadow. Raster wave edges are supplied through background images; do not substitute CSS gradients for those images. The hero's CSS contrast overlay is a separate, actually implemented layer.

**The Depth Has a Job Rule.** Keep service and form panels flat; reserve the observed soft shadows for controls, disclosures, navigation, and illustrative materials.

## Shapes

Pills use the fully rounded treatment, field/menu controls use small corners, and service/contact/notice panels use the shared panel radius. Homepage FAQ containers are rounder than supporting FAQ containers.

The homepage also uses clipped and counter-skewed imagery: trades skew -12deg on desktop and -6deg on mobile, while their content counter-skews; About imagery uses -8deg with counter-skewed content and asymmetric 26px/10px corners. These are image-frame treatments, not transformations for text, forms, or general cards.

SVG icons share a 24-unit viewBox, no fill, currentColor strokes of 1.7, and rounded caps/joins. Their dimensions vary with context. Decorative icons are aria-hidden; meaningful wording remains real text. No glyph icon font is used.

## Components

### Buttons

**Two deliberately distinct families.** Supporting blue buttons use the shared button tokens, 50px minimum height, and a 14px icon gap. Their secondary variant is transparent with a line-colored border and wash hover, as used on the 404 page.

Homepage pills use 44px minimum height, a 10px gap, and a pale filled or outlined surface. Hero actions share the blue 25px circular arrow container; the secondary action remains outlined. Channel and closing actions need not contain that circle. Responsive hero padding and label sizes are recorded in the sidecar.

The shared header action is a hybrid: it keeps the button's typography/transition, but takes the pale surface and pill radius from the later stylesheet. Its navy text follows route scope. Its higher-specificity background remains pale on hover while the button hover shadow applies.

Buttons transition background and shadow over 160ms ease-out; pills transition background over 140ms ease-out. No separate pressed animation is defined. A disabled button has a not-allowed cursor and .65 opacity; the disabled contact fieldset independently applies .65 opacity, so its disabled submit button inherits a compounded visual dimming.

### Cards / Containers

Service cards have line-colored borders and generous padding; contact panels use the same radius with different padding. Notices use wash, a line border, and smaller text. There is no shared hover elevation for static panels.

### Inputs / Fields

Persistent labels sit above native inputs, selects, and textareas. Fields have a 48px minimum height, stronger borders, and 16px text. Textareas have a 120px minimum height and vertical resizing. Phone/email inputs are explicitly LTR; surrounding labels remain RTL.

Invalid controls use an error border and associated error text. Empty error/status containers are hidden. Status messages use a bordered wash panel with semantic text colors. The current preview disables the fieldset and explains that no inquiry can be sent; styled success states do not establish an active backend.

### Navigation

Logo left, centered RTL links, and the pale action right are achieved with an LTR header wrapper. Desktop links have 44px minimum height; hover/current-page treatment is an underline accented in cyan with white text.

The mobile menu is a native details/summary disclosure with a 44px square trigger and a navy-soft overlay below the header. Escape closes it and restores trigger focus; clicking outside closes it. It is not a modal, and no focus trap is implemented. The homepage footer is compact; supporting footers retain a roomier grid.

### FAQ

Both variants use native details/summary, visible question text, and a plus SVG rotating 45deg when open. The open question turns blue-hover. Multiple rows can remain open; there is no exclusive-accordion script.

Homepage rows use the rounded, softly shadowed variant and two columns until mobile. Supporting rows are flat, smaller-radius containers with roomier default summaries. The sidecar keeps their exact breakpoint-specific padding and sizes separate.

### Imagery and illustration

`Picture.astro` renders WebP srcsets: hero 768/1280/1920, support/About 640/960, logo 300/600, and trade images 320/640. Hero sizing is 100vw; logo sizing is declared as 190px; other images declare 92vw on mobile and 45vw otherwise. These are the existing source hints, not a new universal layout rule. Images have dimensions, async decoding, and lazy loading except eager hero/header logo.

Nine numbered PNG originals are preserved. The shipping image directory contains 27 rasters: 19 photographic/logo WebP derivatives, six code-authored decorative WebPs, a logo-derived icon, and a hero-derived social image. The sidecar links their actual manifest, companion records, and preparation code rather than inventing model-generation provenance. People and device conversations remain explicitly illustrative.

### Focus and reduced motion

Shared interactive focus is a 3px cyan outline with 5px offset. Fields use blue with a 2px offset. The skip link becomes visible on focus. Under reduced motion, smooth scrolling becomes auto; button, pill, FAQ-icon, and legacy trade transitions are removed, and the legacy trade hover scaling is suppressed. Static skew, gradients, raster lights, and the non-animated waveform remain static; this is not a site-wide removal of transforms.

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
