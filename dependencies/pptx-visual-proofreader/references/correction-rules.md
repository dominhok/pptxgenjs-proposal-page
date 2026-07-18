# Correction rules

## Preserve meaning and hierarchy

- Do not remove, summarize, reorder, or paraphrase text to make it fit without explicit authorization.
- Preserve the relative prominence of title, section heading, label, body, caption, and footer.
- Preserve the source palette and component language.

## Fix geometry before shrinking text

Use this order:

1. Remove excessive text margins.
2. Reposition the affected element.
3. Increase the containing shape's usable dimensions.
4. Rebalance sibling cards, columns, or rows.
5. Reduce nonessential decorative whitespace.
6. Adjust line and paragraph spacing within readable limits.
7. Insert or remove a line break only after checking semantic phrasing in the render.
8. Reduce font size only when the earlier options would damage the composition.

Never solve overlap by moving an element outside the slide or into the header/footer safe zone.

## Repeated components

- Derive common widths, heights, internal paddings, and gaps from the dominant existing pattern.
- Align peer elements to shared coordinates where the design implies a grid.
- Allow content-driven height differences only when uniform sizing would create worse imbalance.
- Keep icon, badge, heading, and body offsets consistent within the same component family.

## Text handling

- Prefer integer point sizes for changed runs.
- Preserve the source family; use Pretendard when Korean font normalization is required and consistent with the source.
- Avoid autofit settings that silently shrink peer cards to different effective sizes.
- Keep multiline spacing at or above a readable baseline; inspect the render after every change.
- Make manual line breaks at phrase boundaries, not merely where a character count fits.
- Do not add text shadows.

## Intentional overlap

- Background panels may contain cards.
- Icons may sit inside badges.
- Accent bars may touch or overlap their card edge.
- Connectors may cross empty portions of containers.

Document or suppress a lint finding only after confirming the overlap is intentional in the rendered image.

## Safe mutation

- Work on a temporary candidate and promote it only after validation.
- Change the smallest coherent group of properties in each iteration.
- Re-query edited elements to catch unintended formatting rewrites.
- If OfficeCLI mutation cannot preserve an existing structure, prefer a scoped OOXML-safe edit or stop and report the constraint rather than rebuilding the whole slide without authorization.
- Use OfficeCLI for preview rendering and document mutation; never round-trip the deliverable through another office suite for saving.
