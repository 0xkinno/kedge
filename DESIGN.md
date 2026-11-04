# DESIGN

**Concept.** A maritime magazine cover meets a ship's safety placard. Warm chart paper, ink-blue type, one lifejacket-orange accent with a soft glow. Calm and trustworthy, the opposite of a crypto casino.

**Mark.** A kedge anchor drawn as one continuous line whose rope loops into a K (`apps/web/components/art/index.tsx`, `KedgeMark`). Legible at 16 px. **Wordmark:** KEDGE in the display face, tracked.

## Tokens (`apps/web/app/globals.css`, Tailwind v4 `@theme`)
| Token | Hex | Role |
|---|---|---|
| paper | #F6F1E7 | page background (lustre gradient, paper grain, faint chart contours) |
| paper-deep | #EDE5D5 | section bands |
| ink | #0C2536 | text |
| deep-water | #123B52 | nav capsule, dark sections |
| lifejacket | #FF5A1F | the one accent per view; glow `0 0 24px rgba(255,90,31,.45)`. **Text on it is ink, not white** (white measured 3.1:1, ink 5.4:1) |
| sea-glass | #1BB3A2 | verified, completed |
| brass | #B88A2E | ornaments and hairlines only |
| brass-ink | #7A5A14 | brass-coloured text on paper (AA) |
| brass-light, lifejacket-light | #E3B766, #FF8A5C | the same colours as text on deep-water (AA) |
| distress | #D3263C | refusals, failed items |
| fog | #DDD4C2 | borders |

Contrast is checked by axe-core in `e2e/quality.mjs` on every page at seven viewports. A dark "night" theme exists as tokens (`[data-theme='night']`); it is not wired to a toggle yet.

## Fonts (`next/font`, self-hosted)
Bricolage Grotesque 700/800 (display), Instrument Serif (the 03:40 line, pull quotes), Hanken Grotesk (body), JetBrains Mono (addresses, hashes, the call phrase). Fluid scale with `clamp`.

## Motion
Section reveals are a 16 px fade and rise (pure CSS, staggered). Cards lift 6 px on hover with a glow that follows the cursor. Buttons are tactile: a 3 px brass-shadowed edge that presses down on click. "Bring it home" pulses only when ready. On the landing page a rope draws once (1.2 s) from the Rescue Card to the anchor's ring, and dashed flow lines run along the four steps and the three savings. Lenis smooth scrolling loads after idle on screens wider than 900 px, never under reduced motion. Framer Motion was removed from the landing page after it cost 460 ms of blocking time on phones (Lighthouse performance 88 to 99); everything above is CSS.

## Hero
`apps/web/public/hero/harbour-dawn.webp` (1376 x 768) and a 3:4 phone crop `harbour-dawn-mobile.webp`, from the brief's prompt. Placement, as specified: the image takes the right 58% of the hero on desktop, masked with `linear-gradient(90deg, transparent 0%, #000 28%)` so it never sits behind the headline. On phones it moves below the headline at 70% height with a top fade (`linear-gradient(180deg, transparent 0%, #000 28%)`). The Rescue Card sits over the empty sky at top left of the image, clear of the ship, the anchor and the headline. The rope's SVG uses a viewBox equal to the photo's aspect ratio so it lands exactly on the anchor at every width. The image is AI-generated and disclosed in the footer and README.

## Screens
Landing: hero, a live chain strip (block, runtime, vault, latency, all probed every 12 s), four measured stats, the moment, four steps, what comes home, why only Portaldot (two drawn diagrams), the watch, proof, agencies. Harbour: numbered step cards with a sticky protection and cost panel. Crew door, Rescue (including the call phrase, shown only to the new-phone wallet), Proof, Drill, Judge, and a seven-step keyboard-driven tour.

## Ornaments (`components/art/`)
Anchor with rope, Lifeboat Card, signal flag K, hourglass with anchor, lifebuoy, compass rose (also the inner-page header ornament), rope divider, Seaman's Book, phone-overboard ripple. 2 px ink stroke, flat fills, 24 px grid.

## Navigation
A fixed square-cornered capsule (14 px radius, brass hairline). On phones it becomes a bottom capsule with five labelled items. 44 px targets.
