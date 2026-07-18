# Reference-led proposal patterns

## 사용 시점

통합 제안서의 여러 우수 장표를 한 톤으로 묶으면서 본문 골격은 내용 관계에 따라 달리해야 할 때 사용한다. 아래 예시는 21·27·42·52 장표 계보를 KISTI 제안서 내용으로 재구성하고 native PowerPoint 렌더·OfficeCLI·layout lint를 통과한 결과다.

## 공통 시각 문법

- A4 세로, Pretendard, 네이비 `0B2E5B`, 블루 `2563EB`, 틸·퍼플·앰버를 의미색으로 사용한다.
- 상단은 각진 Chapter 블록, 파란 section ribbon, 작은 프로젝트 ribbon으로 구성한다.
- 본문 제목은 20~22pt, section ribbon은 14pt, Chapter code는 20pt로 고정해 승인 예시의 계층을 유지한다.
- 제목 아래에는 한 개의 주 시각구조만 둔다.
- 하단에는 파란 `핵심 메시지` 라벨과 네이비 결론 밴드를 모든 페이지에 공통 적용한다.
- 푸터는 네이비·블루·시안 사선 띠와 페이지 번호로 통일한다.
- 옅은 패널, 0.8~1.0pt 의미색 테두리, 선형 SVG 아이콘, 10pt 이상 정수 글자 크기를 유지한다.

## 다섯 기준 장표의 역할

| 참조 | 유지할 문법 | 업그레이드 방향 | 검증 예시 |
|---|---|---|---|
| 21p | 계층형 스택, 우측 통제영역, 하단 역량 묶음 | 계층 책임과 공통 Trace spine을 분리 | `pptx/I-2-8.pptx` |
| 27p | 상단 기본 흐름, 중앙 프레임, 2×2 원칙, 핵심 메시지 | 번호 배지·데이터/연계 계약을 명시 | `pptx/II-1-2.pptx` |
| 42p | 입력→파이프라인→근거카드, 운영효과 | AI 보조와 전문가 승인, 산출물 carry-forward | `pptx/I-2-2.pptx` |
| 52p | 상단 단계 흐름, 4+1 산출물 구성 | 검토·기준선·공식제출 Gate를 강조 | `pptx/II-2-10.pptx` |

## 확장 레이아웃

| 관계 | 레이아웃 | 검증 예시 |
|---|---|---|
| 시험과 완료기준 | 3단 Stage Gate + PASS + 결함등급 | `pptx/IV-1-2.pptx` |
| 장애처리와 SLA | 8단 zigzag route + L1~L4 + 4h/72h/48h | `pptx/IV-3-2.pptx` |
| 품질 실행증거 | lifecycle + 중앙 증거허브 + Traceability/Approval | `pptx/III-2-1.pptx` |
| 구현·운영 경험 입증 | 6단 serpentine 흐름 + 실제 화면 증거 2개 | `pptx/I-1-3.pptx` |

예시 PPTX와 렌더 경로는 `assets/examples/reference-led-kisti/` 기준이다. 전체 렌더는 `previews/`에서 보고, 좌표와 objectName 구현은 `assets/pptxgenjs-kit/reference-layouts.mjs`에서 확인한다. 화면 증거 원본은 `assets/pptxgenjs-kit/reference-media/`에 있으며 scaffold에도 함께 복사된다. 새 작업은 `scripts/scaffold-page.ps1`로 시작하며, 복사된 `page-template.mjs`와 `reference-layouts.mjs`를 사용한다.

## 배치 라우팅 규칙

1. 먼저 절별 핵심 관계를 계층·흐름·반복·산출물·통제·시험으로 분류한다.
2. 6장 이상이면 최소 세 계열을 사용하고, 제목을 가려도 본문 실루엣이 구분되게 한다.
3. 27p 계보의 2×2 기본형은 설계원칙·범위·성공요인처럼 병렬 판단에만 사용한다.
4. 42p 계보는 입력과 누적 산출물이 다음 단계로 전달되는 경우에만 사용한다.
5. 모든 페이지의 결론은 원문에서 추출한 한 문장으로 작성하고 단독 마침표·짧은 고립 행을 금지한다.
6. 구현 경험을 입증하는 페이지는 장식용 이미지 대신 원문에 포함된 실제 화면을 사용하고, 절차·통제·화면 증거가 한 읽기 경로로 이어지게 한다.

## 구현·검수 주의사항

- PptxGenJS 4.0.1의 네 값 margin 순서는 `[left, top, right, bottom]`이다.
- 단계 번호가 카드 위에 겹치면 text-text overlap으로 잡힌다. 작은 번호 배지는 SVG picture로 만들거나 카드 내부 텍스트에 통합한다.
- 반투명 순환 도형을 큰 카드처럼 채우면 린터가 컨테이너로 오인할 수 있다. 투명 outline ring과 별도 화살촉을 선호한다.
- Chapter 블록과 section ribbon은 경계만 맞대고 20% 이상 겹치지 않는다.
- proofreader wrapper는 설치된 linter의 `--help`를 읽어 선택 옵션 지원 여부를 감지해야 한다.
- 전체 렌더에서 통과해도 카드 sheet를 확인한다. 특히 아이콘-제목 간격, 2줄 보조 바, 마침표 고립을 직접 검토한다.
- 화면 캡처는 핵심 내용을 식별할 수 있는 크기와 영역으로 배치하고 과도한 확대·잘림을 피한다. 구현 화면의 글자가 작더라도 역할을 설명하는 제목과 `altText`를 함께 둔다.
