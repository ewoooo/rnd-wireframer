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

## 2026-05-26 - Data Agent

- 변경: `docs/data-mockups`를 제거하고, 데이터 위치를 `database/client-imports`, `database/ai-imports`, `database/tables`, `database/pattern-store` 생명 주기로 정리함
- 이유: 원천 import, AI 후보 산출물, 승인된 소비 데이터의 경계를 파일 위치로 강제하기 위함
- 검증: 최신 기준 문서에서 `docs/data-mockups` 참조가 제거됐고, `generate-register`가 table 후보를 `database/ai-imports/agent-assets.db-tables.json`에만 쓰도록 확인함
