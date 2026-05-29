---
화면 ID: NOVA-MBR-PU-003-E2
화면 명: 본인인증-인증 실패 한도 초과
화면 설명: 인증 실패 한도 초과(제한) — 인증 잠금 안내 후 10분 대기.
화면 경로: 회원 가입 > 본인인증
구현 유형: PU
관련 정책 그룹: PG-MBR-AUTH-001, PG-MBR-AUTH-002, PG-MBR-AUTH-003, PG-MBR-AUTH-004, PG-MBR-AUTH-005, PG-MBR-AUTH-006, PG-MBR-AUTH-007
관련 유즈케이스: US-MBR-CS-001
관련 기능: FN-MBR-COM-002
상태: 초안
작성일: 2026-05-28
작성자: kyeom
버전: 1.00

---

## 화면 구성

| 섹션 번호 | 섹션 유형 | 섹션 명 | 관련 기능 | 섹션 설명 | 섹션 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | static | AppBarSection | - | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | AuthMethodSection | FN-MBR-COM-002 | 인증수단 선택 및 인증번호 입력 | vertical | 본인인증 진입 시 | 유형(노출 여부), 순서 | 1 | N | 1 | 섹션 전체 숨김 |
| 999 | dynamic | ActionButtonSection | - | 화면 하단 액션 섹션 | vertical | 항상 | 유형(노출 여부) | - | - | - | - |

## 컴포넌트 상세

| 섹션 명 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | state | props | 이벤트 | 액션 | 액션 파라미터 | 관련 정책 | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AppBarSection | 1 | AppBarHeader | 본인인증 헤더 | AppBar | - | WithBack | title: 본인인증<br>showBack: true | onClick | navigate | parent | - | 화면 크롬 |
| AuthMethodSection | 1 | RadioAuthMethod | 인증수단 선택 (잠금) | Radio | - | Disabled | label: {인증수단명} (예: 휴대폰 본인인증) | - | - | - | PI-MBR-AUTH-005-01, PI-MBR-AUTH-005-03 | 잠금 시 Disabled |
| AuthMethodSection | 2 | TextFieldPhoneAuth | 본인 휴대폰번호 입력 (잠금) | TextField | disabled | Disabled | label: 휴대폰번호<br>placeholder: 숫자만 입력<br>helperText: 잠금 해제 후 다시 시도해 주세요. | - | - | - | PI-MBR-AUTH-005-03 | - |
| AuthMethodSection | 3 | ButtonAuthCodeRequest | 인증번호 요청 버튼 (잠금) | Button | primary | Disabled | label: 인증번호 요청 | - | - | - | PI-MBR-AUTH-005-03 | - |
| AuthMethodSection | 4 | TextFieldAuthCode | 인증번호 입력 (잠금) | TextField | disabled | Disabled | label: 인증번호<br>placeholder: 6자리 숫자<br>helperText: 잠금 해제 후 다시 시도해 주세요. | - | - | - | PI-MBR-AUTH-005-03 | - |
| AuthMethodSection | 5 | ButtonAuthCodeResend | 인증번호 재요청 버튼 (잠금) | Button | secondary | Disabled | label: 재요청 | - | - | - | PI-MBR-AUTH-005-03 | - |
| AuthMethodSection | 6 | CalloutAuthLocked | 인증 잠금 안내 박스 | Callout | - | WithTitle | title.text: 인증에 실패했습니다<br>body.text: 입력 정보를 확인한 뒤 다시 시도해 주세요. 잠금 해제까지 약 10분 남았습니다. (예: 09:42) | - | - | - | PI-MBR-AUTH-005-01, PI-MBR-AUTH-005-03, PI-MBR-AUTH-005-07 | 분기 SB 추가 노출 |
| ActionButtonSection | 1 | ActionButtonVerify | 인증 완료 CTA (잠금) | ActionButton | - | Disabled | main.text: 인증 확인 | - | - | - | PI-MBR-AUTH-005-03 | 잠금 동안 비활성 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 인증 실패 5회 누적 시 | CalloutAuthLocked | visible | false → true | FN-MBR-COM-002.exceptions[2] |
| 인증 실패 5회 누적 시 | RadioAuthMethod | state | Checked → Disabled | FN-MBR-COM-002.exceptions[2] |
| 인증 실패 5회 누적 시 | ActionButtonVerify | state | OneButton → Disabled | FN-MBR-COM-002.exceptions[2] |
| 10분 경과 후 자동 해제 시 | RadioAuthMethod | state | Disabled → Checked | PI-MBR-AUTH-005-04 |
| 10분 경과 후 자동 해제 시 | CalloutAuthLocked | visible | true → false | PI-MBR-AUTH-005-04 |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 잠금 해제(10분 경과) 후 | NOVA-MBR-PU-003-0 | 본인인증 | 세션ID, 인증결과 | - | FN-MBR-COM-002.exceptions[2] |
