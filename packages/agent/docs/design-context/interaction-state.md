# Interaction State Bundle

Bundle id: `interaction-state`

Source docs: `packages/agent/docs/skills/references/design/INTERACTION_PATTERNS.md`, `packages/agent/docs/skills/references/design/SECTION_PATTERNS.md`

이 번들은 state coverage·CTA·폼·오버레이 조합 규칙을 제공한다. 우선순위는 **source evidence ≥ schema/catalog > 이 번들 규칙**이다. 상태는 화면 surface가 암시할 때만 다루고, 단순 정적 화면에 불필요한 상태 node를 강제하지 않는다.

## State coverage (surface가 암시할 때만)

- form: validation/error, disabled(제출 불가), required/optional.
- list/search: empty/no-result, long item, selected/filter.
- detail/async: loading, error, populated.
- SourceSpec에 errorPolicy, 필수 동의, disabled, loading, validation 근거가 있으면 `display.stateRole`로 bounded 하게 표현한다.
- **한 슬롯의 상태 변형(특히 Bottom CTA)은 반드시 `display.when`으로 상호배타 게이팅**하거나 단일 노드로 표현한다. 렌더러는 `display.when`이 falsy가 아닌 모든 노드를 그리므로, 게이팅 없는 primary CTA를 Bottom에 2개 두면 둘 다 보인다(규칙 위반).

## CTA 위치·위계

- 단일 페이지 진행: `Screen.Bottom`의 `SinglePrimaryAction`(full-width `ActionButton`).
- **Screen.Bottom의 primary `ActionButton`은 size를 생략하거나 `xlarge`(full-width, 56px)로 둔다.** 하단 주 CTA는 최대 강조 사이즈이므로 `large` 이하로 낮추지 않는다(생략 시 기본값이 `xlarge`다).
- primary-shaped CTA(같은 너비/높이/radius/pill/고대비/하단 근접)는 Bottom에 **1개만** 허용.
- Content 내부 보조 액션은 Bottom CTA보다 최소 한 단계 낮은 시각 강도여야 한다: 짧은 너비, 낮은 높이, 약한 surface, field group 인접.
- 인증/중복확인/재요청 등 field 종속 액션은 **`TextField` props.button: true + props.buttonLabel**로 표현한다(입력란 우측 compact 버튼). `props.rightElement`는 renderer 소유라 AI가 쓰지 않는다(render-node 객체를 넣으면 무시되거나 깨진다). Content full-width ActionButton으로 올리지 않는다.
- 섹션 더보기는 `TitleSection` 우측 링크 등 낮은 강도. primary로 올리지 않는다.
- primary CTA를 스크롤 콘텐츠 중간에 직접 배치하지 않는다.
- 2버튼 조합은 `Secondary + Primary` 순서. 동등하지 않으면 Primary가 더 넓은 비중.

## 폼 조합

- 관련 `TextField`는 그룹 제목과 묶는다. 제목 없이 필드만 나열하지 않는다.
- 보조 버튼은 필드 외부 병렬보다 입력 component 우측 slot으로.
- 에러 메시지는 해당 `TextField` 바로 아래 help text slot에. 별도 callout으로 필드 밖에 띄우지 않는다.
- 약관 동의: `전체 동의 → Divider → 필수/선택 항목` 순서. 결제 약관은 Checkbox + 내용 확인 accordion/policy detail 연결.
- 다중 옵션 단일 선택(예: 인증수단 휴대폰/PASS/공동인증서)은 `RadioGroup`(`props.options` 배열 + `selectedValue`)으로 표현한다. 단일 `Radio`를 옵션 수만큼 나열하거나, 옵션이 source 노트에만 있다고 1개만 렌더하지 않는다. options는 source의 나열(`순서=A → B → C`)에서 추출한다. RadioGroup이 candidate면 `componentContractCatalog.candidates`에 노출된 계약을 따른다.

## 오버레이 선택

- 옵션 1개 선택 / 3개 이상 목록·스크롤 / 여러 조건 필터: BottomSheet.
- 2줄 이내 단순 확인·취소 / 결제 실패·에러 알림: Popup.
- Popup 내부 스크롤이 생기면 BottomSheet로 전환. BottomSheet 중첩 금지.
- Popup 버튼은 `PopupActionButton` 사용(일반 Button 직접 배치 금지).

## 컴포넌트 상태 표현 (참고)

- Accordion: 닫힘 h=21(제목만), 열림 h=95(전체). 첫 항목 열린 상태로 시작.
- ListText(읽기 전용 22px) vs ListSelected(선택 가능 34~52px) 구분.

## 완료 화면

- 제목은 결과를 즉시 이해하는 친근한 구어체(예: `결제가 완료되었어요`).
- 하단 2버튼: 좌측 Secondary(추가 탐색), 우측 Primary(확인/홈 복귀).

## Boundaries

- 누락된 interaction(primary CTA, bottom action, form validation, overlay close/action)은 발명하지 말고 source 근거가 있을 때만 채운다.
