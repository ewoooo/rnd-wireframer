---
오가니즘 ID: ogn-mbr-dormant-detect
오가니즘 명: 휴면 감지 및 안내
오가니즘 설명: 로그인 시도 중 휴면 회원 여부를 감지하고 휴면 해제 플로우로 안내하는 오가니즘
관련 정책서: POL-MBR-LOGIN-001-01, POL-MBR-LOGIN-001-02, POL-MBR-LOGIN-001-06, POL-MBR-LOGIN-001-07, POL-MBR-LOGIN-001-12
연관 설계서: NOVA-MBR-FP-006-0
사용된 화면: NOVA-MBR-FP-006-0
관련 정책 그룹: PG-MBR-LOGIN-001
관련 기능: FN-MBR-DORM-001
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-dormant-detect | 휴면 감지 및 안내 | 로그인 시도 중 휴면 상태 감지 및 휴면 해제 플로우 안내 처리 | vertical | 항상 | [휴면 감지 및 안내] 로그인 계정의 휴면 상태 감지 후 안내 메시지 노출<br>[조건:회원상태=휴면] 휴면 안내 메시지 노출 및 해제 플로우 이동<br>[액션:tap 휴면 해제하기] navigate NOVA-MBR-FP-007-0<br>[상태:loading] skeleton 표시<br>[상태:error] 상태 조회 실패: 재시도 안내<br>[상태:empty] 계정 미존재: 가입 또는 아이디 찾기 안내<br>[고지:필수\|POL-MBR-LOGIN-001-06] 휴면 안내 노출 조건<br>[고지:사용성\|POL-MBR-LOGIN-001-12] 휴면 진입 안내 문구 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 휴면 계정 감지 완료 | section-message(cautionary) 및 휴면 해제 버튼 표시 | - |
| loading | 회원 상태 조회 API 호출 중 | skeleton 표시 | apiCall |
| error | 상태 조회 실패 | section-message(negative) 노출, 재시도 버튼 활성화 | setState |
| empty | 계정 미존재 | section-message(info) 노출, 가입/아이디 찾기 안내 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | section-message-dormant-guide | 휴면 상태 안내 메시지 | section-message | cautionary | - | - | - | [정책:POL-MBR-LOGIN-001-12] 휴면 진입 안내 문구 |
| 2 | section-message-dormant-error | 조회 오류 안내 | section-message | negative | - | - | - | 상태 조회 실패 시 노출 |
| 3 | action-area-dormant-release | 휴면 해제하기 버튼 영역 | action-area | strong | onClick | navigate | NOVA-MBR-FP-007-0 | [정책:POL-MBR-LOGIN-001-07] 휴면 해제 이동 경로 |
