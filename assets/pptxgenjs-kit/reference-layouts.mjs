// Verified layout families used as implementation references.
import fs from "node:fs";
import path from "node:path";
import {
  COLOR, REGION, addArrow, addChrome, addIconBadge, addKeyMessage, addLine,
  addPanel, addRichCard, addSectionLabel, addShape, addText,
  createProposalDeck, svgData, tag, writeDeck
} from "./proposal-kit.mjs";

const outDir = path.resolve(process.argv[2] ?? "../draft");
fs.mkdirSync(outDir, { recursive: true });

const softBy = {
  [COLOR.blue]: COLOR.blueSoft,
  [COLOR.purple]: COLOR.purpleSoft,
  [COLOR.teal]: COLOR.tealSoft,
  [COLOR.green]: COLOR.greenSoft,
  [COLOR.amber]: COLOR.amberSoft,
  [COLOR.red]: COLOR.redSoft
};

function baseSlide(meta) {
  const pptx = createProposalDeck({ title: meta.title });
  const slide = pptx.addSlide();
  addChrome(slide, pptx, meta);
  return { pptx, slide };
}

function stageNode(slide, pptx, item, index, options = {}) {
  const x = options.x;
  const y = options.y;
  const w = options.w;
  const h = options.h;
  addText(slide, pptx, item.label, {
    name: tag(REGION.flow, `Stage${index + 1}`), x, y, w, h,
    shape: options.shape ?? "roundRect", fill: item.fill ?? softBy[item.color] ?? COLOR.white,
    line: { color: item.color, width: 0.9 }, fontSize: options.fontSize ?? 10,
    bold: true, color: item.color, align: "center", valign: "mid", margin: [4, 4, 4, 4]
  });
  if (options.number !== false) {
    const number = String(index + 1).padStart(2, "0");
    const badge = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#${item.color}"/><text x="24" y="29" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#FFFFFF">${number}</text></svg>`;
    slide.addImage({
      data: svgData(badge), x: x + 0.07, y: y - 0.12, w: 0.30, h: 0.30,
      objectName: tag(REGION.flow, `StageNo${index + 1}`), altText: tag(REGION.flow, `StageNo${index + 1}`)
    });
  }
}

function addFlowArrow(slide, pptx, x, y, w = 0.22, h = 0.14, color = COLOR.blue, index = 1) {
  addArrow(slide, pptx, { name: tag(REGION.flow, `Arrow${index}`), x, y, w, h, fill: color });
}

async function architecturePage() {
  const meta = {
    chapter: "I", sectionTitle: "제안개요 · 목표시스템", pageNo: 1,
    title: "목표시스템 구성도 및 구성체계",
    subtitle: "업무·AI·지식·데이터·인프라를 계층화하고 공통 통제로 연결하는 KISTI 독자 AI 구조"
  };
  const { pptx, slide } = baseSlide(meta);

  addText(slide, pptx, "독자 파운데이션 모델 기반 공공 R&D AI 시스템", {
    name: tag(REGION.flow, "VisionBand"), x: 0.42, y: 2.18, w: 6.66, h: 0.40,
    shape: "roundRect", fill: COLOR.navy, line: "none", fontSize: 12, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });

  addPanel(slide, pptx, { name: tag(REGION.flow, "HierarchyPanel"), x: 0.42, y: 2.72, w: 6.66, h: 3.78, fill: COLOR.panel });
  addSectionLabel(slide, pptx, "5-Layer Architecture", { name: tag(REGION.flow, "HierarchyLabel"), x: 0.64, y: 2.88, w: 1.55 });

  const layers = [
    { title: "사용자 접점", body: "웹 서비스 · 회의 지원", color: COLOR.blue, icon: "service" },
    { title: "AI 업무 서비스", body: "ETL · Generation · LLM Gateway", color: COLOR.purple, icon: "brain" },
    { title: "지식·문서 처리", body: "DOREA/PDF · HWP/MS Office · STT", color: COLOR.teal, icon: "layers" },
    { title: "데이터 기반", body: "MySQL · MinIO · Milvus · Kafka · Redis", color: COLOR.amber, icon: "database" },
    { title: "인프라 운영", body: "WEB · WAS · GPU · DB · DOREA · IRIS", color: COLOR.navy, icon: "infra" }
  ];
  layers.forEach((item, i) => {
    const y = 3.32 + i * 0.57;
    const x = 0.68 + i * 0.10;
    const w = 3.74 - i * 0.10;
    addRichCard(slide, pptx, {
      name: tag(REGION.flow, `Layer${i + 1}`), title: item.title, body: item.body,
      x, y, w, h: 0.48, shape: "roundRect", fill: softBy[item.color] ?? COLOR.blueSoft,
      line: { color: item.color, width: 0.9 }, accent: item.color,
      titleSize: 10, bodySize: 10, margin: [34, 4, 8, 4], valign: "mid"
    });
    addIconBadge(slide, pptx, { name: tag(REGION.flow, `Layer${i + 1}`), kind: item.icon, color: item.color, x: x + 0.07, y: y + 0.07, size: 0.34 });
  });

  addPanel(slide, pptx, { name: tag(REGION.support, "ControlPanel"), x: 4.72, y: 3.10, w: 2.10, h: 3.04, fill: COLOR.white, line: { color: COLOR.blue, width: 1.0 } });
  addText(slide, pptx, "공통 통제 Spine", {
    name: tag(REGION.support, "ControlTitle"), x: 4.90, y: 3.28, w: 1.74, h: 0.32,
    shape: "roundRect", fill: COLOR.blue, line: "none", fontSize: 10, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  const controls = [
    ["MCP · REST API", "표준 연결"],
    ["Job ID · Trace", "전 구간 추적"],
    ["권한 · 감사", "책임 통제"],
    ["모니터링 · 배포", "운영 일관성"]
  ];
  controls.forEach((c, i) => {
    addText(slide, pptx, `${c[0]}\n${c[1]}`, {
      name: tag(REGION.support, `Control${i + 1}`), x: 4.95, y: 3.77 + i * 0.55, w: 1.64, h: 0.43,
      shape: "roundRect", fill: i % 2 ? COLOR.cyanSoft : COLOR.blueSoft,
      line: { color: i % 2 ? COLOR.cyan : COLOR.blue, width: 0.7 }, fontSize: 10,
      bold: true, color: COLOR.navy, align: "center", valign: "mid", margin: 2
    });
  });
  addLine(slide, pptx, { name: tag(REGION.support, "SpineLine"), x: 4.54, y: 3.42, w: 0, h: 2.42, color: COLOR.blue, width: 2.2 });
  layers.forEach((_, i) => addLine(slide, pptx, { name: tag(REGION.support, `LayerLink${i + 1}`), x: 4.22 - i * 0.10, y: 3.56 + i * 0.57, w: 0.31 + i * 0.10, h: 0, color: COLOR.line, width: 1.2, endArrowType: "triangle" }));

  const capability = [
    { title: "업무 서비스", body: "사전컨설팅·심의·조정안 작성 흐름을 사용자 관점으로 통합", color: COLOR.blue, icon: "service" },
    { title: "AI 오케스트레이션", body: "문서·회의·검색·생성을 역할별 서비스로 분리하고 유연하게 확장", color: COLOR.purple, icon: "brain" },
    { title: "KISTI 인프라", body: "DOREA·IRIS·GPU·DB 자원을 데이터·보안 정책 안에서 안정 운영", color: COLOR.teal, icon: "infra" }
  ];
  capability.forEach((c, i) => {
    const x = 0.42 + i * 2.25;
    addRichCard(slide, pptx, {
      name: tag(REGION.cards, `Capability${i + 1}`), title: c.title, body: c.body,
      x, y: 6.72, w: 2.16, h: 2.18, fill: softBy[c.color], line: { color: c.color, width: 0.9 },
      accent: c.color, titleSize: 12, bodySize: 10, margin: [11, 12, 48, 9]
    });
    addIconBadge(slide, pptx, { name: tag(REGION.cards, `Capability${i + 1}`), kind: c.icon, color: c.color, x: x + 1.43, y: 6.90, size: 0.54 });
  });
  addKeyMessage(slide, pptx, "서비스 책임은 분리하되 Job ID·Trace·권한·감사정보는 전 계층에서 일관되게 연결합니다.");
  return { pptx, file: "I-2-8.pptx" };
}

async function boundaryPage() {
  const meta = {
    chapter: "II", sectionTitle: "기술 및 기능 · 설계원칙", pageNo: 2,
    title: "공통 설계원칙 및 서비스 경계",
    subtitle: "책임 응집도와 변경주기를 기준으로 실용적인 서비스 경계를 정의하고 연계 계약을 표준화"
  };
  const { pptx, slide } = baseSlide(meta);
  addSectionLabel(slide, pptx, "Backend Service Chain", { name: tag(REGION.flow, "ChainLabel"), x: 0.42, y: 2.18, w: 1.58 });
  const services = [
    { label: "Service", color: COLOR.blue }, { label: "Meeting", color: COLOR.teal },
    { label: "ETL", color: COLOR.amber }, { label: "Generation", color: COLOR.purple },
    { label: "LLM Gateway", color: COLOR.green }
  ];
  services.forEach((s, i) => {
    const x = 0.44 + i * 1.34;
    stageNode(slide, pptx, s, i, { x, y: 2.62, w: 1.12, h: 0.70, fontSize: 10 });
    if (i < services.length - 1) addFlowArrow(slide, pptx, x + 1.14, 2.89, 0.17, 0.13, COLOR.blue, i + 1);
  });

  addPanel(slide, pptx, { name: tag(REGION.flow, "BoundaryFrame"), x: 0.42, y: 3.56, w: 6.66, h: 5.38, fill: COLOR.panel });
  addText(slide, pptx, "실용적 서비스 경계", {
    name: tag(REGION.flow, "BoundaryHub"), x: 2.17, y: 3.79, w: 3.16, h: 0.66,
    shape: "roundRect", fill: COLOR.navy, line: "none", fontSize: 14, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  addText(slide, pptx, "하나의 MySQL · 5개 Schema", {
    name: tag(REGION.flow, "DataBoundary"), x: 1.58, y: 4.50, w: 2.20, h: 0.31,
    shape: "roundRect", fill: COLOR.blueSoft, line: { color: COLOR.blue, width: 0.8 },
    fontSize: 10, bold: true, color: COLOR.blue, align: "center", valign: "mid", margin: 0
  });
  addText(slide, pptx, "REST 동기 · Kafka 비동기", {
    name: tag(REGION.flow, "ContractBoundary"), x: 3.94, y: 4.50, w: 1.98, h: 0.31,
    shape: "roundRect", fill: COLOR.tealSoft, line: { color: COLOR.teal, width: 0.8 },
    fontSize: 10, bold: true, color: COLOR.teal, align: "center", valign: "mid", margin: 0
  });

  const principles = [
    { title: "01  책임 응집도 우선", body: "책임·변경주기·장애영향을 기준으로 서비스를 분리", color: COLOR.blue, icon: "target" },
    { title: "02  과도한 분산 방지", body: "불필요한 Microservice와 DB 계층 분리는 지양", color: COLOR.purple, icon: "layers" },
    { title: "03  계약 기반 연계", body: "동기 REST / 비동기 Kafka, 공통 /api/v1 규약 적용", color: COLOR.teal, icon: "link" },
    { title: "04  작업 단위 추적", body: "Job ID로 상태·결과·오류를 서비스 사이에서 일관 관리", color: COLOR.amber, icon: "trace" }
  ];
  principles.forEach((p, i) => {
    const x = i % 2 === 0 ? 0.65 : 3.83;
    const y = i < 2 ? 5.15 : 7.02;
    addRichCard(slide, pptx, {
      name: tag(REGION.cards, `Principle${i + 1}`), title: p.title, body: p.body,
      x, y, w: 2.92, h: 1.52, fill: COLOR.white, line: { color: p.color, width: 0.9 },
      accent: p.color, titleSize: 11, bodySize: 10, margin: [47, 10, 10, 8], valign: "mid"
    });
    addIconBadge(slide, pptx, { name: tag(REGION.cards, `Principle${i + 1}`), kind: p.icon, color: p.color, x: x + 0.13, y: y + 0.48, size: 0.48 });
  });
  addText(slide, pptx, "경계는 배포 편의가 아니라 책임·변경·장애영향을 기준으로 판단", {
    name: tag(REGION.support, "DecisionRule"), x: 1.28, y: 8.55, w: 4.94, h: 0.31,
    shape: "roundRect", fill: COLOR.cyanSoft, line: { color: COLOR.cyan, width: 0.8 },
    fontSize: 10, bold: true, color: COLOR.navy, align: "center", valign: "mid", margin: 0
  });
  addKeyMessage(slide, pptx, "서비스는 응집도 기준으로 분리하고 데이터·호출·추적 규약은 공통 계약으로 통제합니다.");
  return { pptx, file: "II-1-2.pptx" };
}

async function reviewWorkflowPage() {
  const meta = {
    chapter: "I", sectionTitle: "제안개요 · 업무이해", pageNo: 3,
    title: "예산심의 업무 프로세스와 AI 적용범위",
    subtitle: "사전컨설팅부터 조정안 작성까지 단계별 AI 지원과 전문가 검토를 연결하는 누적형 업무 흐름"
  };
  const { pptx, slide } = baseSlide(meta);
  addSectionLabel(slide, pptx, "End-to-End Review Pipeline", { name: tag(REGION.flow, "PipelineLabel"), x: 0.42, y: 2.18, w: 1.88 });

  addPanel(slide, pptx, { name: tag(REGION.flow, "SourcePanel"), x: 0.42, y: 2.58, w: 1.10, h: 1.18, fill: COLOR.panel });
  addIconBadge(slide, pptx, { name: tag(REGION.flow, "SourceDocs"), kind: "document", color: COLOR.blue, x: 0.56, y: 2.75, size: 0.36 });
  addIconBadge(slide, pptx, { name: tag(REGION.flow, "SourceMeeting"), kind: "meeting", color: COLOR.teal, x: 1.00, y: 2.75, size: 0.36 });
  addText(slide, pptx, "사업자료 + 회의기록", { name: tag(REGION.flow, "SourceText"), x: 0.52, y: 3.24, w: 0.90, h: 0.30, fontSize: 10, bold: true, color: COLOR.navy, align: "center", valign: "mid" });

  const steps = [
    { label: "사전\n컨설팅", color: COLOR.blue }, { label: "사업\n설명회", color: COLOR.teal },
    { label: "전문위원\n검토", color: COLOR.purple }, { label: "심의서\n작성", color: COLOR.amber },
    { label: "조정안\n작성", color: COLOR.green }
  ];
  steps.forEach((s, i) => {
    const x = 1.72 + i * 1.07;
    stageNode(slide, pptx, s, i, { x, y: 2.69, w: 0.89, h: 0.86, fontSize: 10 });
    if (i < 4) addFlowArrow(slide, pptx, x + 0.90, 3.04, 0.14, 0.12, COLOR.blue, i + 1);
  });
  addText(slide, pptx, "AI 초안·요약·근거 탐색  +  전문가 판단·승인", {
    name: tag(REGION.flow, "HumanAIBar"), x: 0.42, y: 3.92, w: 6.66, h: 0.47,
    shape: "roundRect", fill: COLOR.navy, line: "none", fontSize: 12, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });

  const scopes = [
    { title: "준비 · 사전컨설팅/설명회", body: "자료 수집·질의 구조화·회의기록 정리\nFUR-003~020", color: COLOR.blue, icon: "meeting" },
    { title: "검토 · 전문위원 지원", body: "검토 쟁점·근거 탐색·질의응답 지원\nFUR-021~023", color: COLOR.purple, icon: "search" },
    { title: "작성 · 심의서 초안", body: "누적 검토결과를 활용한 심의서 작성 지원\nFUR-024~025", color: COLOR.amber, icon: "document" },
    { title: "조정 · 조정안 완성", body: "심의 결과와 근거를 반영한 조정안 작성\nFUR-031~032", color: COLOR.green, icon: "approve" }
  ];
  scopes.forEach((s, i) => {
    const x = i % 2 === 0 ? 0.42 : 3.83;
    const y = i < 2 ? 4.65 : 6.45;
    addRichCard(slide, pptx, {
      name: tag(REGION.cards, `Scope${i + 1}`), title: s.title, body: s.body,
      x, y, w: 3.25, h: 1.55, fill: softBy[s.color], line: { color: s.color, width: 0.9 },
      accent: s.color, titleSize: 11, bodySize: 10, margin: [50, 10, 10, 8], valign: "mid"
    });
    addIconBadge(slide, pptx, { name: tag(REGION.cards, `Scope${i + 1}`), kind: s.icon, color: s.color, x: x + 0.14, y: y + 0.50, size: 0.50 });
  });
  addText(slide, pptx, "단계별 산출물 Carry-forward", {
    name: tag(REGION.support, "CarryLabel"), x: 0.42, y: 8.22, w: 1.68, h: 0.50,
    shape: "roundRect", fill: COLOR.blue, line: "none", fontSize: 10, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  addText(slide, pptx, "이전 단계의 자료·회의·검토 결과를 다음 단계가 그대로 이어받아 중복 입력과 판단 단절을 최소화", {
    name: tag(REGION.support, "CarryBand"), x: 2.18, y: 8.22, w: 4.90, h: 0.50,
    shape: "roundRect", fill: COLOR.blueSoft, line: { color: COLOR.blue, width: 0.8 },
    fontSize: 10, bold: true, color: COLOR.navy, align: "center", valign: "mid", margin: 4
  });
  addKeyMessage(slide, pptx, "AI는 단계별 초안과 근거를 제공하고, 전문가는 검토·판단·승인을 통해 예산심의 책임성을 유지합니다.");
  return { pptx, file: "I-2-2.pptx" };
}

async function deliverablePage() {
  const meta = {
    chapter: "II", sectionTitle: "사업관리 · 산출물", pageNo: 5,
    title: "산출물 제출시기 및 제출체계",
    subtitle: "작성부터 공식제출까지 검토·보완·기준선을 통과하는 산출물 라이프사이클과 최종 인계 패키지"
  };
  const { pptx, slide } = baseSlide(meta);
  addSectionLabel(slide, pptx, "Deliverable Lifecycle", { name: tag(REGION.flow, "LifecycleLabel"), x: 0.42, y: 2.18, w: 1.72 });
  const phases = [
    { label: "작성·자체점검", color: COLOR.blue }, { label: "기술·PM 검토", color: COLOR.purple },
    { label: "KISTI 검토", color: COLOR.teal }, { label: "보완·기준선", color: COLOR.amber },
    { label: "공식제출", color: COLOR.green }
  ];
  phases.forEach((p, i) => {
    const x = 0.44 + i * 1.34;
    stageNode(slide, pptx, p, i, { x, y: 2.60, w: 1.13, h: 0.72, fontSize: 10 });
    if (i < 4) addFlowArrow(slide, pptx, x + 1.15, 2.88, 0.16, 0.13, COLOR.blue, i + 1);
  });
  addText(slide, pptx, "단계별 산출물 패키지", {
    name: tag(REGION.cards, "PackageTitle"), x: 0.42, y: 3.58, w: 6.66, h: 0.42,
    shape: "roundRect", fill: COLOR.navy, line: "none", fontSize: 12, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  const packages = [
    { title: "01  계획·설계", body: "수행계획 · 요구사항 · 아키텍처 · 상세설계", color: COLOR.blue },
    { title: "02  구현·배포", body: "소스코드 · 빌드/배포 · DB Migration · 컨테이너/Helm", color: COLOR.purple },
    { title: "03  시험·품질", body: "단위/통합/성능/보안/UAT 결과 · 결함조치 이력", color: COLOR.teal },
    { title: "04  운영·교육", body: "운영·사용자 매뉴얼 · 교육자료 · 설정/버전 정보", color: COLOR.amber }
  ];
  packages.forEach((p, i) => {
    const x = i % 2 === 0 ? 0.42 : 3.83;
    const y = i < 2 ? 4.25 : 6.03;
    addRichCard(slide, pptx, {
      name: tag(REGION.cards, `Package${i + 1}`), title: p.title, body: p.body,
      x, y, w: 3.25, h: 1.50, fill: softBy[p.color], line: { color: p.color, width: 0.9 },
      accent: p.color, titleSize: 11, bodySize: 10, margin: [50, 11, 11, 9], valign: "mid"
    });
    addIconBadge(slide, pptx, { name: tag(REGION.cards, `Package${i + 1}`), kind: "folder", color: p.color, x: x + 0.14, y: y + 0.49, size: 0.50 });
  });
  addRichCard(slide, pptx, {
    name: tag(REGION.cards, "FinalPackage"), title: "05  최종 인계 패키지",
    body: "문서·소스·배포자산·시험증거·매뉴얼·교육자료·라이선스·EA 정보를 하나의 버전 기준으로 정합화",
    x: 0.42, y: 7.80, w: 6.66, h: 1.14, fill: COLOR.greenSoft, line: { color: COLOR.green, width: 1.0 },
    accent: COLOR.green, titleSize: 12, bodySize: 10, margin: [58, 10, 12, 8], valign: "mid"
  });
  addIconBadge(slide, pptx, { name: tag(REGION.cards, "FinalPackage"), kind: "approve", color: COLOR.green, x: 0.58, y: 8.13, size: 0.52 });
  addKeyMessage(slide, pptx, "모든 산출물은 검토·보완·기준선 절차를 거쳐 동일 버전의 최종 인계 패키지로 공식 제출합니다.");
  return { pptx, file: "II-2-10.pptx" };
}

async function testGatePage() {
  const meta = {
    chapter: "IV", sectionTitle: "시험 및 품질 · 시험절차", pageNo: 6,
    title: "단계별 시험절차·일정 및 완료기준",
    subtitle: "M1~M6 일정에 맞춰 기술·통합·성능/보안/UAT Gate를 통과한 기능만 릴리스 기준선으로 승격"
  };
  const { pptx, slide } = baseSlide(meta);
  addSectionLabel(slide, pptx, "M1 — M6 Stage Gate", { name: tag(REGION.flow, "GateLabel"), x: 0.42, y: 2.18, w: 1.72 });
  const months = ["M1", "M2", "M3", "M4", "M5", "M6"];
  months.forEach((m, i) => addText(slide, pptx, m, {
    name: tag(REGION.flow, `Month${i + 1}`), x: 0.42 + i * 1.12, y: 2.60, w: 1.00, h: 0.42,
    shape: "roundRect", fill: i < 2 ? COLOR.blueSoft : i < 4 ? COLOR.purpleSoft : COLOR.tealSoft,
    line: { color: i < 2 ? COLOR.blue : i < 4 ? COLOR.purple : COLOR.teal, width: 0.8 },
    fontSize: 10, bold: true, color: COLOR.navy, align: "center", valign: "mid", margin: 0
  }));

  const gates = [
    { no: "01", title: "기술·단위 시험", body: "기능별 구현 적합성 · 단위결과 · 코드 수준 결함 제거", color: COLOR.blue, icon: "code", pass: "단위 PASS" },
    { no: "02", title: "통합 시험", body: "서비스·데이터·API 연계 · 오류경로 · 회귀 영향 검증", color: COLOR.purple, icon: "link", pass: "통합 PASS" },
    { no: "03", title: "성능·보안·UAT", body: "응답성·부하·취약점·사용자 수용성 및 운영준비 검증", color: COLOR.teal, icon: "test", pass: "최종 PASS" }
  ];
  gates.forEach((g, i) => {
    const y = 3.33 + i * 1.55;
    addText(slide, pptx, g.no, {
      name: tag(REGION.flow, `GateNo${i + 1}`), x: 0.42, y, w: 0.72, h: 1.18,
      shape: "roundRect", fill: g.color, line: "none", fontSize: 16, bold: true,
      color: COLOR.white, align: "center", valign: "mid", margin: 0
    });
    addRichCard(slide, pptx, {
      name: tag(REGION.flow, `Gate${i + 1}`), title: g.title, body: g.body,
      x: 1.26, y, w: 4.52, h: 1.18, fill: softBy[g.color], line: { color: g.color, width: 0.9 },
      accent: g.color, titleSize: 12, bodySize: 10, margin: [52, 10, 10, 8], valign: "mid"
    });
    addIconBadge(slide, pptx, { name: tag(REGION.flow, `Gate${i + 1}`), kind: g.icon, color: g.color, x: 1.42, y: y + 0.34, size: 0.50 });
    addText(slide, pptx, g.pass, {
      name: tag(REGION.flow, `Pass${i + 1}`), x: 5.95, y: y + 0.30, w: 1.13, h: 0.58,
      shape: "roundRect", fill: COLOR.green, line: "none", fontSize: 10, bold: true,
      color: COLOR.white, align: "center", valign: "mid", margin: 0
    });
    if (i < 2) addLine(slide, pptx, { name: tag(REGION.flow, `GateLink${i + 1}`), x: 0.78, y: y + 1.18, w: 0, h: 0.37, color: COLOR.line, width: 2.0, endArrowType: "triangle" });
  });

  addText(slide, pptx, "결함 등급", {
    name: tag(REGION.support, "DefectLabel"), x: 0.42, y: 8.03, w: 1.12, h: 0.38,
    shape: "roundRect", fill: COLOR.navy, line: "none", fontSize: 10, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  const defects = [
    { label: "Critical · 즉시 차단", color: COLOR.red },
    { label: "Major · 조치 후 재시험", color: COLOR.amber },
    { label: "Minor · 계획 조치", color: COLOR.blue }
  ];
  defects.forEach((d, i) => addText(slide, pptx, d.label, {
    name: tag(REGION.support, `Defect${i + 1}`), x: 1.68 + i * 1.76, y: 8.03, w: 1.60, h: 0.38,
    shape: "roundRect", fill: softBy[d.color], line: { color: d.color, width: 0.8 }, fontSize: 10,
    bold: true, color: d.color, align: "center", valign: "mid", margin: 0
  }));
  addText(slide, pptx, "PASS + 회귀검증 완료 기능만 Release Baseline 반영", {
    name: tag(REGION.support, "ReleaseRule"), x: 0.42, y: 8.58, w: 6.66, h: 0.42,
    shape: "roundRect", fill: COLOR.greenSoft, line: { color: COLOR.green, width: 0.9 },
    fontSize: 11, bold: true, color: COLOR.green, align: "center", valign: "mid", margin: 0
  });
  addKeyMessage(slide, pptx, "시험 Gate 통과와 회귀검증이 모두 확인된 기능만 릴리스 기준선에 반영하여 결함 전파를 차단합니다.");
  return { pptx, file: "IV-1-2.pptx" };
}

async function incidentPage() {
  const meta = {
    chapter: "IV", sectionTitle: "운영지원 · 장애대응", pageNo: 7,
    title: "장애처리절차 및 등급별 지원방안",
    subtitle: "접수부터 사후조치까지 8단계 처리흐름과 L1~L4 등급·복구/출동 SLA를 결합한 운영지원 체계"
  };
  const { pptx, slide } = baseSlide(meta);
  addPanel(slide, pptx, { name: tag(REGION.flow, "ProcessPanel"), x: 0.42, y: 2.22, w: 4.12, h: 6.72, fill: COLOR.panel });
  addSectionLabel(slide, pptx, "8-Step Incident Route", { name: tag(REGION.flow, "IncidentLabel"), x: 0.64, y: 2.44, w: 1.66 });
  const process = ["접수", "분류", "초동조치", "원인분석", "근본조치", "시험·배포", "완료확인", "사후조치"];
  const coords = [
    [0.66, 2.96], [2.58, 2.96], [2.58, 4.16], [0.66, 4.16],
    [0.66, 5.36], [2.58, 5.36], [2.58, 6.56], [0.66, 6.56]
  ];
  process.forEach((p, i) => {
    const [x, y] = coords[i];
    const color = i < 2 ? COLOR.blue : i < 4 ? COLOR.purple : i < 6 ? COLOR.teal : COLOR.green;
    addText(slide, pptx, `${String(i + 1).padStart(2, "0")}  ${p}`, {
      name: tag(REGION.flow, `IncidentStep${i + 1}`), x, y, w: 1.58, h: 0.78,
      shape: "roundRect", fill: softBy[color], line: { color, width: 0.9 }, fontSize: 11,
      bold: true, color, align: "center", valign: "mid", margin: 0
    });
    if (i < process.length - 1) {
      const [nx, ny] = coords[i + 1];
      if (y === ny) addFlowArrow(slide, pptx, Math.min(x, nx) + 1.62, y + 0.31, 0.26, 0.15, COLOR.blue, i + 1);
      else addLine(slide, pptx, { name: tag(REGION.flow, `RouteLink${i + 1}`), x: i % 4 === 1 ? 3.37 : 1.45, y: y + 0.78, w: 0, h: 0.42, color: COLOR.blue, width: 1.5, endArrowType: "triangle" });
    }
  });
  addText(slide, pptx, "보안사고는 등급과 무관하게 즉시 보고·확산 통제", {
    name: tag(REGION.support, "SecurityRule"), x: 0.66, y: 7.86, w: 3.64, h: 0.54,
    shape: "roundRect", fill: COLOR.redSoft, line: { color: COLOR.red, width: 0.9 },
    fontSize: 10, bold: true, color: COLOR.red, align: "center", valign: "mid", margin: 4
  });

  addPanel(slide, pptx, { name: tag(REGION.cards, "SupportPanel"), x: 4.76, y: 2.22, w: 2.32, h: 6.72, fill: COLOR.white, line: { color: COLOR.navy, width: 0.9 } });
  addText(slide, pptx, "등급별 지원", {
    name: tag(REGION.cards, "SupportTitle"), x: 5.05, y: 2.48, w: 1.74, h: 0.38,
    shape: "roundRect", fill: COLOR.navy, line: "none", fontSize: 11, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  const levels = [
    { label: "L1  긴급", color: COLOR.red }, { label: "L2  중대", color: COLOR.amber },
    { label: "L3  일반", color: COLOR.blue }, { label: "L4  문의", color: COLOR.teal }
  ];
  levels.forEach((l, i) => addText(slide, pptx, l.label, {
    name: tag(REGION.cards, `Level${i + 1}`), x: 5.05, y: 3.12 + i * 0.62, w: 1.74, h: 0.46,
    shape: "roundRect", fill: softBy[l.color], line: { color: l.color, width: 0.8 },
    fontSize: 10, bold: true, color: l.color, align: "center", valign: "mid", margin: 0
  }));
  const sla = [
    { value: "4h", label: "원격 복구 목표", color: COLOR.blue, icon: "clock" },
    { value: "72h", label: "필요 시 출동", color: COLOR.purple, icon: "route" },
    { value: "48h", label: "현장 조치 목표", color: COLOR.teal, icon: "wrench" }
  ];
  sla.forEach((s, i) => {
    const y = 5.78 + i * 0.94;
    addRichCard(slide, pptx, {
      name: tag(REGION.cards, `SLA${i + 1}`), title: s.value, body: s.label,
      x: 5.05, y, w: 1.74, h: 0.78, fill: softBy[s.color], line: { color: s.color, width: 0.8 },
      accent: s.color, titleSize: 14, bodySize: 10, margin: [43, 4, 5, 4], valign: "mid"
    });
    addIconBadge(slide, pptx, { name: tag(REGION.cards, `SLA${i + 1}`), kind: s.icon, color: s.color, x: 5.13, y: y + 0.20, size: 0.38 });
  });
  addKeyMessage(slide, pptx, "장애 등급별 대응속도를 명확히 하고, 보안사고는 즉시 보고하며 복구·출동·현장조치 이력을 추적합니다.");
  return { pptx, file: "IV-3-2.pptx" };
}

async function qualityPage() {
  const meta = {
    chapter: "III", sectionTitle: "품질보증 · 실행증거", pageNo: 8,
    title: "품질보증방안 및 증거 기반 Quality Gate",
    subtitle: "외부 인증 보유를 전제하지 않고 추적성·검토·시험·결함·승인 기록으로 품질을 입증하는 실행체계"
  };
  const { pptx, slide } = baseSlide(meta);
  addText(slide, pptx, "외부 인증이 아니라 프로젝트 실행 증거로 품질을 입증", {
    name: tag(REGION.support, "Disclosure"), x: 0.42, y: 2.18, w: 6.66, h: 0.38,
    shape: "roundRect", fill: COLOR.amberSoft, line: { color: COLOR.amber, width: 0.8 },
    fontSize: 10, bold: true, color: COLOR.navy, align: "center", valign: "mid", margin: 0
  });
  const lifecycle = [
    { label: "분석", color: COLOR.blue }, { label: "설계", color: COLOR.purple },
    { label: "구현", color: COLOR.teal }, { label: "시험", color: COLOR.amber },
    { label: "전환", color: COLOR.green }
  ];
  lifecycle.forEach((s, i) => {
    const x = 0.44 + i * 1.34;
    stageNode(slide, pptx, s, i, { x, y: 2.86, w: 1.13, h: 0.58, fontSize: 10, number: false });
    if (i < 4) addFlowArrow(slide, pptx, x + 1.15, 3.08, 0.16, 0.13, COLOR.blue, i + 1);
  });

  addPanel(slide, pptx, { name: tag(REGION.flow, "EvidencePanel"), x: 0.42, y: 3.72, w: 6.66, h: 5.22, fill: COLOR.panel });
  addText(slide, pptx, "품질보증\n증거 허브", {
    name: tag(REGION.flow, "QualityHub"), x: 2.68, y: 4.70, w: 2.14, h: 2.38,
    shape: "roundRect", fill: COLOR.navy, line: "none", fontSize: 16, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  addIconBadge(slide, pptx, { name: tag(REGION.flow, "QualityHub"), kind: "quality", color: COLOR.white, fill: COLOR.blue, x: 3.37, y: 5.94, size: 0.76 });
  addText(slide, pptx, "Traceability", {
    name: tag(REGION.flow, "TraceLabel"), x: 0.68, y: 4.03, w: 1.72, h: 0.34,
    shape: "roundRect", fill: COLOR.blue, line: "none", fontSize: 10, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  addText(slide, pptx, "Approval", {
    name: tag(REGION.flow, "ApprovalLabel"), x: 5.10, y: 4.03, w: 1.72, h: 0.34,
    shape: "roundRect", fill: COLOR.green, line: "none", fontSize: 10, bold: true,
    color: COLOR.white, align: "center", valign: "mid", margin: 0
  });
  const left = [
    { title: "계획·추적", body: "품질계획 · 요구↔설계↔코드↔시험 연결", color: COLOR.blue, icon: "trace" },
    { title: "검토·시험", body: "단계별 검토기록 · 시험결과 · 객관적 증거", color: COLOR.purple, icon: "test" },
    { title: "결함 이력", body: "등급·조치·재시험 · 잔여위험 기록", color: COLOR.amber, icon: "alert" }
  ];
  const right = [
    { title: "Gate 판정", body: "진입·완료 기준 충족 여부 확인", color: COLOR.teal, icon: "shield" },
    { title: "시정·재시험", body: "부적합 원인 제거 후 동일 기준 재검증", color: COLOR.purple, icon: "cycle" },
    { title: "승인·기준선", body: "PM·KISTI 승인 후 산출물 기준선 확정", color: COLOR.green, icon: "approve" }
  ];
  left.forEach((c, i) => {
    const y = 4.60 + i * 1.25;
    addRichCard(slide, pptx, {
      name: tag(REGION.cards, `EvidenceIn${i + 1}`), title: c.title, body: c.body,
      x: 0.66, y, w: 1.80, h: 1.02, fill: COLOR.white, line: { color: c.color, width: 0.8 },
      accent: c.color, titleSize: 10, bodySize: 10, margin: [38, 5, 5, 4], valign: "mid"
    });
    addIconBadge(slide, pptx, { name: tag(REGION.cards, `EvidenceIn${i + 1}`), kind: c.icon, color: c.color, x: 0.73, y: y + 0.31, size: 0.36 });
    addLine(slide, pptx, { name: tag(REGION.flow, `EvidenceInLink${i + 1}`), x: 2.46, y: y + 0.51, w: 0.22, h: 0, color: c.color, width: 1.3, endArrowType: "triangle" });
  });
  right.forEach((c, i) => {
    const y = 4.60 + i * 1.25;
    addRichCard(slide, pptx, {
      name: tag(REGION.cards, `EvidenceOut${i + 1}`), title: c.title, body: c.body,
      x: 5.04, y, w: 1.80, h: 1.02, fill: COLOR.white, line: { color: c.color, width: 0.8 },
      accent: c.color, titleSize: 10, bodySize: 10, margin: [38, 5, 5, 4], valign: "mid"
    });
    addIconBadge(slide, pptx, { name: tag(REGION.cards, `EvidenceOut${i + 1}`), kind: c.icon, color: c.color, x: 5.11, y: y + 0.31, size: 0.36 });
    addLine(slide, pptx, { name: tag(REGION.flow, `EvidenceOutLink${i + 1}`), x: 4.82, y: y + 0.51, w: 0.22, h: 0, color: c.color, width: 1.3, endArrowType: "triangle" });
  });
  addKeyMessage(slide, pptx, "요구사항 추적부터 승인·기준선까지 모든 품질 판단을 검토·시험·결함 이력이라는 실행 증거로 남깁니다.");
  return { pptx, file: "III-2-1.pptx" };
}

const builders = [architecturePage, boundaryPage, reviewWorkflowPage, deliverablePage, testGatePage, incidentPage, qualityPage];
const written = [];
for (const build of builders) {
  if (process.env.SAMPLE_ONLY && build.name !== process.env.SAMPLE_ONLY) continue;
  const { pptx, file } = await build();
  const outputPath = path.join(outDir, file);
  await writeDeck(pptx, outputPath);
  written.push(outputPath);
  console.log(outputPath);
}

console.log(`WROTE ${written.length} FILES`);
