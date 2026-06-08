---
화면 ID: NOVA-PRDD-PG-002-0
화면 명: 미디어·스펙·후기 이해
화면 설명: 고객이 이미지, 동영상, 스펙 요약, 후기와 Q&A를 조회하고 상품 이용 맥락과 주의사항을 확인한다.
화면 경로: 상품 상세 > 미디어·스펙·후기 이해
구현 유형: PG
관련 정책 그룹: PG-PRDD-COMPARE-001, PG-PRDD-AUDIT-001, PG-PRDD-REVIEW-001
관련 유즈케이스: US-PRDD-CUS-001
관련 기능: FN-PRDD-MEDIA-001, FN-PRDD-SPEC-001, FN-PRDD-REVIEW-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|-----|-----------|-----------|---------------|-----------|----------------|------------------|------------------|---------------|----------------|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 미디어·접근성 뷰어 영역 | vertical | 항상 | 유형(이미지 URL), 개수 | 1 | N | 1 | 오류 항목 미노출 |
| 2 | dynamic | 상품 설명·스펙 구조화 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 1 | N | 2 | 오류 항목 미노출 |
| 3 | dynamic | 상품 리뷰·평점·Q&A 제공 영역 | vertical | 항상 | 개수, 순서 | 0 | N | 3 | 오류 항목 미노출 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|---------------|------|
| default | 화면 진입 정상 | 미디어 뷰어·스펙 아코디언·후기 목록 표시 | apiCall |
| loading | API 호출 | [영역 1] [영역 2] [영역 3] skeleton 표시 | - |
| error | 미디어·후기·스펙 로딩 실패 | [영역 1] [영역 3] Callout 로딩 실패 안내 노출 | apiCall |
| empty | 후기·Q&A 필터 적용 결과 없음 | [영역 3] Callout 필터 완화·전체 후기 안내 노출 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|------------|---------------|-------------|---------|--------|------|---------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-001-0 | title: 미디어·스펙·후기 이해 | - (static) | - |
| 1 | 1 | ThumbnailProductImageViewer | 상품 이미지 뷰어 | Thumbnail | product | onClick | setState | mediaZoomOpen | - | 고객용 상품 상세 섹션 노출 결과 (api:FN-PRDD-MEDIA-001) | [정책:PI-PRDD-SUMMARY-001-02] 미디어 뷰어 — 확대·스와이프 허용, 대체텍스트 필수 |
| 1 | 2 | BannerHorizontalMediumProductVideoViewer | 상품 동영상 뷰어 | BannerHorizontalMedium | - | onClick | setState | mediaZoomOpen | title: {동영상 제목}<br>subtitle: {상품 이용 맥락} | 고객용 상품 상세 섹션 노출 결과 (api:FN-PRDD-MEDIA-001) | [정책:PI-PRDD-SUMMARY-001-02] 미디어 뷰어 — 미디어가 조건 설명 시 동일 정보를 텍스트로도 제공 |
| 1 | 3 | ButtonTextUnderlineMediaZoom | 미디어 확대 보기 링크 | ButtonTextUnderline | - | onClick | setState | mediaZoomOpen | label: 확대해서 보기 | mediaZoomOpen (state) | [정책:PI-PRDD-SUMMARY-001-02] 미디어 뷰어 — 확대 보기 허용 |
| 2 | 1 | AccordionNoticeInfoSpecDetail | 상품 설명·스펙 상세 펼침 | AccordionNoticeInfo | close | onClick | setState | specDetailOpen | titleLabel: {스펙 항목명} (예: 이용 조건)<br>slot: {스펙 상세 설명} | 상품군별 필수 정보 표시 여부 (api:FN-PRDD-SPEC-001)<br>specDetailOpen (state) | [정책:PI-PRDD-SUMMARY-001-03] 스펙 요약 — 요약·상세 펼침 구분, 담기 전 판단 조건 우선 표시 |
| 3 | 1 | CardSummaryRatingSummary | 후기 평점 요약 | CardSummary | text | - | - | - | title: {평균 평점} (예: 4.6)<br>subText: 후기 {후기 수}건 기준 | 고객용 상품 상세 섹션 노출 결과 (api:FN-PRDD-REVIEW-001) | [정책:PI-PRDD-COMPARE-001-04] 후기 요약 — 장·단점 균형, 원문·평점 세부 이동 제공 |
| 3 | 2 | FilterSortingQna | 후기·Q&A 필터·정렬 | FilterSorting | - | onClick | setState | reviewFilter | total: 후기 {후기 수}건<br>sortBtn: {정렬 기준} (예: 최신순) | reviewFilter (state)<br>필터 옵션 (policy:PI-PRDD-SUMMARY-001-04) | [정책:PI-PRDD-SUMMARY-001-04] 상품 리뷰·평점·Q&A — 최신순·도움순·유형별 필터 제공 |
| 3 | 3 | ListTextReviewList | 상품 후기 목록 | ListText | dot | onClick | navigate | NOVA-PRDD-CS-001-0 | title: {후기 작성자} (예: 김**)<br>subText: {후기 요약} / {작성일} | 고객용 상품 상세 섹션 노출 결과 (api:FN-PRDD-REVIEW-001) | [정책:PI-PRDD-REVIEW-001-01] 공통 컬럼 — 작성자·작성일·평점·유형·답변 상태 표준화 |
| 3 | 4 | CalloutFilterRelaxGuide | 후기 필터 완화 안내 | Callout | - | onClick | setState | reviewFilter | title: 조건에 맞는 후기가 없어요<br>body: 필터 조건을 완화하거나 전체 후기를 확인해 보세요. | 미노출·대체 안내 사유 (api:FN-PRDD-REVIEW-001) | [정책:PI-PRDD-REVIEW-001-04] 결과 없음 — 조건 완화·전체 후기 보기·작성 가능 여부 중 하나 이상 안내 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 화면 전환 | NOVA-PRDD-PG-003-0 | 혜택·가격·주의사항 확인 | 미디어·스펙·후기 이해 결과가 성공·제한·보완 필요 중 하나로 확정 시 | 상품 ID, 상품군, 판단 근거 | - |
| 케이스 분기 | NOVA-PRDD-PG-002-1 | 미디어·스펙·후기 이해-상품 기준 정보 누락 | 상품 기준 정보 누락 | - | 해당 섹션 숨기지 않고 보완 필요·상담 가능 경로 안내 후 화면 유지 |
| 케이스 분기 | NOVA-PRDD-PG-002-E1 | 미디어·스펙·후기 이해-미디어·후기·스펙 로딩 실패 | 미디어·후기·스펙 로딩 실패 | - | 핵심 요약·가격·조건 판단 유지한 채 화면 유지 |
