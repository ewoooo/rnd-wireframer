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

## 2026-05-22 - Renderer Agent

- 변경: `packages/renderer/src/component-catalog.ts`를 추가해 compose/AI/editor가 참조할 component prop/variant 계약 레지스트리를 `component-catalog` 이름으로 신설함
- 변경: 실제 `@cx/components` 구현 컴포넌트와 renderer composite node를 `source`로 구분하고, alias 조회와 prop contract 조회 helper를 `@cx/renderer` public export에 추가함
- 이유: Compose 단계가 UI 라벨/설명/variant를 추론하려면 component별 허용 prop surface와 variant 값을 알아야 하며, 이 계약은 React 구현 패키지가 아니라 renderer/validation 경계에서 공유되어야 하기 때문
- 검증: `npx biome check packages/renderer/src/component-catalog.ts packages/renderer/src/__tests__/component-catalog.test.ts packages/renderer/src/index.ts`, `npm test -- --run packages/renderer`, `npx tsc --noEmit --incremental false`
- 후속: `packages/agent` compose 단계가 hardcoded prop key 매핑 대신 `component-catalog`를 참조하도록 연결 필요
