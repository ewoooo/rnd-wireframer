# RND Screen Generator 에이전트 히스토리

## 1. 문서 책임

이 문서는 변경 이력만 기록한다.

제품, 아키텍처, 데이터, 에이전트 역할의 최신 기준은 각 책임 문서를 참조한다.

`MASTER_PLAN.md`, `AGENTS.md`, `AGENTS_HISTORY.md`는 루트 전역 문서로 유지한다. 세부 설계 문서는 `docs/` 아래에 둔다.

| 주제 | 기준 문서 |
|---|---|
| 제품 계획 | [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md) |
| 개발 아키텍처 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| 데이터 설계 | [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md) |
| 에이전트 운영 | [AGENTS.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS.md) |

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

## 2026-05-19 - Documentation Agent

- 변경: `rnd-screen-to-screen`의 `cx-components`, `cx-tokens`, `dxds-layout`을 개선판 기반 패키지로 가져오는 결정을 문서화
- 이유: 새 프로젝트가 UI 어휘와 토큰/레이아웃 계약은 기존 검증 자산을 재사용하고, 생성/검수/편집 파이프라인을 새로 얹는 구조임을 명확히 하기 위함
- 검증: `MASTER_PLAN.md`, `DEVELOPMENT_ARCHITECTURE.md`, `AGENTS.md`, `COMPOSITION_LAYERS.md`에 패키지 재사용과 `dxds-layout` -> `cx-layout` 명명 정책을 반영함
- 후속: 실제 패키지 이전 시 import 경계, package name, build script, token build pipeline 확인 필요

## 2026-05-19 - Documentation Agent

- 변경: DB 관계 검토와 ERD 산출물 도구로 `drawdb` 사용 결정을 문서화
- 이유: Supabase PostgreSQL 스키마를 SQL뿐 아니라 시각적인 ERD로 검토하고 공유하기 위함
- 검증: `DATA_MAP.md`, `DEVELOPMENT_ARCHITECTURE.md`, `AGENTS.md`, `MASTER_PLAN.md`에 drawdb 운영 기준과 백로그를 반영함
- 후속: 실제 구현 시작 시 `docs/drawdb/` 아래의 drawdb 산출물 저장 규칙을 파일명 수준으로 확정 필요

## 2026-05-19 - Documentation Agent

- 변경: 루트 전역 문서와 구현/문서 산출물 디렉토리 구조를 확정
- 이유: `AGENTS.md`, `MASTER_PLAN.md`, `AGENTS_HISTORY.md`는 전역 문서로 루트에 두고, 구현 앱/패키지/API/Supabase/drawdb 산출물의 위치를 명확히 하기 위함
- 검증: `apps/web`, `packages/cx-*`, `services/api`, `supabase`, `docs/drawdb` 디렉토리 골격을 만들고, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`, `AGENTS.md`, `MASTER_PLAN.md`, `AGENTS_HISTORY.md`의 구조 설명과 경로 참조를 갱신함
- 후속: 실제 구현 시작 시 각 `.gitkeep`을 실제 소스/설정 파일로 대체 필요

## 2026-05-19 - Documentation Agent

- 변경: 루트 운영 설정으로 `.env.example`, `.gitignore`, `biome.json` 추가
- 이유: 구현 시작 전 환경 변수 예시, secret 제외 규칙, 포맷/린트 기준이 필요함
- 검증: 환경 변수 파일은 예시만 커밋하고 `.gitignore`에서 실제 `.env*`를 제외하도록 설정함
- 후속: 패키지 매니저와 Next/FastAPI 초기화 후 Biome 스크립트와 Python lint/test 설정 추가 필요

## 2026-05-19 - Documentation Agent

- 변경: 루트 `.gitignore` 제거
- 이유: 사용자 요청에 따라 git ignore 설정을 현재 단계에서 두지 않기 위함
- 검증: `.env.example`과 `biome.json`은 유지하고 `.gitignore`만 삭제함
- 후속: 실제 구현 시작 시 ignore 정책을 다시 정할지 결정 필요

## 2026-05-19 - Frontend Agent

- 변경: `rnd-screen-to-screen`의 `useMemo`/`useCallback` 금지 정책과 검사 스크립트를 가져옴
- 이유: React 코드에서 memoization hook을 기본 선택지로 쓰지 않고, 컴포넌트 경계와 데이터 흐름 정리를 우선하도록 강제하기 위함
- 검증: `scripts/check-react-hooks-policy.mjs`와 루트 `package.json`의 `lint:hooks` 스크립트를 추가하고, `AGENTS.md` 운영 원칙에 금지 정책을 반영함
- 후속: CI를 구성할 때 `npm run lint` 또는 `npm run lint:hooks`를 필수 체크로 연결 필요

## 2026-05-19 - Data Agent

- 변경: drawDB 초안 산출물로 PostgreSQL import SQL, DBML, ERD Mermaid, 운영 README를 추가
- 이유: MVP 데이터 모델을 drawDB에서 먼저 검토할 수 있도록 import 가능한 기준 파일과 보조 표현이 필요함
- 검증: `DATA_MAP.md`의 MVP 테이블과 관계를 `docs/drawdb/rnd-screen-generator.postgres.sql`과 DBML에 반영하고, drawDB 운영 위치를 문서화함
- 후속: drawDB에서 SQL을 import한 뒤 시각 배치 결과를 `docs/drawdb/snapshots/`와 `docs/drawdb/exports/`에 저장 필요

## 2026-05-19 - Data Agent

- 변경: 로컬 브라우저 확인용 `docs/drawdb/preview.html` 추가
- 이유: drawDB import 전에도 ERD 관계를 로컬 화면에서 빠르게 확인할 수 있어야 함
- 검증: Mermaid 기반 preview HTML을 작성하고 로컬 정적 서버로 열 수 있게 함
- 후속: drawDB에서 실제 배치한 결과와 preview 관계가 어긋나면 함께 갱신 필요

## 2026-05-19 - Data Agent

- 변경: 현재 MVP 테이블을 drawDB import용 DBML로 추가
- 이유: SQL import 외에도 DBML 기반으로 관계와 컬럼을 검토할 수 있게 하기 위함
- 검증: `docs/drawdb/rnd-screen-generator.postgres.sql`의 테이블, FK, unique/index, CHECK 메모를 `docs/drawdb/rnd-screen-generator.dbml`에 반영하고 README의 import 안내를 갱신함
- 후속: drawDB에서 DBML import 결과를 확인한 뒤 배치 snapshot/export를 저장 필요

## 2026-05-19 - Data Agent

- 변경: drawDB 공식 repository를 sibling 경로 `/Users/plusx/Documents/drawdb-local`에 클론하고 local development 서버를 실행
- 이유: drawDB를 온라인 서비스가 아니라 로컬 개발 도구로 사용하기 위함
- 검증: `npm install` 후 `npm run dev -- --host 127.0.0.1 --port 5173`로 `http://127.0.0.1:5173/` 응답을 확인함
- 후속: `docs/drawdb/rnd-screen-generator.postgres.sql`을 로컬 drawDB에 import하고 배치 결과를 snapshot/export로 저장 필요

## 2026-05-19 - Frontend/Backend Agents

- 변경: MASTER_PLAN 구현에 필요한 프론트엔드, 백엔드, AI, 테스트 라이브러리를 설치
- 이유: Next.js/Puck/Supabase 기반 웹 UI와 FastAPI/SQLAlchemy/Alembic/Claude/OpenAI Agents 기반 API 구현 준비를 마치기 위함
- 검증: `npm ls --depth=0`, `npm audit --omit=dev`, `npm run lint:hooks`, 외부 Python venv import/version 확인을 실행함
- 후속: Python 가상환경은 `/Users/plusx/Documents/rnd-screen-generator-venv`에 있으므로 API 작업 시 해당 venv를 활성화하고, 실제 구현 시작 후 requirements pinning 여부를 결정 필요

## 2026-05-19 - Backend Agent

- 변경: `.gitignore`를 다시 추가하고 Python 가상환경을 프로젝트 내부 `.venv`로 구성
- 이유: Python 의존성을 프로젝트 디렉토리 안에서 관리하되, 가상환경과 설치 산출물은 git에 포함하지 않기 위함
- 검증: `.venv`에서 `services/api/requirements.txt` 설치와 주요 패키지 import/version 확인을 완료하고, `.gitignore`가 `.venv`, `node_modules`, `.env`를 제외하는 것을 확인함
- 후속: 실제 API 구현 시작 후 requirements pinning 여부 결정 필요
