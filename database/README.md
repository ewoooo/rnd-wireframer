# Database Artifacts

이 디렉토리는 로컬 개발용 입력/소비 데이터만 둔다.

## Directories

| 디렉토리 | 상태 | 소비처 |
|---|---|---|
| `client-imports/` | 사용자가 업로드한 원천 import. 파괴적으로 수정하지 않는다. | source parser / adapter |
| `tables/` | 승인된 소비 데이터 table dump. | local render DB scripts |

## Rules

- `client-imports/PRDD/screen/`에는 기본 생성 대상인 `*-0.md` base 화면만 둔다. `*-1.md`, `*-2.md`, `*-E1.md` 같은 비-base PRDD 화면은 `client-imports/PRDD/variants/`에 보관하고, 명시적 variant/retry 생성 때만 입력으로 사용한다.
- `apps/web`의 browser-facing UI는 `/api/*` endpoint를 소비한다.
- `tables/`는 현재 local render DB migration/audit scripts의 입력이다.
- parser, AI generation, inference runtime은 `tables/`를 직접 덮어쓰지 않는다.
- 생성 후보와 검수 산출물은 `@cx/inference` artifact store 또는 `.data/` 같은 로컬 실행 저장소에 둔다.
- `@cx/layout/catalog`의 pattern은 소비 데이터에 복사하지 않고 `pattern.id`, `pattern.variant`로만 참조한다.
- 생성/검수 prompt와 checklist 정본은 `packages/agent/docs/`가 소유한다.
