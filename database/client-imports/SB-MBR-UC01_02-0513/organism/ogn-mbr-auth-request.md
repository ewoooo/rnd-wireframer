---
오가니즘 ID: ogn-mbr-auth-request
오가니즘 명: 본인인증 요청
오가니즘 설명: 선택한 인증수단으로 인증번호를 발송하고 입력·검증·재요청을 처리하는 오가니즘
관련 정책서: POL-MBR-AUTH-001-01, POL-MBR-AUTH-003-01, POL-MBR-AUTH-003-03, POL-MBR-AUTH-004-01, POL-MBR-AUTH-004-02, POL-MBR-AUTH-005-01, POL-MBR-AUTH-005-03
연관 설계서: NOVA-MBR-FP-003-0, NOVA-MBR-FP-008-0
사용된 화면: NOVA-MBR-FP-003-0, NOVA-MBR-FP-008-0
관련 정책 그룹: PG-MBR-AUTH-001, PG-MBR-AUTH-003, PG-MBR-AUTH-004, PG-MBR-AUTH-005
관련 기능: FN-MBR-COM-002
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-auth-request | 본인인증 요청 | 인증번호 발송·입력·검증·재요청 처리 | vertical | 항상 | [본인인증 요청] 인증번호 발송 및 입력·검증 처리<br>[조건:timer 3분 경과] 만료 시 재요청 필요<br>[액션:tap 인증 요청] apiCall<br>[액션:tap 인증 확인] apiCall<br>[액션:tap 재요청] apiCall<br>[상태:error] 인증번호 만료: 재발급 안내<br>[상태:error] 인증 실패 한도 초과: 재시도 제한<br>[상태:error] 외부 인증기관 오류: 대체 수단 안내<br>[고지:필수\|POL-MBR-AUTH-001-01] 회원 가입 본인인증 적용 여부<br>[고지:사용성\|POL-MBR-AUTH-003-03] 인증번호 유효시간<br>[고지:사용성\|POL-MBR-AUTH-004-02] 인증번호 재요청 가능 횟수<br>[고지:사용성\|POL-MBR-AUTH-005-01] 인증번호 입력 실패 허용 횟수 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 인증수단 선택 완료 | 인증번호 입력 필드 및 인증 요청 버튼 표시 | - |
| loading | 인증 요청 API 호출 중 | 버튼 loading 상태 | apiCall |
| error | 인증번호 만료 | section-message(cautionary) 노출, 재요청 버튼 활성화 | setState |
| error | 인증 실패 한도 초과 | section-message(negative) 노출, 입력 필드 비활성화 | setState |
| blocked | 재시도 제한 | section-message(negative) 노출, 모든 입력 비활성화 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | text-field-auth-code | 인증번호 입력 | text-field | - | onChange | setState | authCode | [정책:POL-MBR-AUTH-003-01] 인증번호 자리수 → max: 6 |
| 2 | text-field-auth-timer | 인증번호 유효시간 타이머 | text-field | - | - | - | - | [정책:POL-MBR-AUTH-003-03] 인증번호 유효시간 → timerDuration: 180 |
| 3 | section-message-auth-error | 인증 오류 안내 | section-message | negative | - | - | - | [정책:POL-MBR-AUTH-005-07] 실패 안내 문구 |
| 4 | section-message-auth-expire | 인증번호 만료 안내 | section-message | cautionary | - | - | - | 유효시간 만료 시 노출 |
| 5 | button-auth-retry | 인증번호 재요청 버튼 | button | outlined | onClick | apiCall | - | [정책:POL-MBR-AUTH-004-01] 인증번호 재요청 가능 시간<br>[정책:POL-MBR-AUTH-004-02] 인증번호 재요청 가능 횟수 → maxRetry: 5 |
| 6 | action-area-auth-confirm | 인증 확인 버튼 영역 | action-area | strong | onClick | apiCall | - | - |
