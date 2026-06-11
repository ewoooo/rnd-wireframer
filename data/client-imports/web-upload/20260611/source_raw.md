---
화면 ID: NOVA-MBR-PG-004-0
화면 명: 회원 검증
화면 설명: 본인인증 결과로 회원 상태를 조회하고 신규 가입 가능 여부를 판정한다.
화면 경로: 회원 가입 > 회원 검증
구현 유형: PG
관련 정책 그룹: PG-MBR-STAT-001, PG-MBR-JOIN-001, PG-MBR-ROUTE-001, PG-MBR-TERM-002
관련 유즈케이스: US-MBR-CS-001
관련 기능: FN-MBR-COM-001, FN-MBR-COM-004, FN-MBR-JOIN-003
상태: 초안
작성일: 2026-05-28
작성자: kyeom
버전: 1.00

---

## 화면 구성

| 섹션 번호 | 섹션 유형 | 섹션 명 | 관련 기능 | 섹션 설명 | 섹션 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | static | AppBarSection | - | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | MemberVerifySection | FN-MBR-COM-001, FN-MBR-JOIN-003, FN-MBR-COM-004 | 회원 상태 조회 및 분기 안내 | vertical | 본인인증 완료 시 | 유형(노출 여부), 순서 | 1 | N | 1 | 섹션 전체 숨김 |
| 999 | dynamic | ActionButtonSection | - | 화면 하단 액션 섹션 | vertical | 항상 | 유형(노출 여부) | - | - | - | - |

## 컴포넌트 상세

| 섹션 명 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | state | props | 이벤트 | 액션 | 액션 파라미터 | 관련 정책 | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AppBarSection | 1 | AppBarHeader | 회원 검증 헤더 | AppBar | - | WithBack | title: 회원 검증<br>showBack: true | onClick | navigate | parent | - | 화면 크롬 |
| MemberVerifySection | 1 | CalloutGuardianConsentStatus | 회원 상태 안내 박스 | Callout | - | WithTitle | title.text: 신규 가입이 가능한 고객입니다<br>body.text: 다음 단계에서 가입을 완료해 주세요. (예: {회원상태} = 미가입) | - | - | - | PI-MBR-STAT-001-01, PI-MBR-STAT-001-08, PI-MBR-JOIN-001-01 | 상태 판정 결과 표시 |
| MemberVerifySection | 2 | TextFieldGuardianName | 법정대리인 이름 입력 | TextField | default | Disabled | label: 법정대리인 이름<br>placeholder: 미성년자만 입력<br>helperText: 만 14세 미만 가입 시 법정대리인 정보가 필요합니다. | onChange | setState | guardianNameInput | PI-MBR-TERM-002-01, PI-MBR-INFO-001-05 | 미성년자 분기 시 활성화 |
| MemberVerifySection | 3 | TextFieldGuardianPhone | 법정대리인 휴대폰번호 입력 | TextField | default | Disabled | label: 법정대리인 휴대폰번호<br>placeholder: 숫자만 입력 | onChange | setState | guardianPhoneInput | PI-MBR-TERM-002-03, PI-MBR-INFO-001-05 | 미성년자 분기 시 활성화 |
| MemberVerifySection | 4 | ButtonGuardianConsentRequest | 법정대리인 동의 요청 버튼 | Button | primary | Disabled | label: 법정대리인 동의 요청 | onClick | apiCall | - | PI-MBR-TERM-002-04, PI-MBR-TERM-002-05 | 미성년자 분기 시 활성화. SMS 발송 |
| ActionButtonSection | 1 | ActionButtonNext | 다음 단계 진행 CTA | ActionButton | - | OneButton | main.text: 다음 | onClick | navigate | NOVA-MBR-PG-005-0 | PI-MBR-JOIN-001-01, PI-MBR-ROUTE-001-01 | 정상 미가입 회원만 활성 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 미가입(신규) 판정 시 | ActionButtonNext | state | Disabled → OneButton | FN-MBR-JOIN-003.processing_logic[1] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 신규 가입 가능 확인 시 | NOVA-MBR-PG-005-0 | 가입 완료 | 세션ID, 회원상태(미가입) | - | PR-MBR-CS-001-04.후행 |
| 케이스 분기 | 미성년자 - 법정대리인 동의 필요 | NOVA-MBR-PG-004-1 | 회원 검증-미성년자 - 법정대리인 동의 필요 | - | 법정대리인 정보 입력·동의 요청 후 동의 확인 시 진행 | FN-MBR-COM-004.processing_logic[1] |
| 케이스 분기 | 기존 정상 회원 | NOVA-MBR-PG-004-E1 | 회원 검증-기존 정상 회원 | - | 로그인 화면 이동 안내 | FN-MBR-JOIN-003.exceptions[1] |
| 케이스 분기 | 기존 휴면 회원 | NOVA-MBR-PG-004-E2 | 회원 검증-기존 휴면 회원 | - | 휴면 해제 프로세스 이동 안내 | FN-MBR-JOIN-003.exceptions[2] |
| 케이스 분기 | 기존 탈퇴 회원 | NOVA-MBR-PG-004-E3 | 회원 검증-기존 탈퇴 회원 | - | 재가입 가능 여부 확인 안내 | FN-MBR-JOIN-003.exceptions[3] |
| 케이스 분기 | 가입제한 회원 | NOVA-MBR-PG-004-E4 | 회원 검증-가입제한 회원 | - | 가입 불가 사유 안내 | FN-MBR-JOIN-003.exceptions[4] |
| 케이스 분기 | 법정대리인 동의 유효시간 만료 | NOVA-MBR-PG-004-E5 | 회원 검증-법정대리인 동의 유효시간 만료 | - | 동의 재요청 안내 | FN-MBR-COM-004.exceptions[1] |
| 케이스 분기 | 상태 조회 시스템 오류 | NOVA-MBR-PG-004-E6 | 회원 검증-상태 조회 시스템 오류 | - | 재시도 안내 | FN-MBR-COM-001.exceptions[1] |
