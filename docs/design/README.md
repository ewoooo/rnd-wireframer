# 디자인 문서 (사람용 SSOT)

이 폴더는 SKT SDUI 화면 관찰·디자인 패턴의 **사람용 정본(SSOT)**이다. 분량이 길고 산문 형태이며, 디자이너·개발자가 읽고 갱신하는 원천이다.

## 에이전트용 규칙과의 관계

에이전트(생성/검수 AI)는 이 문서를 직접 읽지 않는다. 대신 이 문서를 **압축·bounded 규칙으로 린트한 결과**가 `packages/agent/docs/design-context/`에 산다.

```text
docs/design/*.md              (사람용 관찰 SSOT, 산문)
  └─ 린트/요약 ─▶ packages/agent/docs/design-context/*.md   (에이전트용 압축 규칙)
        └─ @cx/orchestration이 ref 선택 ─▶ @cx/pipeline이 본문 로드/주입 ─▶ AI prompt context
```

Figma SOT를 screen inference가 직접 참조할 수 있게 분해한 reference contract는 [reference/](/Users/plusx/Documents/rnd-screen-generator/docs/design/reference/README.md)에 둔다. 원본 Figma node provenance는 [reference/figma-source.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/reference/figma-source.md)를 기준으로 한다.

| 에이전트 번들 | 린트 원천(docs/design 등) |
|---|---|
| `visual-foundation` | `LAYOUT_SPACING_CONTRACT.md`, `VISUAL_FOUNDATION_OBSERVATIONS.md`, `COMPONENT_INVENTORY.md` |
| `layout-composition` | `COMPOSITION_LAYERS.md`, `SECTION_PATTERNS.md`, `SCREEN_PATTERN_SUMMARY.md`, `LAYOUT_SPACING_CONTRACT.md` |
| `interaction-state` | `INTERACTION_PATTERNS.md`, `SECTION_PATTERNS.md` |
| `quality-review` | `packages/agent/docs/quality-review/checklist.md`, `packages/agent/docs/screen-generation/checklist.md` |

## 갱신 원칙

- 이 문서의 관찰을 바꾸면, 영향 받는 `packages/agent/docs/design-context/` 번들도 함께 갱신한다.
- 번들은 산문 복붙이 아니라 에이전트가 바로 적용 가능한 규칙 목록으로 유지한다(번들당 권장 ≤ 120줄).
- ref→파일 매핑은 `packages/pipeline/.../design-context-catalog.ts`와 `packages/orchestration/.../design-context.ts`가 소유한다.
