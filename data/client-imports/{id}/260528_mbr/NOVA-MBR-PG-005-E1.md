---
화면 ID: NOVA-MBR-PG-005-E1
화면 명: 가입 완료-계정 생성 실패
화면 설명: 계정 생성 실패(오류) — 가입 처리 롤백 및 재시도 안내.
화면 경로: 회원 가입 > 가입 완료
구현 유형: PG
관련 정책 그룹: PG-MBR-ACCT-001, PG-MBR-SESS-001, PG-MBR-PROF-001
관련 유즈케이스: US-MBR-CS-001
관련 기능: FN-MBR-JOIN-004, FN-MBR-JOIN-005
상태: 초안
작성일: 2026-05-28
작성자: kyeom
버전: 1.00

---

## 화면 구성

| 섹션 번호 | 섹션 유형 | 섹션 명 | 관련 기능 | 섹션 설명 | 섹션 레이아웃 | 노출 조건 | 서버 제어 항목 | 노출 개수 (최소) | 노출 개수 (최대) | 노출 우선순위 | 오류 처리 방식 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | static | AppBarSection | - | 화면 상단 네비게이션 | vertical | 항상 | - | - | - | - | - |
| 1 | static | SignupResultSection | FN-MBR-JOIN-005 | 가입 완료 안내 | vertical | 가입 처리 완료 시 | - | - | - | - | - |
| 999 | static | ActionButtonSection | - | 화면 하단 액션 섹션 | vertical | 항상 | - | - | - | - | - |

## 컴포넌트 상세

| 섹션 명 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | state | props | 이벤트 | 액션 | 액션 파라미터 | 관련 정책 | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AppBarSection | 1 | AppBarHeader | 가입 완료 헤더 | AppBar | - | WithLogo | title: 가입 처리<br>showBack: false<br>showLogo: true | - | - | - | - | 화면 크롬 |
| SignupResultSection | 1 | TitleMainSignupComplete | 가입 실패 타이틀 | TitleMain | complete | Complete | title: 가입 처리가 완료되지 않았습니다<br>subText: 일시적인 오류가 발생했습니다. | - | - | - | PI-MBR-ACCT-001-10, PI-MBR-ACCT-001-12 | 분기 SB 카피 변경 |
| SignupResultSection | 2 | CalloutSignupResult | 계정 생성 실패 안내 | Callout | - | WithTitle | title.text: 계정 생성 중 오류가 발생했습니다<br>body.text: 잠시 후 다시 시도하거나 고객센터로 문의해 주세요. (예: {오류코드}) | - | - | - | PI-MBR-ACCT-001-10, PI-MBR-ACCT-001-12 | 분기 SB 강조 노출 |
| ActionButtonSection | 1 | ActionButtonHome | 재시도/고객센터 CTA | ActionButton | - | TwoButton | main.text: 다시 시도<br>secondary.text: 고객센터 문의 | onClick<br>onClick | apiCall<br>systemCall | -<br>tel:114 | PI-MBR-ACCT-001-10 | 재시도 성공 시 NOVA-MBR-PG-005-0 이동 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 계정 생성 실패 시 | TitleMainSignupComplete | title | 회원 가입이 완료되었습니다 → 가입 처리가 완료되지 않았습니다 | FN-MBR-JOIN-004.exceptions[1] |
| 계정 생성 실패 시 | CalloutSignupResult | title.text | 자동 로그인되었습니다 → 계정 생성 중 오류가 발생했습니다 | FN-MBR-JOIN-004.exceptions[1] |
| 계정 생성 실패 시 | ActionButtonHome | main.text | 홈으로 → 다시 시도 | FN-MBR-JOIN-004.exceptions[1] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 계정 생성 재시도 성공 시 | NOVA-MBR-PG-005-0 | 가입 완료 | 세션ID, 가입 결과 | - | FN-MBR-JOIN-004.exceptions[1] |
