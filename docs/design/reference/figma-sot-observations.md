# Figma SOT Observations

## 1. 문서 책임

이 문서는 Figma 디자인 정본을 화면별로 조회하며 확인한 구조, 디자인 판단, screen inference 적용 후보를 누적한다.

이 문서의 모든 기록은 추후 agent skill 생성을 쉽게 하기 위한 준비 기록이다. 이 문서는 곧바로 agent skill로 사용하지 않는다. 여러 SOT 화면에서 반복되는 판단 축이 확인되면 `packages/agent/docs/design-skills/`의 bounded skill 문서로 승격한다.

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

## 9. 공통/분리 기준

### 9.1 공통으로 skill화할 후보

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

### 9.2 분리해서 skill화할 후보

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

### 9.3 Skill 생성 전 다시 볼 것

skill 생성자는 다음 순서로 SOT를 다시 조회한다.

1. 만들 scenario skill의 primary SOT frame을 조회한다.
2. 같은 SOT 묶음 안의 sibling frame을 조회해 공통 규칙과 고유 규칙을 분리한다.
3. component promotion 후보가 있으면 해당 section node를 추가 조회한다.
4. 최종 skill에는 primary SOT, secondary SOT, source input signal, composition rule, rejected pattern, validation focus를 적는다.
