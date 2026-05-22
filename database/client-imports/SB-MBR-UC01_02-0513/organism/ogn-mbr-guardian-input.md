---
오가니즘 ID: ogn-mbr-guardian-input
오가니즘 명: 법정대리인 정보 입력
오가니즘 설명: 미성년자 고객의 법정대리인 이름과 연락처를 입력받아 동의 요청을 발송하는 오가니즘
관련 정책서: POL-MBR-TERM-002-01, POL-MBR-TERM-002-03, POL-MBR-TERM-002-05, POL-MBR-TERM-002-06
연관 설계서: NOVA-MBR-FP-001-0
사용된 화면: NOVA-MBR-FP-001-0
관련 정책 그룹: PG-MBR-TERM-002
관련 기능: FN-MBR-COM-004
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-guardian-input | 법정대리인 정보 입력 | 미성년자 고객의 법정대리인 정보를 입력받아 동의 요청 발송 | vertical | [고객유형] = 미성년자 | [법정대리인 정보 입력] 이름·연락처 입력 및 동의 요청 발송<br>[조건:미성년자] 법정대리인 동의 필요<br>[액션:tap 동의 요청 발송] apiCall<br>[상태:error] 법정대리인 인증 실패: 정보 수정 안내<br>[고지:필수\|POL-MBR-TERM-002-01] 법정대리인 동의 대상 고객<br>[고지:사용성\|POL-MBR-TERM-002-03] 법정대리인 인증수단<br>[고지:사용성\|POL-MBR-TERM-002-05] 법정대리인 동의 유효시간 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 미성년자 고객 확인 시 | 법정대리인 이름·연락처 입력 필드 표시 | - |
| error | 인증 실패 또는 정보 불일치 | section-message(negative) 노출 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | text-field-guardian-name | 법정대리인 이름 입력 | text-field | - | onChange | setState | guardianName | - |
| 2 | text-field-guardian-phone | 법정대리인 연락처 입력 | text-field | - | onChange | setState | guardianPhone | [정책:POL-MBR-TERM-002-03] 법정대리인 인증수단 |
| 3 | section-message-guardian-info | 법정대리인 동의 안내 | section-message | info | - | - | - | [정책:POL-MBR-TERM-002-05] 법정대리인 동의 유효시간 |
| 4 | section-message-guardian-error | 법정대리인 정보 오류 안내 | section-message | negative | - | - | - | 인증 실패 시 노출 |
| 5 | action-area-guardian-request | 동의 요청 발송 버튼 영역 | action-area | strong | onClick | apiCall | - | - |
