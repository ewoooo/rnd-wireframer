---
화면 ID: NOVA-PRDD-PG-002-1
화면 명: 미디어·스펙·후기 이해-상품 기준 정보 누락
화면 설명: 상품 기준 정보 누락 시 해당 섹션을 숨기지 않고 보완 필요 또는 상담 가능 경로를 안내한다.
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
| default | 상품 기준 정보 누락 발생 | [영역 1] [영역 2] [영역 3] 누락 섹션 미숨김 유지, Callout 보완 필요·상담 가능 경로 안내 | apiCall |
| error | 보완 후에도 기준 정보 미확인 | [영역 2] Callout 상담 연결 강조 | apiCall |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|------|-----|------------|---------------|-------------|---------|--------|------|---------------|-------------|--------------|------|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-001-0 | title: 미디어·스펙·후기 이해 | - (static) | - |
| 1 | 1 | ThumbnailProductImageViewer | 상품 이미지 뷰어 | Thumbnail | product | onClick | setState | mediaZoomOpen | - | 고객용 상품 상세 섹션 노출 결과 (api:FN-PRDD-MEDIA-001) | [정책:PI-PRDD-SUMMARY-001-02] 미디어 뷰어 — 누락 시 섹션 숨김 금지 |
| 1 | 2 | BannerHorizontalMediumProductVideoViewer | 상품 동영상 뷰어 | BannerHorizontalMedium | - | onClick | setState | mediaZoomOpen | title: {동영상 제목}<br>subtitle: {상품 이용 맥락} | 고객용 상품 상세 섹션 노출 결과 (api:FN-PRDD-MEDIA-001) | [정책:PI-PRDD-SUMMARY-001-02] 미디어 뷰어 — 미디어가 조건 설명 시 동일 정보를 텍스트로도 제공 |
| 1 | 3 | ButtonTextUnderlineMediaZoom | 미디어 확대 보기 링크 | ButtonTextUnderline | - | onClick | setState | mediaZoomOpen | label: 확대해서 보기 | mediaZoomOpen (state) | [정책:PI-PRDD-SUMMARY-001-02] 미디어 뷰어 — 확대 보기 허용 |
| 2 | 1 | AccordionNoticeInfoSpecDetail | 상품 설명·스펙 상세 펼침 | AccordionNoticeInfo | close | onClick | setState | specDetailOpen | titleLabel: {스펙 항목명} (예: 이용 조건)<br>slot: {스펙 상세 설명} | 상품군별 필수 정보 표시 여부 (api:FN-PRDD-SPEC-001)<br>specDetailOpen (state) | [정책:PI-PRDD-SUMMARY-001-03] 스펙 요약 — 누락 항목은 보완 안내로 대체 |
| 3 | 1 | CardSummaryRatingSummary | 후기 평점 요약 | CardSummary | text | - | - | - | title: {평균 평점} (예: 4.6)<br>subText: 후기 {후기 수}건 기준 | 고객용 상품 상세 섹션 노출 결과 (api:FN-PRDD-REVIEW-001) | [정책:PI-PRDD-COMPARE-001-04] 후기 요약 — 장·단점 균형 |
| 3 | 2 | FilterSortingQna | 후기·Q&A 필터·정렬 | FilterSorting | - | onClick | setState | reviewFilter | total: 후기 {후기 수}건<br>sortBtn: {정렬 기준} (예: 최신순) | reviewFilter (state)<br>필터 옵션 (policy:PI-PRDD-SUMMARY-001-04) | [정책:PI-PRDD-SUMMARY-001-04] 상품 리뷰·평점·Q&A — 최신순·도움순·유형별 필터 제공 |
| 3 | 3 | ListTextReviewList | 상품 후기 목록 | ListText | dot | onClick | navigate | NOVA-PRDD-CS-001-0 | title: {후기 작성자} (예: 김**)<br>subText: {후기 요약} / {작성일} | 고객용 상품 상세 섹션 노출 결과 (api:FN-PRDD-REVIEW-001) | [정책:PI-PRDD-REVIEW-001-01] 공통 컬럼 — 작성자·작성일·평점·유형·답변 상태 표준화 |
| 3 | 4 | CalloutFilterRelaxGuide | 후기 필터 완화 안내 | Callout | - | onClick | setState | reviewFilter | title: 조건에 맞는 후기가 없어요<br>body: 필터 조건을 완화하거나 전체 후기를 확인해 보세요. | 미노출·대체 안내 사유 (api:FN-PRDD-REVIEW-001) | [정책:PI-PRDD-REVIEW-001-04] 결과 없음 — 조건 완화·전체 후기 안내 |
| 2 | 2 | CalloutMissingInfoGuide | 기준 정보 누락 보완 안내 | Callout | - | onClick | navigate | NOVA-PRDD-CS-001-0 | title: 상품 정보 확인이 필요해요<br>body: 일부 상품 정보가 준비 중입니다. 보완 후 다시 확인하거나 상담으로 도움받을 수 있어요. | 미노출·대체 안내 사유 (api:FN-PRDD-SPEC-001) | [정책:PI-PRDD-SUMMARY-001-03] 스펙 요약 — 누락 시 숨기지 않고 보완·상담 경로 안내 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|------|---------|---------|------|-------------|-----------|
| 화면 전환 | NOVA-PRDD-PG-002-0 | 미디어·스펙·후기 이해 | 상품 기준 정보 누락 해소 후 | - | - |
