# Screen Generation Checklist

P0 items must pass before returning.

## P0

- Output is one JSON object only.
- Output is the RenderTree object for the current `render-tree` output contract.
- No HTML, CSS, Markdown fence, or explanatory prose is included.
- `SourceSpec`의 핵심 의도와 source ref를 유지한다.
- `SourceSpec`, `screenIntent`, `compositionPlan`에 없는 metric, 수치, 상품명, 혜택, action label을 사실처럼 발명하지 않는다.
- Placeholder copy, filler label, generic sample content, source와 무관한 장식 component를 넣지 않는다.
- RenderTree uses the version required by `context.jsonSchema`.
- Screen, region, area, and component layout ids come from `context.references.layoutCatalog` or selected reference documents.
- Component type, props, variant, and layout role are selected only from `context.references.componentCatalog`, SourceSpec raw data, `compositionPlan`, and selected reference evidence.
- When `context.references.selectedScreenReferences` or `context.references.selectedAreaReferences` are mounted, apply their structure rules and avoid rules without copying literal sketch labels, node ids, or unsupported measurements.
- Source regions remain mapped to Screen Header, Contents, and Bottom.
- Source areas remain grouped unless the validation contract requires a structural wrapper.
- Source나 upstream artifact가 화면 유형을 분명히 암시하면 그 유형의 핵심 완료 조건을 지킨다.
  - Form: 입력 label과 primary submit action을 누락하지 않는다.
  - List/search: item source와 primary browsing/search action을 누락하지 않는다.
  - Detail: 핵심 정보 section과 primary/bottom action을 누락하지 않는다.
  - Complete/result: 결과 상태와 next action을 누락하지 않는다.
  - Bottom sheet/popup: dismiss 또는 confirm action을 누락하지 않는다.
- Component-specific display, binding, and default values are placed in component node props.
- RenderTree는 `@cx/renderer`가 소비 가능한 구조를 유지한다.

## P1

- Node metadata titles are readable and traceable to source intent.
- Layout props are objects, not string shortcuts.
- Bottom actions are not placed in scrollable content when a bottom region exists.
- 구분은 area stack 노드의 `props.divider`만 사용한다(`"contents"`=반복 row 사이 1px, `"section"`=area 뒤 4px section break, `"none"`=구분 없음). `divider:true`, `sectionDivider`, 행 구분용 Divider leaf는 쓰지 않는다.
- 시각 위계는 component 선택과 props로 표현하고, 강조용 임의 색/그라디언트/아이콘을 발명하지 않는다.
- Source가 form, list, search, detail, async surface를 암시하면 필요한 상태 표현을 누락하지 않는다. 단순 정적 화면에는 불필요한 상태 node를 강제하지 않는다.
- Form screen은 label, required/optional hint, validation/error placement, primary CTA를 화면 목적에 맞게 배치한다.
- List/search screen은 empty/no-result, long item, secondary action, selected/filter state가 필요한지 고려한다.
- Detail screen은 핵심 정보 우선순위, section grouping, bottom action 위치를 보존한다.
- Complete/result screen은 결과 메시지, next action, 돌아가기/닫기 action을 source intent에 맞게 둔다.
- Bottom sheet/popup은 dismiss/action pair, destructive action distinction, content overflow 위험을 고려한다.

## Output Contract

`screen-generation`의 현재 목표 출력은 `@cx/schema`의 `render-tree` output contract와 일치하는 RenderTree JSON 객체다.

```json
{
  "version": "render-tree.v0.1",
  "metadata": { "id": "screen-id" },
  "children": []
}
```

규칙:

- `renderTree`는 preview 가능한 materialized 산출물이다.
- `context.jsonSchema`가 generation-time output shape을 제공하고, 최종 검증은 `@cx/schema`의 원본 output contract가 담당한다.
- schema 밖 wrapper(`renderTree`, `payload`, `result`)나 병행 artifact를 추가하지 않는다.

## RenderTree Rules

- Use top-level `version`, `metadata`, and `children`.
- Do not use `contractVersion`, `schemaVersion`, `root`, `tree`, `nodeId`, or `componentId`.
- Top-level `metadata` must not include `title`.
- Every render node `metadata` must include `id` and `title`.
- The first child must be a Screen root node.
- Put `Screen.Header`, `Screen.Contents`, and `Screen.Bottom` under the Screen root when the source has matching regions.
- Use `node.layout` for layout pattern selection, shaped as `layout.<target>.<PatternName>`.
- Component values belong in `node.props`.
