---
name: pptxgenjs-proposal-page
description: Create standalone A4 portrait Korean proposal PPTX pages from numbered DOCX sections with PptxGenJS, using a shared design system and content-driven infographic layouts. Use for DOCX-to-proposal-page work, numbered RFP response pages, and multi-section batches that need individually editable native PowerPoint objects, varied but unified compositions, and render-driven visual QA.
---

# PptxGenJS Proposal Page

Create one editable proposal slide for each requested numbered subsection. Keep the proposal chrome consistent while deriving the body composition from the source content's relationships.

## Read before working

1. Read [references/runtime-requirements.md](references/runtime-requirements.md) and run `scripts/check-requirements.ps1` before the first build in an environment.
2. Read [references/design-system.md](references/design-system.md) before planning the visual system.
3. Read [references/layout-routing.md](references/layout-routing.md) and [references/pptxgenjs-authoring.md](references/pptxgenjs-authoring.md) before selecting or implementing a composition.
4. Read [references/pptxgenjs-compatibility.md](references/pptxgenjs-compatibility.md) before generation.
5. Read [references/proofreader-gate.md](references/proofreader-gate.md) before selecting output folders or running QA.
6. Read [references/reference-inventory.md](references/reference-inventory.md) when choosing among bundled reference decks.
7. Read [references/request-prompt.md](references/request-prompt.md) when converting an informal request into a build contract.
8. Load the bundled `dependencies/pptx-visual-proofreader/SKILL.md` and its `officecli` companion before using their inspection, rendering, or correction workflows. A separately installed sibling `pptx-visual-proofreader` skill remains supported for development overrides.

Use `assets/pptxgenjs-kit/` as the build starter. Do not rewrite the shared helpers for each page.

## Tool and output contract

- Use PptxGenJS as the authoring engine for every new PPTX.
- Use OfficeCLI for source inspection, validation, rendering, and isolated correction after generation.
- Do not use LibreOffice, PowerPoint COM, `python-pptx`, or hand-authored OOXML as the primary builder.
- Permit only the narrowly scoped notes-infrastructure normalization documented in `references/pptxgenjs-compatibility.md`.
- Create text, shapes, connectors, charts, and icons as individually selectable PowerPoint objects. Never rasterize the full infographic.
- Produce exactly one slide and one PPTX per subsection.
- Use a `7.5 × 10.8333 in` portrait page with a white background.
- Map `3.8.1` to `3-8-1.pptx` unless the user specifies another filename.
- Use Korean visible copy except unavoidable product names and technical acronyms.
- Set Pretendard explicitly on every text run.
- Prefer 12pt body copy. Use integer font sizes only and never go below 10pt unless the user explicitly authorizes a 9pt exception.
- Do not add text shadows, glow, bevel, reflection, 3D effects, AI branding, prompts, tool notes, or internal reasoning.

## Workflow

### 1. Resolve and inspect inputs

1. Identify the source DOCX, subsection numbers, output directory, proposal-wide template, and reference PPTX.
2. If no reference is supplied, inspect `assets/reference-decks/2-3-1.pptx` for the shared visual system. Treat its body as one architecture example, not a universal page template.
3. When an integrated proposal deck is available, inspect several representative slides after section II and use them as the primary composition library.
4. Inspect slide size, safe zones, palette, typography, card padding, density, and footer position with OfficeCLI. Do not infer these from filenames.

### 2. Extract the authored subsection

1. Inspect the DOCX outline and text with OfficeCLI.
2. Select the authored heading followed by substantive paragraphs, excluding planning-outline duplicates.
3. Extract through the paragraph immediately before the next same-level heading.
4. Preserve requirement IDs, quantities, systems, roles, deliverables, and verification criteria. Do not merge neighboring subsections.

### 3. Write a content and layout brief

Record:

- section number, title, subtitle, preserved facts, and requirement IDs;
- dominant relationship and intended reading path;
- primary visual grammar and supporting components;
- key message and evidence that must remain visible;
- expected density, anchors, and safe-zone constraints.

Sketch at least two lightweight wireframe candidates before writing final coordinates. Compare semantic fit, scan order, information density, and similarity to adjacent pages. Select the stronger candidate; do not choose by visual novelty alone.

For three or more sibling pages, write a batch layout assignment table before coding. Reuse the design system, not the same body skeleton. If semantically different adjacent pages use the same primary layout, reroute one of them.

### 4. Build with the PptxGenJS kit

1. Run `scripts/scaffold-page.ps1` to copy the starter and locked npm dependencies into a writable work directory.
2. Implement the selected content model in the copied `page-template.mjs` and add reusable layout modules when a pattern will recur.
3. Keep common chrome in shared helpers and body coordinates in content-specific layout functions.
4. Use text-bearing shapes for cards and labels rather than layering a separate text box over a background shape for the same component.
5. Keep decoration, connectors, icons, and copy separate when each needs independent editing.
6. Assign stable semantic `objectName` values. Use `Flow__*`, `Cards__*`, `Message__*`, or `Support__*` prefixes for body objects, and keep `TopRule`, `SectionCode`, `Title`, `Subtitle`, and `Footer` stable.
7. Use the semantic name as image `altText` so pictures remain discoverable in PowerPoint's Selection Pane.
8. Generate into `draft/`, then run `repair-pptxgenjs-ooxml.mjs` exactly once.

### 5. Run render-driven correction

Run `scripts/proofread-proposal-batch.ps1` with separate `draft/`, `candidate/`, and `reports/` directories.

- Fix recurring defects in the PptxGenJS builder and regenerate.
- Use OfficeCLI candidate edits only for isolated geometry defects.
- Inspect every full-slide native render and every filled-panel crop. A contact sheet is supplementary.
- Continue until lint has zero unexplained findings, OfficeCLI has zero issues, all required crops pass visual review, and the composition looks natural.

### 6. Promote and validate

Copy only a passing candidate to the final filename. Run `scripts/postprocess-proposal-page.ps1`, then render and inspect that exact final file again.

Reject the final file if it is sparse, generic, visually inconsistent with the references, clipped, crowded, poorly aligned, or dependent on rasterized content. For batches, inspect a contact sheet and reject repeated body skeletons that do not reflect repeated source relationships.

## Completion report

Report the output path, extracted subsection boundary, reference deck, selected composition, font floor, OOXML result, OfficeCLI issue count, lint report, final native preview, card-crop manifest, and any accepted visual warning with its reason. Target Microsoft PowerPoint 2021 or later.
