---
화면 ID: NOVA-PRDD-PU-016-E1
화면 명: 로그인·인증 후 원위치 복귀-동일 실패 반복
화면 설명: 동일 실패 반복 — 재시도만 제공하지 않고 대체 상품·상담·나중에 다시 시도 경로 제시
화면 경로: 선택 불가·충돌 사유 안내 > 로그인·인증 후 원위치 복귀
구현 유형: PU
관련 정책 그룹: PG-PRDD-FAIL-001, PG-PRDD-ELIG-001, PG-PRDD-SAVE-001, PG-PRDD-CATALOG-001
관련 유즈케이스: US-PRDD-CUS-005
관련 기능: FN-PRDD-AUTH-001, FN-PRDD-SHARE-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 로그인·인증 필요 안내 영역 | vertical | 항상 | 유형(텍스트 내용, 노출 여부) | 1 | N | 1 | 영역 전체 숨김 |
| 2 | dynamic | 공유·딥링크·원위치 복귀 안내 영역 | vertical | [앱 미설치] 있음 | 유형(노출 여부) | 0 | 1 | 2 | 오류 항목 미노출 |
| 999 | dynamic | 화면 하단 액션 영역 | horizontal | 항상 | 유형(노출 여부) | 1 | 1 | 3 | 오류 항목 미노출 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|---|---|---|---|
| default | 화면 진입 정상 | [영역 1] Callout 오류 안내 + 대체 상품·상담·나중에 다시 시도 경로 강조 | apiCall |
| OneButton | 화면 하단 CTA 1개 활성 | ActionButton main 슬롯만 노출 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-015-0 | title: 로그인·인증 후 원위치 복귀 | - (static) | - |
| 1 | 1 | TitleSectionAuthGuide | 로그인·인증 필요 안내 섹션 제목 | TitleSection | Default | - | - | - | title: 계속하려면 로그인·인증이 필요해요 | - (static) | - |
| 1 | 2 | ListTextSelectionKeep | 인증 완료 후 유지되는 선택 구성 안내 | ListText | dot | - | - | - | title: {유지항목} (예: 선택 상품·옵션·비교 조건) | 원위치 복귀 정보 (api:FN-PRDD-AUTH-001) | [정책:PI-PRDD-FAIL-001-03] 인증 복귀 |
| 1 | 3 | ButtonAuthMove | 본인확인·인증 화면으로 이동 | Button | primary | onClick | navigate | NOVA-PRDD-PG-017-0 | label: 로그인·인증하러 가기 | 복구 가능 경로 (api:FN-PRDD-AUTH-001) | [정책:PI-PRDD-ELIG-001-03] 비회원 전환 |
| 2 | 1 | CalloutAppInstallGuide | 앱 미설치 시 설치 유도 안내 | Callout | WithTitle | - | - | - | title: 앱에서 이어서 진행하세요<br>body: 앱을 설치하면 선택한 상품·옵션 그대로 복귀할 수 있어요 | 미노출·대체 안내 사유 (api:FN-PRDD-SHARE-001) | [정책:PI-PRDD-FAIL-001-03] 인증 복귀 |
| 999 | 1 | ActionButtonRecover | 화면 하단 인증 진행 CTA | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-017-0 | main: 상담 연결하기 | 원위치 복귀 정보 (api:FN-PRDD-AUTH-001) | [정책:PI-PRDD-FAIL-001-03] 인증 복귀 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|---|---|---|---|---|---|
| 화면 전환 | NOVA-PRDD-PG-017-0 | 상담 전환과 실패 이력 전달 | 동일 실패 반복으로 상담 경로 선택 시 | 상품 ID, 옵션, 실패 사유, 시도 이력 | - |
