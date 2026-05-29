---
화면 ID: NOVA-MBR-PU-003-0
화면 명: 본인인증
화면 설명: 신규 가입자의 본인 여부를 인증 수단으로 확인한다.
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
| AuthMethodSection | 1 | RadioAuthMethod | 인증수단 선택 | Radio | - | Checked | label: {인증수단명} (예: 휴대폰 본인인증) | onChange | setState | selectedAuthMethod | PI-MBR-AUTH-002-01, PI-MBR-AUTH-002-05, PI-MBR-AUTH-002-09 | 기본값=휴대폰 본인인증. 순서=휴대폰 → PASS → 공동인증서 |
| AuthMethodSection | 2 | TextFieldPhoneAuth | 본인 휴대폰번호 입력 | TextField | default | Default | label: 휴대폰번호<br>placeholder: 숫자만 입력<br>helperText: 본인 명의의 휴대폰번호를 입력해 주세요. | onChange | setState | phoneAuthInput | PI-MBR-AUTH-002-05 | 휴대폰 본인인증 선택 시 노출 |
| AuthMethodSection | 3 | ButtonAuthCodeRequest | 인증번호 요청 버튼 | Button | primary | Disabled | label: 인증번호 요청 | onClick | apiCall | - | PI-MBR-AUTH-003-01, PI-MBR-AUTH-003-04 | 휴대폰번호 입력 후 활성화. onSuccess 시 인증번호 SMS 발송 |
| AuthMethodSection | 4 | TextFieldAuthCode | 인증번호 입력 | TextField | default | Disabled | label: 인증번호<br>placeholder: 6자리 숫자<br>helperText: 유효시간 03:00 (예: 02:45) | onChange | setState | authCodeInput | PI-MBR-AUTH-003-01, PI-MBR-AUTH-003-03 | 인증번호 발급 후 활성화 |
| AuthMethodSection | 5 | ButtonAuthCodeResend | 인증번호 재요청 버튼 | Button | secondary | Disabled | label: 재요청 (예: 00:60) | onClick | apiCall | - | PI-MBR-AUTH-004-01, PI-MBR-AUTH-004-02 | 발급 후 60초 경과 후 활성화 |
| ActionButtonSection | 1 | ActionButtonVerify | 인증 완료 CTA | ActionButton | - | Disabled | main.text: 인증 확인 | onClick | apiCall | - | PI-MBR-AUTH-006-01 | 인증번호 입력 완료 시 활성화. onSuccess 시 NOVA-MBR-PG-004-0 이동 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 휴대폰번호 입력 완료 시 | ButtonAuthCodeRequest | state | Disabled → Enabled | FN-MBR-COM-002.processing_logic[2] |
| 인증번호 요청 성공 시 | TextFieldAuthCode | state | Disabled → Default | FN-MBR-COM-002.processing_logic[3] |
| 발급 후 60초 경과 시 | ButtonAuthCodeResend | state | Disabled → Enabled | FN-MBR-COM-002.processing_logic[3] |
| 인증번호 6자리 입력 완료 시 | ActionButtonVerify | state | Disabled → OneButton | FN-MBR-COM-002.processing_logic[4] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 본인인증 성공 시 | NOVA-MBR-PG-004-0 | 회원 검증 | 세션ID, 인증결과(CI, DI, 이름, 생년월일, 성별, 휴대폰번호) | - | PR-MBR-CS-001-03.후행 |
| 케이스 분기 | 인증번호 만료 | NOVA-MBR-PU-003-E1 | 본인인증-인증번호 만료 | - | 인증번호 재발급 안내 | FN-MBR-COM-002.exceptions[1] |
| 케이스 분기 | 인증 실패 한도 초과 | NOVA-MBR-PU-003-E2 | 본인인증-인증 실패 한도 초과 | - | 인증 잠금 안내 (10분 대기) | FN-MBR-COM-002.exceptions[2] |
| 케이스 분기 | 외부 인증기관 오류 | NOVA-MBR-PU-003-E3 | 본인인증-외부 인증기관 오류 | - | 잠시 후 재시도 안내 | FN-MBR-COM-002.exceptions[3] |
