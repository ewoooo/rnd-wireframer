---
화면 ID: NOVA-PRDD-PG-006-0
화면 명: 추천·AI 요약 근거 검토
화면 설명: 고객이 AI 요약, 추천, 후기 요약의 기준과 원문 정보를 확인하고 선택 후보를 좁힌다.
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
| default | 화면 진입 정상 | AI 요약·추천 근거·후기 목록 기본 표시 | apiCall |
| loading | AI 요약·후기 목록 API 호출 | skeleton 표시 | - |
| error | 미디어·후기·스펙 로딩 실패 | [영역 1] Callout 오류 안내 노출, 핵심 요약·가격 판단은 유지 | apiCall |
| empty | 후기 필터·탭 결과 없음 | [영역 2] 필터 완화 안내 Callout 노출 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|-------------|---------------|-------------|---------|--------|------|----------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-005-0 | title: 추천·AI 요약 근거 검토 | - (static) | - |
| 1 | 1 | TitleSectionAiSummary | AI 요약·추천 영역 제목 | TitleSection | Default | - | - | - | title: AI 요약·추천 | - (static) | - |
| 1 | 2 | CalloutAiSummary | 상품 핵심 특징 AI 요약 | Callout | WithTitle | - | - | - | title: AI 핵심 요약<br>body: {AI 요약 문구} — 생성 기준·반영 시점·원문 이동 경로를 함께 표시합니다 | 고객용 상품 요약 (api:FN-PRDD-AI-001)<br>AI 요약 생성 기준 (policy:PI-PRDD-COMPARE-001-02) | [정책:PI-PRDD-COMPARE-001-02] AI 요약 |
| 1 | 3 | InfoTextListRecommendBasis | 추천 근거 표시 | InfoTextList | Default | - | - | - | title: {추천 근거 항목} (예: 월 예상 부담)<br>category: 추천 기준 | 상품군별 필수 정보 표시 여부 (api:FN-PRDD-AI-001)<br>추천 사용 기준 (policy:PI-PRDD-COMPARE-001-03) | [정책:PI-PRDD-COMPARE-001-03] 추천 근거 |
| 1 | 4 | CardTextReviewSummary | 구매후기 AI 요약 | CardText | Default | onClick | navigate | NOVA-PRDD-PG-006-2 | title: 후기 AI 요약<br>body: {후기 요약 문구} — 장점과 단점을 균형 있게 제공하며 원문으로 이동할 수 있습니다 | 고객용 상품 요약 (api:FN-PRDD-AI-001)<br>후기 요약 균형 기준 (policy:PI-PRDD-COMPARE-001-04) | [정책:PI-PRDD-COMPARE-001-04] 후기 요약 |
| 1 | 5 | ListProductRowSimilarCompare | 유사상품 AI 비교 표시 | ListProductRow | - | onClick | navigate | NOVA-PRDD-PG-005-0 | - | 상품 상세 조회와 비교 전환 이력 (api:FN-PRDD-AI-001)<br>atomic view 재조립 기준 (policy:PI-PRDD-COMPARE-001-05) | [정책:PI-PRDD-COMPARE-001-05] atomic view |
| 2 | 1 | TitleSectionReview | 리뷰·평점·Q&A 영역 제목 | TitleSection | Default | - | - | - | title: 리뷰·평점·Q&A | - (static) | - |
| 2 | 2 | InfoTextListReview | 후기 목록 표시 | InfoTextList | WithBadge | - | - | - | title: {후기 작성자} (예: 익명 고객)<br>category: {작성일} (예: 2026-05-10)<br>badge: {답변·신고 상태} (예: 답변완료) | 상품 상세 조회와 비교·담기 전환 이력 (api:FN-PRDD-REVIEW-001)<br>고객 표시 표준 컬럼 (policy:PI-PRDD-REVIEW-001-01) | [정책:PI-PRDD-REVIEW-001-01] 공통 컬럼 |
| 2 | 3 | CardSummaryRating | 평점 요약 표시 | CardSummary | text | - | - | - | title: 평점 요약<br>subText: {평균 평점} (예: 4.5 / 5.0) | 상품군별 필수 정보 표시 여부 (api:FN-PRDD-REVIEW-001)<br>평점 표시 기준 (policy:PI-PRDD-REVIEW-001-01) | [정책:PI-PRDD-REVIEW-001-01] 공통 컬럼 |
| 2 | 4 | ChipQnaFilter | Q&A 필터 선택 | Chip | - | onClick | setState | selectedQnaFilter | label: {필터 유형} (예: 최신순) | selectedQnaFilter (state)<br>최신순·도움순·유형별 필터 (policy:PI-PRDD-SUMMARY-001-04) | [정책:PI-PRDD-SUMMARY-001-04] 상품 리뷰·평점·Q&A |
| 2 | 5 | CalloutFilterRelaxGuide | 필터 완화 안내 | Callout | WithTitle | - | - | - | title: 조건에 맞는 후기가 없습니다<br>body: 조건 완화, 전체 후기 보기, 후기 작성 가능 여부 중 하나 이상을 안내합니다. | 미노출·대체 안내 사유 (api:FN-PRDD-REVIEW-001)<br>결과 없음 안내 기준 (policy:PI-PRDD-REVIEW-001-04) | [정책:PI-PRDD-REVIEW-001-04] 결과 없음 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 케이스 분기 | NOVA-PRDD-PG-006-1 | 추천·AI 요약 근거 검토-상품 기준 정보 누락 | 상품 기준 정보 누락 | - | 보완 필요·상담 가능 경로 안내 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-006-2 | 추천·AI 요약 근거 검토-후기 필터·탭 결과 없음 | 후기 필터·탭 결과 없음 | - | 조건 완화·전체 후기 보기·후기 작성 안내 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-006-E1 | 추천·AI 요약 근거 검토-내부 운영 코드·원장 필드명 노출 | 내부 운영 코드·원장 필드명 노출 | - | 배포 제한·노출 차단 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-006-E2 | 추천·AI 요약 근거 검토-미디어·후기·스펙 로딩 실패 | 미디어·후기·스펙 로딩 실패 | - | 핵심 요약·가격 판단 유지 후 화면 유지 |
