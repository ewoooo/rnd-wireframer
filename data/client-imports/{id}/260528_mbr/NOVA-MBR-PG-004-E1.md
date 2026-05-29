---
화면 ID: NOVA-MBR-PG-004-E1
화면 명: 회원 검증-기존 정상 회원
화면 설명: 기존 정상 회원 — 로그인 화면 이동 안내.
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
| MemberVerifySection | 1 | CalloutGuardianConsentStatus | 기존 회원 안내 | Callout | - | WithTitle | title.text: 이미 가입된 회원입니다<br>body.text: 기존 계정으로 로그인해 주세요. (예: {회원상태} = 정상) | - | - | - | PI-MBR-STAT-001-04, PI-MBR-JOIN-001-02, PI-MBR-ROUTE-001-02 | 분기 SB 강조 노출 |
| MemberVerifySection | 2 | TextFieldGuardianName | 법정대리인 이름 입력 | TextField | default | Disabled | label: 법정대리인 이름<br>placeholder: 미성년자만 입력 | - | - | - | PI-MBR-TERM-002-01 | - |
| MemberVerifySection | 3 | TextFieldGuardianPhone | 법정대리인 휴대폰번호 입력 | TextField | default | Disabled | label: 법정대리인 휴대폰번호<br>placeholder: 숫자만 입력 | - | - | - | PI-MBR-TERM-002-03 | - |
| MemberVerifySection | 4 | ButtonGuardianConsentRequest | 법정대리인 동의 요청 버튼 | Button | primary | Disabled | label: 법정대리인 동의 요청 | - | - | - | PI-MBR-TERM-002-04 | - |
| ActionButtonSection | 1 | ActionButtonGoLogin | 로그인 이동 CTA | ActionButton | - | TwoButton | main.text: 로그인하기<br>secondary.text: 아이디 찾기 | onClick<br>onClick | navigate<br>navigate | login<br>find-userid | PI-MBR-INFO-003-07, PI-MBR-ROUTE-001-02 | 후속 동선 CTA |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 기존 정상 회원 판정 시 | CalloutGuardianConsentStatus | title.text | 신규 가입이 가능한 고객입니다 → 이미 가입된 회원입니다 | FN-MBR-JOIN-003.exceptions[1] |
| 기존 정상 회원 판정 시 | ActionButtonGoLogin | state | OneButton → TwoButton | FN-MBR-JOIN-003.exceptions[1] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 로그인 선택 시 | login | 로그인 | 세션ID | - | FN-MBR-JOIN-003.exceptions[1] |
