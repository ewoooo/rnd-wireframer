# Quality Review Checklist

P0 finding은 revision 후보가 될 수 있는 결함이다. P1 finding은 human review나 warning 후보로 남길 수 있는 결함이다.

## 점수 (scores)

- `context.designContextBundles`의 quality-review 게이트로 hierarchy, separation, fidelity, actionClarity, densityFit, patternFit을 0–5로 채점해 `scores`에 담는다.
- 위반 규칙(섹션 사이 divider 누락, 카드 내부 divider 남발 등)은 severity finding으로 기록한다.
- finding은 원인 레이어를 `understand`, `compose`, `revise` 중 하나로 표시한다.

## P0

- Schema validation 실패와 디자인 품질 우려를 구분한다.
- SourceSpec에 있는 핵심 목적, source ref, label, 값, action이 생성 결과에서 사라지면 source-fidelity finding으로 기록한다.
- SourceSpec에 없는 metric, 수치, 혜택, 상품명, action label을 생성 결과가 사실처럼 표시하면 source-fidelity 또는 anti-slop finding으로 기록한다.
- Component catalog, pattern candidate, source reference catalog 밖의 component, layout id, source ref, visual role을 사용하면 component-contract 또는 layout finding으로 기록한다.
- Primary CTA, bottom action, form validation, overlay close/action처럼 화면 완료에 필요한 interaction이 누락되면 interaction finding으로 기록한다.
- Form, list, search, detail, async surface가 SourceSpec이나 screenIntent에서 드러나는데 empty, error, loading, disabled, validation state 중 필요한 상태가 전혀 고려되지 않으면 state-coverage finding으로 기록한다.
- Placeholder copy, `Feature 1`, `Sample content`, source와 무관한 장식 요소, 임의 icon/emoji 역할처럼 AI 생성 흔적이 보이면 anti-slop finding으로 기록한다.

## P1

- State coverage는 모든 화면에 loading, empty, error, populated, edge를 강제하지 않는다. 화면 surface가 해당 상태를 암시할 때만 누락을 지적한다.
- Finding은 source fidelity, state coverage, anti-slop, layout, component contract, interaction, hierarchy 중 어느 축의 문제인지 드러낸다.
- 화면 유형별 기본 품질을 확인한다.
  - Form: label, required/optional hint, validation/error placement, primary CTA가 source intent와 맞는지 본다.
  - List/search: empty/no-result, long item, secondary action, selected/filter state가 필요한지 본다.
  - Detail: 핵심 정보 우선순위, section grouping, bottom action 위치가 맞는지 본다.
  - Complete/result: 결과 메시지, next action, 돌아가기/닫기 action이 충분한지 본다.
- Bottom sheet/popup: dismiss/action pair, destructive action distinction, content overflow 위험을 본다.
- 수정 제안은 bounded하게 적고, 전체 재작성처럼 과도한 처방을 피한다.
- 결과는 revision stage나 human review에서 재사용할 수 있도록 구조화한다.

## Output Contract

`quality-review`의 출력은 다음 성격을 만족해야 한다.

- 기계적으로 재사용 가능한 bounded finding 목록
- 필요 시 severity와 target/path를 포함한 구조화된 결과
- direct file mutation이 아닌 suggestion/issue 중심 결과
- `scores` 객체에 hierarchy, separation, fidelity, actionClarity, densityFit, patternFit을 0-5 정수로 담는다(선택이지만 권장).
- 각 finding은 가능하면 `layer`를 `understand`, `compose`, `revise` 중 하나로 지정한다.
