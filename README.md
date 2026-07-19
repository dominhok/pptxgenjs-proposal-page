# pptxgenjs-proposal-page

번호가 있는 DOCX 제안서 원문을 읽어, **A4 세로형 한국어 제안서 PPTX 페이지**로 만드는 Codex 스킬입니다.

- 절·항목별로 편집 가능한 단일 슬라이드 PPTX 생성
- 공통 디자인 시스템을 유지하면서 내용 관계에 맞는 인포그래픽 구성
- PptxGenJS 네이티브 도형·텍스트·아이콘 사용
- OfficeCLI 렌더링과 레이아웃 검사 기반 QA
- 여러 페이지를 만들 때 반복 레이아웃을 피하면서 시각 언어 통일

## 가장 간단한 사용법

Codex 또는 다른 스킬 설치 가능 에이전트에게 저장소 URL과 작업 파일을 전달하면 됩니다.

```text
https://github.com/dominhok/pptxgenjs-proposal-page
이 스킬을 설치하고 SKILL.md를 따라 작업해줘.
이 DOCX의 I.2.1~I.2.8을 제안서 PPTX로 만들어줘.
참고 PPTX의 디자인 톤을 유지하고 각 절은 편집 가능한 단일 페이지로 생성해줘.
```

에이전트는 `SKILL.md`를 먼저 읽고, 사전 점검 → 원문 추출 → 레이아웃 선택 → 생성 → 렌더 검수 순서로 진행해야 합니다.

## 설치

### 에이전트에게 맡기기

```text
이 GitHub 스킬을 Codex 스킬 디렉터리에 설치해줘:
https://github.com/dominhok/pptxgenjs-proposal-page
```

### 직접 설치

PowerShell에서 실행합니다.

```powershell
git clone https://github.com/dominhok/pptxgenjs-proposal-page.git `
  "$env:USERPROFILE\.codex\skills\pptxgenjs-proposal-page"
```

이미 설치했다면 해당 디렉터리에서 `git pull`로 업데이트합니다. Codex가 실행 중이었다면 새 세션에서 스킬을 다시 불러오는 것이 안전합니다.

## 의존성

저장소에 포함되는 항목:

- PptxGenJS `4.0.1`과 JSZip `3.10.1` 잠금 파일
- 제안서 공통 템플릿과 레이아웃 패턴
- 예시 PPTX·미리보기·참조 덱
- `pptx-visual-proofreader` 검사 스크립트와 검수 규칙

사용 환경에 필요한 항목:

- Windows 10 이상
- PowerShell 5.1 이상
- Node.js 18 이상과 npm
- Python 3.10 이상
- OfficeCLI
- Microsoft PowerPoint 2021 이상
- Pretendard 글꼴

`pptx-visual-proofreader`는 `dependencies/`에 포함되어 있으므로 별도 설치가 필수는 아닙니다. 별도 설치본이 있으면 개발용 우선 경로로 사용할 수 있습니다.

설치 후 환경을 확인합니다.

```powershell
powershell -ExecutionPolicy Bypass -File `
  ".\scripts\check-requirements.ps1"
```

## 작업 흐름

1. DOCX의 번호·제목·본문·Key Message·요구사항을 추출합니다.
2. 참고 PPTX에서 크기, 색상, 글꼴, 여백과 반복 구성요소를 확인합니다.
3. 내용 관계에 따라 프로세스, 비교, 계층, 아키텍처, 매트릭스 등 레이아웃을 선택합니다.
4. `scripts/scaffold-page.ps1`로 잠긴 제작 환경을 복사합니다.
5. PptxGenJS로 모든 요소를 편집 가능한 PowerPoint 개체로 생성합니다.
6. OfficeCLI와 포함된 proofreader로 렌더링·겹침·잘림·정렬을 검사합니다.
7. 검수를 통과한 candidate만 최종 파일로 승격합니다.

## 주요 파일

- `SKILL.md`: 에이전트가 따라야 할 전체 작업 규칙
- `references/`: 디자인 시스템, 레이아웃 선택, 호환성, 검수 기준
- `assets/pptxgenjs-kit/`: 제작 템플릿과 잠긴 Node.js 환경
- `assets/examples/`: 검증된 제안서 페이지 예시
- `dependencies/pptx-visual-proofreader/`: 번들된 시각 검수 의존성
- `scripts/`: 환경 점검, 스캐폴딩, 후처리와 일괄 검수

## 결과물 원칙

- 기본 출력은 절 하나당 PPTX 한 장입니다.
- 페이지 크기는 `7.5 × 10.8333 in` A4 세로형입니다.
- 본문은 가급적 12pt, 최소 10pt를 유지합니다.
- 전체 인포그래픽을 이미지로 평면화하지 않습니다.
- 원문 사실·수치·요구사항 ID를 임의로 만들거나 누락하지 않습니다.
- 최종 판단은 XML 검사만이 아니라 PowerPoint 네이티브 렌더 결과를 기준으로 합니다.
