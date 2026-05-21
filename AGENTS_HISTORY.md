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
- 후속: 초기 Python 설치는 외부 venv에서 검증했으나, 이후 프로젝트 내부 `.venv` 기준으로 전환함

## 2026-05-19 - Backend Agent

- 변경: `.gitignore`를 다시 추가하고 Python 가상환경을 프로젝트 내부 `.venv`로 구성
- 이유: Python 의존성을 프로젝트 디렉토리 안에서 관리하되, 가상환경과 설치 산출물은 git에 포함하지 않기 위함
- 검증: `.venv`에서 `services/api/requirements.txt` 설치와 주요 패키지 import/version 확인을 완료하고, `.gitignore`가 `.venv`, `node_modules`, `.env`를 제외하는 것을 확인함
- 후속: 실제 API 구현 시작 후 requirements pinning 여부 결정 필요

## 2026-05-19 - QA Agent

- 변경: Playwright E2E 테스트 러너와 기본 설정을 추가
- 이유: 모바일 미리보기, Puck 편집, 생성 플로우를 브라우저에서 회귀 검증할 기반이 필요함
- 검증: `@playwright/test`, `playwright.config.ts`, `tests/e2e/` 골격과 `test:e2e` 스크립트를 추가함
- 후속: Next.js 앱 초기화 후 `webServer` 설정과 첫 smoke test 추가 필요

## 2026-05-19 - Data Agent

- 변경: `docs/source-json/BACKEND_ENTITY_MAP.md`를 추가하고 백엔드 원천 JSON별 테이블 필요 여부를 정리
- 이유: `docs/source-json/`의 유즈케이스, 정책, 라우트, SB/OGN JSON을 어떤 엔티티로 볼지 먼저 합의해야 하기 위함
- 검증: `docs/source-json/` 내부 문서로 원천 JSON 분류, 후보 엔티티, 정규화 승격 기준을 정리함
- 후속: SB/OGN 직접 적재 대상부터 필드 매핑 표를 작성하고 `frontend-json` API 응답 초안을 채워야 함

## 2026-05-19 - Data Agent

- 변경: DB 모듈 식별자 컬럼을 `module`로 통일하고 원천 SQL JSON의 정의/관계 테이블 분리 초안을 추가
- 이유: `module_kind`, `moduleKind`, `module` 명명 혼재를 줄이고 정책 그룹 membership과 function-policy 연결의 중복 배열을 제거하기 위함
- 검증: `DATA_MAP.md`, drawDB SQL/DBML의 모듈 컬럼명을 `module`로 맞추고 `docs/source-json/SQL_ENTITY_NORMALIZATION.md`에 중복 후보와 후보 테이블을 정리함
- 후속: 정책 관련 정의/관계 테이블을 실제 migration과 drawDB ERD에 반영할 범위를 확정 필요

## 2026-05-19 - Data Agent

- 변경: `docs/source-json/`의 정책, 화면 라우트, 화면-OGN, OGN-컴포넌트 원천 JSON 관계를 1:N/N:1 방향으로 정리
- 이유: 상위 배열이 하위 정의 목록을 중복 소유하지 않고, 하위 정의 또는 사용 관계가 부모 코드를 명확히 바라보도록 하기 위함
- 검증: 정책 그룹/정책, 화면 라우트/화면 소스, 화면/OGN, OGN/component order/component source 간 참조 무결성을 Node 스크립트와 `jq empty`로 확인함
- 후속: business function 정책 연결과 미정의 OGN/정책 참조를 같은 원칙으로 정리 필요

## 2026-05-19 - Data Agent

- 변경: business function 정책 연결을 `businessFunctionPolicyGroups` 중심으로 정리하고, OGN component usage 정책을 `componentUsagePolicies`로 분리
- 이유: `function -> process -> usecase`와 `policy -> policyGroup`에서 이미 유도되는 중복 참조를 제거하고, 배열 FK를 1:N/N:1 관계로 풀기 위함
- 검증: `docs/source-json/*.json` 전체 `jq empty`와 참조 무결성 스크립트로 `moduleKind`, `policyRefs`, `componentUsages[].policyCodes` 잔여가 없음을 확인함
- 후속: 아직 정의되지 않은 OGN 3개와 process 2개는 원천 정의가 들어오는 시점에 추가 필요

## 2026-05-19 - Data Agent

- 변경: `sql-business-functions-source.json`의 상세 업무 로직 필드를 화면 생성용 `screenGenerationContext`로 축소
- 이유: 원천 JSON의 목적이 전체 업무 명세 보관이 아니라 Claude 화면 생성 컨텍스트 제공이기 때문
- 검증: `inputs`, `details`, `outputs`, `flow`, `exceptions` 잔여가 없고 모든 business function이 `requiredInputs`, `displaySignals`, `resultStates`, `exceptionHints`, `ctaHints`를 갖는지 확인함
- 후속: 생성 프롬프트에서 각 context 필드가 실제로 어떤 화면 요소로 반영되는지 매핑 규칙 정의 필요

## 2026-05-19 - Data Agent

- 변경: screen route를 process 하위 관계로 정리하고 screen source가 `screenRouteCode`를 바라보도록 변경
- 이유: 유즈케이스 문서 기준으로 process가 화면 흐름 단위를 소유하고, screen route가 그 아래 screen source 묶음을 제공하는 구조가 자연스럽기 때문
- 검증: `screenRoutes[].processCode`가 기존 process를 참조하고, `screen_source.screenRouteCode`가 기존 screen route를 참조하는지 확인함
- 후속: 현재 route 이름과 process 의미는 견본 데이터 기준이므로 실제 수급 데이터 기준으로 route/process 매핑 재검토 필요

## 2026-05-19 - Data Agent

- 변경: 별도 business function JSON을 제거하고 화면 생성 컨텍스트와 정책 그룹 연결을 process 엔티티로 흡수
- 이유: 화면 생성 목적에서는 function 자체보다 process 단위의 입력, 상태, 예외, CTA, 정책 그룹 맥락이 직접 필요하기 때문
- 검증: `sql-business-functions-source.json`, `sql-business-function-policy-groups-source.json`를 제거하고 `sql-usecase-processes-entries.json`의 `screenGenerationContext`, `processPolicyGroups` 참조 무결성을 확인함
- 후속: 실제 수급 데이터에서 function 정보가 들어오면 저장 엔티티가 아니라 process context 추출 입력으로만 사용

## 2026-05-19 - Data Agent

- 변경: business function의 process 흡수를 취소하고 `sql-business-functions-source.json`, `sql-business-function-policy-groups-source.json`을 복구
- 이유: 화면 생성 컨텍스트를 process로 완전히 합치기보다, function 기반 원천을 별도 화면 생성 힌트로 유지할 필요가 있기 때문
- 검증: process 파일에서 `screenGenerationContext`, `processPolicyGroups`를 제거하고 business function과 policy group 연결 참조 무결성을 확인함
- 후속: business function을 최종 DB 엔티티로 둘지, import 단계의 중간 소스로만 둘지 별도 결정 필요

## 2026-05-19 - Data Agent

- 변경: business function 명명을 `functions`로 단순화하고 파일을 `sql-functions-source.json`, `sql-function-policy-groups-source.json`로 변경
- 이유: 원천 문서의 Function 개념을 유지하되, 화면 생성 컨텍스트를 가진 process 하위 function으로 명확히 표현하기 위함
- 검증: `functions[].processCode`와 `functionPolicyGroups[].functionCode` 참조 무결성을 확인하고 source JSON 내 business function 명명 잔여가 없음을 확인함
- 후속: 실제 수급 데이터에서 function별 screenGenerationContext 추출 규칙 정교화 필요

## 2026-05-19 - Documentation Agent

- 변경: `docs/data-mockups/` 단계별 디렉토리 구조와 최신 입력 관계 모델을 전역 문서에 반영
- 이유: 기존 source JSON 논의가 정책/화면/디자인 입력, parsed JSON, generation context, feedback loop로 분리된 mock 데이터 운영 방식으로 바뀌었기 때문
- 검증: `AGENTS.md`, `MASTER_PLAN.md`, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`의 경로와 용어를 갱신하고 `docs/data-mockups/**/*.json` 파싱을 확인함
- 후속: 추가 기능 시나리오가 확정되면 `4-generation-contexts`와 `5-feedback-loops` 샘플 계약을 확장 필요

## 2026-05-19 - Data Agent

- 변경: 디스플레이 프리뷰 화면 상세 read model 스키마와 샘플 JSON을 추가
- 이유: SQL 1차 적재 정보와 별도로, 화면을 열었을 때 좌측 목록, 중앙 프리뷰, 우측 상세 패널을 렌더링할 조회용 계약이 필요하기 때문
- 검증: `DISPLAY_PREVIEW_SCHEMA.md`에 `navigation`, `workspace.preview`, `detail.summary`, `screen-composition`, `screen-flow` 구조를 정의하고 `docs/data-mockups/3-parsed-jsons/display-preview-screen.json` 샘플을 추가함
- 후속: organism 탭을 열었을 때의 `detail.entityType = "organism"` 상세 섹션과 생성 완료 후 `preview.status = "generated"` 샘플 확장 필요

## 2026-05-19 - Product/Data Agent

- 변경: 추가 기능 요구사항에 맞춰 Puck 편집 범위를 Screen composition 편집과 공유 OGN component 편집으로 분리
- 이유: Screen에서는 OGN 추가/삭제/순서 변경을 다루고, OGN에서는 내부 component 위치/순서/Variant/Props를 다루며, 공유 OGN 수정본은 다른 화면에도 반영되어야 하기 때문
- 검증: `MASTER_PLAN.md`, `DEVELOPMENT_ARCHITECTURE.md`, `DATA_MAP.md`, `AGENTS.md`에 `screen_edit_versions`, `organism_edit_versions`, Screen/OGN 편집 API, 렌더링 우선순위, 재생성 원칙을 반영함
- 후속: 실제 구현 전 screen composition JSON과 OGN internal component tree JSON의 정확한 property schema 확정 필요

## 2026-05-19 - Data Agent

- 변경: 화면 생성용 노드 속성 계약 샘플 `docs/data-mockups/4-generation-contexts/screen-node-tree.sample.json` 추가
- 이유: JSON 입력으로 컴포넌트 구성과 데이터를 연결하고, 화면 렌더러가 노드트리를 순회할 수 있는 최소 계약을 먼저 검증하기 위함
- 검증: `jq empty docs/data-mockups/4-generation-contexts/screen-node-tree.sample.json`
- 후속: 샘플 계약을 기준으로 JSON Schema 또는 Pydantic/Zod validation schema 작성 필요

## 2026-05-19 - Data Agent

- 변경: `docs/data-mockups/4-generation-contexts/node-type-definitions.json`에 nodeType별 공통 엔티티와 고유 엔티티 정의 추가
- 이유: screen, section, organism, pattern, component, slot, text, action, dataList가 공유하는 속성과 각 타입의 고유 속성/자식 규칙을 분리해 검증 기준으로 쓰기 위함
- 검증: `jq empty docs/data-mockups/4-generation-contexts/node-type-definitions.json docs/data-mockups/4-generation-contexts/screen-node-tree.sample.json`
- 후속: allowedChildren, required, renderer registry 기준을 실제 validation schema로 변환 필요

## 2026-05-20 - Data Agent

- 변경: `docs/data-mockups/1-policy-inputs/` 목업 검토용 DBML `docs/drawdb/policy-inputs.dbml` 추가
- 이유: 정책 입력 JSON의 module, usecase, process, function, policy group, policy 관계를 drawDB에서 시각적으로 검토하기 위함
- 검증: 1-policy-inputs JSON 7개 파일을 파싱하고, DBML 파일의 테이블/참조 정의를 확인함
- 후속: drawDB에 import한 뒤 필요하면 배치 snapshot/export를 `docs/drawdb/snapshots/`, `docs/drawdb/exports/`에 저장 필요

## 2026-05-20 - Data Agent

- 변경: `docs/data-mockups/2-spec-inputs/` 목업 검토용 DBML `docs/drawdb/spec-inputs.dbml` 추가
- 이유: 화면 route, screen source, screen-organism 구성, organism state/component usage, component 정의 관계를 drawDB에서 시각적으로 검토하기 위함
- 검증: 2-spec-inputs JSON 4개 파일을 파싱하고, DBML을 PostgreSQL SQL로 변환해 문법을 확인함
- 후속: 아직 정의 파일이 없는 organism code가 있으므로 실제 적재 스키마 확정 전 원천 OGN 정의 보강 필요

## 2026-05-20 - Data Agent

- 변경: `caseBranches`를 `screen_variants`로 승격하고 `screen_sources`가 `screenVariantCode`를 참조하도록 `2-spec-inputs` 목업과 DBML을 갱신
- 이유: 케이스 분기를 source screen의 속성이 아니라 route 아래 생성 대상 화면 단위로 다루기 위함
- 검증: 2-spec-inputs JSON 파싱과 `spec-inputs.dbml`의 PostgreSQL SQL 변환을 확인함
- 후속: edge variant별 전용 `screen_source`가 필요해지는 시점에 source JSON 샘플을 추가 필요

## 2026-05-20 - Data Agent

- 변경: 정리된 `2-spec-inputs/examples/` 구조에 맞춰 `spec-inputs.dbml`을 재작성
- 이유: organism의 `variants`, `components[].property`, component `property` 구조를 DBML에 반영하기 위함
- 검증: examples JSON 4개 파일 파싱과 `spec-inputs.dbml`의 PostgreSQL SQL 변환을 확인함
- 후속: 없음

# 2026-05-21

## `sdui-renderer` 코어 흡수

- 변경: `sdui-renderer`의 schema, binding, registry, validation 패턴을 `packages/wireframe`으로 선별 흡수
- 이유: Claude 생성 JSON을 렌더 가능한 계약으로 검증하고, `cx-components`/`cx-layout` 기반 미리보기와 Puck 변환의 공통 코어를 마련하기 위함
- 검증: `wireframe` 패키지에 schema validation, binding resolver, component registry, 중복 ID/등록 컴포넌트 검증 테스트를 추가함
- 후속: React 렌더러는 `useMemo`/`useCallback` 금지 정책에 맞춰 `apps/web/components/wireframe-renderer`에서 별도 구현 필요

## Wireframe 렌더 데이터 샘플 정리

- 변경: `screen-sdui.sample.json` 내부에 render data context를 다시 포함하고 별도 외부 데이터 mock을 제거
- 이유: 현재 샘플 단계에서는 화면 구조와 binding 대상 데이터를 한 파일에서 확인하는 편이 이해와 검증에 더 적합하기 때문
- 검증: JSON 파싱, `WireframeSchemaValidator`, binding path 확인, Biome check를 실행함
- 후속: 실제 API/DB read model이 생기면 외부 data context 분리를 다시 검토 필요

## Legacy 노드트리 샘플 제거

- 변경: `screen-node-tree.sample.json` 제거
- 이유: `@cx/wireframe` 기준의 `screen-sdui.sample.json`이 렌더 가능한 노드 계약 기준이 되면서 초기 draft 노드트리 샘플이 중복과 혼선을 만들기 때문
- 검증: `screen-sdui.sample.json` 내부의 렌더 구조와 data binding 관계를 유지함
- 후속: `node-type-definitions.json`도 현재 `@cx/wireframe` 스키마와 중복되는지 재검토 필요

## Wireframe typed node 목업 추가

- 변경: `wireframe-node-types.mock.ts`에 `CXUINode`, `Screen`, `Layout.*`, `Organism.*`, `Component.*` discriminated union 타입 초안을 추가
- 이유: `type: string` 기반 노드를 렌더러 친화적인 네임스페이스 타입으로 좁히기 위한 설계 기준이 필요하기 때문
- 검증: 타입 목업에 OGN 식별용 `Organism.Section.props.organismCode`와 layout token props 예제를 포함함
- 후속: 목업 검토 후 `packages/wireframe/src/types.ts`의 실제 타입/Zod 스키마로 승격 여부 결정 필요

## Wireframe 노드 공통 metadata 계약 반영

- 변경: 모든 `WireframeNode`가 `type`, `componentVersion`, `metadata`를 필수로 갖도록 `@cx/wireframe` 타입과 Zod 스키마를 갱신
- 이유: 모든 노드 타입에서 공통 식별/버전/작성 정보를 안정적으로 추적하고, `metadata.id`를 생성/편집/검수 기준 ID로 사용하기 위함
- 검증: `screen-sdui.sample.json`, `wireframe-node-types.mock.ts`, `packages/wireframe` 테스트를 새 metadata 계약에 맞추고 검증을 통과함
- 후속: 실제 렌더러 구현 시 노드 key와 리뷰 코멘트 타겟은 top-level `id`가 아니라 `metadata.id`를 사용해야 함

## Vitest 앱 테스트 설정 추가

- 변경: 루트 Vitest 설정과 Testing Library matcher setup을 추가하고 watch 스크립트를 연결함
- 이유: `apps/web`와 `packages`의 단위/컴포넌트 테스트를 같은 러너로 실행하기 위함
- 검증: `npm test`, `npx biome check package.json vitest.config.ts vitest.setup.ts`
- 후속: 실제 UI 컴포넌트 구현 시 `apps/web/**/*.test.tsx` 테스트 추가 필요

## 컴포넌트 라이브러리 출처 확정

- 변경: 컴포넌트 라이브러리 기준을 GitHub `ewoooo/cx-components`로 확정하고 관련 문서에 반영함
- 이유: 모바일 미리보기와 Puck preview에서 사용할 기초 UI 어휘의 원천 저장소를 명확히 하기 위함
- 검증: `rg -n "cx-components|ewoooo/cx-components" AGENTS.md MASTER_PLAN.md docs AGENTS_HISTORY.md`
- 후속: 실제 패키지 이전 또는 dependency 연결 시 import 경계와 package name 확인 필요

## `cx-layout` 흡수형 `@cx/layout` 패키지 추가

- 변경: 기존 `cx-layout`의 AppScreen/chrome/flex primitive 구조를 `packages/layout`의 `@cx/layout` 패키지로 흡수하고 `@cx/wireframe`의 `Screen.*`, `Layout.*` 타입을 기준으로 정리함
- 이유: 모바일 미리보기와 Puck preview가 같은 wireframe node contract를 렌더링하도록 layout 패키지의 public API를 맞추기 위함
- 검증: `npm test`, `npx biome check packages/layout packages/wireframe/src/types.ts packages/wireframe/src/validation.ts`
- 후속: `wireframe-renderer` 구현 시 `Screen`, `Screen.Header`, `Screen.Contents`, `Screen.Bottom`, `Layout.Flex`, `Layout.Grid` 매핑을 `@cx/layout`으로 연결 필요

## `ewoooo/cx-components` 기반 `@cx/components` 패키지 추가

- 변경: GitHub `ewoooo/cx-components`의 공개 컴포넌트 소스와 SKT token CSS를 `packages/component`의 `@cx/components` 패키지로 추가하고 spacing token을 Tailwind v4 `@theme` CSS 변수로 매핑함
- 이유: leaf component 어휘를 먼저 확보하고, 내부 spacing token을 앱의 Tailwind utility 체계와 연결하기 위함
- 검증: `npm test`, `npx biome check packages/component biome.json`, `npm run lint:hooks`
- 후속: 나머지 원본 컴포넌트는 실제 화면 생성에 필요한 순서대로 추가하고, raw px spacing은 점진적으로 `--skt-spacing-*`/Tailwind mapping 기준으로 정리 필요

## Tailwind theme 산출물 token 패키지 이관

- 변경: Tailwind v4 `@theme` spacing CSS를 `packages/component/src/tailwind/theme.css`에서 `packages/token/src/generated/tailwind-theme.css`로 이관하고 `@cx/tokens/tailwind.css` export를 추가함
- 이유: spacing theme CSS는 컴포넌트 구현이 아니라 token generated artifact 책임에 해당하기 때문
- 검증: `npm test`, `npx biome check packages/token packages/component biome.json package.json package-lock.json`
- 후속: token build pipeline을 만들 때 `packages/token/src/generated/tailwind-theme.css`를 생성 대상으로 연결 필요

## CXUI Screen region node 목업 개선

- 변경: `wireframe-node-types.mock.ts`에 `Screen.Header`, `Screen.Contents`, `Screen.Bottom` 영역 노드와 `Component.SystemHeader`, `Component.TopNavigation`, `Component.ProgressBar`, `Component.GlobalNavigation` 타입 목업을 추가하고, 영역 노드가 자체 `layout` props를 갖도록 정리
- 이유: 화면을 chrome/header, scroll contents, fixed bottom 영역으로 먼저 분리하되, 각 영역의 기본 flex container를 별도 `Layout.Flex` 노드로 중복 명시하지 않기 위함
- 검증: `wireframe-node-types.mock.ts`의 타입 예제를 `Screen -> Screen.* -> Component/Organism` 구조로 갱신함
- 후속: 검토 후 실제 `@cx/wireframe` Zod 스키마와 renderer region contract로 승격 필요

## Wireframe Screen region 계약 검증 추가

- 변경: `@cx/wireframe`에 `Screen` 노드와 `Screen.Header`, `Screen.Contents`, `Screen.Bottom` 필수 직계 영역 타입, 도메인 검증 함수, 회귀 테스트를 추가하고 `screen-sdui.sample.json`을 같은 구조로 갱신
- 이유: `sdui-renderer`에서 가져온 재귀 노드/Zod/registry 패턴 위에 우리 화면 생성 도메인의 필수 화면 영역 계약을 별도로 강제하기 위함
- 검증: `npm test -- packages/wireframe`, TypeScript 단일 파일 체크, Biome check, 샘플 JSON 파싱과 `validateWireframeSchemaFull` 검증을 실행함
- 후속: 실제 renderer 구현 시 `Screen.*` 영역은 component registry 대상이 아니라 renderer primitive로 처리해야 함

## 첨부 명세 변환 시나리오 추가

- 변경: `MASTER_PLAN.md`에 screen/organism 파일 묶음을 파서와 AI 보정으로 `2-spec-inputs/examples` 구조로 변환하는 시나리오를 추가
- 이유: 초기에는 DB 대신 수급 Markdown 묶음을 입력으로 받아 screen, OGN, component 명세 JSON을 만들고, 추후 DB read model로 자연스럽게 대체하기 위함
- 검증: `MASTER_PLAN.md`의 핵심 사용자 흐름과 MVP 포함 범위에 시나리오가 반영됨
- 후속: 실제 구현 시 Markdown table parser, AI 보정 prompt, JSON schema 검증 단계를 분리해 프로토타입 작성 필요

## Wireframe spec composer 초안 추가

- 변경: `@cx/wireframe`에 `composeWireframeFromSpec`를 추가해 `2-spec-inputs` screen/organism/component 구조를 `Screen -> Screen.Header/Contents/Bottom -> Organism.Section -> Component` wireframe schema로 변환함
- 이유: 첨부 명세 또는 DB read model을 바로 렌더 가능한 wireframe 구조로 연결하기 위한 deterministic 변환 계층이 필요하기 때문
- 검증: composer 결과가 `validateWireframeSchemaFull`을 통과하는 회귀 테스트를 추가하고 `npm test -- packages/wireframe`, TypeScript 단일 파일 체크, Biome check를 실행함
- 후속: AI 보정 단계에서는 composer 입력의 누락 props, data binding, 상태별 visible set, header/bottom 배치 힌트를 보강하도록 설계 필요

## Wireframe 변환 책임 분리 원칙 추가

- 변경: `AGENTS.md`에 `@cx/wireframe` 변환 시 AI가 보정할 영역과 deterministic code가 반드시 처리할 영역을 분리한 운영 원칙을 추가
- 이유: AI가 트리 전체를 자유 생성하지 않고, 코드가 기본 트리를 만들고 AI가 props/data binding/상태/표현을 보정한 뒤 코드가 다시 검증하는 흐름을 고정하기 위함
- 검증: `AGENTS.md`에 책임 분리 섹션과 항목별 역할이 반영됨
- 후속: Claude Generation Agent prompt와 composer/validator 구현이 이 책임 분리 원칙을 따르도록 연결 필요

## Wireframe renderer 필수 기능 정의

- 변경: `MASTER_PLAN.md`와 `DEVELOPMENT_ARCHITECTURE.md`에 wireframe renderer 화면의 필수 기능 3가지를 추가
- 이유: 렌더러를 단순 모바일 캔버스가 아니라 렌더된 스크린, 다른 screen/OGN 조회, 현재 화면 관련 screen/OGN 정보 확인을 함께 제공하는 작업면으로 정의하기 위함
- 검증: MVP 포함 범위, 성공 기준, Next.js `wireframe-renderer` 구현 경계에 기능 요구사항이 반영됨
- 후속: 실제 구현 시 renderer 작업면의 목록/검색, 관련 정보 패널, 렌더 프리뷰 상태 관리를 같은 read model로 연결 필요

## Wireframe renderer 작업면 구현

- 변경: `apps/web` Next.js 앱 골격과 shadcn 스타일 UI primitive, `wireframe-renderer` 작업면, mock wireframe data를 추가하고 `AppScreen` 기반 모바일 캔버스 미리보기를 구현
- 이유: 렌더된 스크린 화면, 다른 screen/OGN 조회, 현재 렌더 화면 관련 screen/OGN 정보를 한 화면에서 확인해야 하기 때문
- 검증: `npm run build`, `npx tsc --noEmit`, `npm test`, `npm run lint:hooks`, Biome targeted check, Playwright Chromium 화면 확인을 실행함
- 후속: API read model 연결, 실제 component registry 기반 렌더 매핑, 반응형 레이아웃 보강 필요

## `@cx/layout` Tailwind v4 기반 전환

- 변경: `packages/layout`의 AppScreen, ScreenRegion, Flex, Grid를 CSS 파일과 inline style 중심에서 Tailwind v4 utility class 기반으로 전환하고 spacing prop을 `gap-cx-*`, `px-cx-*`, `py-cx-*`로 매핑함
- 이유: 레이아웃 컴포넌트도 컴포넌트 패키지와 같은 Tailwind v4 token utility 체계를 사용하게 하기 위함
- 검증: `npm test`, `npx biome check packages/layout vitest.config.ts package.json package-lock.json`, `npm run lint:hooks`
- 후속: renderer 구현 시 높이, z-index, grid template, 미등록 spacing처럼 런타임 계산이 필요한 값만 inline fallback으로 제한 유지 필요

## 앱 구현 상태 기준 마스터플랜 재설정

- 변경: `MASTER_PLAN.md`를 현재 디렉토리와 구현 상태 기준으로 재정리하고, 로컬 렌더러 수직 슬라이스를 단기 MVP 중심으로 재설정함
- 이유: `apps/web` wireframe workbench와 `@cx/wireframe`, `@cx/components`, `@cx/layout`, `@cx/tokens` 패키지 구현이 먼저 진행된 반면 API, Supabase, Puck, Agent SDK는 아직 골격 또는 문서 단계이기 때문
- 검증: `apps/web`, `packages`, `services/api`, `supabase`, `docs/data-mockups` 디렉토리 상태를 확인하고 문서 diff를 점검함
- 후속: `packages/renderer` 사용 여부 결정, workbench data source를 `docs/data-mockups` 샘플로 정리, renderer mapping registry 분리 필요

## Wireframe screen render 로직 분리

- 변경: `wireframe-workbench` 안에 있던 Screen region 분해와 node type별 React 렌더 매핑을 `wireframe-screen-renderer.tsx`로 분리함
- 이유: 작업면 UI는 screen/OGN 조회와 관련 정보 표시를 담당하고, 실제 스크린 렌더 비즈니스 로직은 독립 모듈에서 관리하기 위함
- 검증: `npx tsc --noEmit`, `npm run lint:hooks`, `npx biome check apps/web/components/wireframe-renderer/wireframe-workbench.tsx apps/web/components/wireframe-renderer/wireframe-screen-renderer.tsx`
- 후속: 현재 hardcoded node type 매핑을 component registry 기반으로 교체 필요
