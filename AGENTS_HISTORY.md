# RND Screen Generator 에이전트 히스토리

## 1. 문서 책임

이 문서는 변경 이력만 기록한다.

제품, 아키텍처, 데이터, 에이전트 역할의 최신 기준은 각 책임 문서를 참조한다.

`MASTER_PLAN.md`, `AGENTS.md`, `AGENTS_HISTORY.md`는 루트 전역 문서로 유지한다. 세부 설계 문서는 `docs/` 아래에 둔다.

| 주제 | 기준 문서 |
|---|---|
| 제품 계획 | [MASTER_PLAN.md](./MASTER_PLAN.md) |
| 개발 아키텍처 | [docs/development/DEVELOPMENT_ARCHITECTURE.md](./docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| 데이터 설계 | [docs/development/DATA_MAP.md](./docs/development/DATA_MAP.md) |
| 에이전트 운영 | [AGENTS.md](./AGENTS.md) |

## 2. 기록 형식

```markdown
## YYYY-MM-DD - Agent

- 변경:
- 이유:
- 검증:
- 후속:
```

새 엔트리는 가장 최근 월의 `docs/agents-history/YYYY-MM.md`에 추가한다. 월이 바뀌면 새 월 파일을 만들고 아래 인덱스에 링크를 추가한다.

## 3. 월별 인덱스

- [2026-05](./docs/agents-history/2026-05.md)

## 4. 최근 엔트리

가장 최근 1건만 inline 유지. 그 외는 위 월별 파일 참조.

## 2026-05-26 - Promote Import Adapter

- 변경: `@cx/agent/promote-database-tables`와 `/api/agent/promote-ai-import`를 추가해 `*.db-tables.json` 후보를 검증 후에만 `database/tables` wrapper payload로 반영하도록 구현함
- 변경: promote API는 dry-run을 기본값으로 두고, 명시적으로 `dryRun: false`일 때만 `database/tables`에 파일을 쓴다
- 이유: parser/AI 후보 산출물이 승인 소비 데이터인 `database/tables`를 직접 덮어쓰지 못하게 하기 위함
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run packages/agent apps/web/src/server apps/web/src/app/api/agent/promote-ai-import`, 관련 파일 `npx biome check --write`
- 후속: 소비 데이터 계약 기준 FastAPI read model 초안, sample `sourceRef`/state/edge variant 보강

## 2026-05-26 - Data Agent

- 변경: `tablesToRenderTree`/`tablesToRenderTrees` projection을 `apps/web` adapter에서 `@cx/renderer`의 `render-tree-projection.ts`로 이동하고, renderer가 table shape -> RenderTree DTO -> React render 책임을 갖도록 조정함
- 이유: RenderTree DTO를 만드는 책임과 React node로 소비하는 책임이 모두 renderer 경계에 있어야 앱 workbench가 생성/렌더링 파이프라인 중간 책임을 갖지 않기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, 관련 파일 `npx biome check`

## 2026-05-26 - Data Agent

- 변경: `@cx/renderer`의 public 입력 타입/API를 `WireframeNode` 계열에서 `RenderTreeNode`/`RenderTree`/`RenderTree*Renderer` 계열로 변경하고, render tree를 DB로 되돌리는 `renderTreeToTables` 역변환 adapter를 제거함
- 이유: render tree는 렌더러 입력 DTO여야 하며, 역변환 adapter가 남아 있으면 render tree가 저장/편집 원본처럼 사용될 수 있기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, `npx biome check`, `jq empty database/ai-imports/*.json database/tables/*.json database/pattern-store/*.json`

## 2026-05-26 - Data Agent

- 변경: `pattern-store` layout preset의 `props`를 `layoutProps`로 좁히고, `WireframeNode`를 저장/편집 관리 모델이 아니라 `@cx/renderer` 입력용 render projection DTO로 문서화함
- 이유: pattern-store가 leaf props처럼 보이면 DB leaf의 텍스트/상태/hook 책임과 layout preset 책임이 섞이고, WireframeNode를 중간 관리 원본으로 보면 DB -> render projection -> React 흐름이 불필요하게 길어지기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, `jq empty database/ai-imports/*.json database/tables/*.json database/pattern-store/*.json`

## 2026-05-26 - Data Agent

- 변경: `components.json` row를 component render row로 정리하고, `composite`는 2개 이상의 `@cx/components`가 결합된 wrapper 의미로만 남기도록 계약/코드/문서를 갱신함
- 이유: 일반 component row를 composite라고 부르면 합성 컴포넌트와 단일 컴포넌트 참조의 경계가 다시 흐려지기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, 관련 파일 `npx biome check`
