# Figma SOT Observations

## 1. 문서 책임

이 문서는 Figma 디자인 정본을 화면별로 조회하며 확인한 구조, 디자인 판단, screen inference 적용 후보를 누적한다.

이 문서의 모든 기록은 추후 agent skill 생성을 쉽게 하기 위한 준비 기록이다. 이 문서는 곧바로 agent skill로 사용하지 않는다. 여러 SOT 화면에서 반복되는 판단 축이 확인되면 `packages/agent/docs/skills/design-skills/`의 bounded skill 문서로 승격한다.

실제 skill 문서를 만들기 직전에는 이 문서의 `Skill creation lookup plan`을 기준으로 Figma SOT를 한 번 더 조회한다. 최종 skill에는 재조회한 node, 작성할 규칙, 제외할 범위, component promotion 후보를 명시한다.

## 2. 운영 원칙

- Figma node와 frame provenance를 함께 기록한다.
- 화면별 관찰은 구조, 컴포넌트, 리듬, 판단 근거, 스킬 후보로 나눈다.
- 구현 패키지의 stage 순서, runner, artifact 저장 계약은 이 문서에 쓰지 않는다.
- skill로 승격할 때는 이 문서의 산문을 그대로 복사하지 않고, agent가 바로 적용할 수 있는 입력 신호와 규칙으로 압축한다.
- component promotion 후보는 확정 catalog 값처럼 쓰지 않고, 후속 검토 후보로만 기록한다.
- Figma frame name은 provenance로만 사용하고, screen inference 기준 이름은 별도의 `screen family`로 재분류한다.
- skill 생성 직전에는 이 문서에 적힌 SOT node를 다시 조회해 최신 구조와 텍스트, component state를 확인한다.

## 3. Observation Status

| 영역 | SOT node | 조회한 frame | Inference screen family | 상태 |
|---|---:|---:|---|---|
| 사용자 정보입력 | `10095:23483` | `10095:23484` | `form-entry-screen` | 1차 관찰, 재조회 완료 |
| 사용자 정보입력 | `10095:23483` | `10095:23501` | `checkout-additional-info` | 1차 관찰, 재조회 완료 |
| 사용자 정보입력 | `10095:23483` | `10161:49136` | `checkout-payment-screen` | 1차 관찰 완료 |
| 사용자 정보입력 | `10095:23483` | `10161:49258` | `cart-review-screen` | 1차 관찰 완료 |
| 상품 상세화면 | `10069:97828` | `10069:97829` | `subscription-product-detail-screen` | 1차 관찰 완료 |
| 상품 상세화면 | `10069:97828` | `10069:97927` | `gifticon-product-detail-screen` | 1차 관찰 완료 |
| 상품 상세화면 | `10069:97828` | `10069:121732` | `device-product-detail-screen` | 1차 관찰 완료 |
| 텍스트 리스트 | `10042:46203` | `10082:58057` | `usage-history-list-screen` | 1차 관찰 완료 |
| 텍스트 리스트 | `10042:46203` | `10082:58364` | `point-history-list-screen` | 1차 관찰 완료 |
| 텍스트 리스트 | `10042:46203` | `10082:58227` | `discount-history-list-screen` | 1차 관찰 완료 |
| 텍스트 리스트 | `10042:46203` | `10082:43724` | `faq-guide-list-screen` | 1차 관찰 완료 |
| 텍스트 리스트 | `10042:46203` | `10082:47225` | `notice-text-list-screen` | 1차 관찰 완료 |
| 메인 페이지 | `10042:57541` | `10042:58271` | `management-home-screen` | 1차 관찰 완료 |
| 메인 페이지 | `10042:57541` | `10095:44460` | `management-home-screen` | 1차 관찰 완료 |
| 메인 페이지 | `10042:57541` | `10082:59886` | `search-home-screen` | 1차 관찰 완료 |
| 메인 페이지 | `10042:57541` | `10042:58251` | `shopping-home-feed-screen` | 1차 관찰 완료 |
| 카드 리스트 | `9896:91122` | `9792:110378` | `subscription-card-list-screen` | 1차 관찰 완료 |
| 카드 리스트 | `9896:91122` | `9792:110351` | `device-card-grid-screen` | 1차 관찰 완료 |
| 카드 리스트 | `9896:91122` | `9754:62082` | `benefit-card-list-screen` | 1차 관찰 완료 |
| 카드 리스트 | `9896:91122` | `9754:62038` | `plan-card-list-screen` | 1차 관찰 완료 |
| 카드 리스트 | `9896:91122` | `9754:62108` | `add-on-service-card-list-screen` | 1차 관찰 완료 |
| 카드 리스트 | `9896:91122` | `9754:62134` | `internet-card-list-screen` | 1차 관찰 완료 |
| 결과 및 확인 완료 | `10090:60588` | `10090:58791` | `activation-completion-screen` | 1차 관찰 완료 |
| 결과 및 확인 완료 | `10090:60588` | `10090:58796` | `plan-change-completion-screen` | 1차 관찰 완료 |
| 결과 및 확인 완료 | `10090:60588` | `10090:58816` | `cancellation-completion-screen` | 1차 관찰 완료 |
| 결과 및 확인 완료 | `10090:60588` | `10090:58801` | `payment-receipt-completion-screen` | 1차 관찰 완료 |

## 4. 사용자 정보입력

### 4.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `10095:23483`
- 조회 frame: `10095:23484`
- Frame name: `상세_정보입력인풋`
- Screen title: `가입자 정보 입력`
- Viewport basis: mobile `393px`
- 조회일: 2026-06-01
- 재조회 상태: 2026-06-01 재확인 완료

### 4.2 상위 SOT 묶음

`사용자 정보입력` SOT node는 단일 화면이 아니라 여러 상세 흐름 화면을 묶은 section이다. 이 묶음은 Figma provenance로는 하나의 SOT 그룹이지만, screen inference와 skill 생성 기준으로는 서로 다른 screen family로 분리한다.

| Frame | Figma name | Inference screen family | 1차 해석 | Skill 후보 |
|---:|---|---|---|---|
| `10095:23484` | `상세_정보입력인풋` | `form-entry-screen` | 가입자 정보 입력 기준 화면 | `form-entry-screen`, `address-input`, `text-field-states` |
| `10095:23501` | `상세_정보체크` | `checkout-additional-info` | 추가 옵션 선택과 배송 정보 입력 기준 화면 | `checkout-additional-info`, `option-selection-group`, `delivery-address-group` |
| `10161:49136` | `상세_결제` | `checkout-payment-screen` | 결제 수단, 할인, 약관 동의를 포함한 결제 실행 화면 | `checkout-payment-screen`, `payment-method-selection`, `payment-summary-ledger` |
| `10161:49258` | `상세_장바구니` | `cart-review-screen` | 배송지, 인증, 상품 목록, 결제 예상 금액을 확인하는 카트 화면 | `cart-review-screen`, `cart-product-list`, `payment-summary-ledger` |

현재 상세 관찰은 `상세_정보입력인풋`, `상세_정보체크`, `상세_결제`, `상세_장바구니`에 한정한다.

### 4.2.1 SOT 묶음 스킬 생성 브리프

이 SOT 묶음은 `사용자 정보입력`이라는 이름 아래 여러 form 계열 화면을 포함한다. skill 생성 시에는 Figma 묶음 이름이 아니라 screen family를 기준으로 나눈다.

| 기준 | `form-entry-screen` | `checkout-additional-info` | `checkout-payment-screen` | `cart-review-screen` |
|---|---|---|---|---|
| Primary SOT | `10095:23484` | `10095:23501` | `10161:49136` | `10161:49258` |
| 화면 title | `가입자 정보 입력` | `추가 정보 입력` | `결제하기` | `카트` |
| Dominant UI | text field, disabled field, address lookup | product sheet, radio option, callout, repeated recipient form | payment method, point input, agreement list, ledger | cart product list, delivery summary, expected payment ledger |
| 주요 목적 | 사용자의 기본 정보 입력과 확인 | 구매/가입 옵션 선택과 배송 정보 입력 | 결제 수단과 약관을 확정해 결제 실행 | 장바구니 상품과 결제 예상 금액 확인 |
| 공통 축 | `Pagestack`, `4px` divider, 주소 찾기, bottom CTA | `Pagestack`, `4px` divider, option/callout, bottom CTA | `Pagestack`, `4px` divider, payment ledger, agreement CTA | `Pagestack`, `4px` divider, product list, payment ledger, agreement CTA |
| 분리 이유 | 개인정보 입력의 field state가 핵심 | 상품/옵션/배송의 선택 흐름과 고밀도 반복 입력이 핵심 | 결제 실행 전 최종 결정과 약관 동의가 핵심 | 결제 전 카트 구성과 금액 검토가 핵심 |

skill 생성자는 이 표를 기준으로 scenario skill을 먼저 나누고, `address-input`, `payment-summary-ledger`, `section-divider-rhythm`, `bottom-fixed-cta` 같은 atomic/domain skill은 여러 frame의 공통 참조로 설계한다.

### 4.3 화면 구조

```text
StatusBar
AppBar(title: 가입자 정보 입력, back action)
Contents
  Pagestack: 기기변경 휴대폰 번호
  Section Divider
  Pagestack: 본인인증 완료
  Section Divider
  Pagestack: 가입자 주소
  Section Divider
  Pagestack: 주 생활지역
  Section Divider
  Pagestack: 이메일
Bottom ActionButton: 다음
```

핵심 구조는 `Header -> Contents -> Bottom CTA`다. Contents는 `Pagestack` 단위의 섹션 반복으로 구성되고, 각 섹션은 `TitleSection`과 contents slot을 가진다.

### 4.4 섹션별 구성

| Section | 역할 | 주요 구성 |
|---|---|---|
| 기기변경 휴대폰 번호 | 기존 정보 확인 | disabled `TextField` |
| 본인인증 완료 | 완료 상태 안내 | `ListText` |
| 가입자 주소 | 주소 입력/검색 | 우편번호 disabled field + `주소 찾기` button, 주소 disabled field, 상세주소 typed field |
| 주 생활지역 | 가입자 정보 재사용/동의 | checked `ListSelected`, 주소 검색 field group, help text |
| 이메일 | 직접 입력 정보 | typed `TextField` |

### 4.5 컴포넌트와 상태

- `AppBar`: back action과 화면 title을 함께 제공한다.
- `Pagestack`: 섹션 제목과 섹션 본문을 묶는 기본 단위다.
- `Divider`: 섹션 사이를 `4px` divider로 분리한다.
- `TextFieldDisabled`: 값은 보이지만 사용자가 직접 수정하지 않는 정보다.
- `TextFieldTyped`: 사용자가 입력했거나 수정 가능한 정보다.
- `ListText`: 인증 완료 같은 상태성 안내를 한 줄로 표현한다.
- `ListSelected`: 체크된 선택 상태를 표현한다.
- `Button`: 주소 찾기 같은 보조 액션과 하단 primary CTA에 모두 쓰인다.
- `Help Text`: 주 생활지역 주소가 왜 필요한지 보조 설명을 제공한다.

### 4.6 Layout Rhythm

- 화면 폭은 `393px` 기준이다.
- 섹션은 좌우 outer padding `12px`, 내부 contents padding `20px` 흐름을 가진다.
- 섹션 제목 아래는 `16px` 여백으로 본문과 분리된다.
- TextField stack은 `8px` 간격과 bottom padding을 반복한다.
- `가입자 주소`, `주 생활지역`처럼 같은 주소 입력 패턴을 공유하는 섹션은 우편번호 row와 full-width address field를 순차 배치한다.
- 하단 CTA는 bottom fixed 영역에 있으며, content와 별도의 action rail로 읽힌다.

### 4.7 디자인 판단 인사이트

- 이 화면은 단순 입력 폼이 아니라 `기존 정보 확인 -> 인증 완료 표시 -> 주소 검색/입력 -> 선택 동의 -> 이메일 입력 -> 다음` 흐름이다.
- 모든 정보를 동일한 TextField로 처리하지 않고, read-only 정보와 editable 정보를 시각 상태로 구분한다.
- 주소 입력은 단일 field가 아니라 `우편번호 + 주소 찾기 + 기본 주소 + 상세 주소` 조합 패턴으로 보아야 한다.
- `가입자 정보와 동일` 체크는 주소 입력을 줄이는 shortcut이며, source intent가 "같은 정보 사용"을 포함할 때 `ListSelected` 우선 후보가 된다.
- 섹션 divider는 정보 덩어리의 의미 경계를 만든다. 입력 필드가 많아도 섹션별 판단 단위가 유지된다.
- primary action은 하단에 고정되어 scroll 위치와 무관하게 다음 단계로 이어진다.

### 4.8 Screen Inference 적용 후보

이 SOT는 `form-entry-screen`의 기준 reference로 사용할 수 있다.

입력 source에서 아래 신호가 보이면 이 화면 구조를 우선 후보로 고려한다.

- 사용자 정보, 가입자 정보, 고객 정보, 연락처, 주소, 이메일 같은 개인정보 입력 항목이 있다.
- 본인인증, 인증 완료, 확인 완료 같은 상태성 문장이 포함된다.
- 주소 검색 또는 우편번호 조회 액션이 필요하다.
- 기존 정보와 동일, 가입자 정보와 동일 같은 재사용 선택지가 있다.
- 입력을 완료한 뒤 다음 단계로 이동하는 primary CTA가 있다.

### 4.9 Component Proposal / Promotion 후보

아래 항목은 바로 catalog로 확정하지 않고, 컴포넌트 프로모션 강화 작업과 함께 검토한다.

| 후보 | 이유 | 검토 포인트 |
|---|---|---|
| `AddressInputGroup` | 우편번호, 주소 찾기, 기본 주소, 상세 주소 조합이 반복될 가능성이 높다. | `TextField` 조합으로 충분한지, domain composite로 승격할지 확인 |
| `VerificationCompleteNotice` | 본인인증 완료 안내가 상태성 section으로 반복될 수 있다. | `ListText` variant로 충분한지 확인 |
| `SameAsSubscriberSelector` | `가입자 정보와 동일`은 정보 입력 흐름의 shortcut pattern이다. | `ListSelected` + controlled field state를 함께 다룰지 확인 |
| `BottomPrimaryActionRail` | 하단 fixed CTA는 여러 screen family에서 반복된다. | 이미 존재하는 action area/layout pattern과 중복 여부 확인 |

### 4.10 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `form-entry-screen` | scenario | 개인정보 입력 화면의 section order, field state, bottom CTA |
| `address-input` | domain | 우편번호/주소 찾기/기본 주소/상세 주소 조합 |
| `text-field-states` | atomic | disabled, typed, help text 구분 |
| `section-divider-rhythm` | atomic | `Pagestack` 반복과 `4px` section divider |
| `bottom-fixed-cta` | atomic | primary action rail 위치와 CTA 명료성 |

### 4.11 Skill creation lookup plan

실제 skill 생성 직전에는 아래 SOT를 다시 조회한다.

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `form-entry-screen` | `10095:23484` | 개인정보 입력 화면의 section order, field state, bottom CTA 확인 | 입력 신호, section order, field state rule, CTA rule, 금지 패턴 |
| `address-input` | `10095:23484`, `10095:23501` | 주소 입력 조합이 두 화면에서 어떻게 반복되는지 확인 | 우편번호 row, 주소 찾기 action, 기본 주소, 상세 주소, 동일 정보 shortcut |
| `text-field-states` | `10095:23484`, `10095:23501` | disabled, typed, label, help text 상태 차이를 확인 | state별 사용 조건, visual hierarchy, validation/review 체크 포인트 |
| `bottom-fixed-cta` | `10095:23484`, `10095:23501` | 하단 CTA rail의 반복 규칙 확인 | primary action 위치, content와 CTA 분리, density별 주의점 |

### 4.12 후속 조회 필요

1. skill 생성 직전에 `10095:23484`를 다시 조회해 section order, 실제 text, component state가 유지되는지 확인한다.
2. `상세_정보입력인풋`의 실제 component catalog 매핑 가능성을 `@cx/components/catalog`와 대조한다.
3. `AddressInputGroup`을 component promotion 후보로 둘지, `TextField` composition rule로 둘지 결정한다.
4. `form-entry-screen` skill 작성 시 `checkout-additional-info`와 공유할 규칙과 고유 규칙을 분리한다.

## 5. 추가 옵션 및 배송 정보 입력

### 5.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `10095:23483`
- 조회 frame: `10095:23501`
- Figma frame name: `상세_정보체크`
- Inference screen family: `checkout-additional-info`
- Screen title: `추가 정보 입력`
- Viewport basis: mobile `393px`
- 조회일: 2026-06-01
- 재조회 상태: 2026-06-01 재확인 완료

### 5.2 분리 이유

`상세_정보체크`라는 Figma name은 실제 화면 성격을 충분히 설명하지 못한다. 이 frame은 입력 내용을 단순 확인하는 화면이 아니라 상품 구매/가입 플로우에서 추가 옵션을 선택하고 배송 정보를 입력하는 화면이다.

따라서 `form-entry-screen`의 하위 variant로 넣지 않고, `checkout-additional-info` screen family로 분리한다.

재조회 결과, 화면 title은 `추가 정보 입력`이고 첫 번째 content는 상품 요약 `Sheet`다. 이후 `결합 할인`, `USIMㆍ이심(eSIM)`, `휴대폰 배송 방법`, `배송지`, `바로보상 안내`, `T기프트 배송 정보`가 이어진다. 따라서 이 frame은 confirmation screen이 아니라 checkout step의 추가 정보 입력 화면으로 기록한다.

### 5.3 화면 구조

```text
StatusBar
AppBar(title: 추가 정보 입력, back action)
Contents
  Sheet: 선택 상품과 월 납부 금액 요약
  Pagestack: 결합 할인
  Section Divider
  Pagestack: USIMㆍ이심(eSIM)
  Section Divider
  Pagestack: 휴대폰 배송 방법
  Section Divider
  Pagestack: 배송지
  Section Divider
  Pagestack: 바로보상 안내
  Section Divider
  Pagestack: T기프트 배송 정보
Bottom ActionButton: 다음
```

### 5.4 섹션별 구성

| Section | 역할 | 주요 구성 |
|---|---|---|
| 상품 요약 Sheet | 현재 선택 상품과 월 납부 금액 유지 | thumbnail, 상품명, 월 금액, 확장 icon |
| 결합 할인 | 할인 적용 여부 선택 | radio `ListSelected` group |
| USIMㆍ이심(eSIM) | USIM/eSIM 방식 선택 | radio `ListSelected` group, `Callout` |
| 휴대폰 배송 방법 | 배송 방식 선택 | radio `ListSelected` group |
| 배송지 | 수령자 배송 정보 입력 | `가입자 정보와 동일`, 받는 분, 연락처, 주소 입력 group |
| 바로보상 안내 | 부가 서비스 신청/안내 | 보상 정보, 신청 button, `Callout` |
| T기프트 배송 정보 | 별도 사은품 배송 정보 입력 | badge, `가입자 정보와 동일`, 받는 분, 연락처, 주소 입력 group |

### 5.5 컴포넌트와 상태

- `Sheet`: 상품 요약을 화면 상단에 고정된 컨텍스트처럼 제공한다.
- `ListSelected`: radio option과 checkbox option 모두를 표현한다.
- `Callout`: 선택 옵션의 조건, 제한, 보조 설명을 묶는다.
- `TextFieldTyped`: 받는 분, 연락처, 상세 주소처럼 수정 가능한 값을 표현한다.
- `TextFieldDisabled`: 우편번호, 기본 주소처럼 조회/선택 결과를 표현한다.
- `Button`: 주소 찾기, 바로보상 신청 같은 보조 action을 표현한다.
- `Badge`: `T기프트 배송 정보`의 배송 성격을 section title 옆에서 보조 표시한다.

### 5.6 Layout Rhythm

- 기본 섹션 리듬은 `Pagestack` + `4px` section divider로 `form-entry-screen`과 같다.
- 이 화면은 option group, callout, repeated recipient form이 섞여 있어 밀도가 높다.
- radio option은 `8px` row rhythm을 사용하고, 설명이 필요한 option group 뒤에는 `20px` spacing 후 callout을 둔다.
- 배송 정보 group은 checkbox shortcut 뒤에 `12px` spacing을 두고 field stack을 배치한다.
- field stack 내부에는 label과 input이 함께 나타나며, 반복 field 사이에 `8px` spacing이 들어간다.

### 5.7 디자인 판단 인사이트

- 이 화면은 사용자가 이미 선택한 상품/금액을 잊지 않도록 top summary sheet를 먼저 보여준다.
- 선택지는 독립 row가 아니라 section 단위의 radio group으로 구성한다.
- 선택 후 이해가 필요한 항목은 callout으로 바로 아래에서 설명한다.
- 배송지와 T기프트 배송 정보는 같은 recipient 입력 pattern이 반복되지만 목적이 다르므로 section을 분리한다.
- `가입자 정보와 동일` checkbox는 반복 입력 부담을 줄이는 shortcut으로 사용된다.
- 화면이 길고 밀도가 높기 때문에 하단 primary CTA를 고정해 다음 단계의 위치를 안정화한다.

### 5.8 Screen Inference 적용 후보

이 SOT는 `checkout-additional-info`의 기준 reference로 사용할 수 있다.

입력 source에서 아래 신호가 보이면 이 화면 구조를 우선 후보로 고려한다.

- 상품명, 월 금액, 할부/부가세 등 구매 요약 정보가 있다.
- 결합 할인, USIM/eSIM, 배송 방법처럼 사용자가 옵션을 선택해야 한다.
- 선택 옵션 뒤에 조건, 제한, 유의사항 안내가 필요하다.
- 배송지, 사은품 배송지처럼 recipient 정보 입력 group이 반복된다.
- 부가 서비스 신청 버튼이나 안내 callout이 포함된다.
- primary CTA가 다음 단계로 이어진다.

### 5.9 Component Proposal / Promotion 후보

| 후보 | 이유 | 검토 포인트 |
|---|---|---|
| `ProductSummarySheet` | 상품명과 월 금액을 구매 플로우 상단 컨텍스트로 유지한다. | sheet가 단순 section인지, checkout 전용 composite인지 확인 |
| `OptionSelectionGroup` | radio 기반 선택지가 여러 section에서 반복된다. | `ListSelected` row 조합으로 충분한지, option group contract가 필요한지 확인 |
| `DeliveryAddressGroup` | 수령자, 연락처, 주소 입력이 목적별로 반복된다. | `AddressInputGroup`과 recipient label/phone field를 분리할지 확인 |
| `CalloutAfterSelection` | 옵션 선택 뒤 조건 설명이 반복된다. | 기존 Callout variant와 composition rule로 충분한지 확인 |
| `InlineApplicationBlock` | 바로보상처럼 정보, action, callout이 함께 묶인다. | domain composite로 승격할지, 개별 component 조합으로 유지할지 확인 |

### 5.10 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `checkout-additional-info` | scenario | 상품 요약, 옵션 선택, 배송 정보, 하단 CTA 조합 |
| `product-summary-sheet` | atomic/domain | 상품명, 월 금액, 보조 금액 설명을 상단 context로 유지하는 규칙 |
| `option-selection-group` | atomic | radio group section 구성, selected/unselected 상태, callout 배치 |
| `delivery-address-group` | domain | 수령자, 연락처, 주소 찾기, 상세 주소 조합 |
| `callout-after-selection` | atomic | 옵션 선택 뒤 조건 안내를 붙이는 위치와 밀도 규칙 |
| `repeated-recipient-info` | domain | 같은 recipient pattern을 목적별 section으로 반복하는 규칙 |

### 5.11 Skill creation lookup plan

실제 skill 생성 직전에는 아래 SOT를 다시 조회한다.

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `checkout-additional-info` | `10095:23501` | 구매/가입 추가 정보 화면의 전체 section order 확인 | screen family 입력 신호, top sheet rule, option/recipient section order, CTA rule |
| `product-summary-sheet` | `10095:23501` | 상품 요약 sheet의 정보 계층과 표시 범위 확인 | 상품명, 가격, 보조 가격 설명, collapse/expand affordance |
| `option-selection-group` | `10095:23501` | radio selected/unselected row와 callout 배치 확인 | option group rule, selected state, 설명 callout 연결, 금지 패턴 |
| `delivery-address-group` | `10095:23501`, `10095:23484` | recipient 정보와 주소 입력 조합 비교 | 수령자/연락처/주소 group, same-as shortcut, 주소 찾기 action |
| `callout-after-selection` | `10095:23501` | 옵션 설명 callout의 위치와 밀도 확인 | callout 배치 조건, 문장 길이, option group과의 간격 |
| `repeated-recipient-info` | `10095:23501` | 배송지와 T기프트 배송 정보 반복 구조 확인 | 목적별 section 분리, 반복 field order, badge 사용 조건 |

### 5.12 후속 조회 필요

1. skill 생성 직전에 `10095:23501`과 필요 시 하위 section node를 다시 조회해 `휴대폰 배송 방법`, `바로보상 안내`의 전체 텍스트와 구조를 보완한다.
2. `ProductSummarySheet`, `OptionSelectionGroup`, `DeliveryAddressGroup`이 현 component catalog에 있는 조합으로 충분한지 대조한다.
3. `checkout-additional-info`를 `form-entry-screen`의 variant로 둘지 독립 scenario skill로 둘지 최종 결정한다. 현재 판단은 독립 scenario skill이다.
4. `상세_결제`, `상세_장바구니` 조회 후 checkout family 내부 skill 경계를 재검토한다.

## 6. 결제 실행

### 6.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `10095:23483`
- 조회 frame: `10161:49136`
- Figma frame name: `상세_결제`
- Inference screen family: `checkout-payment-screen`
- Screen title: `결제하기`
- Viewport basis: mobile `393px`
- 조회일: 2026-06-01
- 조회 상태: sparse metadata + screenshot 확인 완료

### 6.2 분리 이유

`상세_결제`는 결제 직전의 실행 화면이다. 이전 frame인 `checkout-additional-info`가 옵션과 배송 정보를 모으는 화면이라면, 이 frame은 주문자 정보, 상품 정보, 할인/포인트, 구독 방식, 결제 수단, 현금영수증, 결제 약관을 한 화면에서 최종 확정한다.

따라서 `checkout-additional-info`의 variant가 아니라 `checkout-payment-screen` scenario skill 후보로 분리한다.

### 6.3 화면 구조

```text
StatusBar
AppBar(title: 결제하기, back action)
Contents
  Pagestack: 주문자 정보
  Section Divider
  Pagestack: SKT 고객 인증
  Section Divider
  Pagestack: 상품 정보
  Pagestack: T 플러스 포인트
  Section Divider
  Pagestack: 구독 방식
  Section Divider
  Pagestack: 결제 수단
  Section Divider
  Pagestack: 현금영수증
  Section Divider
  Pagestack: 결제 정보
  Section Divider
  Pagestack: 결제 약관 및 동의
Bottom ActionButton: 약관 동의하고 결제하기
```

### 6.4 섹션별 구성

| Section | 역할 | 주요 구성 |
|---|---|---|
| 주문자 정보 | 결제 주체 확인 | 이름, 전화번호, 이메일, 주소, 배송 메시지, 변경 button |
| SKT 고객 인증 | 인증 대상 회선 확인 | 선택한 휴대폰 번호 수, callout/input-like notice |
| 상품 정보 | 결제 상품 묶음 확인 | `Local_PayList`, `PayProdutListItem`, coupon/pack items, monthly price |
| T 플러스 포인트 | 포인트 할인 적용 | point input, `모두 사용` button, 사용 가능 포인트, 자동 사용 checkbox |
| 구독 방식 | 결제/구독 방식 선택 | radio `ListSelected`, callout |
| 결제 수단 | 결제 방법 선택 | card/pay option, Kakao/Naver/general payment, recommend banner |
| 현금영수증 | 현금영수증 신청 여부 | radio `ListSelected`, callout |
| 결제 정보 | 금액 ledger와 최종 금액 확인 | `ListText` rows, internal divider, final amount emphasis |
| 결제 약관 및 동의 | 결제 전 동의 | agreement rows, required/optional labels, chevron navigation, selected checkbox |

### 6.5 컴포넌트와 상태

- `Local_PayList`: 상품 묶음과 하위 결제 상품을 계층적으로 보여준다.
- `PaymentList`: 결제 수단 row와 결제 옵션 상태를 표현한다.
- `TextField`: 포인트 입력처럼 수치 입력이 필요한 영역에 사용된다.
- `ListSelected`: 구독 방식, 결제 수단, 현금영수증, 약관 동의 상태를 표현한다.
- `BannerHorizontalSmall`: 결제 수단 추천 또는 혜택 배너를 표현한다.
- `Callout`: 구독, 현금영수증, 결제 정보의 조건 안내에 사용된다.
- `ListText`: 결제 정보 ledger에서 항목명과 금액을 정렬한다.

### 6.6 Layout Rhythm

- `Pagestack`과 `4px` section divider는 이전 checkout frame들과 동일하게 유지된다.
- 결제 정보 내부는 `ListText` rows, `4px` spacing, `16px` spacing, `1px` divider로 ledger rhythm을 만든다.
- 상품 정보는 `Local_PayList` 안에서 상품 제목, price, 하위 item, internal divider를 반복한다.
- 최종 금액은 `결제 정보` section 하단에서 brand color와 semi-bold emphasis로 분리한다.
- 하단 CTA는 결제 실행 문구를 포함하며, 단순 `다음`이 아니라 `약관 동의하고 결제하기`로 action cost를 명확히 한다.

### 6.7 디자인 판단 인사이트

- 결제 화면은 정보 입력 화면보다 훨씬 고밀도지만, 각 판단 단위를 section으로 분리해 사용자가 결제 전 확인할 수 있게 한다.
- 결제 실행 전에는 단순 summary가 아니라 할인, 포인트, 결제 수단, 현금영수증, 약관까지 모두 최종 결정 대상으로 노출한다.
- 금액 정보는 일반 list가 아니라 ledger로 다룬다. 할인 항목과 최종 결제 금액의 위계가 달라야 한다.
- 약관 동의는 화면 하단 CTA와 직접 연결된다. CTA 문구는 약관 동의와 결제 실행을 함께 드러낸다.

### 6.8 Screen Inference 적용 후보

이 SOT는 `checkout-payment-screen`의 기준 reference로 사용할 수 있다.

입력 source에서 아래 신호가 보이면 이 화면 구조를 우선 후보로 고려한다.

- 결제하기, 결제 수단, 카드/간편결제, 현금영수증 같은 결제 실행 정보가 있다.
- 총 금액, 할인, 쿠폰, 포인트, 최종 결제 금액처럼 ledger가 필요하다.
- 상품 정보가 여러 결제 상품 또는 구독 상품으로 묶인다.
- 결제 전 약관 동의와 CTA가 필요하다.
- 구독 방식이나 정기 결제 옵션이 포함된다.

### 6.9 Component Proposal / Promotion 후보

| 후보 | 이유 | 검토 포인트 |
|---|---|---|
| `PaymentSummaryLedger` | 총 금액, 할인, 포인트, 최종 결제 금액의 위계가 반복될 가능성이 높다. | `ListText` 조합으로 충분한지, ledger domain composite가 필요한지 확인 |
| `PaymentMethodGroup` | 카드/간편결제/general payment 선택이 결제 화면의 핵심이다. | `PaymentList` catalog surface와 선택 상태 계약 확인 |
| `AgreementListGroup` | 필수/선택 약관 row와 동의 checkbox가 결제 CTA와 연결된다. | interaction hook과 validation rule까지 포함할지 확인 |
| `SubscriptionModeSelector` | 1회/정기 구독 선택과 callout이 반복될 수 있다. | `ListSelected` + callout rule로 충분한지 확인 |
| `PointRedemptionInput` | 포인트 입력, 모두 사용, 사용 가능 포인트, 자동 사용 옵션이 묶인다. | 수치 입력 + action button + checkbox composite 여부 확인 |

### 6.10 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `checkout-payment-screen` | scenario | 결제 실행 화면의 section order, 결제 수단, 약관, CTA |
| `payment-summary-ledger` | domain | 금액 row, 할인 row, internal divider, final amount emphasis |
| `payment-method-selection` | domain | 결제 수단 option, 추천 배너, 선택 상태 |
| `agreement-gate-cta` | domain | 약관 동의 list와 결제 CTA 연결 |
| `point-redemption-input` | domain | 포인트 입력, 모두 사용, 자동 사용 option |

### 6.11 Skill creation lookup plan

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `checkout-payment-screen` | `10161:49136` | 결제 실행 화면의 전체 section order 확인 | source signal, section order, payment/terms CTA rule, rejected pattern |
| `payment-summary-ledger` | `10161:49136`, `10161:49258` | 결제 정보 ledger가 결제/카트에서 어떻게 반복되는지 비교 | row hierarchy, discount treatment, final amount emphasis |
| `payment-method-selection` | `10161:49136` | 결제 수단 row와 추천 배너 확인 | option state, recommended method, external payment group |
| `agreement-gate-cta` | `10161:49136`, `10161:49258` | 약관 동의와 결제 CTA의 연결 방식 확인 | required agreement, CTA wording, validation focus |
| `point-redemption-input` | `10161:49136` | 포인트 입력 composite 확인 | numeric field, use-all action, available balance, auto-use option |

### 6.12 후속 조회 필요

1. skill 생성 직전에 `10161:49136` 하위 section node를 나눠 조회해 sparse metadata에서 빠진 텍스트를 보완한다.
2. `PaymentList`, `Local_PayList`, `BannerHorizontalSmall`의 catalog surface와 RenderTree 표현 가능성을 대조한다.
3. `payment-summary-ledger`를 `cart-review-screen`과 공유 domain skill로 둘지 확정한다.

## 7. 카트 검토

### 7.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `10095:23483`
- 조회 frame: `10161:49258`
- Figma frame name: `상세_장바구니`
- Inference screen family: `cart-review-screen`
- Screen title: `카트`
- Viewport basis: mobile `393px`
- 조회일: 2026-06-01
- 조회 상태: design context + screenshot 확인 완료

### 7.2 분리 이유

`상세_장바구니`는 결제 실행 직전의 카트 검토 화면이다. 배송지, 고객 인증, 상품 목록, 할인/예상 결제 금액, 유의사항을 확인하고 약관 동의 후 결제로 이어진다.

따라서 `checkout-payment-screen`과 금액 ledger, 약관 CTA를 공유하지만, 주 목적은 결제 수단 선택이 아니라 cart contents review다.

### 7.3 화면 구조

```text
StatusBar
AppBar(title: 카트, back action)
Contents
  Pagestack: 배송지 정보
  Section Divider
  Pagestack: SKT 고객 인증
  Section Divider
  Pagestack: 상품
  Section Divider
  Pagestack: 결제 정보
  Section Divider
  Pagestack: 유의사항
Bottom ActionButton: 약관 동의하고 결제하기
```

### 7.4 섹션별 구성

| Section | 역할 | 주요 구성 |
|---|---|---|
| 배송지 정보 | 배송지 요약과 변경 | 수령지 label, 변경 button, phone, address, delivery request |
| SKT 고객 인증 | 선택 회선 상태 확인 | selected count, callout |
| 상품 | 카트 상품 목록 확인 | product count, 전체삭제, `Local_CartList`, close/remove item, coupon/pack items |
| 결제 정보 | 예상 결제 금액 확인 | 총 금액, 할인 rows, internal divider, final expected payment amount |
| 유의사항 | 카트 정책 안내 | bullet list |

### 7.5 컴포넌트와 상태

- `TitleContents`: 배송지 이름과 변경 action처럼 section summary를 구성한다.
- `Local_CartList`: 카트 상품 묶음과 하위 상품 item을 표현한다.
- `PayProdutListItem`: 카트 상품의 하위 coupon/pack item을 표현한다.
- `.ButtonCloseItem`: 상품 삭제 affordance를 표현한다.
- `ListText`: 배송지 요약, 결제 정보 ledger, 유의사항에 사용된다.
- `Callout`: 고객 인증 benefit 안내에 사용된다.
- `ActionButton`: 약관 동의와 결제 진입을 함께 표현한다.

### 7.6 Layout Rhythm

- 기본 rhythm은 `Pagestack` + `4px` section divider다.
- 상품 section은 title에 count와 `전체삭제` action이 붙어 list management affordance를 만든다.
- `Local_CartList` 내부는 product title, close button, item list, coupon/price row를 반복한다.
- 결제 정보 section은 payment screen과 동일하게 row ledger + internal divider + final amount emphasis 구조를 가진다.
- CTA 문구는 `약관 동의하고 결제하기`로 payment screen과 동일한 action gate를 사용한다.

### 7.7 디자인 판단 인사이트

- 카트 화면은 입력보다 검토가 핵심이다. 사용자는 무엇을 담았는지, 어디로 받을지, 얼마를 결제할지 확인한다.
- 카트 상품은 단순 card list가 아니라 제거/전체삭제 affordance를 가진 관리 가능한 목록이다.
- 결제 예상 금액은 `checkout-payment-screen`의 최종 결제 금액보다 앞단의 estimate로 다룬다.
- 배송지 정보는 editable field group이 아니라 summary + 변경 action으로 표현한다.

### 7.8 Screen Inference 적용 후보

이 SOT는 `cart-review-screen`의 기준 reference로 사용할 수 있다.

입력 source에서 아래 신호가 보이면 이 화면 구조를 우선 후보로 고려한다.

- 카트, 장바구니, 담긴 상품, 전체삭제, 상품 삭제 같은 cart management 정보가 있다.
- 배송지 요약과 변경 action이 필요하다.
- 상품 목록과 하위 coupon/pack item을 검토해야 한다.
- 결제 예상 금액과 할인 ledger가 필요하다.
- 약관 동의 후 결제로 이어지는 CTA가 있다.

### 7.9 Component Proposal / Promotion 후보

| 후보 | 이유 | 검토 포인트 |
|---|---|---|
| `CartProductList` | 상품 묶음, 하위 item, 삭제 affordance, 가격이 결합된다. | `Local_CartList`를 runtime component로 승격할지 확인 |
| `DeliverySummaryBlock` | 배송지 요약과 변경 action이 카트/결제 앞단에서 반복될 수 있다. | 입력형 주소 group과 summary형 block을 분리할지 확인 |
| `PaymentSummaryLedger` | 예상 결제 금액 ledger가 payment screen과 공유된다. | estimate/final amount variant가 필요한지 확인 |
| `AgreementGateCTA` | 약관 동의 후 결제 CTA가 payment screen과 공유된다. | CTA wording과 required agreement 연결 확인 |

### 7.10 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `cart-review-screen` | scenario | 배송지 요약, cart product list, payment estimate, agreement CTA |
| `cart-product-list` | domain | product count, 전체삭제, remove item, nested product item |
| `delivery-summary-block` | domain | 배송지 summary, 변경 action, 배송 요청 사항 |
| `payment-summary-ledger` | domain | expected amount variant와 discount rows |
| `agreement-gate-cta` | domain | 약관 동의 후 결제 CTA |

### 7.11 Skill creation lookup plan

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `cart-review-screen` | `10161:49258` | 카트 검토 화면의 전체 section order 확인 | source signal, cart section order, management action, CTA rule |
| `cart-product-list` | `10161:49258` | cart product row와 nested item 구조 확인 | product count, 전체삭제, remove affordance, item hierarchy |
| `delivery-summary-block` | `10161:49258`, `10161:49136` | 배송지 summary가 cart/payment에서 어떻게 쓰이는지 비교 | summary fields, change action, delivery request |
| `payment-summary-ledger` | `10161:49258`, `10161:49136` | estimate/final ledger 차이 확인 | expected/final amount label, discount rows, emphasis |
| `agreement-gate-cta` | `10161:49258`, `10161:49136` | 결제 전 약관 CTA 공유 규칙 확인 | CTA wording, agreement dependency, validation focus |

### 7.12 후속 조회 필요

1. skill 생성 직전에 `10161:49258`의 `Local_CartList` 하위 node를 재조회해 product item 구조와 삭제 affordance를 보완한다.
2. `CartProductList`와 `PaymentSummaryLedger`를 component promotion 후보로 둘지, domain skill rule로 둘지 결정한다.
3. `checkout-payment-screen`과 공유할 `agreement-gate-cta`의 범위를 확정한다.

## 8. 상품 상세화면

### 8.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `10069:97828`
- Section name: `Page (상세-상품)`
- 조회 frame: `10069:97829`, `10069:97927`, `10069:121732`
- 조회일: 2026-06-01
- 조회 상태: 3개 frame 1차 관찰 완료

### 8.2 상위 SOT 묶음

`상품 상세화면` SOT node는 단일 상세 화면이 아니라 상품 유형별 상세 화면을 묶은 section이다. 공통 구조는 `상품 이미지 -> ProductInfo -> 상품별 핵심 결정 영역 -> 상세/안내/추천/푸터 -> bottom CTA`지만, 상품 유형마다 사용자가 결정해야 하는 대상이 다르다.

| Frame | Figma name | Inference screen family | 1차 해석 | Skill 후보 |
|---:|---|---|---|---|
| `10069:97829` | `상세_구독상품` | `subscription-product-detail-screen` | 구독 상품의 가격/할인/혜택과 이용 안내를 확인하고 구독/선물로 진입하는 화면 | `subscription-product-detail-screen`, `product-price-benefit-summary`, `product-detail-media-section`, `notice-accordion-list` |
| `10069:97927` | `상세_기프티콘` | `gifticon-product-detail-screen` | 금액권/쿠폰형 상품을 간결하게 확인하고 구매하는 화면 | `gifticon-product-detail-screen`, `merchant-usage-meta`, `notice-accordion-list`, `bottom-purchase-cta` |
| `10069:121732` | `상세_단말기` | `device-product-detail-screen` | 단말기 색상/용량/배송 옵션을 선택하고 맞춤 옵션 선택으로 진입하는 화면 | `device-product-detail-screen`, `device-option-selection`, `product-detail-media-section`, `bottom-purchase-cta` |

### 8.2.1 SOT 묶음 스킬 생성 브리프

상품 상세 SOT는 checkout 이전의 상품 이해/결정 화면이다. 따라서 skill 생성 시 `product-detail-screen` 하나로 뭉개지 않고, 상품 유형별 scenario skill과 공통 domain/atomic skill로 나눈다.

| 기준 | `subscription-product-detail-screen` | `gifticon-product-detail-screen` | `device-product-detail-screen` |
|---|---|---|---|
| Primary SOT | `10069:97829` | `10069:97927` | `10069:121732` |
| Figma name | `상세_구독상품` | `상세_기프티콘` | `상세_단말기` |
| Dominant UI | ProductInfo, price benefit accordion, media detail, recommendation carousel, notice accordion | ProductInfo, more product button, notice accordion, legal notice, purchase CTA | ProductInfo, option selection cards, media detail, notice accordion, guided CTA |
| 주요 목적 | 할인/혜택과 상품 상세를 이해하고 구독 또는 선물하기로 진행 | 쿠폰형 상품 정보를 확인하고 구매하기로 진행 | 색상/용량/배송 옵션을 선택하고 다음 선택 단계로 진행 |
| 공통 축 | image carousel, ProductInfo, notice accordion, footer, bottom CTA | image carousel, ProductInfo, notice accordion, footer, bottom CTA | image carousel, ProductInfo, option list, media detail, notice accordion, bottom CTA |
| 분리 이유 | 가격/혜택 구조와 dual CTA가 핵심 | 짧은 구매형 상세와 사용처/고시 정보가 핵심 | 옵션 선택과 추천/배송 상태가 핵심 |

### 8.3 구독상품 상세 화면 구조

```text
StatusBar
AppBar(back, share/cart/menu actions)
Contents
  Thumbnail carousel
  ProductInfo: category, product title, original price, discount, sale price, monthly unit, badge, coupon action
  Pagestack: price/benefit accordion
    AccordionPriceInfo: 최대 할인 구독가
    AccordionPriceInfo: 배송 정보
  BannerHorizontalMedium
  Pagestack: product detail media
    UnderlineTab
    Image detail
    ButtonMore
  Section Divider
  Pagestack: 함께 보면 좋은 상품 carousel
  Section Divider
  Pagestack: 상품 고시/이용 안내 accordion list
  Footer
Bottom ActionButton: 선물하기 | 구독하기
```

### 8.4 기프티콘 상세 화면 구조

```text
StatusBar
AppBar(back, share/cart/menu actions)
Contents
  Thumbnail carousel
  ProductInfo: brand/category, product title, price, badge, coupon action, usage meta
  ButtonMoreProduct: 같은 카테고리 상품 더보기
  Section Divider
  Pagestack: 안내사항 accordion
    상품명
    상품소개
    유의사항
  Divider
  Footer
Bottom ActionButton: 구매하기
```

### 8.5 단말기 상세 화면 구조

```text
StatusBar
AppBar(back, share/cart/menu actions)
Contents
  Thumbnail carousel
  ProductInfo: brand, model name, original price, sale price, badges, coupon action
  Pagestack: 색상 option list
  Pagestack: 용량 option list
  Pagestack: 배송 방법 option list
  BannerHorizontalMedium
  Pagestack: product detail media
    UnderlineTab
    Image detail
    ButtonMore
  Pagestack: 상품 고시/이용 안내 accordion list
  Footer
Bottom ActionButton: 맞춤 옵션 바로 선택하기
```

### 8.6 공통 컴포넌트와 상태

- `Thumbnail`: 상품 이미지 carousel과 indicator로 상세 화면의 첫 시각 신호를 만든다.
- `ProductInfo`: category/brand, product title, price, discount, badge, coupon action을 한 덩어리로 제공한다.
- `Pagestack`: 상세 화면의 의미 단위 section을 묶는다.
- `Divider`: 큰 section 경계에는 `4px`, accordion 내부 경계에는 `1px` divider가 쓰인다.
- `AccordionPriceInfo`: 가격/혜택/배송 정보처럼 요약 header와 세부 row를 접을 수 있는 card로 표현한다.
- `AccordionProductInfo`: 구독 상품 상세 고시처럼 logo/title과 세부 내용을 함께 가진다.
- `AccordionNoticeInfo`: 안내사항, 상품 이용 안내, 판매자 정보 등 긴 정책성 정보를 접는 row로 표현한다.
- `UnderlineTab`: 이미지형 상품 상세 영역의 tab navigation을 표현한다.
- `ButtonMore`: 긴 상세 이미지의 progressive disclosure action이다.
- `OptionList`: 단말기 색상/용량/배송 옵션 선택에 쓰인다.
- `ButtonMoreProduct`: 같은 카테고리 상품 더보기 action이다.
- `ActionButton`: 상세 화면의 구매/구독/맞춤 옵션 진입 CTA다.

### 8.7 Layout Rhythm

- 상단은 모든 frame에서 `Thumbnail 480px -> ProductInfo`로 시작한다.
- ProductInfo 내부는 `32px` top padding, `32px` horizontal padding, title/price/badge/coupon action을 compact하게 묶는다.
- 상품 상세 중간 영역은 `Pagestack`과 `4px` divider로 정보 블록을 분리한다.
- card형 accordion은 rounded `20px`, border `1.5px`, 내부 padding `24px`를 가진다.
- 안내 accordion list는 row 사이 `1px` divider와 `20px` vertical padding으로 읽기 rhythm을 만든다.
- 긴 이미지 상세는 `UnderlineTab -> image -> ButtonMore` 구조로 먼저 일부만 보여주고 더보기로 확장한다.
- bottom CTA는 `Screen.Bottom` rail에 고정되고, 구독상품/단말기에는 tooltip성 benefit copy가 함께 붙을 수 있다.

### 8.8 디자인 판단 인사이트

- 상세 화면은 상품명과 가격만 보여주는 화면이 아니라, 상품 유형별로 "구매 전 결정해야 하는 것"을 다르게 드러낸다.
- 구독상품은 할인율, 구독가, 배송/혜택, 상품 상세, 추천, 안내를 길게 제공하고 CTA도 `선물하기 | 구독하기`로 나뉜다.
- 기프티콘은 가격과 사용처, 안내사항이 핵심이며 옵션 선택 없이 바로 `구매하기`로 이어진다.
- 단말기는 상세 설명보다 선택이 먼저다. 색상, 용량, 배송 방법을 ProductInfo 바로 아래에 배치해 구매 가능 조합을 먼저 확정하게 한다.
- 상세 이미지 영역은 모든 상품에서 전체를 한 번에 펼치지 않고 tab과 더보기로 점진 공개한다.
- 안내/고시/판매자 정보는 긴 본문을 항상 노출하지 않고 accordion list로 접어 screen density를 낮춘다.
- product detail screen의 primary user action은 상품 유형에 따라 `구매하기`, `구독하기`, `선물하기`, `맞춤 옵션 바로 선택하기`로 달라진다.

### 8.9 Screen Inference 적용 후보

이 SOT는 `product-detail-screen` 계열의 기준 reference로 사용할 수 있다.

입력 source에서 아래 신호가 보이면 이 화면 구조를 우선 후보로 고려한다.

- 상품 이미지, 상품명, 브랜드/category, 가격, 할인율, badge, 쿠폰 같은 product hero 정보가 있다.
- 상품 상세 설명, 고시 정보, 유의사항, 판매자 정보 같은 긴 정보가 있다.
- 상품 유형이 구독/금액권/기프티콘/단말기처럼 서로 다른 구매 결정을 요구한다.
- 색상, 용량, 배송 방법 같은 옵션 선택지가 있다.
- 구매/구독/선물하기/옵션 선택 같은 bottom primary action이 있다.
- 상세 이미지 또는 콘텐츠를 더보기로 확장해야 한다.

### 8.10 Component Proposal / Promotion 후보

| 후보 | 이유 | 검토 포인트 |
|---|---|---|
| `ProductHeroInfo` | 모든 상세 화면에서 이미지 다음 ProductInfo가 category/title/price/badge/action을 묶는다. | 기존 `ProductInfo` catalog surface로 충분한지, 상품 유형별 price variant가 필요한지 확인 |
| `ProductPriceBenefitAccordion` | 구독상품에서 할인/구독가/배송 정보를 card accordion으로 묶는다. | `AccordionPriceInfo`를 도메인 composite로 승격할지 확인 |
| `ProductDetailMediaSection` | `UnderlineTab`, image, dim, `ButtonMore` 조합이 상세 이미지 영역에 반복된다. | 이미지형 상세와 텍스트형 상세를 분리할지 확인 |
| `NoticeAccordionList` | 상품 고시/안내/판매자 정보가 여러 상세 유형에서 반복된다. | `AccordionNoticeInfo` row list로 충분한지 확인 |
| `DeviceOptionSelection` | 단말기 상세에서 색상/용량/배송 방법 선택이 주요 결정이다. | `OptionList` variant와 selected/default state를 catalog로 표현 가능한지 확인 |
| `BottomPurchaseActionRail` | 구매/구독/선물/옵션 선택 CTA가 하단 고정 rail로 반복된다. | 기존 `bottom-fixed-cta`와 통합할지, product detail variant를 둘지 확인 |

### 8.11 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `product-detail-screen` | scenario umbrella | 상품 상세 공통 hero, ProductInfo, detail/notice, bottom CTA |
| `subscription-product-detail-screen` | scenario | 구독가/할인/혜택 accordion, dual CTA, 추천 상품 |
| `gifticon-product-detail-screen` | scenario | 금액권 price, 사용처 meta, 안내사항, 구매 CTA |
| `device-product-detail-screen` | scenario | 옵션 선택 section order, 추천 badge, guided CTA |
| `product-hero-info` | domain | Thumbnail + ProductInfo + price/badge/coupon action |
| `product-price-benefit-summary` | domain | 할인율, 월 구독가, 배송/혜택 ledger |
| `product-detail-media-section` | domain | tabbed image detail, dim, more button |
| `notice-accordion-list` | domain | 안내/고시/판매자 row accordion |
| `device-option-selection` | domain | option group, selected/default state, AI 추천 badge |
| `merchant-usage-meta` | domain | 기프티콘 사용처, 교환처, 사용 조건 meta |
| `bottom-purchase-cta` | atomic/domain | purchase/subscription/gift/guided CTA label과 tooltip |

### 8.12 Skill creation lookup plan

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `product-detail-screen` | `10069:97828` | 상품 상세 SOT 묶음의 공통 skeleton 확인 | source signal, 공통 region/section order, 상품 유형 분기 기준 |
| `subscription-product-detail-screen` | `10069:97829` | 구독 상품의 가격/혜택/CTA 구조 확인 | price benefit rule, dual CTA, 추천/안내 section rule |
| `gifticon-product-detail-screen` | `10069:97927` | 구매형 금액권 상세의 간결한 구조 확인 | usage meta, notice accordion, purchase CTA, 금지 패턴 |
| `device-product-detail-screen` | `10069:121732` | 단말기 상세의 option selection 구조 확인 | option section order, selected/default state, guided CTA |
| `product-hero-info` | `10069:97829`, `10069:97927`, `10069:121732` | ProductInfo 공통/variant 확인 | title/category/brand, price, discount, badge, coupon action |
| `product-detail-media-section` | `10069:97829`, `10069:121732` | 이미지 상세 영역의 tab/more 구조 확인 | UnderlineTab, image, dim, ButtonMore, progressive disclosure |
| `notice-accordion-list` | `10069:97829`, `10069:97927`, `10069:121732` | 안내 accordion 반복 규칙 확인 | open/closed row, divider, 긴 본문, legal info |
| `device-option-selection` | `10069:121732` | option list의 selected/default/recommended 상태 확인 | color/capacity/delivery option, AI 추천 badge, price subtext |
| `merchant-usage-meta` | `10069:97927` | 금액권의 사용처/교환처 meta 노출 규칙 확인 | 사용처 label, merchant text, legal notice 연결 |

### 8.13 후속 조회 필요

1. skill 생성 직전에 각 frame의 `ProductInfo` 하위 node를 재조회해 가격/할인/쿠폰 action variant를 더 정확히 정리한다.
2. `10069:121732`의 `OptionList`를 상세 조회해 색상/용량/배송 방법의 prop surface와 selected/default state를 catalog와 대조한다.
3. `AccordionNoticeInfo`와 `AccordionProductInfo`의 차이를 component promotion 후보로 분리할지 결정한다.
4. checkout 화면의 `product-summary-sheet`와 상세 화면의 `ProductHeroInfo`가 공유할 수 있는 정보 축을 비교한다.

## 9. 텍스트 리스트

### 9.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `10042:46203`
- Section name: `Page (리스트-텍스트)`
- 조회 frame: `10082:58057`, `10082:58364`, `10082:58227`, `10082:43724`, `10082:47225`
- 조회일: 2026-06-02
- 조회 상태: 5개 frame 1차 관찰 완료

### 9.2 상위 SOT 묶음

`텍스트 리스트` SOT node는 단순 row list 하나가 아니라 내역형 리스트와 안내/공지형 리스트를 함께 포함한다. screen inference와 skill 생성 기준으로는 summary card가 있는 거래/내역 계열과 검색/accordion이 있는 안내 계열을 분리한다.

| Frame | Figma name | Inference screen family | 1차 해석 | Skill 후보 |
|---:|---|---|---|---|
| `10082:58057` | `리스트_이용내역` | `usage-history-list-screen` | 요약 카드와 최근 이용 내역을 section 단위로 보여주는 내역 화면 | `usage-history-list-screen`, `summary-card-ledger`, `info-text-list-row` |
| `10082:58364` | `리스트_T플러스포인트내역` | `point-history-list-screen` | 포인트 잔액 요약, 기간 filter, chip, 월별 거래 내역 화면 | `point-history-list-screen`, `summary-card-ledger`, `filter-chip-row`, `month-grouped-info-list` |
| `10082:58227` | `리스트_할인내역` | `discount-history-list-screen` | 할인 요약과 chip filter를 가진 월별 할인 내역 화면 | `discount-history-list-screen`, `summary-card-ledger`, `filter-chip-row`, `month-grouped-info-list` |
| `10082:43724` | `리스트_이용안내` | `faq-guide-list-screen` | tab, chip, search, accordion으로 안내 정보를 탐색하는 FAQ 화면 | `faq-guide-list-screen`, `tab-chip-search-filter`, `faq-accordion-list` |
| `10082:47225` | `리스트_공지사항` | `notice-text-list-screen` | 요약/필터 없이 공지 row를 고밀도로 훑는 공지 목록 화면 | `notice-text-list-screen`, `info-text-list-row` |

### 9.2.1 SOT 묶음 스킬 생성 브리프

이 SOT 묶음은 `텍스트 리스트`라는 이름 아래 두 갈래의 화면 의도를 포함한다.

- 내역/거래 리스트: summary card, 기간/상태 filter, 월/날짜 group, `InfoTextList` 반복이 핵심이다.
- 안내/공지 리스트: tab/chip/search 또는 순수 row list, FAQ accordion, 검색 가능한 정보 탐색이 핵심이다.

| 기준 | `usage-history-list-screen` | `point-history-list-screen` | `discount-history-list-screen` | `faq-guide-list-screen` | `notice-text-list-screen` |
|---|---|---|---|---|---|
| Primary SOT | `10082:58057` | `10082:58364` | `10082:58227` | `10082:43724` | `10082:47225` |
| 화면 title | 이용내역 | T 플러스포인트 내역 | 할인내역 | 이용안내 | 공지사항 |
| Dominant UI | CardSummary, Pagestack, InfoTextList | CardSummary, Chip, TextListGroup | CardSummary, Chip, TextListGroup | Tab, Chip, SearchBar, AccordionNoticeInfo | Local_ListInfo, InfoTextList |
| 주요 목적 | 이용 내역 요약과 최근 내역 확인 | 포인트 잔액과 적립/사용 내역 탐색 | 할인 내역 확인과 유형 필터링 | 자주 묻는 질문 검색과 category 탐색 | 공지 항목 scan과 상세 진입 |
| 분리 이유 | summary + simple grouped row가 핵심 | 포인트 금액 강조와 chip filter가 핵심 | 할인 내역의 월별 group과 filter가 핵심 | FAQ 검색/accordion 상호작용이 핵심 | summary/filter 없는 순수 텍스트 목록이 핵심 |

### 9.3 내역형 리스트 구조

```text
StatusBar
AppBar(title)
Contents
  Local_Summary: CardSummary
  ContentsTitle / TitleSection with optional right filter
  Chip filter row (optional)
  TextListGroup / Pagestack
    Month or section TitleSection
    InfoTextList
    Divider
    InfoTextList
```

### 9.4 안내/공지형 리스트 구조

```text
StatusBar
AppBar(title)
Contents
  Tab row (optional)
  Chip filter row (optional)
  SearchBar (optional)
  AccordionList or Local_ListInfo
    AccordionNoticeInfo or InfoTextList
    Divider
```

### 9.5 컴포넌트와 상태

- `CardSummary`: 목록 앞에 aggregate metric을 제시한다. 사용 가능 포인트, 보유 포인트, 적립 예정 포인트처럼 primary metric과 secondary row/action이 함께 있다.
- `InfoTextList`: 텍스트 리스트의 row primitive다. 내역형에서는 title, right value, sub meta, 날짜/유형을 담고 공지형에서는 title과 날짜를 밀도 있게 반복한다.
- `Chip`: 리스트 filter를 가로로 제공한다. active chip은 brand primary fill, inactive chip은 gray alpha 계열로 보인다.
- `TitleSection`: 목록 group title 또는 기간/정렬 filter를 제공한다.
- `TextListGroup` / `Local_ListInfo`: `32px` side margin, `329px` rail을 기준으로 row를 쌓는다.
- `Tab`: 안내 화면의 상위 category를 나눈다.
- `SearchBar`: FAQ/안내 화면에서 질문 탐색을 좁힌다.
- `AccordionNoticeInfo`: 질문/답변형 안내 row의 open/closed 상태를 표현한다.
- `Divider`: row 사이는 `1px`, 큰 section 사이는 `4px` divider로 끊는다.

### 9.6 Layout Rhythm

- AppBar 아래 contents는 대체로 `y=107` 지점에서 시작한다.
- summary card가 있는 내역형 화면은 card `x=12`, `w=369`, rounded `20` 계열로 시작하고 이후 list rail로 내려간다.
- dense list rail은 `x=32`, `w=329`를 기준으로 한다.
- `InfoTextList` row는 약 `71px` 높이, 상하 `16px` padding, `1px` divider rhythm을 가진다.
- summary와 list 사이에는 title/filter stack이 들어가며, summary가 없는 공지 화면은 바로 list rail로 진입한다.
- 이 묶음에는 bottom fixed CTA가 없다. primary action은 filter/search/row selection이다.

### 9.7 디자인 판단 인사이트

- 텍스트 리스트 화면은 하나의 패턴으로 묶으면 과하다. 내역/거래 리스트와 안내/공지 리스트를 먼저 나눠야 한다.
- source에 잔액, 사용 가능 금액, 보유 수량 같은 aggregate가 있을 때만 summary card를 제안한다.
- 내역형 리스트에서는 월/날짜 group title과 우측 기간 filter가 정보 탐색 품질을 높인다.
- `InfoTextList`는 row primitive로 보고, 각 내역 row를 별도 component로 과승격하지 않는다.
- FAQ/가이드 입력 신호가 있으면 plain `InfoTextList`가 아니라 `AccordionNoticeInfo` 기반으로 제안한다.
- `공지사항`은 summary/filter 없이도 정본 패턴이다. source에 aggregate나 filter 신호가 없으면 card/filter를 임의로 만들지 않는다.
- bottom CTA가 없는 묶음이므로 row selection이나 search가 primary user action인 화면에서는 `Screen.Bottom`을 만들지 않는다.

### 9.8 Screen Inference 적용 후보

| Source signal | 제안 화면/구조 |
|---|---|
| 이용내역, 사용내역, 최근 내역, 날짜별 기록 | `usage-history-list-screen`, summary card optional, grouped `InfoTextList` |
| 포인트, 적립, 사용, 선물, 보유 포인트 | `point-history-list-screen`, `summary-card-ledger`, `filter-chip-row`, point value emphasis |
| 할인, 할인내역, 쿠폰 적용 기록 | `discount-history-list-screen`, `summary-card-ledger`, monthly grouped list |
| 자주 묻는 질문, FAQ, Q/A, 이용안내, 검색 | `faq-guide-list-screen`, `tab-chip-search-filter`, `faq-accordion-list` |
| 공지사항, 알림 목록, 날짜 있는 단순 row | `notice-text-list-screen`, pure `InfoTextList` list |
| 반복되는 title/meta/subtext row | `info-text-list-row` + `Divider` |

### 9.9 Component Proposal / Promotion 후보

| 후보 | 근거 SOT | 검토할 내용 |
|---|---|---|
| `SummaryCardLedger` | `10082:58057`, `10082:58364`, `10082:58227` | primary metric, secondary rows, optional action button을 catalog surface로 승격할 수 있는지 확인 |
| `InfoTextListRow` | `10082:58057`, `10082:58364`, `10082:58227`, `10082:47225` | title, right value, sub meta, date, divider, chevron 여부를 prop surface로 정리 |
| `FilterChipRow` | `10082:58364`, `10082:58227`, `10082:43724` | active/inactive state와 horizontal overflow 규칙 확인 |
| `MonthGroupedInfoList` | `10082:58364`, `10082:58227` | month title + repeated row 묶음을 domain composite로 둘지 판단 |
| `FAQAccordionList` | `10082:43724` | tab/chip/search와 accordion list를 한 scenario skill로 둘지, domain skill로 분리할지 판단 |
| `NoticeTextList` | `10082:47225` | summary 없는 plain text list를 별도 scenario/domain 후보로 보존 |

### 9.10 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `text-list-screen` | scenario umbrella | 텍스트 리스트 SOT의 내역형/안내형 분기, summary/filter/search/row primitive 선택 |
| `usage-history-list-screen` | scenario | summary optional, section title, recent usage row grouping |
| `point-history-list-screen` | scenario | point summary, point value emphasis, chip filter, month group |
| `discount-history-list-screen` | scenario | discount summary, filter chip, monthly discount row list |
| `faq-guide-list-screen` | scenario | tab, chip, search, FAQ accordion open/closed state |
| `notice-text-list-screen` | scenario | summary/filter 없는 dense notice row list |
| `summary-card-ledger` | domain | aggregate metric, secondary row, optional action |
| `info-text-list-row` | domain/atomic | title, right value, sub meta, date, divider rhythm |
| `filter-chip-row` | domain | active/inactive filter chip row |
| `month-grouped-info-list` | domain | month title, repeated InfoTextList, divider rhythm |
| `faq-accordion-list` | domain | Q/A row, open body, closed rows, search/filter interaction |

### 9.11 Skill creation lookup plan

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `text-list-screen` | `10042:46203` | 텍스트 리스트 SOT 묶음의 공통/분기 skeleton 확인 | source signal, 내역형/안내형 분기, rejected pattern |
| `usage-history-list-screen` | `10082:58057` | 이용내역 summary와 grouped row 구조 확인 | summary optional rule, row group, divider rhythm |
| `point-history-list-screen` | `10082:58364` | 포인트 잔액/적립/사용 구조 확인 | point value emphasis, chip filter, month group |
| `discount-history-list-screen` | `10082:58227` | 할인 내역 summary/filter 구조 확인 | discount summary, filter chip, month grouped row |
| `faq-guide-list-screen` | `10082:43724` | tab/chip/search/accordion 조합 확인 | FAQ source signal, open/closed state, search placement |
| `notice-text-list-screen` | `10082:47225` | pure notice row list 확인 | no-summary/no-filter rule, row density |
| `summary-card-ledger` | `10082:58057`, `10082:58364`, `10082:58227` | CardSummary variant와 metric row 확인 | primary metric, secondary rows, action button |
| `info-text-list-row` | `10082:58057`, `10082:58364`, `10082:58227`, `10082:47225` | row primitive의 prop surface 확인 | title/rightValue/subMeta/date/divider/chevron |
| `filter-chip-row` | `10082:58364`, `10082:58227`, `10082:43724` | chip state와 filter semantics 확인 | active state, chip labels, horizontal overflow |
| `faq-accordion-list` | `10082:43724` | FAQ accordion open/closed 구조 확인 | question title, body, closed row, divider |

### 9.12 후속 조회 필요

1. `InfoTextList` prop surface를 `@cx/components/catalog`와 대조해 row primitive로 바로 쓸 수 있는지 확인한다.
2. `CardSummary` variant를 재조회해 내역/포인트/할인 summary의 공통 prop과 분기 prop을 나눈다.
3. `Chip` active/inactive state와 filter label mapping을 확인한다.
4. FAQ accordion의 open body, closed row height, divider를 재조회해 validation focus로 만들 수 있는지 확인한다.
5. 카드 리스트 SOT를 조회한 뒤 텍스트 리스트와 card list의 row/card promotion 기준을 비교한다.

## 10. 메인 페이지

### 10.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `10042:57541`
- Section name: `Page (메인)`
- 조회 frame: `10042:58271`, `10095:44460`, `10082:59886`, `10042:58251`
- 조회일: 2026-06-02
- 조회 상태: 4개 frame 1차 관찰 완료

### 10.2 상위 SOT 묶음

`메인 페이지` SOT는 하나의 home pattern이 아니라 관리 홈, 검색 홈, 쇼핑 feed 홈으로 분리된다. 공통으로는 AppBar와 BottomNavigation을 가진 mobile home shell이지만, primary action과 content rhythm이 다르다.

| Frame | Figma name | Inference screen family | 1차 해석 | Skill 후보 |
|---:|---|---|---|---|
| `10042:58271` | `메인_관리_세그먼트1` | `management-home-screen` | 보유 혜택/사용량/멤버십/청구 등 account management card stack | `management-home-screen`, `home-card-section-stack`, `bottom-navigation-shell` |
| `10095:44460` | `메인_관리_세그먼트2` | `management-home-screen` | segment가 바뀐 관리 홈. 더 긴 card section과 nested contents item 포함 | `management-home-screen`, `home-card-section-stack`, `home-segment-variant` |
| `10082:59886` | `메인_검색` | `search-home-screen` | 큰 hero search intent, keyword chip, search bar 중심 화면 | `search-home-screen`, `search-hero-banner`, `keyword-chip-cloud` |
| `10042:58251` | `메인_쇼핑` | `shopping-home-feed-screen` | BannerShop, ChipImage, HomeCardCarousel 반복으로 구성된 긴 shopping feed | `shopping-home-feed-screen`, `home-card-carousel-feed`, `product-carousel-section` |

### 10.3 화면 구조

```text
StatusBar
AppBar
Contents
  management: BannerBenefit + CardSectionList + ButtonItem
  search: TitleMain + BannerSearch carousel + keyword chips + SearchBar
  shopping: BannerShop + ChipImage + repeated HomeCardCarousel
BottomNavigation
```

### 10.4 디자인 판단 인사이트

- 메인 화면은 `Screen.Bottom` CTA가 아니라 `BottomNavigation`이 shell 역할을 한다.
- 관리 홈은 여러 task를 카드로 펼치는 dense dashboard다. hero를 크게 만들기보다 `CardSection`의 반복과 summary/action item을 우선한다.
- 검색 홈은 primary user action이 검색이다. keyword chip과 search bar가 하단 CTA보다 중요하다.
- 쇼핑 홈은 one-screen dashboard가 아니라 long feed다. `HomeCardCarousel` 반복이 section rhythm의 정본이다.
- `main-task-screen` 하나로는 부족하므로 umbrella 아래 `management-home-screen`, `search-home-screen`, `shopping-home-feed-screen`을 둔다.

### 10.5 Screen Inference 적용 후보

| Source signal | 제안 화면/구조 |
|---|---|
| 보유 혜택, 사용량, 멤버십, 청구, barcode, MY, 관리 | `management-home-screen`, card section stack |
| 검색, 키워드, 추천 검색어, 무엇을 찾나요 | `search-home-screen`, hero search + keyword chips + search bar |
| 쇼핑, 추천 상품, 구독 상품, carousel, benefit feed | `shopping-home-feed-screen`, repeated HomeCardCarousel |
| 하단 탭, MY/검색/쇼핑 같은 global navigation | `bottom-navigation-shell`; `Screen.Bottom` CTA로 대체하지 않는다 |

### 10.6 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `main-task-screen` | scenario umbrella | 관리/검색/쇼핑 home 분기, bottom navigation shell |
| `management-home-screen` | scenario | BannerBenefit, CardSectionList, account task card stack |
| `search-home-screen` | scenario | TitleMain, BannerSearch carousel, keyword chip cloud, SearchBar |
| `shopping-home-feed-screen` | scenario | BannerShop, ChipImage, HomeCardCarousel repeated feed |
| `home-card-section-stack` | domain | CardSection 반복, ButtonItem 더보기, banner insertion |
| `home-card-carousel-feed` | domain | TitleMain + carousel slot 반복, section 간 vertical rhythm |
| `bottom-navigation-shell` | atomic/domain | home shell navigation, bottom CTA 금지 조건 |

### 10.7 Skill creation lookup plan

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `main-task-screen` | `10042:57541` | 메인 묶음의 공통 shell과 분기 기준 확인 | home source signal, BottomNavigation rule, rejected bottom CTA |
| `management-home-screen` | `10042:58271`, `10095:44460` | 관리 홈 segment variant와 card stack 확인 | card section order, summary/action item, segment variant |
| `search-home-screen` | `10082:59886` | 검색 home의 hero/chip/search 구조 확인 | keyword signal, search primary action, chip cloud |
| `shopping-home-feed-screen` | `10042:58251` | shopping feed의 carousel section 반복 확인 | carousel feed rhythm, banner/chip insertion |

## 11. 카드 리스트

### 11.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `9896:91122`
- Section name: `Page (리스트-카드)`
- 조회 frame: `9792:110378`, `9792:110351`, `9754:62082`, `9754:62038`, `9754:62108`, `9754:62134`
- 조회일: 2026-06-02
- 조회 상태: 6개 frame 1차 관찰 완료

### 11.2 상위 SOT 묶음

카드 리스트는 `Chip`, `FilterSorting`, `ProductListGroup`을 공통 상단 구조로 사용하지만 card shape는 상품군에 따라 달라진다. 구독상품/단말기는 image product grid, 혜택/요금제/부가서비스/인터넷은 horizontal 또는 plan-like card list가 중심이다.

| Frame | Figma name | Inference screen family | 1차 해석 | Skill 후보 |
|---:|---|---|---|---|
| `9792:110378` | `리스트_구독상품` | `subscription-card-list-screen` | category chip + sort/filter + 2-column product cards | `subscription-card-list-screen`, `card-list-filter-bar`, `product-card-grid` |
| `9792:110351` | `리스트_단말기` | `device-card-grid-screen` | 단말기 category chip + sort/filter + image-heavy product grid | `device-card-grid-screen`, `product-card-grid`, `device-card-emphasis` |
| `9754:62082` | `리스트_혜택` | `benefit-card-list-screen` | 혜택 category chip + sort/filter + horizontal benefit cards | `benefit-card-list-screen`, `product-horizontal-card-list` |
| `9754:62038` | `리스트_요금제` | `plan-card-list-screen` | 요금제 category chip + sort/filter + grouped horizontal cards | `plan-card-list-screen`, `plan-card-list`, `card-list-section-title` |
| `9754:62108` | `리스트_부가서비스` | `add-on-service-card-list-screen` | chip 없이 count/sort/filter + dense add-on cards | `add-on-service-card-list-screen`, `service-card-list` |
| `9754:62134` | `리스트_인터넷` | `internet-card-list-screen` | chip 없이 count/sort/filter + 인터넷 상품 cards | `internet-card-list-screen`, `service-card-list` |

### 11.3 화면 구조

```text
StatusBar
AppBar(title)
Chip category row (optional)
FilterSorting(count + sort + filter)
ProductListGroup
  ContentsTitle (optional)
  ListProductRow / ListProductHorizontal repeated
```

### 11.4 디자인 판단 인사이트

- 카드 리스트의 공통 핵심은 `FilterSorting`이다. 결과 개수, 정렬, 필터 affordance를 row 상단에 유지해야 한다.
- 구독상품/단말기는 2-column 또는 image-heavy `ListProductRow`를 사용하고, 혜택/요금제/서비스는 full-width horizontal card에 가깝다.
- `Chip`은 모든 카드 리스트에 있지 않다. 부가서비스/인터넷처럼 source가 count/sort/filter만 요구하면 chip을 만들지 않는다.
- 카드 리스트는 텍스트 리스트보다 image/price/badge/benefit token의 시각 위계가 중요하다.
- `ProductListGroup`은 list container로 유지하되, 세부 card type은 상품군 signal로 분기한다.

### 11.5 Screen Inference 적용 후보

| Source signal | 제안 화면/구조 |
|---|---|
| 구독상품, 쿠폰팩, 상품 이미지, 월 가격 | `subscription-card-list-screen`, product card grid |
| 단말기, 휴대폰, iPhone, Galaxy, 할부/용량 | `device-card-grid-screen`, image-heavy grid |
| 혜택, 제휴, 쿠폰, 브랜드 로고 | `benefit-card-list-screen`, horizontal benefit card list |
| 요금제, 데이터, 5G/LTE, 월정액 | `plan-card-list-screen`, plan card list |
| 부가서비스, 서비스명, 월 이용료 | `add-on-service-card-list-screen`, service card list |
| 인터넷, 와이파이, 속도, 월 이용료 | `internet-card-list-screen`, service card list |
| 전체 n개, 인기순, 필터 | `card-list-filter-bar`, `FilterSorting` 필수 |

### 11.6 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `card-list-screen` | scenario umbrella | card list 상품군 분기, chip/filter/sort, card type 선택 |
| `subscription-card-list-screen` | scenario | subscription product card grid, price/badge hierarchy |
| `device-card-grid-screen` | scenario | device image grid, capacity badge, discount price emphasis |
| `benefit-card-list-screen` | scenario | benefit horizontal cards, merchant/category metadata |
| `plan-card-list-screen` | scenario | plan price/data card, grouped sections |
| `add-on-service-card-list-screen` | scenario | service card list without chip, count/sort/filter first |
| `internet-card-list-screen` | scenario | internet product card list, speed and monthly price emphasis |
| `card-list-filter-bar` | domain | count, sort, filter icon/button row |
| `product-card-grid` | domain | 2-column product cards, image/title/price/badge |
| `product-horizontal-card-list` | domain | full-width ListProductHorizontal stack |
| `service-card-list` | domain | service/internet card copy density and tag chips |

### 11.7 Skill creation lookup plan

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `card-list-screen` | `9896:91122` | 카드 리스트 묶음의 공통 filter/sort/card type 확인 | source signal 분기, rejected plain text list |
| `subscription-card-list-screen` | `9792:110378` | 구독상품 grid 구조 확인 | image/price/badge hierarchy, grid rhythm |
| `device-card-grid-screen` | `9792:110351` | 단말기 card grid 구조 확인 | device image, capacity badge, discount price |
| `benefit-card-list-screen` | `9754:62082` | 혜택 horizontal card 구조 확인 | merchant/category meta, benefit chips |
| `plan-card-list-screen` | `9754:62038` | 요금제 grouped list 구조 확인 | plan group title, data/price emphasis |
| `service-card-list` | `9754:62108`, `9754:62134` | 부가서비스/인터넷 card list 공통 확인 | no-chip rule, service tags, monthly fee |

## 12. 결과 및 확인 완료

### 12.1 Provenance

- Figma file: `SKT GenUI Test 0514`
- SOT section node: `10090:60588`
- Section name: screenshot 기준 `결과 및 확인 완료` 묶음
- 조회 frame: `10090:58791`, `10090:58796`, `10090:58816`, `10090:58801`
- 조회일: 2026-06-02
- 조회 상태: 4개 frame 1차 관찰 완료

### 12.2 상위 SOT 묶음

결과/완료 묶음은 성공 메시지만 있는 단순 완료 화면과, 결제/배송/상품/안내 정보를 길게 보여주는 receipt형 완료 화면을 함께 포함한다.

| Frame | Figma name | Inference screen family | 1차 해석 | Skill 후보 |
|---:|---|---|---|---|
| `10090:58791` | `완료_개통` | `activation-completion-screen` | 축하 메시지, 개통 정보 summary, 데이터 옮기기/확인 CTA | `activation-completion-screen`, `completion-summary-card`, `completion-bottom-actions` |
| `10090:58796` | `완료_요금제변경` | `plan-change-completion-screen` | 요금제 변경 완료 메시지와 요금제 정보 card | `plan-change-completion-screen`, `completion-summary-card` |
| `10090:58816` | `완료_해지` | `cancellation-completion-screen` | 해지 완료 메시지, 추천 상품 carousel, 환불정보/확인 CTA | `cancellation-completion-screen`, `completion-recommendation-carousel` |
| `10090:58801` | `완료_결제` | `payment-receipt-completion-screen` | 결제 정보, 상품/배송지/추천/선물 안내를 포함한 긴 receipt 화면 | `payment-receipt-completion-screen`, `receipt-ledger-section`, `completion-bottom-actions` |

### 12.3 화면 구조

```text
StatusBar
Close AppBar
Completion hero message
Optional summary / receipt sections
Optional recommendation carousel
Bottom fixed action rail
```

### 12.4 디자인 판단 인사이트

- 완료 화면의 primary content는 성공/완료 메시지다. 기존 상세/결제 화면의 입력 UI를 계속 노출하지 않는다.
- 단순 완료는 큰 hero message + rounded summary card + bottom action으로 충분하다.
- 결제 완료는 receipt형이다. payment ledger, 상품, 배송지, 안내를 section divider로 길게 쌓는다.
- 해지 완료처럼 next action이 추천/환불정보일 수 있다. 완료 화면이라고 무조건 `확인` 하나만 두면 다음 행동 품질이 낮아진다.
- Close icon이 header action으로 보이며, bottom action은 완료 후 next task를 명확히 한다.

### 12.5 Screen Inference 적용 후보

| Source signal | 제안 화면/구조 |
|---|---|
| 개통 완료, 축하, 휴대폰/요금제/납부금액 | `activation-completion-screen`, summary card, data transfer secondary action |
| 요금제 변경 완료, 변경된 요금제, 다음 적용일 | `plan-change-completion-screen`, plan info summary |
| 해지 완료, 다음에 다시 만나요, 환불 | `cancellation-completion-screen`, recommendation carousel + refund action |
| 결제 완료, 결제 정보, 배송지, 선물 안내, 최종 결제 금액 | `payment-receipt-completion-screen`, receipt sections |
| 완료 후 다음 행동이 2개 이상 | `completion-bottom-actions`, primary/secondary split |

### 12.6 스킬화 후보

| 후보 skill | 종류 | 포함할 규칙 |
|---|---|---|
| `completion-feedback-screen` | scenario umbrella | 완료/결제/해지/변경 분기, hero message, next action |
| `activation-completion-screen` | scenario | 개통 완료 summary, data transfer secondary action |
| `plan-change-completion-screen` | scenario | 변경 완료 summary, 적용일/요금제 정보 |
| `cancellation-completion-screen` | scenario | 해지 완료 message, recommendation/refund actions |
| `payment-receipt-completion-screen` | scenario | receipt ledger, product/delivery/gift sections |
| `completion-summary-card` | domain | rounded summary card with key/value rows |
| `receipt-ledger-section` | domain | payment rows, final amount emphasis, divider |
| `completion-recommendation-carousel` | domain | 완료 후 추천 상품 carousel |
| `completion-bottom-actions` | atomic/domain | confirm/next task split, no input CTA carryover |

### 12.7 Skill creation lookup plan

| 만들 skill | 재조회할 SOT node | 조회 목적 | 작성할 내용 |
|---|---:|---|---|
| `completion-feedback-screen` | `10090:60588` | 완료 묶음의 단순/receipt 분기 확인 | source signal, hero message, next action, rejected input UI |
| `activation-completion-screen` | `10090:58791` | 개통 완료 summary와 CTA 확인 | activation summary, secondary data transfer action |
| `plan-change-completion-screen` | `10090:58796` | 요금제 변경 완료 summary 확인 | plan info, next billing/apply date |
| `cancellation-completion-screen` | `10090:58816` | 해지 완료와 recommendation/refund action 확인 | completion + recommendation carousel |
| `payment-receipt-completion-screen` | `10090:58801` | receipt형 완료 화면의 section order 확인 | payment ledger, product, delivery, notice, bottom actions |

### 12.8 후속 조회 필요

1. `10090:60588` metadata가 section 단위로 타임아웃되어 shallow tree 재조회가 필요하다.
2. completion skill 생성 직전에는 각 frame의 `completion hero`, `summary card`, `bottom action` node를 다시 조회해 정확한 component name과 prop surface를 확인한다.

## 13. 공통/분리 기준

### 13.1 공통으로 skill화할 후보

| 후보 skill | 참조 SOT | 이유 |
|---|---|---|
| `address-input` | `10095:23484`, `10095:23501` | 우편번호, 주소 찾기, 기본 주소, 상세 주소 조합이 두 화면에 반복된다. |
| `same-as-info-shortcut` | `10095:23484`, `10095:23501` | `가입자 정보와 동일` checkbox가 반복 입력을 줄이는 shortcut으로 쓰인다. |
| `payment-summary-ledger` | `10161:49136`, `10161:49258` | 결제 정보/예상 결제 금액 ledger가 결제와 카트 화면에 반복된다. |
| `agreement-gate-cta` | `10161:49136`, `10161:49258` | 약관 동의 후 결제 CTA가 결제 진입 화면에서 반복된다. |
| `bottom-fixed-cta` | `10095:23484`, `10095:23501`, `10161:49136`, `10161:49258` | 긴 form/checkout 흐름에서도 primary action을 하단에 고정한다. |
| `section-divider-rhythm` | `10095:23484`, `10095:23501`, `10161:49136`, `10161:49258` | `Pagestack` 사이를 `4px` divider로 구분하는 정보 chunking이 반복된다. |
| `product-hero-info` | `10069:97829`, `10069:97927`, `10069:121732` | 모든 상품 상세 화면에서 이미지 다음 ProductInfo가 핵심 hero 정보로 반복된다. |
| `product-detail-media-section` | `10069:97829`, `10069:121732` | 상세 이미지, tab, 더보기 조합이 긴 상품 상세에서 반복된다. |
| `notice-accordion-list` | `10069:97829`, `10069:97927`, `10069:121732` | 안내/고시/판매자 정보를 accordion row list로 접어 density를 낮춘다. |
| `bottom-purchase-cta` | `10069:97829`, `10069:97927`, `10069:121732` | 상품 유형별 primary purchase action을 하단 rail로 고정한다. |
| `summary-card-ledger` | `10082:58057`, `10082:58364`, `10082:58227` | 목록 상단에서 잔액/사용 가능량/요약 수치를 먼저 제시하는 내역형 리스트 패턴이 반복된다. |
| `info-text-list-row` | `10082:58057`, `10082:58364`, `10082:58227`, `10082:47225` | 텍스트 목록의 핵심 row primitive가 여러 내역/공지 화면에 반복된다. |
| `filter-chip-row` | `10082:58364`, `10082:58227`, `10082:43724` | 리스트를 상태/유형별로 좁히는 chip filter가 반복된다. |
| `month-grouped-info-list` | `10082:58364`, `10082:58227` | 월별 title 아래 내역 row를 반복하는 구조가 포인트/할인 화면에 반복된다. |
| `bottom-navigation-shell` | `10042:58271`, `10095:44460`, `10082:59886`, `10042:58251` | 메인 화면은 bottom CTA가 아니라 BottomNavigation shell을 유지한다. |
| `card-list-filter-bar` | `9792:110378`, `9792:110351`, `9754:62082`, `9754:62038`, `9754:62108`, `9754:62134` | 카드 리스트에서 count, sort, filter affordance가 반복된다. |
| `completion-summary-card` | `10090:58791`, `10090:58796` | 완료 화면의 핵심 결과 정보를 rounded key/value card로 요약한다. |
| `completion-bottom-actions` | `10090:58791`, `10090:58796`, `10090:58816`, `10090:58801` | 완료 후 다음 행동을 bottom rail에 명확히 분리한다. |

### 13.2 분리해서 skill화할 후보

| 후보 skill | Primary SOT | 분리 이유 |
|---|---:|---|
| `form-entry-screen` | `10095:23484` | 개인정보 입력, 인증 완료 안내, field state 구분이 핵심이다. |
| `checkout-additional-info` | `10095:23501` | 상품 요약, 옵션 선택, callout, 배송 정보 반복이 핵심이다. |
| `checkout-payment-screen` | `10161:49136` | 결제 수단, 할인/포인트, 현금영수증, 약관 동의가 핵심이다. |
| `cart-review-screen` | `10161:49258` | 장바구니 상품 관리, 배송지 요약, 예상 결제 금액 검토가 핵심이다. |
| `option-selection-group` | `10095:23501` | radio selected/unselected row와 선택 후 설명 callout이 핵심이다. |
| `product-summary-sheet` | `10095:23501` | checkout context를 상단 sheet로 유지하는 패턴이다. |
| `cart-product-list` | `10161:49258` | nested product item과 삭제 affordance가 핵심이다. |
| `payment-method-selection` | `10161:49136` | 결제 수단 option, 추천 배너, 선택 상태가 핵심이다. |
| `subscription-product-detail-screen` | `10069:97829` | 구독가/할인/혜택 accordion, 추천 상품, dual CTA가 핵심이다. |
| `gifticon-product-detail-screen` | `10069:97927` | 금액권 price, 사용처 meta, 안내사항, 구매 CTA가 핵심이다. |
| `device-product-detail-screen` | `10069:121732` | 색상/용량/배송 옵션 선택과 guided CTA가 핵심이다. |
| `device-option-selection` | `10069:121732` | option card selected/default state와 추천 badge가 핵심이다. |
| `usage-history-list-screen` | `10082:58057` | 이용 내역 요약과 최근 내역 row grouping이 핵심이다. |
| `point-history-list-screen` | `10082:58364` | 포인트 잔액, 적립/사용 filter, 포인트 value emphasis가 핵심이다. |
| `discount-history-list-screen` | `10082:58227` | 할인 요약, filter chip, 월별 할인 내역이 핵심이다. |
| `faq-guide-list-screen` | `10082:43724` | tab/chip/search와 FAQ accordion 탐색이 핵심이다. |
| `notice-text-list-screen` | `10082:47225` | summary/filter 없이 공지 row를 scan하는 구조가 핵심이다. |
| `faq-accordion-list` | `10082:43724` | 질문/답변 open/closed state와 검색 가능한 안내 탐색이 핵심이다. |
| `management-home-screen` | `10042:58271`, `10095:44460` | account/task management card stack과 BottomNavigation shell이 핵심이다. |
| `search-home-screen` | `10082:59886` | search hero, keyword chip, search bar가 primary action이다. |
| `shopping-home-feed-screen` | `10042:58251` | HomeCardCarousel 반복 feed와 shopping category chip이 핵심이다. |
| `subscription-card-list-screen` | `9792:110378` | 구독상품 image card grid와 price/badge hierarchy가 핵심이다. |
| `device-card-grid-screen` | `9792:110351` | 단말기 image grid, 용량/할인 badge, device price가 핵심이다. |
| `benefit-card-list-screen` | `9754:62082` | 혜택/브랜드 horizontal card list가 핵심이다. |
| `plan-card-list-screen` | `9754:62038` | 요금제 data/price card와 grouped section이 핵심이다. |
| `add-on-service-card-list-screen` | `9754:62108` | chip 없는 service card list와 count/sort/filter가 핵심이다. |
| `internet-card-list-screen` | `9754:62134` | 인터넷 속도/월 이용료 중심 card list가 핵심이다. |
| `activation-completion-screen` | `10090:58791` | 개통 완료 메시지와 개통 정보 summary가 핵심이다. |
| `plan-change-completion-screen` | `10090:58796` | 요금제 변경 완료와 적용 정보 summary가 핵심이다. |
| `cancellation-completion-screen` | `10090:58816` | 해지 완료 이후 환불/추천 next action이 핵심이다. |
| `payment-receipt-completion-screen` | `10090:58801` | payment receipt, 배송지, 상품, 안내 section order가 핵심이다. |

### 13.3 Skill 생성 전 다시 볼 것

skill 생성자는 다음 순서로 SOT를 다시 조회한다.

1. 만들 scenario skill의 primary SOT frame을 조회한다.
2. 같은 SOT 묶음 안의 sibling frame을 조회해 공통 규칙과 고유 규칙을 분리한다.
3. component promotion 후보가 있으면 해당 section node를 추가 조회한다.
4. 최종 skill에는 primary SOT, secondary SOT, source input signal, composition rule, rejected pattern, validation focus를 적는다.
