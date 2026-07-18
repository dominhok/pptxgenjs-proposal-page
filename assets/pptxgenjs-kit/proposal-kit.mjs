// Single approved proposal design system used by the default scaffold.
import PptxGenJS from "pptxgenjs";

export const PAGE = Object.freeze({ width: 7.5, height: 10.8333 });

export const COLOR = Object.freeze({
  navy: "0B2E5B",
  navy2: "173D6F",
  blue: "2563EB",
  cyan: "17B7D8",
  purple: "7C3AED",
  teal: "0F766E",
  green: "16A34A",
  amber: "F59E0B",
  red: "DC2626",
  text: "172033",
  muted: "64748B",
  line: "CFDCEC",
  panel: "F7FAFE",
  blueSoft: "EFF6FF",
  cyanSoft: "E9F9FC",
  purpleSoft: "F3E8FF",
  tealSoft: "ECFDF5",
  greenSoft: "ECFDF3",
  amberSoft: "FFF7E6",
  redSoft: "FEF2F2",
  white: "FFFFFF"
});

export const REGION = Object.freeze({
  flow: "Flow",
  cards: "Cards",
  message: "Message",
  support: "Support"
});

export const tag = (region, item) => `${region}__${item}`;

function assertFontSize(size) {
  if (!Number.isInteger(size) || size < 10) {
    throw new Error(`Font size must be an integer >= 10pt. Received: ${size}`);
  }
}

function shapeType(pptx, shape) {
  if (typeof shape !== "string") return shape;
  return pptx.ShapeType[shape] ?? shape;
}

function fillProps(fill) {
  if (!fill || fill === "none") return { color: COLOR.white, transparency: 100 };
  if (typeof fill === "string") return { color: fill };
  return fill;
}

function lineProps(line) {
  if (!line || line === "none") return { color: COLOR.white, transparency: 100, width: 0 };
  if (typeof line === "string") return { color: line, width: 1 };
  return line;
}

export function createProposalDeck(meta = {}) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4_REFERENCE_LED", width: PAGE.width, height: PAGE.height });
  pptx.layout = "A4_REFERENCE_LED";
  pptx.author = "DMT Labs";
  pptx.company = "DMT Labs";
  pptx.subject = meta.subject ?? "2026 KISTI 독자 파운데이션 모델 기반 공공 R&D AI 시스템 개발";
  pptx.title = meta.title ?? "KISTI 제안서 디자인 샘플";
  pptx.lang = "ko-KR";
  pptx.theme = { headFontFace: "Pretendard", bodyFontFace: "Pretendard", lang: "ko-KR" };
  return pptx;
}

export function addShape(slide, pptx, options) {
  slide.addShape(shapeType(pptx, options.shape ?? "rect"), {
    x: options.x, y: options.y, w: options.w, h: options.h,
    objectName: options.name,
    fill: fillProps(options.fill),
    line: lineProps(options.line),
    rotate: options.rotate ?? 0,
    radius: options.radius
  });
}

export function addText(slide, pptx, text, options) {
  const fontSize = options.fontSize ?? 11;
  assertFontSize(fontSize);
  slide.addText(text, {
    x: options.x, y: options.y, w: options.w, h: options.h,
    shape: shapeType(pptx, options.shape ?? "rect"),
    objectName: options.name,
    fontFace: "Pretendard",
    fontSize,
    color: options.color ?? COLOR.text,
    bold: options.bold ?? false,
    align: options.align ?? "left",
    valign: options.valign ?? "top",
    margin: options.margin ?? 0,
    paraSpaceAfterPt: options.paraSpaceAfterPt ?? 0,
    breakLine: false,
    fill: fillProps(options.fill),
    line: lineProps(options.line)
  });
}

export function addRichCard(slide, pptx, options) {
  const titleSize = options.titleSize ?? 12;
  const bodySize = options.bodySize ?? 10;
  assertFontSize(titleSize);
  assertFontSize(bodySize);
  const runs = [
    { text: options.title, options: { fontFace: "Pretendard", fontSize: titleSize, bold: true, color: options.titleColor ?? options.accent ?? COLOR.navy, breakLine: true } },
    { text: options.body, options: { fontFace: "Pretendard", fontSize: bodySize, color: options.bodyColor ?? COLOR.text } }
  ];
  slide.addText(runs, {
    x: options.x, y: options.y, w: options.w, h: options.h,
    shape: shapeType(pptx, options.shape ?? "roundRect"),
    objectName: options.name,
    fontFace: "Pretendard", fontSize: bodySize,
    color: options.bodyColor ?? COLOR.text,
    valign: options.valign ?? "top",
    align: options.align ?? "left",
    margin: options.margin ?? [8, 10, 8, 10],
    paraSpaceAfterPt: 3,
    fill: fillProps(options.fill ?? COLOR.white),
    line: lineProps(options.line ?? { color: COLOR.line, width: 0.8 })
  });
}

export function addPanel(slide, pptx, options) {
  addShape(slide, pptx, {
    ...options,
    shape: options.shape ?? "roundRect",
    fill: options.fill ?? COLOR.panel,
    line: options.line ?? { color: COLOR.line, width: 0.8 }
  });
}

export function addLine(slide, pptx, options) {
  slide.addShape(pptx.ShapeType.line, {
    x: options.x, y: options.y, w: options.w, h: options.h,
    objectName: options.name,
    line: {
      color: options.color ?? COLOR.blue,
      width: options.width ?? 1.5,
      beginArrowType: options.beginArrowType ?? "none",
      endArrowType: options.endArrowType ?? "none",
      dash: options.dash ?? "solid"
    }
  });
}

export function addArrow(slide, pptx, options) {
  addShape(slide, pptx, {
    ...options,
    shape: options.shape ?? "rightArrow",
    fill: options.fill ?? COLOR.blue,
    line: "none"
  });
}

export function svgData(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

export function iconSvg(kind, color = COLOR.blue) {
  const common = `fill="none" stroke="#${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
  const paths = {
    layers: `<path d="M4 8l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>`,
    service: `<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6M7 17h8"/>`,
    brain: `<path d="M9 5a3 3 0 0 0-5 2.3A3.5 3.5 0 0 0 5 13a3.5 3.5 0 0 0 4 5M15 5a3 3 0 0 1 5 2.3 3.5 3.5 0 0 1-1 5.7 3.5 3.5 0 0 1-4 5"/><path d="M9 5v14M15 5v14M9 10H7M15 10h2M9 15H7M15 15h2"/>`,
    database: `<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>`,
    infra: `<rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="10" width="16" height="5" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/><path d="M7 6.5h.1M7 12.5h.1M7 18h.1"/>`,
    link: `<path d="M9 15l-2 2a4 4 0 0 1-6-6l3-3a4 4 0 0 1 6 0M15 9l2-2a4 4 0 0 1 6 6l-3 3a4 4 0 0 1-6 0M8 12h8"/>`,
    target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 4V1M20 12h3M12 20v3M4 12H1"/>`,
    shield: `<path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-5"/>`,
    route: `<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h5c3 0 3 5 0 5H9c-3 0-3 5 0 5h8"/>`,
    meeting: `<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>`,
    search: `<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6M7 10h6M10 7v6"/>`,
    document: `<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/>`,
    cycle: `<path d="M4 8a8 8 0 0 1 13-3l2 2M20 16a8 8 0 0 1-13 3l-2-2"/><path d="M19 3v4h-4M5 21v-4h4"/>`,
    risk: `<path d="M12 3l10 18H2z"/><path d="M12 9v5M12 18h.1"/>`,
    code: `<path d="M8 7l-4 5 4 5M16 7l4 5-4 5M14 4l-4 16"/>`,
    check: `<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 6-7"/>`,
    folder: `<path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2"/>`,
    test: `<path d="M9 3v5l-5 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 8V3"/><path d="M8 14h8M8 3h8"/>`,
    alert: `<path d="M12 3l10 18H2z"/><path d="M12 9v5M12 18h.1"/>`,
    clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>`,
    wrench: `<path d="M14 6a5 5 0 0 0-6 6L3 17l4 4 5-5a5 5 0 0 0 6-6l-3 3-4-4z"/>`,
    trace: `<path d="M4 5h7v5H4zM13 14h7v5h-7z"/><path d="M11 7.5h3a3 3 0 0 1 3 3V14M13 16.5h-3a3 3 0 0 1-3-3V10"/>`,
    quality: `<path d="M12 3l3 3 4 .5-.5 4 2.5 3-3 2-.5 4-4-.5-3 2.5-2-3-4 .5.5-4L2 12l3-2-.5-4 4 .5z"/><path d="M8.5 12l2.2 2.2 4.8-5"/>`,
    approve: `<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M9 17l2 2 4-4"/>`
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g ${common}>${paths[kind] ?? paths.document}</g></svg>`;
}

export function addIcon(slide, options) {
  slide.addImage({
    data: svgData(iconSvg(options.kind, options.color)),
    x: options.x, y: options.y, w: options.w, h: options.h,
    objectName: options.name,
    altText: options.name
  });
}

export function addIconBadge(slide, pptx, options) {
  addShape(slide, pptx, {
    name: `${options.name}__Badge`, x: options.x, y: options.y,
    w: options.size, h: options.size, shape: "ellipse",
    fill: options.fill ?? COLOR.white,
    line: { color: options.color, width: 0.8 }
  });
  addIcon(slide, {
    name: `${options.name}__Icon`, kind: options.kind, color: options.color,
    x: options.x + options.size * 0.21, y: options.y + options.size * 0.21,
    w: options.size * 0.58, h: options.size * 0.58
  });
}

export function addSectionLabel(slide, pptx, text, options) {
  addText(slide, pptx, text, {
    name: options.name,
    x: options.x, y: options.y, w: options.w, h: options.h ?? 0.30,
    shape: "roundRect", fill: options.fill ?? COLOR.white,
    line: { color: options.lineColor ?? COLOR.line, width: 0.8 },
    fontSize: options.fontSize ?? 10, bold: true,
    color: options.color ?? COLOR.navy, align: "center", valign: "mid", margin: 0
  });
}

export function addChrome(slide, pptx, options) {
  slide.background = { color: COLOR.white };
  addShape(slide, pptx, { name: "TopRule", x: 0, y: 0, w: 7.5, h: 0.06, fill: COLOR.cyan, line: "none" });
  addShape(slide, pptx, { name: "ChapterBlock", x: 0, y: 0.18, w: 1.24, h: 0.72, shape: "parallelogram", fill: COLOR.navy, line: "none" });
  addShape(slide, pptx, { name: "SectionRibbon", x: 1.08, y: 0.18, w: 4.58, h: 0.72, shape: "parallelogram", fill: COLOR.blue, line: "none" });
  addText(slide, pptx, "CH.", { name: "ChapterLabel", x: 0.10, y: 0.28, w: 0.46, h: 0.20, fontSize: 10, bold: true, color: COLOR.white, valign: "mid" });
  addText(slide, pptx, options.chapter, { name: "SectionCode", x: 0.10, y: 0.48, w: 0.80, h: 0.31, fontSize: 20, bold: true, color: COLOR.white, valign: "mid" });
  addText(slide, pptx, options.sectionTitle, { name: "SectionTitle", x: 1.42, y: 0.36, w: 3.72, h: 0.34, fontSize: 14, bold: true, color: COLOR.white, valign: "mid", align: "center" });
  addText(slide, pptx, "KISTI", { name: "KistiMark", x: 6.25, y: 0.30, w: 0.78, h: 0.30, fontSize: 14, bold: true, color: COLOR.navy, align: "right", valign: "mid" });
  addShape(slide, pptx, { name: "ProjectRibbon", x: 3.68, y: 1.00, w: 3.82, h: 0.25, shape: "parallelogram", fill: COLOR.blue, line: "none" });
  addText(slide, pptx, "KISTI 공공 R&D AI 시스템 개발", { name: "ProjectName", x: 4.00, y: 1.00, w: 3.18, h: 0.25, fontSize: 10, bold: true, color: COLOR.white, align: "center", valign: "mid" });
  addShape(slide, pptx, { name: "TitleAccent", x: 0.40, y: 1.39, w: 0.07, h: 0.58, fill: COLOR.blue, line: "none" });
  addText(slide, pptx, options.title, { name: "Title", x: 0.56, y: 1.34, w: 6.45, h: 0.48, fontSize: options.titleSize ?? 20, bold: true, color: COLOR.navy, valign: "mid" });
  addText(slide, pptx, options.subtitle, { name: "Subtitle", x: 0.57, y: 1.83, w: 6.35, h: 0.27, fontSize: 10, color: COLOR.muted, valign: "mid" });
  addShape(slide, pptx, { name: "FooterNavy", x: 0, y: 10.43, w: 2.25, h: 0.40, shape: "parallelogram", fill: COLOR.navy, line: "none" });
  addShape(slide, pptx, { name: "FooterBlue", x: 1.80, y: 10.43, w: 3.25, h: 0.40, shape: "parallelogram", fill: COLOR.blue, line: "none" });
  addShape(slide, pptx, { name: "FooterCyan", x: 4.62, y: 10.43, w: 2.88, h: 0.40, shape: "parallelogram", fill: COLOR.cyan, line: "none" });
  addText(slide, pptx, options.footer ?? "DMT Labs", { name: "Footer", x: 0.30, y: 10.51, w: 1.26, h: 0.18, fontSize: 10, bold: true, color: COLOR.white, valign: "mid" });
  addText(slide, pptx, String(options.pageNo).padStart(2, "0"), { name: "PageCode", x: 6.48, y: 10.49, w: 0.55, h: 0.20, fontSize: 12, bold: true, color: COLOR.white, align: "right", valign: "mid" });
}

export function addKeyMessage(slide, pptx, message) {
  addText(slide, pptx, "핵심 메시지", {
    name: tag(REGION.message, "Label"), x: 0.42, y: 9.26, w: 1.12, h: 0.30,
    shape: "roundRect", fill: COLOR.blue, line: "none", fontSize: 10,
    bold: true, color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  addText(slide, pptx, message, {
    name: tag(REGION.message, "Band"), x: 0.42, y: 9.60, w: 6.66, h: 0.62,
    shape: "roundRect", fill: COLOR.navy, line: "none", fontSize: 11,
    bold: true, color: COLOR.white, align: "center", valign: "mid", margin: [4, 4, 4, 4]
  });
}

export async function writeDeck(pptx, outputPath) {
  await pptx.writeFile({ fileName: outputPath, compression: true });
}
