---
화면 ID: NOVA-MBR-PG-001-E2
화면 명: 약관 동의-필수 약관 미동의
화면 설명: 필수 약관 미동의(제한) — 미동의 항목 강조·다음 단계 진행 불가.
화면 경로: 회원 가입 > 약관 동의
구현 유형: PG
관련 정책 그룹: PG-MBR-TERM-001, PG-MBR-TERM-002, PG-MBR-TERM-003
관련 유즈케이스: US-MBR-CS-001
관련 기능: FN-MBR-COM-003
상태: 초안
작성일: 2026-05-28
작성자: kyeom
버전: 1.00

---

## 화면 구성

| 섹션 번호 | 섹션 유형 | 섹션 명 | 관련 기능 | 섹션 설명 | 섹션 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | static | AppBarSection | - | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | dynamic | TermsSection | FN-MBR-COM-003 | 가입 약관 조회 및 동의 입력 | vertical | 회원 가입 진입 시 | 유형(노출 여부), 순서 | 2 | N | 1 | 섹션 전체 숨김 |
| 999 | dynamic | ActionButtonSection | - | 화면 하단 액션 섹션 | vertical | 항상 | 유형(노출 여부) | - | - | - | - |

## 컴포넌트 상세

| 섹션 명 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | state | props | 이벤트 | 액션 | 액션 파라미터 | 관련 정책 | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AppBarSection | 1 | AppBarHeader | 가입 약관 헤더 | AppBar | - | WithBack | title: 약관 동의<br>showBack: true | onClick | navigate | parent | - | 화면 크롬 |
| TermsSection | 1 | ListTextTerms | 약관 목록 행 | ListText | dot | Default | title: {약관명} (예: 서비스 이용약관)<br>showRightItem: true | onClick | navigate | terms-detail-{약관ID} | PI-MBR-TERM-001-11 | - |
| TermsSection | 2 | CheckboxTermsRequired | 필수 약관 동의 체크 (오류 강조) | Checkbox | - | Unchecked | label: [필수] {약관명} (예: 서비스 이용약관) | onChange | setState | termsRequiredAgreed | PI-MBR-TERM-001-01, PI-MBR-TERM-001-06 | 미동의 항목 강조 |
| TermsSection | 3 | CheckboxTermsOptional | 선택 약관 동의 체크 | Checkbox | - | Unchecked | label: [선택] {약관명} (예: 마케팅 정보 수신 동의) | onChange | setState | termsOptionalAgreed | PI-MBR-TERM-001-02, PI-MBR-TERM-001-07 | - |
| TermsSection | 4 | CalloutBlockedRequired | 필수 약관 미동의 안내 | Callout | - | Default | body.text: 필수 약관에 모두 동의해야 다음 단계로 진행할 수 있습니다. | - | - | - | PI-MBR-TERM-001-06 | 분기 SB 추가 노출 |
| ActionButtonSection | 1 | ActionButtonNext | 다음 단계 진행 CTA | ActionButton | - | Disabled | main.text: 다음 | - | - | - | PI-MBR-TERM-001-06 | 필수 약관 모두 동의 전까지 비활성 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 필수 약관 미동의 상태에서 다음 시도 시 | CalloutBlockedRequired | visible | false → true | FN-MBR-COM-003.exceptions[2] |
| 필수 약관 미동의 상태에서 다음 시도 시 | ActionButtonNext | state | OneButton → Disabled | FN-MBR-COM-003.exceptions[2] |
| 필수 약관 전체 동의 시 | ActionButtonNext | state | Disabled → OneButton | FN-MBR-COM-003.processing_logic[2] |
| 필수 약관 전체 동의 시 | CalloutBlockedRequired | visible | true → false | FN-MBR-COM-003.processing_logic[2] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 필수 약관 미동의 해소 후 | NOVA-MBR-PG-001-0 | 약관 동의 | 약관 동의 결과, 세션ID | - | FN-MBR-COM-003.exceptions[2] |
