---
오가니즘 ID: ogn-mbr-join-complete
오가니즘 명: 가입 완료
오가니즘 설명: 가입 결과를 안내하고 후속 액션(홈 이동 또는 목적지 이동)을 제공하는 오가니즘
관련 정책서: -
연관 설계서: NOVA-MBR-FP-005-0
사용된 화면: NOVA-MBR-FP-005-0
관련 정책 그룹: -
관련 기능: FN-MBR-JOIN-005
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-join-complete | 가입 완료 | 가입 완료 결과 안내 및 홈·목적지 이동 처리 | vertical | 항상 | [가입 완료 안내] 가입 결과 및 후속 액션 제공<br>[액션:tap 홈으로 이동] navigate 홈<br>[상태:error] 가입 완료 알림 실패: 화면 안내 유지<br>[상태:error] 세션 생성 실패: 로그인 재시도 안내 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 가입 성공 | 가입 완료 안내 메시지 및 CTA 버튼 표시 | - |
| error | 세션 생성 실패 | section-message(cautionary) 노출, 로그인 재시도 버튼 표시 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | section-message-join-success | 가입 완료 안내 메시지 | section-message | positive | - | - | - | - |
| 2 | section-message-session-error | 세션 생성 실패 안내 | section-message | cautionary | - | - | - | 세션 생성 실패 시 노출 |
| 3 | action-area-join-done | 홈으로 이동 버튼 영역 | action-area | strong | onClick | navigate | 홈 | - |
