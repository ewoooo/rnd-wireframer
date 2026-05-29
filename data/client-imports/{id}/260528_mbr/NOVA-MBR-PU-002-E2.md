---
화면 ID: NOVA-MBR-PU-002-E2
화면 명: 개인정보 입력-입력 형식 오류
화면 설명: 입력 형식 오류(제한) — 형식 오류 항목 강조 및 안내.
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
| MemberInfoSection | 1 | TextFieldUserid | 아이디 입력 필드 | TextField | default | Error | label: 아이디<br>placeholder: 영문/숫자 6~20자<br>helperText: 입력값을 다시 확인해 주세요. (예: 영문/숫자 6~20자) | onChange | setState | useridInput | PI-MBR-INFO-002-03, PI-MBR-INFO-002-04, PI-MBR-INFO-002-13 | 형식 오류 시 Error |
| MemberInfoSection | 2 | TextFieldPassword | 비밀번호 입력 필드 | TextField | default | Error | label: 비밀번호<br>placeholder: 10~20자<br>helperText: 입력값을 다시 확인해 주세요. (예: 영문·숫자·특수문자 3종 이상)<br>type: password | onChange | setState | passwordInput | PI-MBR-INFO-002-05, PI-MBR-INFO-002-06, PI-MBR-INFO-002-13 | 형식 오류 시 Error |
| MemberInfoSection | 3 | TextFieldEmail | 이메일 입력 필드 | TextField | default | Error | label: 이메일<br>placeholder: 예: user@example.com<br>helperText: 입력값을 다시 확인해 주세요. (예: user@example.com) | onChange | setState | emailInput | PI-MBR-INFO-002-07, PI-MBR-INFO-002-13 | 형식 오류 시 Error |
| MemberInfoSection | 4 | TextFieldPhone | 연락처 입력 필드 | TextField | default | Error | label: 연락처<br>placeholder: 휴대폰번호 숫자만 입력<br>helperText: 입력값을 다시 확인해 주세요. | onChange | setState | phoneInput | PI-MBR-INFO-002-08, PI-MBR-INFO-002-13 | 형식 오류 시 Error |
| MemberInfoSection | 5 | CalloutFormatError | 형식 오류 안내 박스 | Callout | - | Default | body.text: 입력값을 다시 확인해 주세요. | - | - | - | PI-MBR-INFO-002-13 | 분기 SB 추가 노출 |
| ActionButtonSection | 1 | ActionButtonNext | 다음 단계 진행 CTA | ActionButton | - | Disabled | main.text: 다음 | - | - | - | PI-MBR-INFO-002-11 | 검증 실패 시 비활성 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 형식 검증 실패 시 | CalloutFormatError | visible | false → true | FN-MBR-JOIN-002.exceptions[2] |
| 형식 검증 실패 시 | ActionButtonNext | state | OneButton → Disabled | FN-MBR-JOIN-002.exceptions[2] |
| 형식 검증 통과 시 | TextFieldUserid | state | Error → Default | FN-MBR-JOIN-002.processing_logic[3] |
| 형식 검증 통과 시 | ActionButtonNext | state | Disabled → OneButton | FN-MBR-JOIN-002.processing_logic[3] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 입력 형식 오류 해소 후 | NOVA-MBR-PU-002-0 | 개인정보 입력 | 세션ID, 입력값(아이디·이메일·연락처) | - | FN-MBR-JOIN-002.exceptions[2] |
