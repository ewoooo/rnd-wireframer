---
오가니즘 ID: ogn-mbr-join-path
오가니즘 명: 가입 경로 분기
오가니즘 설명: 본인인증 결과와 기존 이력을 기준으로 가입 가능 여부를 판정하고 경로를 분기하는 오가니즘
관련 정책서: POL-MBR-JOIN-001-01, POL-MBR-JOIN-001-03, POL-MBR-JOIN-001-05, POL-MBR-JOIN-001-11, POL-MBR-ROUTE-001-01, POL-MBR-ROUTE-001-02, POL-MBR-ROUTE-001-03, POL-MBR-ROUTE-001-04, POL-MBR-ROUTE-001-05
연관 설계서: NOVA-MBR-FP-004-0
사용된 화면: NOVA-MBR-FP-004-0
관련 정책 그룹: PG-MBR-JOIN-001, PG-MBR-ROUTE-001
관련 기능: FN-MBR-JOIN-003
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-join-path | 가입 경로 분기 | 가입 가능 여부 판정 및 상태별 경로 분기 안내 | vertical | 항상 | [가입 경로 분기] 신규 가입 가능 여부 판정 및 경로 분기<br>[상태:loading] skeleton 표시<br>[액션:tap 가입 진행] navigate NOVA-MBR-FP-005-0<br>[상태:error] 기존 정상 회원: 가입 진행 불가 안내<br>[상태:error] 휴면 회원: 휴면 해제 경로 제시<br>[상태:error] 재가입 제한: 제한 사유 안내<br>[고지:필수\|POL-MBR-JOIN-001-01] 신규가입 가능 고객 상태<br>[고지:사용성\|POL-MBR-JOIN-001-11] 가입 제한 사유 코드<br>[고지:사용성\|POL-MBR-ROUTE-001-01] 미가입 상태 이동 경로 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 회원 상태 조회 완료 | 판정 결과에 따른 안내 표시 | apiCall |
| loading | 판정 API 호출 중 | skeleton 표시 | apiCall |
| error | 가입 불가 판정 | section-message(negative) 노출, 대체 경로 안내 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | section-message-join-available | 신규 가입 가능 안내 | section-message | positive | - | - | - | [정책:POL-MBR-JOIN-001-01] 신규가입 가능 고객 상태 |
| 2 | section-message-join-dormant | 휴면 해제 유도 안내 | section-message | cautionary | - | - | - | [정책:POL-MBR-JOIN-001-03] 기존 휴면 회원 처리 |
| 3 | section-message-join-blocked | 가입 제한 안내 | section-message | negative | - | - | - | [정책:POL-MBR-JOIN-001-05] 가입 제한 고객 처리 |
| 4 | action-area-join-proceed | 가입 진행 버튼 영역 | action-area | strong | onClick | navigate | NOVA-MBR-FP-005-0 | 미가입 상태 판정 시 활성화 |
