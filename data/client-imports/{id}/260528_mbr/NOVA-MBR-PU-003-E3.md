---
화면 ID: NOVA-MBR-PU-003-E3
화면 명: 본인인증-외부 인증기관 오류
화면 설명: 외부 인증기관 오류 — 잠시 후 재시도 안내. 실패 횟수 제외 대상.
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
| AuthMethodSection | 1 | RadioAuthMethod | 인증수단 선택 | Radio | - | Checked | label: {인증수단명} (예: 휴대폰 본인인증) | onChange | setState | selectedAuthMethod | PI-MBR-AUTH-002-06 | 대체 인증수단 선택 권장 |
| AuthMethodSection | 2 | TextFieldPhoneAuth | 본인 휴대폰번호 입력 | TextField | default | Typed | label: 휴대폰번호<br>placeholder: 숫자만 입력<br>helperText: 본인 명의의 휴대폰번호를 입력해 주세요. | onChange | setState | phoneAuthInput | PI-MBR-AUTH-002-05 | - |
| AuthMethodSection | 3 | ButtonAuthCodeRequest | 인증번호 요청 버튼 | Button | primary | Enabled | label: 인증번호 요청 | onClick | apiCall | - | PI-MBR-AUTH-003-04 | - |
| AuthMethodSection | 4 | TextFieldAuthCode | 인증번호 입력 | TextField | default | Default | label: 인증번호<br>placeholder: 6자리 숫자<br>helperText: 외부 인증기관 응답 지연 중입니다. | onChange | setState | authCodeInput | PI-MBR-AUTH-003-01, PI-MBR-AUTH-006-04 | - |
| AuthMethodSection | 5 | ButtonAuthCodeResend | 인증번호 재요청 버튼 | Button | secondary | Disabled | label: 재요청 | - | - | - | PI-MBR-AUTH-004-01 | - |
| AuthMethodSection | 6 | CalloutAuthProviderError | 외부 인증기관 오류 안내 | Callout | - | WithTitle | title.text: 인증 서비스에 일시적인 오류가 발생했습니다<br>body.text: 잠시 후 다시 시도하거나 다른 인증수단을 선택해 주세요. | - | - | - | PI-MBR-AUTH-006-04, PI-MBR-AUTH-005-06 | 분기 SB 추가 노출. 실패 횟수 제외 |
| ActionButtonSection | 1 | ActionButtonVerify | 인증 완료 CTA | ActionButton | - | TwoButton | main.text: 다시 시도<br>secondary.text: 다른 인증수단 선택 | onClick<br>onClick | apiCall<br>setState | -<br>selectedAuthMethod | PI-MBR-AUTH-002-06, PI-MBR-AUTH-006-04 | 대체 인증수단으로 분기 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 외부 인증기관 오류 발생 시 | CalloutAuthProviderError | visible | false → true | FN-MBR-COM-002.exceptions[3] |
| 외부 인증기관 오류 발생 시 | ActionButtonVerify | state | OneButton → TwoButton | FN-MBR-COM-002.exceptions[3] |
| 외부 인증 정상화 시 | CalloutAuthProviderError | visible | true → false | FN-MBR-COM-002.processing_logic[1] |
| 외부 인증 정상화 시 | ActionButtonVerify | state | TwoButton → OneButton | FN-MBR-COM-002.processing_logic[1] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 외부 인증기관 오류 해소 후 | NOVA-MBR-PU-003-0 | 본인인증 | 세션ID, 인증결과 | - | FN-MBR-COM-002.exceptions[3] |
