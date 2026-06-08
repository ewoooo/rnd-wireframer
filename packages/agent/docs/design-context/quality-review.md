# Quality Review Bundle

Bundle id: `quality-review`

Source docs: `packages/agent/docs/skills/quality-review/checklist.md`, `packages/agent/docs/skills/screen-generation/checklist.md`, `docs/design/SECTION_PATTERNS.md`, `docs/design/INTERACTION_PATTERNS.md`

이 번들은 생성물의 디자인 품질을 점수화하고 결함을 bounded finding으로 기록하는 게이트를 제공한다. schema/contract 실패와 디자인 품질 우려를 구분한다.

## 점수 차원 (0–5)

- `hierarchy`: 섹션 순서·component 선택으로 위계가 읽히는가. 제목/행/강조 구분이 명확한가.
- `separation`: 구분선·간격이 맥락에 맞는가. 섹션 사이 4px, 행 사이 1px, 카드 그룹 내부 과잉 Divider 없음.
- `fidelity`: source의 목적·ref·label·값·action을 보존했는가. source에 없는 값을 발명하지 않았는가.

각 차원 0–5로 채점하고, 위반은 finding으로 남긴다.

## P0 finding (revision 후보)

- source-fidelity: SourceSpec의 핵심 목적·ref·label·값·action이 사라짐.
- anti-slop: SourceSpec에 없는 metric/수치/혜택/상품명/action label을 사실처럼 표시. placeholder copy(`Feature 1`, `Sample content`), source 무관 장식, 임의 icon/emoji.
- component-contract/layout: catalog·pattern candidate·source ref catalog 밖의 component/layout id/source ref/visual role 사용.
- interaction: primary CTA, bottom action, form validation, overlay close/action 등 완료 필수 interaction 누락.
- state-coverage: form/list/search/detail/async surface가 암시됨에도 필요한 empty/error/loading/disabled/validation 상태가 전혀 없음.
- separation: 섹션 구분 Divider 누락, 또는 카드 내부 Divider 남발.
- interaction: Screen.Bottom에 `display.when` 게이팅 없는 primary CTA가 2개 이상(상태 변형이 동시 노출). 단일 CTA 또는 상호배타 when으로 수정.

## P1 finding (human review/warning 후보)

- 상태 coverage를 모든 화면에 강제하지 않는다. surface가 암시할 때만 누락 지적.
- 화면 유형별 기본 품질:
  - Form: label, required/optional hint, validation/error placement, primary CTA가 intent와 맞는지.
  - List/search: empty/no-result, long item, secondary action, selected/filter.
  - Detail: 핵심 정보 우선순위, section grouping, bottom action 위치.
  - Complete/result: 결과 메시지, next action, 돌아가기/닫기.
  - Bottom sheet/popup: dismiss/action pair, destructive distinction, content overflow.

## 운영 원칙

- finding은 어느 축(source fidelity, state coverage, anti-slop, layout, component contract, interaction, hierarchy, separation)인지 드러낸다.
- 수정 제안은 bounded 하게. 전체 재작성 같은 과도한 처방을 피한다.
- 반복 실패나 warning-only 불확실성이 남으면 발명하지 말고 human review용 맥락을 남긴다.
- 결과는 revision stage나 human review에서 재사용 가능하게 구조화한다.
