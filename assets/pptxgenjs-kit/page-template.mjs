import {
  COLOR,
  REGION,
  addArrow,
  addChrome,
  addIconBadge,
  addKeyMessage,
  addPanel,
  addRichCard,
  addSectionLabel,
  addText,
  createProposalDeck,
  svgData,
  tag,
  writeDeck
} from "./proposal-kit.mjs";

// Default proposal starter. Replace this body with a content-routed layout.
// Use reference-layouts.mjs as a pattern library; do not repeat this 2x2
// composition when the source relationship is sequential, hierarchical, or cyclic.
const output = process.argv[2] ?? "II-1-2.pptx";
const pptx = createProposalDeck({ title: "공통 설계원칙 및 서비스 경계" });
const slide = pptx.addSlide();

addChrome(slide, pptx, {
  chapter: "II",
  sectionTitle: "기술 및 기능 · 설계원칙",
  pageNo: 2,
  title: "공통 설계원칙 및 서비스 경계",
  subtitle: "책임 응집도와 변경주기를 기준으로 서비스 경계를 정의하고 연계 계약을 표준화"
});

const softBy = {
  [COLOR.blue]: COLOR.blueSoft,
  [COLOR.purple]: COLOR.purpleSoft,
  [COLOR.teal]: COLOR.tealSoft,
  [COLOR.green]: COLOR.greenSoft,
  [COLOR.amber]: COLOR.amberSoft
};

function stageNode(item, index, x) {
  addText(slide, pptx, item.label, {
    name: tag(REGION.flow, `Stage${index + 1}`),
    x,
    y: 2.62,
    w: 1.12,
    h: 0.70,
    shape: "roundRect",
    fill: softBy[item.color],
    line: { color: item.color, width: 0.9 },
    fontSize: 10,
    bold: true,
    color: item.color,
    align: "center",
    valign: "mid",
    margin: [4, 4, 4, 4]
  });
  const number = String(index + 1).padStart(2, "0");
  const badge = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#${item.color}"/><text x="24" y="29" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#FFFFFF">${number}</text></svg>`;
  slide.addImage({
    data: svgData(badge),
    x: x + 0.07,
    y: 2.50,
    w: 0.30,
    h: 0.30,
    objectName: tag(REGION.flow, `StageNo${index + 1}`),
    altText: tag(REGION.flow, `StageNo${index + 1}`)
  });
}

addSectionLabel(slide, pptx, "Backend Service Chain", {
  name: tag(REGION.flow, "ChainLabel"),
  x: 0.42,
  y: 2.18,
  w: 1.58
});

const services = [
  { label: "Service", color: COLOR.blue },
  { label: "Meeting", color: COLOR.teal },
  { label: "ETL", color: COLOR.amber },
  { label: "Generation", color: COLOR.purple },
  { label: "LLM Gateway", color: COLOR.green }
];
services.forEach((service, index) => {
  const x = 0.44 + index * 1.34;
  stageNode(service, index, x);
  if (index < services.length - 1) {
    addArrow(slide, pptx, {
      name: tag(REGION.flow, `Arrow${index + 1}`),
      x: x + 1.14,
      y: 2.89,
      w: 0.17,
      h: 0.13,
      fill: COLOR.blue
    });
  }
});

addPanel(slide, pptx, {
  name: tag(REGION.flow, "BoundaryFrame"),
  x: 0.42,
  y: 3.56,
  w: 6.66,
  h: 5.38,
  fill: COLOR.panel
});
addText(slide, pptx, "실용적 서비스 경계", {
  name: tag(REGION.flow, "BoundaryHub"),
  x: 2.17,
  y: 3.79,
  w: 3.16,
  h: 0.66,
  shape: "roundRect",
  fill: COLOR.navy,
  line: "none",
  fontSize: 14,
  bold: true,
  color: COLOR.white,
  align: "center",
  valign: "mid",
  margin: 0
});
addText(slide, pptx, "하나의 MySQL · 5개 Schema", {
  name: tag(REGION.flow, "DataBoundary"),
  x: 1.58,
  y: 4.50,
  w: 2.20,
  h: 0.31,
  shape: "roundRect",
  fill: COLOR.blueSoft,
  line: { color: COLOR.blue, width: 0.8 },
  fontSize: 10,
  bold: true,
  color: COLOR.blue,
  align: "center",
  valign: "mid",
  margin: 0
});
addText(slide, pptx, "REST 동기 · Kafka 비동기", {
  name: tag(REGION.flow, "ContractBoundary"),
  x: 3.94,
  y: 4.50,
  w: 1.98,
  h: 0.31,
  shape: "roundRect",
  fill: COLOR.tealSoft,
  line: { color: COLOR.teal, width: 0.8 },
  fontSize: 10,
  bold: true,
  color: COLOR.teal,
  align: "center",
  valign: "mid",
  margin: 0
});

const principles = [
  { title: "01  책임 응집도 우선", body: "책임·변경주기·장애영향을 기준으로 서비스를 분리", color: COLOR.blue, icon: "target" },
  { title: "02  과도한 분산 방지", body: "불필요한 Microservice와 DB 계층 분리는 지양", color: COLOR.purple, icon: "layers" },
  { title: "03  계약 기반 연계", body: "동기 REST / 비동기 Kafka, 공통 /api/v1 규약 적용", color: COLOR.teal, icon: "link" },
  { title: "04  작업 단위 추적", body: "Job ID로 상태·결과·오류를 서비스 사이에서 일관 관리", color: COLOR.amber, icon: "trace" }
];
principles.forEach((principle, index) => {
  const x = index % 2 === 0 ? 0.65 : 3.83;
  const y = index < 2 ? 5.15 : 7.02;
  addRichCard(slide, pptx, {
    name: tag(REGION.cards, `Principle${index + 1}`),
    title: principle.title,
    body: principle.body,
    x,
    y,
    w: 2.92,
    h: 1.52,
    fill: COLOR.white,
    line: { color: principle.color, width: 0.9 },
    accent: principle.color,
    titleSize: 11,
    bodySize: 10,
    margin: [47, 10, 10, 8],
    valign: "mid"
  });
  addIconBadge(slide, pptx, {
    name: tag(REGION.cards, `Principle${index + 1}`),
    kind: principle.icon,
    color: principle.color,
    x: x + 0.13,
    y: y + 0.48,
    size: 0.48
  });
});

addText(slide, pptx, "경계는 배포 편의가 아니라 책임·변경·장애영향을 기준으로 판단", {
  name: tag(REGION.support, "DecisionRule"),
  x: 1.28,
  y: 8.55,
  w: 4.94,
  h: 0.31,
  shape: "roundRect",
  fill: COLOR.cyanSoft,
  line: { color: COLOR.cyan, width: 0.8 },
  fontSize: 10,
  bold: true,
  color: COLOR.navy,
  align: "center",
  valign: "mid",
  margin: 0
});
addKeyMessage(slide, pptx, "서비스는 응집도 기준으로 분리하고 데이터·호출·추적 규약은 공통 계약으로 통제합니다.");

await writeDeck(pptx, output);
console.log(output);
