# Runtime requirements

## Required environment

| Dependency | Requirement | Purpose |
|---|---:|---|
| Windows | 10 or later | Native PowerPoint rendering and `System.Drawing` crop generation |
| PowerShell | 5.1 or later | Scaffolding, preflight, proofreader, and final gate scripts |
| Node.js | 18 or later | PptxGenJS authoring and OOXML normalization |
| npm | Lockfile-aware version bundled with supported Node.js | Reproducible `npm ci` installation |
| Python | 3.10 or later | `pptx_layout_lint.py`; the linter uses only the standard library |
| PptxGenJS | Exactly `4.0.1` | Native PowerPoint authoring |
| JSZip | Exactly `3.10.1` | Narrow notes-infrastructure normalization |
| OfficeCLI | Available on `PATH` or `%LOCALAPPDATA%\OfficeCLI\officecli.exe` | Office inspection, OOXML validation, issue detection, and rendering |
| Microsoft PowerPoint | 2021 or later | Authoritative native render for final visual QA |
| Pretendard | Installed for the current Windows environment | Required Korean typography |
| `pptx-visual-proofreader` | Sibling skill directory or repository root | Layout linting and filled-panel crop review |

Run the preflight once per environment:

```powershell
powershell -ExecutionPolicy Bypass -File "<skill>/scripts/check-requirements.ps1"
```

Treat a failed preflight as a build blocker. Do not silently replace the authoring engine, renderer, font, or validation path.

## Node dependency policy

`assets/pptxgenjs-kit/package.json` and `package-lock.json` are the source of truth. Keep runtime dependencies exact rather than using ranges. Scaffold the kit, then install with `npm ci --no-audit --no-fund`.

When changing a Node dependency:

1. update `package.json`;
2. regenerate `package-lock.json`;
3. run the kit syntax and smoke tests;
4. generate a sample PPTX;
5. run the compatibility repair and OfficeCLI validation;
6. update `references/pptxgenjs-compatibility.md` if the upstream defect changes.

## Dependency graph

```text
pptxgenjs-proposal-page
├─ Node.js + npm
│  ├─ pptxgenjs 4.0.1
│  └─ jszip 3.10.1
├─ PowerShell 5.1+
├─ Python 3.10+ (standard library only)
├─ OfficeCLI
├─ Microsoft PowerPoint 2021+
├─ Pretendard
└─ co-located skill: pptx-visual-proofreader
   ├─ scripts/pptx_layout_lint.py
   └─ scripts/render_card_crops.ps1
```
