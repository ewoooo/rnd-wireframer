# Design Context Bundles

이 디렉토리는 agent-facing design-context bundle 요약을 관리한다.

정본 책임:

- `docs/design/`: SKT SDUI 디자인 패턴 원문 정본
- `packages/agent/docs/design-context/`: agent prompt에 넣기 위한 압축 규칙
- `@cx/schema`: bundle ref DTO 계약
- `@cx/orchestration`: bundle id 선택과 선택 이유
- `@cx/pipeline`: 선택 결과와 사용 artifact 기록

Bundle은 `SourceSpec`, JSON Schema, component contract, pattern candidate를 우회하지 않는다. Bundle 본문은 화면 구조, state coverage, interaction, visual foundation, review 기준을 좁히는 보조 context로만 사용한다.

현재 bundle:

- `layout-composition.md`: Screen, Region, Area, Component 조합과 section role 기준
- `interaction-state.md`: 상태 coverage와 interaction surface 기준
- `visual-foundation.md`: spacing, divider, typography, visual foundation 기준
- `quality-review.md`: source fidelity, anti-slop, bounded finding 기준
