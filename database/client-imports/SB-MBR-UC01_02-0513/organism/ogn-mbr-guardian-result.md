---
오가니즘 ID: ogn-mbr-guardian-result
오가니즘 명: 법정대리인 동의 결과 확인
오가니즘 설명: 법정대리인 동의 완료 여부를 확인하고 결과를 안내하는 오가니즘
관련 정책서: POL-MBR-TERM-002-05, POL-MBR-TERM-002-06
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
| ogn-mbr-guardian-result | 법정대리인 동의 결과 확인 | 법정대리인 동의 요청 발송 후 결과 폴링 및 상태 안내 | vertical | [고객유형] = 미성년자 | [법정대리인 동의 결과 확인] 동의 완료 여부 확인 및 안내<br>[상태:loading] 동의 대기 중 안내 표시<br>[상태:error] 동의 유효시간 만료: 재요청<br>[고지:필수\|POL-MBR-TERM-002-06] 법정대리인 동의 미완료 처리<br>[고지:사용성\|POL-MBR-TERM-002-05] 법정대리인 동의 유효시간 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 동의 요청 발송 완료 | 동의 대기 안내 메시지 표시 | apiCall |
| loading | 동의 결과 폴링 중 | 대기 상태 안내 표시 | apiCall |
| error | 유효시간 만료 또는 동의 미완료 | section-message(negative) 노출, 재요청 버튼 활성화 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | section-message-guardian-wait | 법정대리인 동의 대기 안내 | section-message | info | - | - | - | [정책:POL-MBR-TERM-002-05] 법정대리인 동의 유효시간 |
| 2 | section-message-guardian-expire | 동의 유효시간 만료 안내 | section-message | negative | - | - | - | 만료 시 노출 |
| 3 | button-guardian-retry | 동의 재요청 버튼 | button | solid | onClick | apiCall | - | 유효시간 만료 시 활성화 |
