---
name: MedCUA presentation design
description: TUM-blue research pages with real software imagery and open layouts.
colors:
  navy: "#003359"
  navy-hover: "#005293"
  link: "#0065BD"
  body-secondary: "#40566B"
  metadata: "#536B80"
  white: "#FFFFFF"
  surface: "#F4F7FA"
  line: "#DCE4EB"
rounded:
  control: "4px"
  replay: "8px"
---

# MedCUA design system

## Overview

This system covers the homepage, Projects, Team and 404 pages. It uses TUM deep blue, self-hosted type, authentic research imagery and visible reading order. Large headings establish hierarchy; project figures and portraits remain outside decorative card shells.

The implementation is `editorial.css`, `pages-editorial.css` and `editorial.js`. Presentation pages opt in with `body.editorial`; the contribution questionnaire retains its original design and behavior.

## Colors

- Navy is the main text, primary-button, replay-panel and footer color. Primary buttons darken to the secondary navy on hover.
- Link blue identifies text actions, focus, the caret and selected title emphasis.
- White and pale blue-grey alternate between sections. Secondary text uses `#40566B`; metadata uses `#536B80`.
- Thin rules use `#DCE4EB`; stronger control boundaries use `#C6D3DF`. Selection uses `#C2DCF0` with navy text.
- Keep clinical images, research figures and portrait assets in their own colors. The homepage affiliation strip becomes full-color on hover; Team affiliation logos remain full-color.

## Typography

- Geist is the display and body face, loaded from `assets/fonts/geist.woff2`. Geist Mono is reserved for BibTeX and code; serif emphasis is not part of this presentation design.
- Homepage title: `clamp(3.2rem, 5.4vw, 5.25rem)`, weight 550, line-height 1.06, tracking `-.035em`, with smaller mobile rules.
- Page title: `clamp(3rem, 6vw, 5rem)`, weight 550, line-height 1.06. Section headings: `clamp(2.1rem, 3.8vw, 3.3rem)` with line-height 1.12.
- Reading text is generally 16–18px, line-height 1.6–1.7. Metadata is 13–14px. Team names are 22–24px, with affiliations at 16px.
- Use sentence case and concrete headings. Let headings carry their own meaning without eyebrow labels.

## Layout

- `.shell` uses a 1200px maximum and `clamp(22px, 5vw, 64px)` side gutters. Header, content and footer share those edges.
- Standard section padding is `clamp(64px, 8vw, 112px)`. Local spacing follows content groups: 16–24px within a group, 32–64px between columns or rows.
- The homepage pairs the research statement with introductory copy, followed by one broad software replay. Research entries, the task invitation and the team preview use open grids.
- At 860px, the header uses its mobile menu and the introduction stacks. At 600px, the replay and main two-column content stack. The homepage team preview goes from six columns to three, then two.
- Projects use text-first, 0.8/1.2-column rows, stacking at 820px. Their figures use `object-fit: contain` so none of the research content is cropped.
- Team portraits use three columns, two at 820px and one at 560px. Affiliations use two columns, then a single list at 820px.

## Elevation & Depth

The presentation pages are flat. Section color, spacing and thin rules separate content; there are no glass headers, floating HUD panels or card shadows. The opaque header keeps a single bottom rule.

## Shapes

Controls have 4px corners; the homepage replay has 8px corners. Project-page research figures and Team portraits are square-cornered. Avoid nested rounded containers and decorative gradients.

## Components

- Primary buttons are navy with white text, at least 48px high; secondary buttons use a transparent fill and navy text. Navigation and smaller actions have a minimum 44px target.
- Links respond with color, underline or a small arrow movement. Keyboard focus uses a 3px blue outline with a 5px offset; preserve visible focus on linked portraits and other whole-item links.
- Team entries combine one portrait, a name and affiliations. Keep the existing member order, profile destinations and affiliation order when changing layout.
- The replay provides a play/pause control. It pauses outside the viewport or when the document is hidden, and starts paused for reduced motion.
- The homepage introduction has one 650ms entrance using `cubic-bezier(.16, 1, .3, 1)`. Hover transitions are short and local; linked imagery may scale to 1.025. There are no repeated scroll reveals.
- Reduced motion disables presentation animations and transitions. Content remains visible without animation. The mobile menu exposes its state and closes with Escape or after following a link.
- Preserve the existing BibTeX copy behavior and its success/fallback status.

## Do's and Don'ts

- Do preserve verified project facts, paper citations, team details, real imagery and working destinations.
- Do load editorial styles after the original page styles, and use the dedicated presentation script.
- Do check desktop and narrow layouts, navigation, keyboard focus and replay controls after changes.
- Don't modify `contribute/`, `site.css`, `site.js` or form-shared assets during a presentation-only update. Query-string version numbers do not isolate shared-file changes.
- Don't load `editorial.css`, `pages-editorial.css` or `editorial.js` on the questionnaire without an explicit request to change it.
- Don't introduce decorative clinical measurements, new institutional claims or invented performance numbers.
