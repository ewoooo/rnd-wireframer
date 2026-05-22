---
오가니즘 ID: ogn-mbr-dormant-eligibility
오가니즘 명: 휴면 해제 가능 여부 판정
오가니즘 설명: 휴면 회원의 정상 복귀 가능 조건을 판정하고 필요 조치를 안내하는 오가니즘
관련 정책서: POL-MBR-DORM-001-01, POL-MBR-DORM-001-02, POL-MBR-DORM-001-03, POL-MBR-DORM-001-04, POL-MBR-DORM-001-06, POL-MBR-DORM-001-10
연관 설계서: NOVA-MBR-FP-007-0
사용된 화면: NOVA-MBR-FP-007-0
관련 정책 그룹: PG-MBR-DORM-001
관련 기능: FN-MBR-DORM-002
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-dormant-eligibility | 휴면 해제 가능 여부 판정 | 휴면 회원의 해제 가능 조건 판정 및 필요 조치 안내 처리 | vertical | 항상 | [휴면 해제 가능 여부 판정] 본인인증 필요 여부 및 재동의 약관 확인 후 해제 가능 여부 반환<br>[조건:본인인증 완료 및 데이터 복원 가능] 해제 처리 허용<br>[조건:필수 재동의 대상 존재] 약관 재동의 단계 요구<br>[액션:tap 본인인증 진행] navigate NOVA-MBR-FP-008-0<br>[상태:loading] skeleton 표시<br>[상태:error] 판정 실패: 업무 중단 및 오류 안내<br>[고지:필수\|POL-MBR-DORM-001-03] 본인확인 필요 여부<br>[고지:필수\|POL-MBR-DORM-001-04] 약관 재동의 필요 여부<br>[고지:사용성\|POL-MBR-DORM-001-06] 휴면 해제 제한 조건 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 휴면 해제 가능 여부 판정 완료 | 판정 결과 및 안내 메시지, 진행 버튼 표시 | - |
| loading | 판정 조건 조회 API 호출 중 | skeleton 표시 | apiCall |
| error | 판정 실패 | section-message(negative) 노출, 업무 중단 안내 | setState |
| blocked | 해제 불가 상태 (탈퇴·가입제한) | section-message(negative) 노출, 진행 버튼 비활성화 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | section-message-eligibility-guide | 휴면 해제 가능 안내 | section-message | info | - | - | - | [정책:POL-MBR-DORM-001-01] 휴면 해제 가능 상태 |
| 2 | section-message-eligibility-block | 해제 불가 안내 | section-message | negative | - | - | - | [정책:POL-MBR-DORM-001-02] 휴면 해제 불가 상태 |
| 3 | section-message-eligibility-error | 판정 오류 안내 | section-message | negative | - | - | - | [정책:POL-MBR-DORM-001-10] 판정 실패 처리 |
| 4 | action-area-eligibility-proceed | 본인인증 진행 버튼 영역 | action-area | strong | onClick | navigate | NOVA-MBR-FP-008-0 | [정책:POL-MBR-DORM-001-03] 본인확인 필요 여부 |
