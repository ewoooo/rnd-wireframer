---
화면 ID: NOVA-MBR-PG-005-E2
화면 명: 가입 완료-세션 생성 실패
화면 설명: 세션 생성 실패(오류) — 가입은 처리되었으나 자동 로그인 실패. 재로그인 유도.
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
| AppBarSection | 1 | AppBarHeader | 가입 완료 헤더 | AppBar | - | WithLogo | title: 가입 완료<br>showBack: false<br>showLogo: true | - | - | - | - | 화면 크롬 |
| SignupResultSection | 1 | TitleMainSignupComplete | 가입 완료 타이틀 | TitleMain | complete | Complete | title: 회원 가입이 완료되었습니다<br>subText: 자동 로그인에 실패했습니다. | - | - | - | PI-MBR-SESS-001-08 | 분기 SB 카피 변경 |
| SignupResultSection | 2 | CalloutSignupResult | 세션 생성 실패 안내 | Callout | - | WithTitle | title.text: 자동 로그인에 실패했습니다<br>body.text: 가입은 정상 처리되었습니다. 로그인 화면에서 다시 로그인해 주세요. | - | - | - | PI-MBR-SESS-001-08 | 분기 SB 강조 노출 |
| ActionButtonSection | 1 | ActionButtonHome | 로그인 이동 CTA | ActionButton | - | OneButton | main.text: 로그인하기 | onClick | navigate | login | PI-MBR-SESS-001-08 | 재로그인 유도 |

## 상태 변화

| 트리거 | 컴포넌트 명 | 속성 | 변경 값 | 관련 처리 |
| --- | --- | --- | --- | --- |
| 세션 생성 실패 시 | CalloutSignupResult | title.text | 자동 로그인되었습니다 → 자동 로그인에 실패했습니다 | FN-MBR-JOIN-004.exceptions[2] |
| 세션 생성 실패 시 | ActionButtonHome | state | TwoButton → OneButton | FN-MBR-JOIN-004.exceptions[2] |
| 세션 생성 실패 시 | ActionButtonHome | main.text | 홈으로 → 로그인하기 | FN-MBR-JOIN-004.exceptions[2] |

## 화면 흐름

| 구분 | 조건 | 화면 ID | 화면 명 | 전달 데이터 | 후속 처리 | 관련 흐름 |
| --- | --- | --- | --- | --- | --- | --- |
| 화면 전환 | 로그인 선택 시 | login | 로그인 | 세션ID | - | FN-MBR-JOIN-004.exceptions[2] |
