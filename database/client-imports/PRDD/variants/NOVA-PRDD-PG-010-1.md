---
화면 ID: NOVA-PRDD-PG-010-1
화면 명: 공유·딥링크·문의 맥락 유지-상품 기준 정보 누락
화면 설명: 상품 기준 정보 누락 (보완 필요) — 해당 섹션을 숨기지 않고 보완 필요 또는 상담 가능 경로를 안내한다
화면 경로: 옵션·구성 선택 > 가입·구매 조건 검증 > 예상 비용·혜택 요약 > 공유·딥링크·문의 맥락 유지
구현 유형: PG
관련 정책 그룹: PG-PRDD-CATALOG-001, PG-PRDD-CS-001, PG-PRDD-MON-001
관련 유즈케이스: US-PRDD-CUS-003
관련 기능: FN-PRDD-SHARE-001, FN-PRDD-CS-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 공유·딥링크·원위치 복귀 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 0 | 1 | 1 | 오류 항목 미노출 |
| 2 | dynamic | 상품 문맥 상담 전달 영역 | vertical | 항상 | 유형(노출 여부, 텍스트 내용) | 1 | N | 2 | 영역 전체 숨김 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|---|---|---|---|
| default | 화면 진입 시 상품 기준 정보 누락 상태 | 해당 섹션을 숨기지 않고 보완 필요 또는 상담 가능 경로를 안내한다 — 보완 항목 강조 + Callout 안내 노출 | setState |
| loading | API 호출 | skeleton 표시 | - |
| error | 동일 실패 반복·인증 실패 후 복귀 불가 발생 | [영역 2] Callout 대체 경로 안내 노출 | apiCall |
| empty | 상품 기준 정보 누락으로 표시 항목 없음 | [영역 1] 보완 필요·상담 가능 경로 안내 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-009-0 | title: 공유·딥링크·문의 맥락 유지 | - (static) | - |
| 1 | 1 | CalloutDeeplinkInstall | 딥링크 미설치 유도 안내 | Callout | WithTitle | onClick | navigate | NOVA-PRDD-PG-009-0 | title: 앱에서 이어보기<br>body: 앱을 설치하면 선택한 상품 구성을 그대로 이어볼 수 있어요. | 딥링크 진입 경로와 복원 상태 (api:FN-PRDD-SHARE-001)<br>인증 후 핵심 상태 복원 (policy:PI-PRDD-FAIL-001-03) | [정책:PI-PRDD-FAIL-001-03] 인증 복귀 |
| 2 | 1 | TitleSectionCounsel | 상담 전달 섹션 헤더 | TitleSection | Default | - | - | - | subtitle: 도움이 필요하신가요?<br>title: 상품 문맥 상담 전달 | - (static) | - |
| 2 | 2 | ListTextCounselConnect | 상담 연결 | ListText | off | onClick | navigate | NOVA-PRDD-CS-001-0 | title: 상담 연결하기 | 상담 전환 문맥 (api:FN-PRDD-CS-001)<br>상담 문맥 전달 기준 (policy:PI-PRDD-CS-001-01) | [정책:PI-PRDD-CS-001-01] 상담 문맥<br>[정책:PI-PRDD-CS-001-03] 대체 안내 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|---|---|---|---|---|---|
| 화면 전환 | NOVA-PRDD-PG-010-0 | 공유·딥링크·문의 맥락 유지 | 상품 기준 정보 누락 해소 후 | - | - |
