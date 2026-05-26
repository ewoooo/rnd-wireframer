# Database Artifact Lifecycle

이 디렉토리는 파일 위치로 데이터 생명 주기를 강제한다.

## Directories

| 디렉토리 | 상태 | 소비처 |
|---|---|---|
| `client-imports/` | 사용자가 업로드한 원천 import. 파괴적으로 수정하지 않는다. | parser / register 단계 |
| `ai-imports/` | AI 생성 후보와 중간 산출물. 승인 전 staging 영역이다. | 검수 / promote 단계 |
| `tables/` | 승인된 소비 데이터 table dump. | `apps/web`, `@cx/renderer` adapter |
| `pattern-store/` | layout preset reference catalog. | resolver / decorator |

## Rules

- `apps/web` workbench는 `tables/` 또는 동일 shape의 loader 결과만 화면 데이터로 소비한다.
- parser, AI generation, agent pipeline은 `tables/`를 직접 덮어쓰지 않는다.
- `ai-imports/*.db-tables.json`은 `tables/` 후보일 뿐이다.
- 후보를 `tables/`로 반영하려면 별도 promote/import 단계에서 참조 무결성, renderer validation, 변경 이력 기록을 통과해야 한다.
- `pattern-store/`의 pattern은 소비 데이터에 복사하지 않고 `pattern.id`, `pattern.variant`로만 참조한다.
