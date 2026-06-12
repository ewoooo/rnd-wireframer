---
documents:
  - prompt ../docs/prompts/intent-composition.md
  - skill ../docs/skills/design-skills/design-fundamentals/README.md
  - skill ../docs/skills/review-skills/source-fidelity-review/README.md
  - skill ../docs/skills/review-skills/state-coverage-review/README.md
  - skill ../docs/skills/generate-skills/divider-usage-rules/README.md
  - skill ../docs/skills/compose-skills/pagestack-section-unit/README.md
  - skill ../docs/skills/review-skills/pattern-fit-review/README.md
  - skill ../docs/skills/review-skills/visual-hierarchy-review/README.md
---

# intent-composition

SourceSpec를 받아 화면 의도 판단과 레이아웃·섹션 구성 계획을 한 번의 생성으로 내는
02-intent-composition step의 지식 묶음. 기존 screen-intent + composition-planning
스킬셋의 합집합이며, prompt가 intent 선확정 → catalog 참조의 사고 순서를 강제한다.

documents의 순서가 LLM에 전달되는 순서다. 항목 형식은 `<kind> <sourceRef>`이며
sourceRef는 `packages/agent/src` 기준 상대경로(`../docs/...`)다.
수정 후 `pnpm sync:skillset`을 실행해야 카탈로그에 반영된다.
