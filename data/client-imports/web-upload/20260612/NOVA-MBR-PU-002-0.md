---
화면 ID: NOVA-MBR-PU-002-0
화면 명: 개인정보 입력
화면 설명: 가입에 필요한 회원 정보를 입력하고 형식·중복을 검증한다.
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
| MemberInfoSection | 1 | TextFieldUserid | 아이디 입력 필드 | TextField | default | Default | label: 아이디<br>placeholder: 영문/숫자 6~20자<br>helperText: 영문 대문자·소문자·숫자 조합, 6~20자 | onChange | setState | useridInput | PI-MBR-INFO-001-01, PI-MBR-INFO-002-03, PI-MBR-INFO-002-04 | 임시저장 대상 |
| MemberInfoSection | 2 | TextFieldPassword | 비밀번호 입력 필드 | TextField | default | Default | label: 비밀번호<br>placeholder: 10~20자<br>helperText: 영문·숫자·특수문자 중 3종 이상 조합, 10~20자<br>type: password | onChange | setState | passwordInput | PI-MBR-INFO-001-01, PI-MBR-INFO-002-05, PI-MBR-INFO-002-06 | 임시저장 제외 |
| MemberInfoSection | 3 | TextFieldEmail | 이메일 입력 필드 | TextField | default | Default | label: 이메일<br>placeholder: 예: user@example.com<br>helperText: 이메일 주소 형식 | onChange | setState | emailInput | PI-MBR-INFO-001-01, PI-MBR-INFO-002-07 | 임시저장 대상 |
| MemberInfoSection | 4 | TextFieldPhone | 연락처 입력 필드 | TextField | default | Default | label: 연락처<br>placeholder: 휴대폰번호 숫자만 입력<br>helperText: 본인인증 휴대폰번호로 사용됩니다. | onChange | setState | phoneInput | PI-MBR-INFO-001-01, PI-MBR-INFO-002-08 | 임시저장 대상 |
| ActionButtonSection | 1 | ActionButtonNext | 다음 단계 진행 CTA | ActionButton | - | Disabled | main.text: 다음 | onClick | apiCall | - | PI-MBR-INFO-002-12, PI-MBR-INFO-003-11 | 입력 완료 및 검증 통과 시 활성화. onSuccess 시 NOVA-MBR-PU-003-0 이동 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 필수 항목 모두 입력 완료 시 | ActionButtonNext | state | Disabled → OneButton | FN-MBR-JOIN-002.processing_logic[2] |
| 입력 중 형식 오류 발견 시 | TextFieldUserid | state | Default → Error | FN-MBR-JOIN-002.processing_logic[3] |
| 입력 중 형식 오류 발견 시 | TextFieldUserid | helperText | 영문 대문자·소문자·숫자 조합, 6~20자 → 입력값을 다시 확인해 주세요. | FN-MBR-JOIN-002.processing_logic[3] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 입력값 검증 및 중복 확인 통과 시 | NOVA-MBR-PU-003-0 | 본인인증 | 세션ID, 입력값(아이디·이메일·연락처) | - | PR-MBR-CS-001-02.후행 |
| 케이스 분기 | 필수값 누락 | NOVA-MBR-PU-002-E1 | 개인정보 입력-필수값 누락 | - | 누락 항목 강조·다음 진행 불가 | FN-MBR-JOIN-002.exceptions[1] |
| 케이스 분기 | 입력 형식 오류 | NOVA-MBR-PU-002-E2 | 개인정보 입력-입력 형식 오류 | - | 형식 오류 항목 강조 및 안내 | FN-MBR-JOIN-002.exceptions[2] |
| 케이스 분기 | 아이디 중복 | NOVA-MBR-PU-002-E3 | 개인정보 입력-아이디 중복 | - | 다른 아이디 입력 안내 | FN-MBR-JOIN-001.exceptions[1] |
| 케이스 분기 | 이메일 중복 | NOVA-MBR-PU-002-E4 | 개인정보 입력-이메일 중복 | - | 기존 계정 확인 안내 | FN-MBR-JOIN-001.exceptions[2] |
| 케이스 분기 | 휴대폰번호 중복 | NOVA-MBR-PU-002-E5 | 개인정보 입력-휴대폰번호 중복 | - | 기존 회원 확인 안내 | FN-MBR-JOIN-001.exceptions[3] |
