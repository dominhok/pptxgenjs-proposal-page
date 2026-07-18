import PptxGenJS from "pptxgenjs";

export const PAGE = Object.freeze({ width: 7.5, height: 10.8333 });

export const COLOR = Object.freeze({
  navy: "0B2A53",
  blue: "2F66F5",
  purple: "7C3AED",
  teal: "0F8C7A",
  amber: "F5A000",
  green: "16A34A",
  text: "1F2937",
  muted: "64748B",
  line: "D6E3F3",
  panel: "F7FAFE",
  blueSoft: "EAF2FF",
  purpleSoft: "F1EBFF",
  tealSoft: "E9F8F5",
  amberSoft: "FFF5DF",
  greenSoft: "ECFDF3",
  white: "FFFFFF"
});

export const REGION = Object.freeze({
  flow: "Flow",
  cards: "Cards",
  message: "Message",
  support: "Support"
});

export function tag(region, item) {
  return `${region}__${item}`;
}

function assertFontSize(size) {
  if (!Number.isInteger(size) || size < 9) {
    throw new Error(`Font size must be an integer >= 9pt. Received: ${size}`);
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

function hasVisibleFill(fill) {
  if (!fill || fill === "none") return false;
  if (typeof fill === "string") return true;
  return Number(fill.transparency ?? 0) < 100;
}

function proofreadMargin(margin, fill) {
  if (!hasVisibleFill(fill)) return margin ?? 0;
  const minimum = 6;
  if (Array.isArray(margin)) {
    return margin.map((value) => Math.max(Number(value ?? 0), minimum));
  }
  return Math.max(Number(margin ?? 0), minimum);
}

function proofreadHeight(text, fontSize, fill, height) {
  if (!hasVisibleFill(fill)) return height;
  const explicitBreak = Array.isArray(text)
    ? text.some((run) => Boolean(run.options?.breakLine) || String(run.text ?? "").includes("\n"))
    : String(text ?? "").includes("\n");
  if (explicitBreak) return height;
  return Math.max(Number(height), (fontSize + 12) / 72);
}

function lineProps(line) {
  if (!line || line === "none") return { color: COLOR.white, transparency: 100, width: 0 };
  if (typeof line === "string") return { color: line, width: 1 };
  return line;
}

function normalizeRuns(text, defaultSize) {
  if (!Array.isArray(text)) return text;
  return text.map((run) => {
    const options = { ...(run.options ?? {}) };
    options.fontFace = "Pretendard";
    options.fontSize = options.fontSize ?? defaultSize;
    assertFontSize(options.fontSize);
    return { ...run, options };
  });
}

export function createProposalDeck(meta = {}) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4_PROPOSAL", width: PAGE.width, height: PAGE.height });
  pptx.layout = "A4_PROPOSAL";
  pptx.author = meta.author ?? "DMT Labs";
  pptx.company = meta.company ?? "DMT Labs";
  pptx.subject = meta.subject ?? "AI서비스와 공공서비스 연계 기반 구축용역";
  pptx.title = meta.title ?? "제안서 인포그래픽";
  pptx.lang = "ko-KR";
  pptx.theme = {
    headFontFace: "Pretendard",
    bodyFontFace: "Pretendard",
    lang: "ko-KR"
  };
  return pptx;
}

export function addTextShape(slide, pptx, text, options) {
  const fontSize = options.fontSize ?? 12;
  assertFontSize(fontSize);
  const normalizedText = normalizeRuns(text, fontSize);
  slide.addText(normalizedText, {
    x: options.x,
    y: options.y,
    w: options.w,
    h: proofreadHeight(text, fontSize, options.fill, options.h),
    shape: shapeType(pptx, options.shape ?? "rect"),
    objectName: options.name,
    fontFace: "Pretendard",
    fontSize,
    color: options.color ?? COLOR.text,
    bold: options.bold ?? false,
    align: options.align ?? "left",
    valign: options.valign ?? "top",
    margin: proofreadMargin(options.margin, options.fill),
    breakLine: false,
    paraSpaceAfterPt: options.paraSpaceAfterPt ?? 0,
    lineSpacingMultiple: options.lineSpacingMultiple ?? 1.0,
    isTextBox: false,
    fill: fillProps(options.fill),
    line: lineProps(options.line)
  });
}

export function addShape(slide, pptx, options) {
  slide.addShape(shapeType(pptx, options.shape ?? "rect"), {
    x: options.x,
    y: options.y,
    w: options.w,
    h: options.h,
    objectName: options.name,
    fill: fillProps(options.fill),
    line: lineProps(options.line),
    rotate: options.rotate ?? 0
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

export function addCard(slide, pptx, options) {
  const titleSize = options.titleSize ?? 13;
  const bodySize = options.bodySize ?? 12;
  assertFontSize(titleSize);
  assertFontSize(bodySize);
  addTextShape(
    slide,
    pptx,
    [
      {
        text: options.title,
        options: {
          bold: true,
          color: options.accent,
          fontSize: titleSize,
          breakLine: true
        }
      },
      {
        text: options.body,
        options: {
          color: options.color ?? COLOR.text,
          fontSize: bodySize
        }
      }
    ],
    {
      name: options.name,
      x: options.x,
      y: options.y,
      w: options.w,
      h: options.h,
      shape: "roundRect",
      fill: options.fill,
      line: options.line ?? { color: COLOR.line, width: 0.8 },
      margin: options.margin ?? [8, 9, 7, 39],
      fontSize: bodySize,
      valign: "top",
      lineSpacingMultiple: 1.0
    }
  );
}

export function addArrow(slide, pptx, options) {
  addShape(slide, pptx, {
    ...options,
    shape: "rightArrow",
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
    agent: `<circle cx="12" cy="8" r="3"/><path d="M6 20c.7-4 3-6 6-6s5.3 2 6 6"/><path d="M18 7h4M20 5v4"/>`,
    gateway: `<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 10h10M7 14h6"/><path d="M16 14h2"/>`,
    server: `<rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="10" width="16" height="5" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/><path d="M7 6.5h.1M7 12.5h.1M7 18h.1"/>`,
    api: `<path d="M5 7h14v10H5z"/><path d="M8 11h8M8 14h5"/><path d="M12 3v4M12 17v4"/>`,
    shield: `<path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-5"/>`,
    chart: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 16l3-4 3 2 4-6"/><path d="M17 8h2v2"/>`,
    document: `<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/>`
  };
  const body = paths[kind] ?? paths.document;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g ${common}>${body}</g></svg>`;
}

export function addIconSvg(slide, options) {
  slide.addImage({
    data: svgData(iconSvg(options.kind, options.color)),
    x: options.x,
    y: options.y,
    w: options.w,
    h: options.h,
    objectName: options.tag,
    altText: options.tag
  });
}

export function addChrome(slide, pptx, options) {
  addShape(slide, pptx, {
    name: "TopRule",
    x: 0,
    y: 0,
    w: PAGE.width,
    h: 0.09,
    shape: "rect",
    fill: COLOR.navy,
    line: "none"
  });
  addShape(slide, pptx, {
    name: "TitleAccent",
    x: 0.44,
    y: 0.34,
    w: 0.055,
    h: 0.57,
    shape: "rect",
    fill: COLOR.blue,
    line: "none"
  });
  addTextShape(slide, pptx, options.section, {
    name: "SectionCode",
    x: 0.56,
    y: 0.28,
    w: 0.72,
    h: 0.34,
    shape: "roundRect",
    fill: COLOR.blue,
    line: "none",
    fontSize: 12,
    bold: true,
    color: COLOR.white,
    align: "center",
    valign: "mid",
    margin: 0
  });
  addTextShape(slide, pptx, options.title, {
    name: "Title",
    x: 0.56,
    y: 0.62,
    w: 6.28,
    h: 0.46,
    shape: "rect",
    fill: "none",
    line: "none",
    fontSize: options.titleSize ?? 24,
    bold: true,
    color: COLOR.navy,
    valign: "mid",
    margin: 0
  });
  addTextShape(slide, pptx, options.subtitle, {
    name: "Subtitle",
    x: 0.56,
    y: 1.04,
    w: 6.30,
    h: 0.28,
    shape: "rect",
    fill: "none",
    line: "none",
    fontSize: 11,
    color: COLOR.muted,
    valign: "mid",
    margin: 0
  });

  const orbit = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="48" viewBox="0 0 120 48"><path d="M8 24c20-25 35 18 57-8 13-15 24 15 45-7" fill="none" stroke="#D7E6FA" stroke-width="2"/><g fill="#EDF4FF" stroke="#CFE0F7"><circle cx="8" cy="24" r="5"/><circle cx="38" cy="8" r="4"/><circle cx="65" cy="16" r="4"/><circle cx="110" cy="9" r="6"/></g></svg>`;
  slide.addImage({ data: svgData(orbit), x: 5.66, y: 0.24, w: 1.25, h: 0.50, objectName: "DecorativeOrbit", altText: "DecorativeOrbit" });

  addShape(slide, pptx, {
    name: "FooterLine",
    x: 0.43,
    y: 10.08,
    w: 6.64,
    h: 0.01,
    shape: "rect",
    fill: COLOR.line,
    line: "none"
  });
  addTextShape(slide, pptx, options.footer ?? "AI서비스와 공공서비스 연계 기반 구축용역", {
    name: "Footer",
    x: 0.43,
    y: 10.13,
    w: 5.70,
    h: 0.28,
    shape: "rect",
    fill: "none",
    line: "none",
    fontSize: 10,
    color: COLOR.muted,
    valign: "mid",
    margin: 0
  });
  addTextShape(slide, pptx, options.section, {
    name: "PageCode",
    x: 6.25,
    y: 10.13,
    w: 0.82,
    h: 0.28,
    shape: "rect",
    fill: "none",
    line: "none",
    fontSize: 10,
    bold: true,
    color: COLOR.navy,
    align: "right",
    valign: "mid",
    margin: 0
  });
  addShape(slide, pptx, {
    name: "BottomRule",
    x: 0,
    y: 10.74,
    w: PAGE.width,
    h: 0.0933,
    shape: "rect",
    fill: COLOR.navy,
    line: "none"
  });
}

export async function writeDeck(pptx, outputPath) {
  await pptx.writeFile({ fileName: outputPath, compression: true });
}
