#!/usr/bin/env python3
"""Geometry- and typography-aware PPTX layout linting using OfficeCLI.

The built-in ``officecli view ... issues`` check is necessary but not sufficient:
it intentionally trusts PowerPoint autofit and does not report every visual
collision.  This script layers deterministic geometry and text-fit checks on
top of OfficeCLI's document model.

It never edits the input file.  Reports are suitable for an iterative loop:

    edit -> lint -> render -> inspect -> lint
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable


PATH_SLIDE_RE = re.compile(r"/slide\[(\d+)\]")
SHAPE_PREFIX_RE = re.compile(r"^(.*?/shape\[@id=\d+\])")


def officecli_executable() -> str:
    command = shutil.which("officecli")
    if command:
        return command

    if os.name == "nt":
        local_app_data = os.environ.get("LOCALAPPDATA")
        if local_app_data:
            installed = Path(local_app_data) / "OfficeCLI" / "officecli.exe"
            if installed.is_file():
                return str(installed)

    raise RuntimeError(
        "officecli is not installed or is not on PATH; install it from "
        "https://github.com/iOfficeAI/OfficeCLI"
    )


def run_officecli(*args: str) -> dict[str, Any]:
    proc = subprocess.run(
        [officecli_executable(), *map(str, args)],
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"officecli failed ({proc.returncode}): {' '.join(args)}\n"
            f"stdout: {proc.stdout}\nstderr: {proc.stderr}"
        )
    start = proc.stdout.find("{")
    if start < 0:
        raise RuntimeError(f"officecli returned no JSON: {proc.stdout}")
    payload = json.loads(proc.stdout[start:])
    if not payload.get("success", False):
        raise RuntimeError(f"officecli operation failed: {payload}")
    return payload.get("data", {})


def length_pt(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = re.fullmatch(r"\s*(-?[0-9]+(?:\.[0-9]+)?)(pt|cm|in|px|emu)?\s*", str(value).lower())
    if not match:
        return None
    number = float(match.group(1))
    unit = match.group(2) or "pt"
    return number * {
        "pt": 1.0,
        "cm": 72.0 / 2.54,
        "in": 72.0,
        "px": 0.75,
        "emu": 1.0 / 12700.0,
    }[unit]


@dataclass(frozen=True)
class Box:
    x: float
    y: float
    w: float
    h: float

    @property
    def right(self) -> float:
        return self.x + self.w

    @property
    def bottom(self) -> float:
        return self.y + self.h

    @property
    def area(self) -> float:
        return max(0.0, self.w) * max(0.0, self.h)

    @property
    def cx(self) -> float:
        return self.x + self.w / 2.0

    @property
    def cy(self) -> float:
        return self.y + self.h / 2.0

    def intersection(self, other: "Box") -> "Box | None":
        left = max(self.x, other.x)
        top = max(self.y, other.y)
        right = min(self.right, other.right)
        bottom = min(self.bottom, other.bottom)
        if right <= left or bottom <= top:
            return None
        return Box(left, top, right - left, bottom - top)

    def contains_point(self, x: float, y: float, padding: float = 0.0) -> bool:
        return (
            self.x - padding <= x <= self.right + padding
            and self.y - padding <= y <= self.bottom + padding
        )

    def contains(self, other: "Box", padding: float = 0.0) -> bool:
        return (
            self.x - padding <= other.x
            and self.y - padding <= other.y
            and self.right + padding >= other.right
            and self.bottom + padding >= other.bottom
        )


@dataclass
class Element:
    path: str
    slide: int
    kind: str
    text: str
    box: Box | None
    fmt: dict[str, Any]
    font_sizes: list[float] = field(default_factory=list)

    @property
    def zorder(self) -> int:
        try:
            return int(self.fmt.get("zorder", 0))
        except (TypeError, ValueError):
            return 0

    @property
    def has_text(self) -> bool:
        return bool(self.text.strip())

    @property
    def font_size(self) -> float | None:
        if self.font_sizes:
            return max(self.font_sizes)
        return length_pt(self.fmt.get("size") or self.fmt.get("effective.size"))


@dataclass
class Finding:
    severity: str
    code: str
    slide: int
    path: str
    message: str
    related_path: str | None = None
    metrics: dict[str, Any] = field(default_factory=dict)


def slide_number(path: str) -> int:
    match = PATH_SLIDE_RE.search(path)
    return int(match.group(1)) if match else 1


def element_from_result(result: dict[str, Any]) -> Element:
    fmt = result.get("format", {}) or {}
    values = [length_pt(fmt.get(key)) for key in ("x", "y", "width", "height")]
    box = None
    if all(value is not None for value in values):
        x, y, w, h = (float(value) for value in values)  # type: ignore[arg-type]
        box = Box(x, y, w, h)
    return Element(
        path=result.get("path", ""),
        slide=slide_number(result.get("path", "")),
        kind=result.get("type", "unknown"),
        text=result.get("text", "") or "",
        box=box,
        fmt=fmt,
    )


def query_elements(pptx: Path) -> list[Element]:
    elements: dict[str, Element] = {}
    for selector in ("shape", "picture", "connector", "table", "chart", "group"):
        try:
            data = run_officecli("query", str(pptx), selector, "--json")
        except RuntimeError:
            continue
        for result in data.get("results", []):
            element = element_from_result(result)
            elements[element.path] = element

    # Shape-level size is intentionally suppressed for mixed formatting.  Read
    # run sizes once so text-fit checks use the actual explicit run sizes.
    try:
        runs = run_officecli("query", str(pptx), "run", "--json").get("results", [])
    except RuntimeError:
        runs = []
    for run in runs:
        match = SHAPE_PREFIX_RE.match(run.get("path", ""))
        if not match:
            continue
        shape = elements.get(match.group(1))
        if not shape:
            continue
        size = length_pt((run.get("format", {}) or {}).get("size"))
        if size is not None:
            shape.font_sizes.append(size)
    return sorted(elements.values(), key=lambda item: (item.slide, item.zorder, item.path))


def slide_size(pptx: Path) -> tuple[float, float]:
    data = run_officecli("get", str(pptx), "/", "--depth", "0", "--json")
    result = data.get("results", [{}])[0]
    fmt = result.get("format", {}) or {}
    width = length_pt(fmt.get("slideWidth"))
    height = length_pt(fmt.get("slideHeight"))
    if width is None or height is None:
        raise RuntimeError("Could not read slide dimensions")
    return width, height


def is_transparent(fmt: dict[str, Any]) -> bool:
    opacity = fmt.get("opacity")
    if opacity is not None:
        try:
            if float(opacity) <= 0.02:
                return True
        except (TypeError, ValueError):
            pass
    fill = str(fmt.get("fill", "")).upper()
    return not fill or fill in {"NONE", "TRANSPARENT"} or fill.endswith("00")


def margins_pt(value: Any) -> tuple[float, float, float, float]:
    if value is None:
        return (0.0, 0.0, 0.0, 0.0)
    text = str(value)
    if "," not in text:
        margin = length_pt(text) or 0.0
        return (margin, margin, margin, margin)
    raw = text.split(",")
    parsed = [(length_pt(item) or 0.0) if item != "-" else 0.0 for item in raw]
    parsed += [0.0] * (4 - len(parsed))
    return tuple(parsed[:4])  # type: ignore[return-value]


def line_spacing_multiplier(value: Any, font_size: float) -> float:
    if value is None:
        return 1.0
    text = str(value).strip().lower()
    try:
        if text.endswith("x"):
            return max(0.75, float(text[:-1]))
        if text.endswith("pt"):
            return max(0.75, (length_pt(text) or font_size) / font_size)
    except ValueError:
        pass
    return 1.0


def explicit_line_spacing(value: Any, font_size: float) -> float:
    """Return the declared line-spacing multiplier for readability checks."""
    return line_spacing_multiplier(value, font_size)


def glyph_width(ch: str) -> float:
    if ch.isspace():
        return 0.30
    category = unicodedata.category(ch)
    if category.startswith("P"):
        return 0.38
    if unicodedata.east_asian_width(ch) in {"W", "F"}:
        return 1.0
    if ch.isupper():
        return 0.64
    if ch.isdigit():
        return 0.56
    return 0.54


def estimate_text_fit(element: Element) -> dict[str, float] | None:
    if not element.has_text or not element.box:
        return None
    font_size = element.font_size
    if font_size is None or font_size <= 0:
        return None
    left, top, right, bottom = margins_pt(element.fmt.get("margin"))
    usable_width = max(1.0, element.box.w - left - right)
    usable_height = max(1.0, element.box.h - top - bottom)
    lines = 0
    for paragraph in element.text.split("\n"):
        width = sum(glyph_width(ch) * font_size for ch in paragraph)
        paragraph_lines = max(1, math.ceil(width / usable_width))
        lines += paragraph_lines
    line_height = font_size * line_spacing_multiplier(element.fmt.get("lineSpacing"), font_size)
    needed = lines * line_height
    ratio = min(1.0, usable_height / needed) if needed else 1.0
    return {
        "font_pt": round(font_size, 2),
        "lines": float(lines),
        "usable_height_pt": round(usable_height, 2),
        "needed_height_pt": round(needed, 2),
        "fit_ratio": round(ratio, 3),
        "estimated_render_font_pt": round(font_size * ratio, 2),
    }


def official_findings(pptx: Path) -> list[Finding]:
    findings: list[Finding] = []
    data = run_officecli("view", str(pptx), "issues", "--json")
    for issue in data.get("issues", []):
        message = issue.get("message", "")
        code = "office.text_overflow" if "text overflow" in message.lower() else "office.layout"
        findings.append(
            Finding(
                severity="error" if int(issue.get("severity", 1)) >= 1 else "warning",
                code=code,
                slide=slide_number(issue.get("path", "")),
                path=issue.get("path", ""),
                message=message,
            )
        )
    return findings


def infer_container(element: Element, candidates: Iterable[Element]) -> Element | None:
    if not element.box:
        return None
    possible: list[Element] = []
    for candidate in candidates:
        if candidate.path == element.path or candidate.slide != element.slide or not candidate.box:
            continue
        if candidate.has_text or is_transparent(candidate.fmt):
            continue
        if candidate.box.area <= element.box.area * 1.05:
            continue
        if candidate.box.contains_point(element.box.cx, element.box.cy):
            possible.append(candidate)
    return min(possible, key=lambda candidate: candidate.box.area) if possible else None  # type: ignore[union-attr]


def custom_findings(
    elements: list[Element],
    width: float,
    height: float,
    min_font: float,
    overlap_ratio: float,
    edge_tolerance: float,
) -> list[Finding]:
    findings: list[Finding] = []
    page = Box(0.0, 0.0, width, height)

    for element in elements:
        if not element.box:
            continue
        if not page.contains(element.box, padding=edge_tolerance):
            findings.append(
                Finding(
                    severity="error",
                    code="geometry.out_of_bounds",
                    slide=element.slide,
                    path=element.path,
                    message="Element extends outside the slide boundary",
                    metrics={
                        "x": round(element.box.x, 2),
                        "y": round(element.box.y, 2),
                        "right": round(element.box.right, 2),
                        "bottom": round(element.box.bottom, 2),
                        "slide_width": round(width, 2),
                        "slide_height": round(height, 2),
                    },
                )
            )

        if element.has_text:
            fit = estimate_text_fit(element)
            if fit:
                auto_fit = str(element.fmt.get("autoFit", "")).lower()
                render_font = fit["estimated_render_font_pt"]
                spacing = explicit_line_spacing(element.fmt.get("lineSpacing"), fit["font_pt"])
                if fit["lines"] >= 2 and spacing < 0.98:
                    findings.append(
                        Finding(
                            severity="warning",
                            code="typography.tight_line_spacing",
                            slide=element.slide,
                            path=element.path,
                            message=f"Multi-line text uses tight {spacing:.2f}x line spacing; use at least 1.0x",
                            metrics={**fit, "line_spacing": round(spacing, 3)},
                        )
                    )
                if auto_fit in {"normal", "shrink"} and fit["fit_ratio"] < 0.82:
                    findings.append(
                        Finding(
                            severity="error" if fit["fit_ratio"] < 0.68 else "warning",
                            code="typography.excessive_autoshrink",
                            slide=element.slide,
                            path=element.path,
                            message=(
                                f"Autofit is estimated to shrink text to {render_font:.2f}pt "
                                f"({fit['fit_ratio'] * 100:.0f}% of nominal size)"
                            ),
                            metrics=fit,
                        )
                    )
                elif auto_fit in {"none", ""} and fit["fit_ratio"] < 0.98:
                    findings.append(
                        Finding(
                            severity="error",
                            code="typography.estimated_overflow",
                            slide=element.slide,
                            path=element.path,
                            message="Estimated rendered text height exceeds the text box",
                            metrics=fit,
                        )
                    )
                if render_font < min_font:
                    findings.append(
                        Finding(
                            severity="warning",
                            code="typography.too_small",
                            slide=element.slide,
                            path=element.path,
                            message=f"Estimated rendered font is {render_font:.2f}pt; minimum is {min_font:.2f}pt",
                            metrics=fit,
                        )
                    )

            container = infer_container(element, elements)
            if container and container.box and not container.box.contains(element.box, padding=0.6):
                findings.append(
                    Finding(
                        severity="error",
                        code="layout.container_escape",
                        slide=element.slide,
                        path=element.path,
                        related_path=container.path,
                        message="Text box is not fully contained by its inferred visual container",
                    )
                )

    # Text-box intersections are almost always unintended.  Decorative shape
    # layering is handled separately and only reported at a larger threshold.
    text_elements = [element for element in elements if element.has_text and element.box]
    for index, left in enumerate(text_elements):
        for right in text_elements[index + 1 :]:
            if left.slide != right.slide:
                continue
            intersection = left.box.intersection(right.box)  # type: ignore[union-attr]
            if not intersection:
                continue
            ratio = intersection.area / max(1.0, min(left.box.area, right.box.area))  # type: ignore[union-attr]
            if ratio >= overlap_ratio:
                findings.append(
                    Finding(
                        severity="error",
                        code="geometry.text_text_overlap",
                        slide=left.slide,
                        path=left.path,
                        related_path=right.path,
                        message=f"Text boxes overlap by {ratio * 100:.1f}% of the smaller box",
                        metrics={"overlap_ratio": round(ratio, 3)},
                    )
                )

    visible_shapes = [
        element
        for element in elements
        if element.box and not element.has_text and not is_transparent(element.fmt) and element.kind != "connector"
    ]
    for index, left in enumerate(visible_shapes):
        for right in visible_shapes[index + 1 :]:
            if left.slide != right.slide:
                continue
            if left.box.contains(right.box, padding=0.6) or right.box.contains(left.box, padding=0.6):  # type: ignore[union-attr]
                continue
            intersection = left.box.intersection(right.box)  # type: ignore[union-attr]
            if not intersection:
                continue
            ratio = intersection.area / max(1.0, min(left.box.area, right.box.area))  # type: ignore[union-attr]
            if ratio >= max(0.20, overlap_ratio * 2.0):
                findings.append(
                    Finding(
                        severity="warning",
                        code="geometry.shape_overlap",
                        slide=left.slide,
                        path=left.path,
                        related_path=right.path,
                        message=f"Non-container shapes overlap by {ratio * 100:.1f}% of the smaller shape",
                        metrics={"overlap_ratio": round(ratio, 3)},
                    )
                )
    return findings


def dedupe_findings(findings: list[Finding]) -> list[Finding]:
    seen: set[tuple[str, str, str | None]] = set()
    result: list[Finding] = []
    for finding in findings:
        key = (finding.code, finding.path, finding.related_path)
        if key in seen:
            continue
        seen.add(key)
        result.append(finding)
    order = {"error": 0, "warning": 1, "info": 2}
    return sorted(result, key=lambda item: (order.get(item.severity, 9), item.slide, item.path, item.code))


def render_preview(pptx: Path, output_dir: Path) -> list[str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    stats = run_officecli("view", str(pptx), "stats", "--json")
    slide_count = int(stats.get("slides", 0))
    if slide_count < 1:
        raise RuntimeError("officecli reported no slides to render")

    previews: list[str] = []
    officecli = officecli_executable()
    for page in range(1, slide_count + 1):
        preview = output_dir / f"{pptx.stem}_slide_{page}.png"
        proc = subprocess.run(
            [
                officecli,
                "view",
                str(pptx),
                "screenshot",
                "--page",
                str(page),
                "--render",
                "auto",
                "-o",
                str(preview),
            ],
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            check=False,
        )
        if proc.returncode != 0:
            raise RuntimeError(
                f"officecli screenshot failed for slide {page}: "
                f"{proc.stdout}\n{proc.stderr}"
            )
        if not preview.is_file():
            raise RuntimeError(
                f"officecli reported success but did not create slide {page}: {preview}"
            )
        previews.append(str(preview))
    return previews


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pptx", type=Path)
    parser.add_argument("--json", action="store_true", help="Print the full machine-readable report")
    parser.add_argument("--output", type=Path, help="Write the JSON report to this path")
    parser.add_argument("--render-dir", type=Path, help="Also render a PNG preview into this directory")
    parser.add_argument("--min-font-pt", type=float, default=7.0)
    parser.add_argument("--overlap-ratio", type=float, default=0.08)
    parser.add_argument("--edge-tolerance-pt", type=float, default=0.75)
    args = parser.parse_args()

    pptx = args.pptx.resolve()
    if not pptx.is_file():
        parser.error(f"file not found: {pptx}")

    width, height = slide_size(pptx)
    elements = query_elements(pptx)
    findings = dedupe_findings(
        official_findings(pptx)
        + custom_findings(
            elements,
            width,
            height,
            args.min_font_pt,
            args.overlap_ratio,
            args.edge_tolerance_pt,
        )
    )
    previews = render_preview(pptx, args.render_dir.resolve()) if args.render_dir else []
    counts = {
        severity: sum(1 for finding in findings if finding.severity == severity)
        for severity in ("error", "warning", "info")
    }
    report = {
        "file": str(pptx),
        "slide_size_pt": {"width": round(width, 2), "height": round(height, 2)},
        "element_count": len(elements),
        "counts": counts,
        "previews": previews,
        "findings": [asdict(finding) for finding in findings],
    }

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"{pptx.name}: {counts['error']} error(s), {counts['warning']} warning(s)")
        for finding in findings:
            related = f" <-> {finding.related_path}" if finding.related_path else ""
            print(f"[{finding.severity.upper()}] {finding.code} {finding.path}{related}: {finding.message}")
        if previews:
            for preview in previews:
                print(f"preview: {preview}")
    return 1 if counts["error"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
