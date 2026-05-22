---
오가니즘 ID: ogn-mbr-member-status
오가니즘 명: 회원 상태 조회
오가니즘 설명: 고객 식별정보를 기준으로 회원 상태와 업무 진입 가능 상태를 조회하여 표시하는 오가니즘
관련 정책서: POL-MBR-STAT-001-01, POL-MBR-STAT-001-05, POL-MBR-STAT-001-06, POL-MBR-STAT-001-10
연관 설계서: NOVA-MBR-FP-004-0, NOVA-MBR-FP-006-0, NOVA-MBR-FP-007-0
사용된 화면: NOVA-MBR-FP-004-0, NOVA-MBR-FP-006-0, NOVA-MBR-FP-007-0
관련 정책 그룹: PG-MBR-STAT-001
관련 기능: FN-MBR-COM-001
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-member-status | 회원 상태 조회 | 고객 식별정보 기준 회원 상태 조회 및 후속 처리 안내 | vertical | 항상 | [회원 상태 조회] 식별정보 기반 회원 상태·이력 조회<br>[상태:loading] skeleton 표시<br>[상태:error] 조회 시스템 오류: 재시도 안내<br>[고지:필수\|POL-MBR-STAT-001-01] 상태 코드<br>[고지:사용성\|POL-MBR-STAT-001-05] 휴면 상태 후속 처리<br>[고지:사용성\|POL-MBR-STAT-001-06] 탈퇴 상태 후속 처리<br>[고지:사용성\|POL-MBR-STAT-001-10] 조회 실패 처리 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 본인인증 완료 후 화면 진입 | 회원 상태 조회 API 호출 | apiCall |
| loading | API 호출 중 | skeleton 표시 | apiCall |
| error | 조회 시스템 오류 | section-message(negative) 노출, 재시도 버튼 표시 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | section-message-status-dormant | 휴면 회원 안내 | section-message | cautionary | - | - | - | [정책:POL-MBR-STAT-001-05] 휴면 상태 후속 처리 |
| 2 | section-message-status-withdrawn | 탈퇴 회원 안내 | section-message | info | - | - | - | [정책:POL-MBR-STAT-001-06] 탈퇴 상태 후속 처리 |
| 3 | section-message-status-error | 조회 오류 안내 | section-message | negative | - | - | - | [정책:POL-MBR-STAT-001-10] 조회 실패 처리 |
| 4 | button-status-retry | 재시도 버튼 | button | outlined | onClick | apiCall | - | 오류 발생 시 노출 |
