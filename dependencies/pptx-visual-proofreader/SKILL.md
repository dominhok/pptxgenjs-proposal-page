---
name: pptx-visual-proofreader
description: Preserve an existing PowerPoint presentation's content and design tone while correcting text overflow, element overlap, broken alignment, inconsistent spacing, cramped typography, and rendered layout defects. Use when Codex needs to inspect, lint, render, visually review, and iteratively modify an existing .pptx with OfficeCLI, producing a separate corrected copy rather than redesigning or rewriting the presentation.
---

# PPTX Visual Proofreader

Correct existing presentations through a render-driven review loop. Treat automated checks as evidence, not as a substitute for looking at the rendered slides.

## Required companion skill

Use the `officecli` skill for all OfficeCLI inspection and mutation work. Read its instructions before issuing OfficeCLI commands.

## Preserve the source

1. Resolve the input PPTX and output directory.
2. Never overwrite the source unless the user explicitly requests it.
3. Create `<stem>_교정본.pptx` beside the source by default.
4. Keep text meaning, information order, colors, visual vocabulary, icons, borders, card styles, and hierarchy intact.
5. Do not rewrite, summarize, or delete content unless the user separately authorizes content editing.

## Execute the correction loop

### 1. Establish a baseline

- Inspect slide dimensions, shapes, groups, text, typography, autofit, margins, positions, and sizes with OfficeCLI.
- Run `officecli view <pptx> issues --json`.
- Render every slide before editing and retain the baseline images.
- Inspect the rendered images directly. Do not infer visual quality only from geometry.

Choose the most faithful available renderer:

1. Use `officecli view <pptx> screenshot --render auto`; on Windows with Microsoft PowerPoint installed, OfficeCLI selects its native renderer.
2. Use `--render native` when native PowerPoint rendering must be enforced and failure is preferable to fallback output.
3. When OfficeCLI falls back to its HTML renderer, treat the output as a supplementary structural preview rather than authoritative PowerPoint line wrapping.

### 2. Run deterministic linting

Run:

```bash
python3 scripts/pptx_layout_lint.py input.pptx \
  --output reports/input_layout.json \
  --render-dir reports/input_preview
```

Use lint findings for slide-boundary escape, text overflow, excessive autofit shrinkage, suspicious overlap, container escape, small rendered fonts, and tight line spacing.

Do not use the linter to decide semantic line breaks, aesthetic alignment, information hierarchy, or whether an intentional overlap is visually correct.

### 3. Perform the first visual review

Read [references/visual-review-checklist.md](references/visual-review-checklist.md) completely. Review the baseline images at full-slide scale and at a readable zoom. Identify the smallest set of changes that improves readability without changing the design language.

### 4. Correct in a safe order

Read [references/correction-rules.md](references/correction-rules.md) completely. Apply corrections in this order:

1. Normalize unnecessary internal margins.
2. Move elements to restore spacing and alignment.
3. Resize containers and cards.
4. Rebalance repeated rows and columns.
5. Resize text-bearing shapes or text regions.
6. Adjust paragraph spacing and line spacing.
7. Adjust line breaks at semantic boundaries after visual inspection.
8. Reduce font size only as a last resort.

Prefer explicit, stable formatting over unpredictable autofit. When changing fonts, sizes, line spacing, or geometry, check that OfficeCLI did not rewrite unrelated text runs.

### 5. Render and iterate

After each meaningful batch:

1. Save to a temporary candidate, not directly to the final corrected file.
2. Run OfficeCLI issues and the bundled linter.
3. Render every affected slide.
4. Inspect the new images directly.
5. Compare against the baseline and previous candidate.
6. Continue until both mechanical checks and visual review pass.

Lint success alone is never completion.

### 6. Complete the final visual review

Inspect the exact PPTX that will be delivered, not an earlier temporary candidate. Verify:

- no text or element escapes its intended area;
- no unintended overlap remains;
- repeated elements share consistent dimensions and gaps;
- headings, icons, labels, and bodies follow coherent alignment axes;
- line breaks are meaningful and no short orphan fragments remain;
- text density is balanced across peer cards;
- visual hierarchy and original design tone remain intact;
- footer, header, and template safe zones remain clear.

If the rendered result is visually awkward, continue editing even when all lint checks report zero findings.

## Style-preservation rules

- Preserve the original font family. When normalization is needed and the source uses Pretendard or has missing/inconsistent Korean fonts, prefer Pretendard.
- Prefer integer font sizes for any changed text. Do not impose a universal 12 pt minimum on an existing design; preserve hierarchy and avoid making text smaller unless no layout alternative works.
- Never add shadows to text, text-bearing shapes, or other text-bearing objects.
- Put text directly in newly created cards or labels when practical; do not force-convert existing structures if conversion risks changing appearance.
- Preserve the source presentation's existing object structure. Follow any stricter editability contract supplied by the calling skill when creating new objects.
- Do not add unrequested logos, watermarks, AI marks, instructions, or internal review notes to slides.
- Preserve the existing slide size and template. Do not force A4 portrait dimensions during correction unless the user explicitly asks for conversion.

## Completion criteria

Complete only when all are true:

- the source remains unchanged;
- the corrected PPTX opens and can be queried and rendered again;
- OfficeCLI reports no unresolved structural or overflow issue;
- the bundled linter has no unexplained error or warning;
- final rendered images have been directly reviewed;
- the corrected file contains no visible unintended overlap, overflow, broken alignment, or newly introduced readability defect;
- content and design tone remain materially unchanged.

Return links to the corrected PPTX, final preview images, and lint report. Briefly state any intentionally accepted warning or constraint.
