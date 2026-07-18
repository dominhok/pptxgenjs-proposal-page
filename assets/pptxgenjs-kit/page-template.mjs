import {
  COLOR,
  REGION,
  addArrow,
  addCard,
  addChrome,
  addIconSvg,
  addPanel,
  addShape,
  addTextShape,
  createProposalDeck,
  tag,
  writeDeck
} from "./proposal-kit.mjs";

const output = process.argv[2] ?? "2-3-1.pptx";
const pptx = createProposalDeck({ title: "전체 기술 아키텍처" });
const slide = pptx.addSlide();
slide.background = { color: COLOR.white };

addChrome(slide, pptx, {
  section: "2.3.1",
  title: "전체 기술 아키텍처",
  subtitle: "민간 AI Agent부터 정부공통 MCP와 개방기관 API까지 이어지는 공공 AI 연계 구조"
});

addTextShape(slide, pptx, "핵심 연계 구조", {
  name: tag(REGION.flow, "Label"),
  x: 0.58,
  y: 1.40,
  w: 1.42,
  h: 0.31,
  shape: "roundRect",
  fill: COLOR.white,
  line: { color: COLOR.line, width: 0.8 },
  fontSize: 12,
  bold: true,
  color: COLOR.navy,
  align: "center",
  valign: "mid",
  margin: 0
});
addPanel(slide, pptx, {
  name: tag(REGION.flow, "Panel"),
  x: 0.42,
  y: 1.76,
  w: 6.66,
  h: 1.94,
  fill: COLOR.panel
});
addTextShape(slide, pptx, "민간 Agent 요청을 정부 MCP Gateway가 인증·정책검사 후 서비스별 MCP Server로 중계", {
  name: tag(REGION.flow, "Banner"),
  x: 0.69,
  y: 1.88,
  w: 5.78,
  h: 0.26,
  shape: "rect",
  fill: COLOR.blueSoft,
  line: { color: COLOR.line, width: 0.6 },
  fontSize: 10,
  bold: true,
  color: COLOR.blue,
  align: "center",
  valign: "mid",
  margin: 0
});

const flowNodes = [
  { title: "민간 AI Agent", body: "요청·Tool 탐색", x: 0.64, fill: COLOR.blueSoft, accent: COLOR.blue, icon: "agent" },
  { title: "정부 MCP Gateway", body: "인증·정책·Routing", x: 2.27, fill: COLOR.purpleSoft, accent: COLOR.purple, icon: "gateway" },
  { title: "서비스별 MCP", body: "Tool·Adapter·검증", x: 3.90, fill: COLOR.tealSoft, accent: COLOR.teal, icon: "server" },
  { title: "DSP·기관 API", body: "암복호화·결과반환", x: 5.53, fill: COLOR.amberSoft, accent: COLOR.amber, icon: "api" }
];

flowNodes.forEach((node, index) => {
  addTextShape(
    slide,
    pptx,
    [
      { text: node.title, options: { bold: true, fontSize: 11, color: COLOR.navy, breakLine: true } },
      { text: node.body, options: { fontSize: 10, color: COLOR.text } }
    ],
    {
      name: tag(REGION.flow, `Node${index + 1}`),
      x: node.x,
      y: 2.30,
      w: 1.28,
      h: 0.72,
      shape: "roundRect",
      fill: node.fill,
      line: { color: node.accent, width: 0.8 },
      fontSize: 10,
      align: "center",
      valign: "mid",
      margin: [5, 5, 4, 27]
    }
  );
  addShape(slide, pptx, {
    name: tag(REGION.flow, `IconBadge${index + 1}`),
    x: node.x + 0.08,
    y: 2.48,
    w: 0.24,
    h: 0.24,
    shape: "ellipse",
    fill: COLOR.white,
    line: { color: node.accent, width: 0.6 }
  });
  addIconSvg(slide, {
    tag: tag(REGION.flow, `Icon${index + 1}`),
    kind: node.icon,
    color: node.accent,
    x: node.x + 0.115,
    y: 2.515,
    w: 0.17,
    h: 0.17
  });
  if (index < flowNodes.length - 1) {
    addArrow(slide, pptx, {
      name: tag(REGION.flow, `Arrow${index + 1}`),
      x: node.x + 1.34,
      y: 2.54,
      w: 0.22,
      h: 0.18,
      fill: COLOR.blue
    });
  }
});

addTextShape(slide, pptx, "A2A PoC", {
  name: tag(REGION.flow, "ExtensionBadge"),
  x: 2.28,
  y: 3.13,
  w: 1.12,
  h: 0.29,
  shape: "roundRect",
  fill: COLOR.green,
  line: "none",
  fontSize: 10,
  bold: true,
  color: COLOR.white,
  align: "center",
  valign: "mid",
  margin: 0
});
addTextShape(slide, pptx, "업무위임·상태공유·결과반환", {
  name: tag(REGION.flow, "ExtensionBand"),
  x: 3.48,
  y: 3.13,
  w: 2.38,
  h: 0.29,
  shape: "roundRect",
  fill: COLOR.greenSoft,
  line: { color: "BFE8CF", width: 0.7 },
  fontSize: 10,
  bold: true,
  color: COLOR.green,
  align: "center",
  valign: "mid",
  margin: 0
});
addTextShape(slide, pptx, "Agent 간 상호운용을 검증하는 확장 연계 경로", {
  name: tag(REGION.flow, "ExtensionNote"),
  x: 1.35,
  y: 3.43,
  w: 4.82,
  h: 0.18,
  shape: "rect",
  fill: "none",
  line: "none",
  fontSize: 10,
  bold: true,
  color: COLOR.green,
  align: "center",
  valign: "mid",
  margin: 0
});

addPanel(slide, pptx, {
  name: tag(REGION.cards, "Panel"),
  x: 0.42,
  y: 3.88,
  w: 6.66,
  h: 4.77,
  fill: COLOR.panel
});
addTextShape(slide, pptx, "아키텍처 구성요소별 역할 이해", {
  name: tag(REGION.cards, "Title"),
  x: 0.62,
  y: 4.06,
  w: 4.10,
  h: 0.40,
  shape: "rect",
  fill: "none",
  line: "none",
  fontSize: 17,
  bold: true,
  color: COLOR.navy,
  valign: "mid",
  margin: 0
});

const cards = [
  {
    title: "이용채널  |  민간 AI Agent",
    body: "• 자연어 요청 분석 및 Tool 탐색\n• MCP 표준으로 Agent·LLM 연계\n• 플랫폼 독립형 공공서비스 호출",
    x: 0.63,
    y: 4.58,
    fill: COLOR.blueSoft,
    accent: COLOR.blue,
    icon: "agent"
  },
  {
    title: "공통통제  |  정부 MCP Gateway",
    body: "• 인증·권한·유량·감사 단일 진입점\n• 정책 기반 MCP Server 안전 중계\n• 외부 Agent 직접 연결 차단",
    x: 3.79,
    y: 4.58,
    fill: COLOR.purpleSoft,
    accent: COLOR.purple,
    icon: "gateway"
  },
  {
    title: "Tool 제공  |  서비스별 MCP Server",
    body: "• 개방 API를 MCP Tool로 변환·검증\n• Adapter 호출과 응답 정규화\n• 장애영향 기준 독립 구성",
    x: 0.63,
    y: 6.56,
    fill: COLOR.tealSoft,
    accent: COLOR.teal,
    icon: "server"
  },
  {
    title: "외부연계  |  DSP·기관 API·A2A",
    body: "• DSP 인증·암복호화 및 API 호출\n• 표준 형식으로 결과 변환·반환\n• A2A Agent 상호운용 검증",
    x: 3.79,
    y: 6.56,
    fill: COLOR.amberSoft,
    accent: COLOR.amber,
    icon: "api"
  }
];

cards.forEach((card, index) => {
  addCard(slide, pptx, {
    name: tag(REGION.cards, `Card${index + 1}`),
    title: card.title,
    body: card.body,
    x: card.x,
    y: card.y,
    w: 2.93,
    h: 1.86,
    fill: card.fill,
    accent: card.accent,
    titleSize: 12,
    bodySize: 10
  });
  addShape(slide, pptx, {
    name: tag(REGION.cards, `Accent${index + 1}`),
    x: card.x,
    y: card.y,
    w: 0.10,
    h: 1.86,
    shape: "rect",
    fill: card.accent,
    line: "none"
  });
  addShape(slide, pptx, {
    name: tag(REGION.cards, `IconBadge${index + 1}`),
    x: card.x + 0.18,
    y: card.y + 0.17,
    w: 0.33,
    h: 0.33,
    shape: "ellipse",
    fill: COLOR.white,
    line: { color: card.accent, width: 0.7 }
  });
  addIconSvg(slide, {
    tag: tag(REGION.cards, `Icon${index + 1}`),
    kind: card.icon,
    color: card.accent,
    x: card.x + 0.235,
    y: card.y + 0.225,
    w: 0.22,
    h: 0.22
  });
});

addTextShape(slide, pptx, "핵심 메시지", {
  name: tag(REGION.message, "Label"),
  x: 0.58,
  y: 8.93,
  w: 1.16,
  h: 0.37,
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
addTextShape(slide, pptx, "민간 AI 요청을 정부공통 Gateway와 서비스별 MCP Server로 통제하고 기관 API·A2A 확장경로까지 일관되게 연계", {
  name: tag(REGION.message, "Band"),
  x: 0.58,
  y: 9.34,
  w: 6.33,
  h: 0.60,
  shape: "roundRect",
  fill: COLOR.navy,
  line: "none",
  fontSize: 12,
  bold: true,
  color: COLOR.white,
  align: "center",
  valign: "mid",
  margin: [4, 8, 4, 8]
});

await writeDeck(pptx, output);
console.log(output);
