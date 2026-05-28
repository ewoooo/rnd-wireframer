---
화면 ID: NOVA-MBR-PU-002-E1
화면 명: 개인정보 입력-필수값 누락
화면 설명: 필수값 누락(제한) — 누락 항목 강조·다음 단계 진행 불가.
화면 경로: 회원 가입 > 개인정보 입력
구현 유형: PU
관련 정책 그룹: PG-MBR-INFO-001, PG-MBR-INFO-002, PG-MBR-INFO-003
관련 유즈케이스: US-MBR-CS-001
관련 기능: FN-MBR-JOIN-001, FN-MBR-JOIN-002
상태: 초안
작성일: 2026-05-28
작성자: kyeom
버전: 1.00

---

## 화면 구성

| 섹션 번호 | 섹션 유형 | 섹션 명 | 관련 기능 | 섹션 설명 | 섹션 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | static | AppBarSection | - | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | MemberInfoSection | FN-MBR-JOIN-002, FN-MBR-JOIN-001 | 회원 정보 입력 및 검증 | vertical | 약관 동의 완료 시 | 유형(노출 여부) | 4 | N | 1 | 섹션 전체 숨김 |
| 999 | dynamic | ActionButtonSection | - | 화면 하단 액션 섹션 | vertical | 항상 | 유형(노출 여부) | - | - | - | - |

## 컴포넌트 상세

| 섹션 명 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | state | props | 이벤트 | 액션 | 액션 파라미터 | 관련 정책 | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AppBarSection | 1 | AppBarHeader | 개인정보 입력 헤더 | AppBar | - | WithBack | title: 개인정보 입력<br>showBack: true | onClick | navigate | parent | - | 화면 크롬 |
| MemberInfoSection | 1 | TextFieldUserid | 아이디 입력 필드 (누락 강조) | TextField | default | Error | label: 아이디<br>placeholder: 영문/숫자 6~20자<br>helperText: 아이디를 입력해 주세요. | onChange | setState | useridInput | PI-MBR-INFO-002-01, PI-MBR-INFO-002-02 | 누락 시 Error |
| MemberInfoSection | 2 | TextFieldPassword | 비밀번호 입력 필드 (누락 강조) | TextField | default | Error | label: 비밀번호<br>placeholder: 10~20자<br>helperText: 비밀번호를 입력해 주세요.<br>type: password | onChange | setState | passwordInput | PI-MBR-INFO-002-01, PI-MBR-INFO-002-02 | 누락 시 Error |
| MemberInfoSection | 3 | TextFieldEmail | 이메일 입력 필드 (누락 강조) | TextField | default | Error | label: 이메일<br>placeholder: 예: user@example.com<br>helperText: 이메일을 입력해 주세요. | onChange | setState | emailInput | PI-MBR-INFO-002-01, PI-MBR-INFO-002-02 | 누락 시 Error |
| MemberInfoSection | 4 | TextFieldPhone | 연락처 입력 필드 (누락 강조) | TextField | default | Error | label: 연락처<br>placeholder: 휴대폰번호 숫자만 입력<br>helperText: 연락처를 입력해 주세요. | onChange | setState | phoneInput | PI-MBR-INFO-002-01, PI-MBR-INFO-002-02 | 누락 시 Error |
| MemberInfoSection | 5 | CalloutMissingRequired | 필수값 누락 안내 박스 | Callout | - | Default | body.text: 모든 필수 항목을 입력해야 다음 단계로 진행할 수 있습니다. | - | - | - | PI-MBR-INFO-002-02 | 분기 SB 추가 노출 |
| ActionButtonSection | 1 | ActionButtonNext | 다음 단계 진행 CTA | ActionButton | - | Disabled | main.text: 다음 | - | - | - | PI-MBR-INFO-002-02 | 필수값 누락 동안 비활성 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 필수값 누락 상태에서 다음 시도 시 | CalloutMissingRequired | visible | false → true | FN-MBR-JOIN-002.exceptions[1] |
| 누락 항목 입력 완료 시 | TextFieldUserid | state | Error → Default | FN-MBR-JOIN-002.processing_logic[2] |
| 모든 필수값 입력 완료 시 | ActionButtonNext | state | Disabled → OneButton | FN-MBR-JOIN-002.processing_logic[2] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 필수값 누락 해소 후 | NOVA-MBR-PU-002-0 | 개인정보 입력 | 세션ID, 입력값(아이디·이메일·연락처) | - | FN-MBR-JOIN-002.exceptions[1] |
