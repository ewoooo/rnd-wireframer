---
화면 ID: NOVA-MBR-PG-001-E3
화면 명: 약관 동의-동의 저장 실패
화면 설명: 동의 저장 실패(오류) — 재시도 안내 토스트 표시.
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
| TermsSection | 2 | CheckboxTermsRequired | 필수 약관 동의 체크 | Checkbox | - | Checked | label: [필수] {약관명} (예: 서비스 이용약관) | onChange | setState | termsRequiredAgreed | PI-MBR-TERM-001-01 | - |
| TermsSection | 3 | CheckboxTermsOptional | 선택 약관 동의 체크 | Checkbox | - | Checked | label: [선택] {약관명} (예: 마케팅 정보 수신 동의) | onChange | setState | termsOptionalAgreed | PI-MBR-TERM-001-02 | - |
| TermsSection | 4 | CalloutSaveFailed | 동의 저장 실패 안내 토스트 | Callout | - | Default | body.text: 일시적인 오류가 발생했습니다. 다시 시도해 주세요. | - | - | - | - | 분기 SB 추가 노출 |
| ActionButtonSection | 1 | ActionButtonRetry | 동의 재저장 CTA | ActionButton | - | OneButton | main.text: 다시 시도 | onClick | apiCall | - | - | onSuccess 시 NOVA-MBR-PU-002-0 이동 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 동의 저장 실패 시 | CalloutSaveFailed | visible | false → true | FN-MBR-COM-003.exceptions[3] |
| 동의 저장 실패 시 | ActionButtonRetry | main.text | 다음 → 다시 시도 | FN-MBR-COM-003.exceptions[3] |
| 동의 저장 재시도 성공 시 | CalloutSaveFailed | visible | true → false | FN-MBR-COM-003.processing_logic[3] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 동의 저장 재시도 성공 시 | NOVA-MBR-PU-002-0 | 개인정보 입력 | 약관 동의 결과, 세션ID | - | FN-MBR-COM-003.exceptions[3] |
