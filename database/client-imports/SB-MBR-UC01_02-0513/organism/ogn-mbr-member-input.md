---
오가니즘 ID: ogn-mbr-member-input
오가니즘 명: 회원 정보 입력
오가니즘 설명: 회원 가입에 필요한 기본 개인정보를 입력받고 형식·중복을 검증하는 오가니즘
관련 정책서: POL-MBR-INFO-001-01, POL-MBR-INFO-001-02, POL-MBR-INFO-002-01, POL-MBR-INFO-002-04, POL-MBR-INFO-002-05, POL-MBR-INFO-002-11
연관 설계서: NOVA-MBR-FP-002-0
사용된 화면: NOVA-MBR-FP-002-0
관련 정책 그룹: PG-MBR-INFO-001, PG-MBR-INFO-002
관련 기능: FN-MBR-JOIN-002
작성일: 2026-05-12
작성자: plus
버전: 1.00
---

## 오가니즘 정보

| 오가니즘 ID | 오가니즘 명 | 오가니즘 설명 | 오가니즘 레이아웃 | 노출 조건 | 노출 케이스 |
|------------|-----------|-------------|----------------|----------|-----------|
| ogn-mbr-member-input | 회원 정보 입력 | 가입에 필요한 기본 개인정보 입력 및 형식·중복 검증 | vertical | 항상 | [회원 정보 입력] 아이디·비밀번호·이메일·연락처 입력<br>[액션:tap 다음] navigate NOVA-MBR-FP-003-0<br>[상태:error] 필수값 누락: 다음 단계 진행 불가<br>[상태:error] 형식 오류: 입력 필드 invalid 상태 표시<br>[상태:error] 중복 아이디·이메일·연락처: 수정 요청<br>[고지:필수\|POL-MBR-INFO-001-01] 회원 가입 필수 입력 항목<br>[고지:사용성\|POL-MBR-INFO-002-04] 아이디 길이<br>[고지:사용성\|POL-MBR-INFO-002-05] 비밀번호 길이 |

## 케이스 분기

| 상태 | 트리거 | 컴포넌트 변화 | 액션 |
|------|--------|-------------|------|
| default | 화면 진입 | 입력 필드 활성화 | - |
| error | 필수값 누락 또는 형식 오류 | 해당 text-field invalid 상태, section-message(negative) 노출 | setState |
| error | 중복 정보 확인 실패 | 중복 필드 invalid 상태 표시 | setState |

## 컴포넌트 상세

| no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 이벤트 | 액션 | 액션 파라미터 | 비고 |
|-----|-----------|-----------|----------------|---------|-------|-----|------------|-----|
| 1 | text-field-user-id | 아이디 입력 | text-field | - | onChange | setState | userId | [정책:POL-MBR-INFO-002-04] 아이디 길이 → max: 20 |
| 2 | text-field-password | 비밀번호 입력 | text-field | - | onChange | setState | password | [정책:POL-MBR-INFO-002-05] 비밀번호 길이 → max: 20 |
| 3 | text-field-email | 이메일 입력 | text-field | - | onChange | setState | email | [정책:POL-MBR-INFO-001-01] 회원 가입 필수 입력 항목 |
| 4 | text-field-phone | 연락처 입력 | text-field | - | onChange | setState | phone | [정책:POL-MBR-INFO-001-01] 회원 가입 필수 입력 항목 |
| 5 | section-message-input-error | 입력 오류 안내 | section-message | negative | - | - | - | 검증 실패 시 노출 |
| 6 | action-area-next | 다음 버튼 영역 | action-area | strong | onClick | navigate | NOVA-MBR-FP-003-0 | - |
