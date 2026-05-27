# Database Artifact Lifecycle

이 디렉토리는 파일 위치로 데이터 생명 주기를 강제한다.

## Directories

| 디렉토리 | 상태 | 소비처 |
|---|---|---|
| `client-imports/` | 사용자가 업로드한 원천 import. 파괴적으로 수정하지 않는다. | parser / register 단계 |
| `ai-imports/` | AI 생성 후보와 중간 산출물. 승인 전 staging 영역이다. | 검수 / promote 단계 |
| `tables/` | 승인된 소비 데이터 table dump. | `apps/web`, `@cx/renderer` adapter |
| `pattern-store/` | legacy pointer. JSON 원천은 `@cx/pattern-store`로 이동했다. | 문서 안내 |
| `generated-decks/` | AI prompt/validation context deck 빌드 산출물. SOT가 아니며 재생성 가능하다. | compose / decorate / validator |

## Rules

- `client-imports/PRDD/screen/`에는 기본 생성 대상인 `*-0.md` base 화면만 둔다. `*-1.md`, `*-2.md`, `*-E1.md` 같은 비-base PRDD 화면은 `client-imports/PRDD/variants/`에 보관하고, 명시적 variant/retry 생성 때만 입력으로 사용한다.
- `apps/web` workbench는 `tables/` 또는 동일 shape의 loader 결과만 화면 데이터로 소비한다.
- parser, AI generation, agent pipeline은 `tables/`를 직접 덮어쓰지 않는다.
- `ai-imports/*.materialized.json`은 `tables/` 후보일 뿐이다.
- Claude/AI 보정 흐름은 `agent-assets.json`, `agent-assets.registered.json`, `agent-assets.composed.json`, `agent-assets.decorated.json`, `agent-assets.design-review.json`, `agent-assets.reviewed.json`, `agent-assets.materialized.json`을 남긴다.
- 후보를 `tables/`로 반영할 때는 `@cx/agent/promote-database-tables` 또는 `/api/agent/promote-ai-import` 경계를 사용한다.
- promote/import는 참조 무결성, renderer projection validation, pattern-store warning report를 통과한 후보만 `tables/`로 쓴다.
- `@cx/pattern-store`의 pattern은 소비 데이터에 복사하지 않고 `pattern.id`, `pattern.variant`로만 참조한다.
- `generated-decks/` deck은 `@cx/components/catalog`, `@cx/pattern-store`, `docs/design` 같은 원천 계약을 LLM 입력용으로 요약한 context bundle이다.
- 생성/검수 로직의 기준은 deck 파일 자체가 아니라 원천 계약이다. deck이 오래됐거나 충돌하면 원천 계약을 우선하고 deck을 다시 생성한다.
