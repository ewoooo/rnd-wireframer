---
documents:
  - prompt ../docs/prompts/screen-intent.md
  - skill ../docs/skills/design-skills/design-fundamentals/README.md
  - skill ../docs/skills/review-skills/source-fidelity-review/README.md
  - skill ../docs/skills/review-skills/state-coverage-review/README.md
---

# screen-intent

SourceSpec를 받아 화면 목적·사용자 행동·콘텐츠 우선순위를 판단하는 02-screen-intent step의 지식 묶음.

documents의 순서가 LLM에 전달되는 순서다. 항목 형식은 `<kind> <sourceRef>`이며
sourceRef는 `packages/agent/src` 기준 상대경로(`../docs/...`)다.
수정 후 `pnpm sync:skillset`을 실행해야 카탈로그에 반영된다.
