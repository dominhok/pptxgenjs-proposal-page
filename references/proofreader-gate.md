# 생성 후 시각 교정 Gate

PptxGenJS 생성 결과를 곧바로 납품하지 않는다. 초안을 보존하고 별도 후보본을 교정한 뒤 최종 파일로 승격한다.

## 폴더 역할

- `draft/`: PptxGenJS가 만든 원본. 수정·덮어쓰기 금지.
- `candidate/`: draft의 복사본. OfficeCLI 교정 또는 재생성 결과를 반복 검수.
- `reports/`: 린트 JSON, native 전체 렌더, 카드 크롭, 판정 manifest.
- `final/`: 모든 Gate를 통과한 후보만 복사한 뒤 최종 검증.

## 필수 순서

1. draft를 생성하고 PptxGenJS 노트 정규화를 정확히 한 번 실행한다.
2. `proofread-proposal-batch.ps1`로 candidate, 보고서, native 카드 크롭을 만든다.
3. 린트 오류를 안정된 이름 경로로 매핑한다.
4. 공통 결함은 PptxGenJS 빌더를 수정해 draft를 재생성한다. 단일 개체 결함만 candidate에서 OfficeCLI로 교정한다.
5. `-UseExistingCandidates`로 기계 검사를 다시 실행한다.
6. 전체 렌더와 모든 카드 크롭을 직접 읽고 manifest의 각 행을 `PASS` 또는 결함으로 기록한다.
7. 모든 행이 PASS이고 렌더 결함이 없을 때만 candidate를 final로 복사한다.
8. final에 OOXML·OfficeCLI 검사를 실행한다.
9. 정확한 final 파일을 native PowerPoint로 다시 렌더하고 카드 크롭을 재검토한다.

## 고정 임계값

- 모든 가시 텍스트: nominal 및 추정 렌더 크기 10pt 이상.
- 카드 Header–Body 간격: 4pt 이상.
- 채움 패널의 가시 텍스트 패딩: 사방 6pt 이상.
- 중앙·고밀도 카드의 상하 패딩 차이: 3pt 이하.
- 텍스트 포함 개체 그림자: 0건.
- OfficeCLI issue와 OOXML 오류: 0건.

임계값을 낮춘 실행은 진단용일 뿐 납품 PASS로 인정하지 않는다.

## 수정 우선순위

1. 내부 여백 정규화.
2. 개체 이동과 정렬.
3. 아이콘 배지와 아이콘을 함께 이동·축소.
4. 컨테이너 크기와 반복 그리드 재배치.
5. 텍스트 영역 확대.
6. 줄·문단 간격 조정.
7. 의미 단위 줄바꿈.
8. 마지막 수단으로 글자 크기 조정. 10pt 미만 금지.

## 린터 경고 처리

- 오류는 수정 전 최종 승격 금지.
- 경고는 native 렌더에서 의도된 배경 중첩·아이콘 내부 배치임을 확인한 경우에만 수용한다.
- 수용한 경고는 최종 보고서에 경로와 사유를 기록한다.
- `view issues` 0건만으로 PASS 처리하지 않는다.
