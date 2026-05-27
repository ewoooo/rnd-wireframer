---
화면 ID: NOVA-PRDD-PG-015-E1
화면 명: 선택 불가·충돌 사유 안내-동일 실패 반복
화면 설명: 동일 실패 반복 — 재시도만 제공하지 않고 대체 상품·상담·나중에 다시 시도 경로 제시
화면 경로: 선택 불가·충돌 사유 안내
구현 유형: PG
관련 정책 그룹: PG-PRDD-FAIL-001, PG-PRDD-COMBO-001, PG-PRDD-CS-001, PG-PRDD-OPTION-001, PG-PRDD-ELIG-001, PG-PRDD-CATALOG-001
관련 유즈케이스: US-PRDD-CUS-005
관련 기능: FN-PRDD-FAIL-001, FN-PRDD-COMBO-001
작성일: 2026-05-22
작성자: plus
버전: 1.00

---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | static | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | 선택 불가·충돌 복구 안내 영역 | vertical | 항상 | 유형(텍스트 내용, 노출 여부) | 1 | 1 | 1 | 영역 전체 숨김 |
| 2 | dynamic | 상품 조합·중복가입 검증 결과 영역 | vertical | 항상 | 유형(노출 여부), 개수 | 0 | N | 2 | 오류 항목 미노출 |
| 999 | dynamic | 화면 하단 액션 영역 | horizontal | 항상 | 유형(노출 여부) | 1 | 1 | 3 | 오류 항목 미노출 |

## 컴포넌트 상태

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|---|---|---|---|
| default | 화면 진입 정상 | [영역 1] Callout 오류 안내 + 대체 상품·상담·나중에 다시 시도 경로 강조 | apiCall |
| OneButton | 화면 하단 CTA 1개 활성 | ActionButton main 슬롯만 노출 | - |

## 컴포넌트 상세

| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 표시 텍스트 | 바인딩(소스) | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | onClick | navigate | NOVA-PRDD-PG-014-0 | title: 선택 불가·충돌 사유 안내 | - (static) | - |
| 1 | 1 | TitleSectionFailReason | 선택 불가·충돌 복구 안내 섹션 제목 | TitleSection | Default | - | - | - | title: 담기에 실패한 이유와 해결 방법 | - (static) | - |
| 1 | 2 | CalloutFailReason | 실패 사유 축 구분과 수정 방법 안내 | Callout | WithTitle | - | - | - | title: {실패축} 문제로 담지 못했어요 (예: 가입 조건)<br>body: 상품·옵션·조건·정책 중 어디서 막혔는지와 수정 방법을 확인하세요 | 실패 사유와 고객 안내 문구 (api:FN-PRDD-FAIL-001) | [정책:PI-PRDD-FAIL-001-01] 불가 안내<br>[정책:PI-PRDD-ELIG-001-02] 불가 사유 |
| 1 | 3 | TextButtonViewLater | 나중에 다시 보기 보조 행동 | TextButton | single | onClick | setState | viewLaterSaved | label: 나중에 다시 보기 | viewLaterSaved (state) | [정책:PI-PRDD-FAIL-001-04] 대체 경로 |
| 2 | 1 | TitleSectionComboResult | 상품 조합·중복가입 검증 결과 섹션 제목 | TitleSection | Default | - | - | - | title: 선택 구성 검증 결과 | - (static) | - |
| 2 | 2 | ListTextDuplicateCheck | 중복가입 가능여부 확인 결과 표시 | ListText | on | - | - | - | title: 중복가입 가능여부<br>subText: {중복가입판정결과} (예: 중복 가입 불가) | 수정 필요 옵션과 제한 사유 (api:FN-PRDD-COMBO-001) | [정책:PI-PRDD-COMBO-001-02] 중복가입 가능여부 확인 |
| 2 | 3 | ListSelectedGroupProduct | 그룹상품 구성·구성원 조건 선택 | ListSelected | radio | onChange | setState | selectedGroupProduct | RadioText: {그룹상품명} (예: 가족 결합 그룹) | selectedGroupProduct (state)<br>담기 가능 여부와 선택 구성 상태 (api:FN-PRDD-COMBO-001) | [정책:PI-PRDD-OPTION-001-03] 그룹 상품<br>[정책:PI-PRDD-COMBO-001-03] 필수 구성 |
| 999 | 1 | ActionButtonRecover | 화면 하단 복구 진행 CTA | ActionButton | default | onClick | navigate | NOVA-PRDD-PG-017-0 | main: 상담 연결하기 | 원위치 복귀 정보 (api:FN-PRDD-FAIL-001) | [정책:PI-PRDD-FAIL-001-03] 인증 복귀 |

## 화면 흐름

| 구분 | 화면 ID | 화면 명 | 조건 | 전달 데이터 | 후속 처리 |
|---|---|---|---|---|---|
| 화면 전환 | NOVA-PRDD-PG-017-0 | 상담 전환과 실패 이력 전달 | 동일 실패 반복으로 상담 경로 선택 시 | 상품 ID, 옵션, 실패 사유, 시도 이력 | - |
