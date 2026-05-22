---
오가니즘 ID: ogn-mbr-dormant-release
오가니즘 명: 휴면 해제 처리
오가니즘 설명: 본인인증 및 약관 재동의 완료 후 휴면 상태를 정상으로 전환하고 데이터를 복원하는 오가니즘
관련 정책서: POL-MBR-DORM-002-01, POL-MBR-DORM-002-02, POL-MBR-DORM-002-03, POL-MBR-DORM-002-07, POL-MBR-DORM-003-01, POL-MBR-DORM-003-07, POL-MBR-DORM-003-08, POL-MBR-SESS-002-01, POL-MBR-SESS-002-04, POL-MBR-SESS-002-06, POL-MBR-SESS-002-07
연관 설계서: NOVA-MBR-FP-010-0
사용된 화면: NOVA-MBR-FP-010-0
관련 정책 그룹: PG-MBR-DORM-002, PG-MBR-DORM-003, PG-MBR-SESS-002
관련 기능: FN-MBR-DORM-003
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-dormant-release | 휴면 해제 처리 | 휴면 상태 정상 전환 및 분리보관 데이터 복원 처리 | vertical | 항상 | [휴면 해제 처리] 본인인증·약관 재동의 결과 확인 후 상태 전환 및 데이터 복원 진행<br>[상태:loading] skeleton 표시<br>[상태:error] 상태 전환 실패: 휴면 상태 유지 및 오류 안내<br>[상태:error] 데이터 복원 실패: 해제 보류 및 오류 안내<br>[상태:error] 세션 복구 실패: 재로그인 유도<br>[고지:필수\|POL-MBR-DORM-002-03] 상태 전환 조건<br>[고지:사용성\|POL-MBR-DORM-003-01] 복원 대상 데이터<br>[고지:사용성\|POL-MBR-SESS-002-04] 재로그인 필요 여부 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 해제 조건 충족 확인 | 처리 중 안내 메시지 및 로딩 표시 | apiCall |
| loading | 휴면 해제 API 호출 중 | skeleton 표시 | apiCall |
| error | 상태 전환 실패 | section-message(negative) 노출, 업무 중단 안내 | setState |
| error | 데이터 복원 실패 | section-message(negative) 노출, 해제 보류 안내 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | section-message-release-progress | 휴면 해제 처리 중 안내 | section-message | info | - | - | - | [정책:POL-MBR-DORM-002-03] 상태 전환 조건 |
| 2 | section-message-release-error | 처리 오류 안내 | section-message | negative | - | - | - | [정책:POL-MBR-DORM-002-07] 상태 전환 실패 처리<br>[정책:POL-MBR-DORM-003-08] 복원 실패 처리 |
| 3 | section-message-release-session-error | 세션 복구 실패 안내 | section-message | cautionary | - | - | - | [정책:POL-MBR-SESS-002-07] 세션 복구 실패 처리 |
