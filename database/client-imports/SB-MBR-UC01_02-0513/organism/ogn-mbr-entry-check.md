---
오가니즘 ID: ogn-mbr-entry-check
오가니즘 명: 가입 진입 조건 확인
오가니즘 설명: 고객의 채널·로그인 상태·기존 회원 여부를 확인하여 가입 가능 경로를 분기하는 오가니즘
관련 정책서: POL-MBR-INFO-003-01, POL-MBR-INFO-003-07, POL-MBR-INFO-003-08, POL-MBR-INFO-003-09
연관 설계서: NOVA-MBR-FP-002-0
사용된 화면: NOVA-MBR-FP-002-0
관련 정책 그룹: PG-MBR-INFO-003
관련 기능: FN-MBR-JOIN-001
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-entry-check | 가입 진입 조건 확인 | 진입 채널·로그인 상태·기존 회원 여부 확인 및 가입 가능 경로 분기 | vertical | 항상 | [가입 진입 조건 확인] 채널·로그인 상태·회원 여부 확인 및 경로 분기<br>[상태:loading] skeleton 표시<br>[상태:error] 이미 가입된 회원: 로그인 또는 내정보 안내<br>[상태:error] 휴면 회원: 휴면 해제 안내<br>[상태:error] 재가입 제한 대상: 제한 안내<br>[고지:사용성\|POL-MBR-INFO-003-07] 기존 정상 회원 식별 시 처리<br>[고지:사용성\|POL-MBR-INFO-003-08] 기존 휴면 회원 식별 시 처리<br>[고지:사용성\|POL-MBR-INFO-003-09] 기존 탈퇴 회원 식별 시 처리 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 화면 진입 | 진입 조건 확인 API 호출 | apiCall |
| loading | API 호출 중 | skeleton 표시 | apiCall |
| error | 기존 회원 식별 | section-message(cautionary) 노출, 안내 메시지 표시 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | section-message-entry-existing | 기존 정상 회원 안내 | section-message | cautionary | - | - | - | [정책:POL-MBR-INFO-003-07] 기존 정상 회원 식별 시 처리 |
| 2 | section-message-entry-dormant | 휴면 회원 안내 | section-message | cautionary | - | - | - | [정책:POL-MBR-INFO-003-08] 기존 휴면 회원 식별 시 처리 |
| 3 | section-message-entry-withdrawn | 탈퇴 회원 안내 | section-message | info | - | - | - | [정책:POL-MBR-INFO-003-09] 기존 탈퇴 회원 식별 시 처리 |
