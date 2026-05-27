---
화면 ID: NOVA-PRDD-PG-006-1
화면 명: 추천·AI 요약 근거 검토-상품 기준 정보 누락
화면 설명: 상품 기준 정보가 누락되면 해당 섹션을 숨기지 않고 보완 필요 또는 상담 가능 경로를 안내한다.
화면 경로: 고객 상태 기반 적합성 파악 > 비교 컴포넌트로 대안 비교 > 추천·AI 요약 근거 검토
구현 유형: PG
관련 정책 그룹: PG-PRDD-COMPARE-001, PG-PRDD-AUDIT-001, PG-PRDD-SUMMARY-001, PG-PRDD-REVIEW-001
관련 유즈케이스: US-PRDD-CUS-002
관련 기능: FN-PRDD-AI-001, FN-PRDD-REVIEW-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | AI 요약·추천·atomic view 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용), 순서 | 1 | N | 1 | 오류 항목 미노출 |
| 2 | dynamic | 상품 리뷰·평점·Q&A 제공 영역 | vertical | 항상 | 유형(노출 여부), 순서, 개수 | 0 | N | 2 | 오류 항목 미노출 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|---------------|------|
| default | 화면 진입 정상 (상품 기준 정보 누락 상태) | [영역 1] 보완 필요 안내 노출, 누락 섹션 미숨김 + 상담 경로 안내 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|----------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-006-0 | title: 추천·AI 요약 근거 검토 | - (static) | - |
| 1 | 1 | TitleSectionAiSummary | AI 요약·추천 영역 제목 | TitleSection | Default | - | - | - | title: AI 요약·추천 | - (static) | - |
| 1 | 2 | CalloutAiSummary | AI 요약 (보완 필요 안내 노출) | Callout | WithTitle | - | - | - | title: 일부 정보 보완이 필요합니다<br>body: 상품 기준 정보가 누락되어 일부 요약을 표시하지 못했습니다. 보완 필요 항목과 상담 가능 경로를 확인해 주세요. | 미노출·대체 안내 사유 (api:FN-PRDD-AI-001) | [정책:PI-PRDD-COMPARE-001-02] AI 요약 |
| 1 | 3 | InfoTextListRecommendBasis | 추천 근거 표시 | InfoTextList | Default | - | - | - | title: {추천 근거 항목} (예: 월 예상 부담)<br>category: 추천 기준 | 상품군별 필수 정보 표시 여부 (api:FN-PRDD-AI-001)<br>추천 사용 기준 (policy:PI-PRDD-COMPARE-001-03) | [정책:PI-PRDD-COMPARE-001-03] 추천 근거 |
| 1 | 4 | CardTextReviewSummary | 구매후기 AI 요약 | CardText | Default | onClick | navigate | NOVA-PRDD-PG-006-2 | title: 후기 AI 요약<br>body: {후기 요약 문구} — 원문으로 이동할 수 있습니다 | 고객용 상품 요약 (api:FN-PRDD-AI-001)<br>후기 요약 균형 기준 (policy:PI-PRDD-COMPARE-001-04) | [정책:PI-PRDD-COMPARE-001-04] 후기 요약 |
| 1 | 5 | ListProductRowSimilarCompare | 유사상품 AI 비교 표시 | ListProductRow | - | onClick | navigate | NOVA-PRDD-PG-005-0 | - | 상품 상세 조회와 비교 전환 이력 (api:FN-PRDD-AI-001)<br>atomic view 재조립 기준 (policy:PI-PRDD-COMPARE-001-05) | [정책:PI-PRDD-COMPARE-001-05] atomic view |
| 2 | 1 | TitleSectionReview | 리뷰·평점·Q&A 영역 제목 | TitleSection | Default | - | - | - | title: 리뷰·평점·Q&A | - (static) | - |
| 2 | 2 | InfoTextListReview | 후기 목록 표시 | InfoTextList | WithBadge | - | - | - | title: {후기 작성자} (예: 익명 고객)<br>category: {작성일} (예: 2026-05-10)<br>badge: {답변·신고 상태} (예: 답변완료) | 상품 상세 조회와 비교·담기 전환 이력 (api:FN-PRDD-REVIEW-001)<br>고객 표시 표준 컬럼 (policy:PI-PRDD-REVIEW-001-01) | [정책:PI-PRDD-REVIEW-001-01] 공통 컬럼 |
| 2 | 3 | CardSummaryRating | 평점 요약 표시 | CardSummary | text | - | - | - | title: 평점 요약<br>subText: {평균 평점} (예: 4.5 / 5.0) | 상품군별 필수 정보 표시 여부 (api:FN-PRDD-REVIEW-001)<br>평점 표시 기준 (policy:PI-PRDD-REVIEW-001-01) | [정책:PI-PRDD-REVIEW-001-01] 공통 컬럼 |
| 2 | 4 | ChipQnaFilter | Q&A 필터 선택 | Chip | - | onClick | setState | selectedQnaFilter | label: {필터 유형} (예: 최신순) | selectedQnaFilter (state)<br>최신순·도움순·유형별 필터 (policy:PI-PRDD-SUMMARY-001-04) | [정책:PI-PRDD-SUMMARY-001-04] 상품 리뷰·평점·Q&A |
| 2 | 5 | CalloutFilterRelaxGuide | 필터 완화 안내 | Callout | WithTitle | - | - | - | title: 조건에 맞는 후기가 없습니다<br>body: 조건 완화, 전체 후기 보기, 후기 작성 가능 여부 중 하나 이상을 안내합니다. | 미노출·대체 안내 사유 (api:FN-PRDD-REVIEW-001)<br>결과 없음 안내 기준 (policy:PI-PRDD-REVIEW-001-04) | [정책:PI-PRDD-REVIEW-001-04] 결과 없음 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 화면 전환 | NOVA-PRDD-PG-006-0 | 추천·AI 요약 근거 검토 | 상품 기준 정보 누락 해소 후 | - | - |
