# PptxGenJS direct-authoring practice

Use PptxGenJS as a coordinate-based PowerPoint object generator. It is not a CSS layout engine. Build layout logic explicitly and keep the final slide composed of native text, shapes, connectors, charts, and images.

## Architecture

Separate four layers:

```text
theme/chrome  → palette, typography, safe zones, footer, title
components    → node, connector, lane, card, chip, metric, callout
layouts       → architecture, swimlane, hub, topology, roadmap, matrix
content model → facts, relationships, hierarchy, sequence, evidence
```

Keep theme and component helpers stable. Let layout functions own coordinates and reading order. Do not place all pages through a universal card-grid helper.

## Layout generation

- Derive positions with reusable row, column, grid, lane, and radial calculations instead of copying literals between pages.
- Pass a content model into a layout function. Keep source facts out of generic geometry helpers.
- Calculate gaps and widths from the available body rectangle. Round only at the final coordinate assignment.
- Establish the primary reading path before adding explanation cards.
- Reserve cards for evidence, roles, exceptions, or definitions that support the primary visual.
- Create two wireframe candidates when more than one relationship model is plausible.
- Render early after the primary structure is placed. Do not wait for all detail copy before checking balance.

Example coordinate primitive:

```js
export function distributeRow(items, { x, y, w, h, gap = 0.12 }) {
  const itemW = (w - gap * (items.length - 1)) / items.length;
  return items.map((item, index) => ({
    ...item,
    x: x + index * (itemW + gap),
    y,
    w: itemW,
    h,
  }));
}
```

## Diagram construction

Add objects in this z-order:

1. canvas and large panels;
2. lanes, zones, and containment boundaries;
3. connectors and flow paths;
4. nodes and cards;
5. labels, badges, icons, and callouts.

Center connectors on the objects they connect and leave visible clearance around text. Use custom geometry only when built-in PowerPoint shapes cannot express the meaning clearly.

SVG icons remain images, even though they render sharply. Use native shapes for elements that users must recolor or reshape directly. Use native PowerPoint charts for editable data visualizations.

## Typography and density

- Estimate text before final geometry, then verify actual PowerPoint line wrapping in a native render.
- Prefer shortening connective prose over reducing type.
- Avoid automatic fit behavior that gives peer cards inconsistent effective font sizes.
- Use explicit line breaks only at semantic phrase boundaries.
- Keep information density comparable to the reference deck without inventing facts.
- Treat large empty regions beside compressed content as a layout-routing problem, not a decoration problem.

## PptxGenJS 4.0.1 margin order

- Interpret a four-value text margin as `[left, top, right, bottom]`.
- Verify the emitted margin with OfficeCLI after introducing a new card family.
- Reserve icon space on the matching side. For a left icon, increase the first value; for a top-right icon, increase the third value and keep the top value modest.
- Do not infer margin order from CSS conventions. A wrong order can create icon-title collisions while the nominal font size remains unchanged.

## Reuse boundaries

Reuse:

- chrome, tokens, typography, spacing scales, component styling, and geometry primitives;
- a layout when the source relationship and reading path are genuinely the same.

Do not reuse:

- the same coordinate skeleton merely because a previous page passed QA;
- `top flow + lower card grid` for content that is really a topology, sequence, hierarchy, comparison, or lifecycle;
- color changes as a substitute for structural variety.

## Official references

- PptxGenJS repository and demos: <https://github.com/gitbrent/PptxGenJS>
- Slide masters: <https://gitbrent.github.io/PptxGenJS/docs/masters.html>
- Shapes: <https://gitbrent.github.io/PptxGenJS/docs/api-shapes.html>
- Charts: <https://gitbrent.github.io/PptxGenJS/docs/api-charts/>
- Images: <https://gitbrent.github.io/PptxGenJS/docs/api-images/>
- HTML table conversion scope: <https://gitbrent.github.io/PptxGenJS/docs/html-to-powerpoint/>
