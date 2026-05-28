---
화면 ID: NOVA-MBR-PG-004-E5
화면 명: 회원 검증-법정대리인 동의 유효시간 만료
화면 설명: 법정대리인 동의 유효시간 만료(만료) — 동의 재요청 안내.
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
| MemberVerifySection | 1 | CalloutGuardianConsentStatus | 법정대리인 동의 만료 안내 | Callout | - | WithTitle | title.text: 법정대리인 동의 유효시간이 만료되었습니다<br>body.text: 24시간이 지나 동의가 만료되었습니다. 동의 요청을 다시 보내 주세요. | - | - | - | PI-MBR-TERM-002-05, PI-MBR-TERM-002-06 | 분기 SB 강조 노출 |
| MemberVerifySection | 2 | TextFieldGuardianName | 법정대리인 이름 입력 | TextField | default | Typed | label: 법정대리인 이름<br>placeholder: 법정대리인 실명 | onChange | setState | guardianNameInput | PI-MBR-INFO-001-05 | 이전 입력값 유지 |
| MemberVerifySection | 3 | TextFieldGuardianPhone | 법정대리인 휴대폰번호 입력 | TextField | default | Typed | label: 법정대리인 휴대폰번호<br>placeholder: 숫자만 입력 | onChange | setState | guardianPhoneInput | PI-MBR-INFO-001-05 | 이전 입력값 유지 |
| MemberVerifySection | 4 | ButtonGuardianConsentRequest | 법정대리인 동의 재요청 버튼 | Button | primary | Enabled | label: 동의 재요청 SMS 발송 | onClick | apiCall | - | PI-MBR-TERM-002-05 | 재발송 |
| ActionButtonSection | 1 | ActionButtonNext | 다음 단계 진행 CTA | ActionButton | - | Disabled | main.text: 다음 | - | - | - | PI-MBR-TERM-002-06 | 재동의 완료 시 활성화. onClick navigate NOVA-MBR-PG-005-0 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 법정대리인 동의 유효시간 만료 시 | CalloutGuardianConsentStatus | title.text | 법정대리인 동의가 필요합니다 → 법정대리인 동의 유효시간이 만료되었습니다 | FN-MBR-COM-004.exceptions[1] |
| 법정대리인 동의 유효시간 만료 시 | ButtonGuardianConsentRequest | label.text | 동의 요청 SMS 발송 → 동의 재요청 SMS 발송 | FN-MBR-COM-004.exceptions[1] |
| 법정대리인 동의 재완료 시 | ActionButtonNext | state | Disabled → OneButton | FN-MBR-COM-004.processing_logic[3] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 법정대리인 동의 재완료 시 | NOVA-MBR-PG-005-0 | 가입 완료 | 세션ID, 법정대리인 동의 결과 | - | FN-MBR-COM-004.exceptions[1] |
