# RND Screen Generator 에이전트 히스토리

## 1. 문서 책임

이 문서는 변경 이력만 기록한다.

제품, 아키텍처, 데이터, 에이전트 역할의 최신 기준은 각 책임 문서를 참조한다.

| 주제 | 기준 문서 |
|---|---|
| 제품 계획 | [MASTER_PLAN.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/MASTER_PLAN.md) |
| 개발 아키텍처 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| 데이터 설계 | [DATA_MAP.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DATA_MAP.md) |
| 에이전트 운영 | [AGENTS.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/AGENTS.md) |

## 2. 기록 형식

```markdown
## YYYY-MM-DD - Agent

- 변경:
- 이유:
- 검증:
- 후속:
```

## 2026-05-18 - Documentation Agent

- 변경: 초기 문서 세트 생성
- 이유: RND Screen Generator의 제품 방향, 아키텍처, 에이전트 운영 기준을 정리하기 위함
- 검증: 샘플 SB/OGN 문서 구조를 확인하고 문서 4종을 생성함
- 후속: 데이터 설계 문서 필요

## 2026-05-18 - Data Agent

- 변경: `DATA_MAP.md` 추가
- 이유: SB/OGN과 관계형 DB 사이의 매핑 기준이 필요함
- 검증: SB, OGN, 생성 이력 중심의 테이블 설계를 문서화함
- 후속: SQL 마이그레이션 생성 필요

## 2026-05-18 - Documentation Agent

- 변경: 문서 본문을 한국어 중심으로 재작성
- 이유: 프로젝트 문서의 독자와 운영 언어를 한국어로 맞추기 위함
- 검증: 5개 문서의 헤더와 주요 섹션을 확인함
- 후속: 실제 구현이 시작되면 코드와 문서 동기화 필요

## 2026-05-18 - Data Agent

- 변경: 입력 기준을 Markdown 파싱에서 JSON 적재로 변경
- 이유: OGN과 SB를 JSON화해서 DB에 넣는 방향으로 결정됨
- 검증: `source_json`, `schema_version`, `normalized_json`, `raw_item` 기준을 반영함
- 후속: SB JSON Schema와 OGN JSON Schema 확정 필요

## 2026-05-18 - Documentation Agent

- 변경: 문서 간 책임을 분리하고 중복 내용을 참조 링크로 대체
- 이유: 같은 내용이 여러 문서에 반복되어 유지보수 비용이 커짐
- 검증: `MASTER_PLAN`, `DEVELOPMENT_ARCHITECTURE`, `AGENTS`, `AGENTS_HISTORY`를 경량화함
- 후속: `DATA_MAP.md`를 기준으로 실제 마이그레이션 문서 또는 SQL 작성 필요

## 2026-05-18 - Documentation Agent

- 변경: `docs/design/DESIGN_PATTERNS.md` 허브 내용을 `AGENTS.md`로 이동하고 기존 파일을 삭제
- 이유: 디자인 패턴 허브 역할을 에이전트 운영 문서에서 함께 관리하기 위함
- 검증: 분리된 디자인 문서들이 삭제된 허브 파일을 참조하지 않도록 출처 문구를 갱신함
- 후속: 디자인 문서 추가 시 `AGENTS.md`의 디자인 패턴 문서 목록도 함께 갱신 필요

## 2026-05-18 - Documentation Agent

- 변경: `AGENTS.md`의 작업 인계 형식 설명을 보강
- 이유: 템플릿만으로는 각 항목의 의미가 불명확함
- 검증: 작업, 기준 문서, 기대 산출물, 검증 방법, 열린 이슈의 의미를 항목별로 추가함
- 후속: 없음

## 2026-05-18 - Architecture Agent

- 변경: 생성 AI는 Claude, 검수 AI는 Codex로 역할을 분리
- 이유: 와이어프레임 생성과 품질 검수를 서로 다른 모델 책임으로 운영하기 위함
- 검증: `AGENTS.md`, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`, `MASTER_PLAN.md`에 역할 분리를 반영함
- 후속: Claude 생성 모델명과 Codex 검수 모델명을 구현 환경 변수로 확정 필요

## 2026-05-18 - Architecture Agent

- 변경: AI 실행 경로에 Agent SDK와 로컬 세션 우선 정책 추가
- 이유: 로컬 AI 세션이 있으면 세션을 재사용하고, 없을 때만 원격 API를 호출하기 위함
- 검증: `AGENTS.md`, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`에 Agent SDK, local session, remote fallback, 실행 이력 필드를 반영함
- 후속: Agent SDK에서 탐지할 로컬 Claude/Codex 세션 식별 방식 확정 필요

## 2026-05-18 - Architecture Agent

- 변경: SB 케이스 분기를 Screen Variant로 생성하는 정책 추가
- 이유: 각 화면의 엣지 케이스를 누락하지 않고 Base Screen과 함께 생성/검수하기 위함
- 검증: `DEVELOPMENT_ARCHITECTURE.md`에 Screen Variant 생성 정책과 API를 추가하고, `DATA_MAP.md`에 `wireframe_screen_variants` 저장 구조를 추가함
- 후속: `schemas/wireframe.py`에서 `mobile-wireframe-set` 스키마 확정 필요

## 2026-05-18 - Data Agent

- 변경: `DATA_MAP.md`를 MVP 7개 테이블 기준 스키마로 재정리
- 이유: 모듈별 스크린이 계속 생성되는 구조에서는 확장형 정규화보다 `module_kind`와 JSONB 중심 MVP 스키마가 더 단순함
- 검증: `projects`, `documents`, `screens`, `organisms`, `screen_organisms`, `generations`, `generation_versions`의 SQL 스키마와 인덱스를 문서화함
- 후속: Supabase migration 파일 생성 필요

## 2026-05-18 - Data Agent

- 변경: MVP 스키마에서 `documents` 테이블 제거
- 이유: 입력 데이터 자체가 이미 SB/OGN JSON이므로 별도 원본 문서 테이블 없이 `screens.source_json`, `organisms.source_json`에 직접 보존하는 편이 단순함
- 검증: `DATA_MAP.md`를 `projects`, `screens`, `organisms`, `screen_organisms`, `generations`, `generation_versions` 6개 테이블 기준으로 정리함
- 후속: 이전 히스토리의 7개 테이블 기록은 과거 결정으로만 유지

## 2026-05-18 - Data Agent

- 변경: 테이블명을 입력 소스/생성 결과 기준으로 재정리
- 이유: `screens`가 생성 화면인지 입력 소스인지 혼동되어 `screen_sources`, `organism_sources`, `screen_source_organisms`, `screen_generation_jobs`, `generated_screen_sets`, `generated_screens`로 책임을 명확히 분리함
- 검증: `DATA_MAP.md`의 관계도, SQL 스키마, 조회 패턴을 새 모델로 갱신함
- 후속: Supabase migration 작성 필요

## 2026-05-18 - Architecture Agent

- 변경: 개발 아키텍처의 API, FastAPI 모듈, Next.js 라우트명을 입력 소스/생성 결과 모델에 맞춰 갱신
- 이유: `generated_screen_sets` 아래에 Base/Variant `generated_screens`가 여러 개 존재하는 단순 모델을 구현 구조에서도 그대로 읽히게 하기 위함
- 검증: `DEVELOPMENT_ARCHITECTURE.md`에서 예전 `/documents`, `/screens`, `/generations`, `generation_versions`, `wireframe_screen_variants` 참조가 남아 있지 않음을 확인함
- 후속: 실제 구현 시 API path와 Supabase migration을 같은 이름으로 생성 필요

## 2026-05-18 - Architecture Agent

- 변경: Claude와 Codex의 로컬 실행 가능 범위를 구분해 Agent SDK 실행 정책을 보정
- 이유: Claude는 Agent SDK의 세션 재개를 사용할 수 있지만, Codex는 기존 앱 세션 attach가 아니라 Codex CLI 또는 OpenAI 로컬 런타임 adapter로 다뤄야 함
- 검증: 로컬 환경에서 `claude 2.1.143`, `codex-cli 0.128.0`, `~/.claude`, `~/.codex` 존재를 확인함
- 후속: `local_session_resolver.py` 구현 시 Claude session resolver와 Codex CLI runner를 분리 필요

## 2026-05-18 - Frontend Agent

- 변경: Puck 기반 라이브 블록 편집을 제품 범위와 개발 아키텍처에 추가
- 이유: Claude가 생성한 모바일 와이어프레임을 사용자가 섹션, 문구, 간격 prop 단위로 후편집할 수 있어야 함
- 검증: `MASTER_PLAN.md`, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`, `AGENTS.md`에 Puck 역할, API, `edited_json`, `edit_status`를 반영함
- 후속: Puck component config와 와이어프레임 JSON 변환 규칙 정의 필요

## 2026-05-18 - Frontend Agent

- 변경: Puck 저장 포맷을 공식 데이터가 아닌 임시 편집 포맷으로 정리
- 이유: 서비스의 공식 저장/검수/렌더링 포맷을 internal wireframe JSON 하나로 유지하기 위함
- 검증: `DEVELOPMENT_ARCHITECTURE.md`와 `DATA_MAP.md`에 `internal wireframe JSON -> Puck data -> internal wireframe JSON` 변환 흐름을 반영함
- 후속: `wireframe_to_puck`과 `puck_to_wireframe` 변환기 설계 필요

## 2026-05-18 - Data Agent

- 변경: 생성 결과 모델에 `generated_organisms` 테이블을 추가
- 이유: OGN이 대부분 섹션 단위이므로 `generated_screens`가 하위 `generated_organisms`를 소유하고, `generated_organisms`가 layout/component/edit JSON을 소유하는 구조가 더 명확함
- 검증: `DATA_MAP.md`의 테이블 책임, ERD, SQL 스키마, 생성 결과 구조, 조회 패턴을 갱신하고 `DEVELOPMENT_ARCHITECTURE.md`의 API와 Puck 편집 정책을 OGN 섹션 기준으로 수정함
- 후속: Supabase migration 작성 시 `generated_screens`에서 `result_json`, `edited_json`, `edit_status`를 제거하고 `generated_organisms`를 추가해야 함

## 2026-05-18 - Data Agent

- 변경: `generated_organisms.screen_source_organism_id`를 추가
- 이유: 생성된 OGN 섹션이 원천 SB composition row와 어떤 관계인지 추적하기 위함
- 검증: `DATA_MAP.md`의 ERD, SQL 스키마, 인덱스에 `screen_source_organisms -> generated_organisms` 관계를 반영함
- 후속: 생성 시 `screen_source_organisms.id`를 `generated_organisms.screen_source_organism_id`에 기록 필요

## 2026-05-18 - Documentation Agent

- 변경: 전체 문서를 최신 데이터 모델과 Puck 편집 정책 기준으로 정리
- 이유: `generated_screens` 중심 설명과 Puck 블록 편집 표현이 `generated_organisms` 중심 구조와 일부 어긋날 수 있음
- 검증: `MASTER_PLAN.md`, `AGENTS.md`, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`, `COMPOSITION_LAYERS.md`를 갱신하고 오래된 현재 문서 참조를 검색함
- 후속: 실제 구현 시작 시 migration, API schema, Puck 변환기 문서를 별도 작성 필요
