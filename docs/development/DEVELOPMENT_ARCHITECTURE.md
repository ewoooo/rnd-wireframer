# RND Screen Generator 개발 아키텍처

## 1. 문서 책임

이 문서는 기술 스택, 서비스 경계, 모듈 구조, API 표면만 정의한다.

중복을 피하기 위해 상세 데이터 설계와 입력 JSON 예시는 [DATA_MAP.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 기준으로 한다.

## 2. 시스템 개요

```text
User
  |
  v
Next.js
  |
  v
FastAPI
  |
  +--> Agent SDK
  |     +--> Local AI Session
  |     +--> Remote AI API
  +--> Supabase PostgreSQL
  +--> Supabase Storage
  +--> Claude API
  +--> Codex Review
```

## 3. 레이어 책임

| 레이어 | 책임 |
|---|---|
| Next.js | 사용자 흐름, 화면 조회, 생성 요청, 모바일 미리보기, Puck 기반 OGN 섹션 편집 |
| Puck | 생성된 OGN 섹션을 제한된 블록/prop 단위로 후편집 |
| FastAPI | JSON 검증, 정규화, OGN 조합, AI 호출, 결과 검증 |
| Agent SDK | Claude 생성과 Codex 검수를 실행하는 공통 런타임 계층 |
| Local AI Session | 사용 가능한 로컬 AI 세션이 있을 때 우선 사용 |
| Remote AI API | 로컬 세션이 없거나 실패할 때 fallback |
| Supabase PostgreSQL | 관계형 데이터와 생성 이력 저장 |
| Supabase Storage | 원본 JSON 파일과 선택적 산출물 저장 |
| Claude API | 와이어프레임 JSON 생성과 재생성 |
| Codex Review | Claude 생성 결과 검수 |

DB 테이블과 컬럼 책임은 [DATA_MAP.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 참조한다.

## 4. 권장 저장소 구조

```text
apps/
  web/
services/
  api/
documents/
  rnd-screen-generator/
```

## 5. FastAPI 모듈

```text
services/api/app/
  api/
    source_imports.py
    screen_sources.py
    organism_sources.py
    generation_jobs.py
    generated_screen_sets.py
    generated_screens.py
    generated_organisms.py
  services/
    json_validator.py
    source_normalizer.py
    source_importer.py
    screen_composer.py
    prompt_builder.py
    agent_runtime.py
    local_session_resolver.py
    claude_wireframe_generator.py
    codex_wireframe_reviewer.py
    generated_screen_set_builder.py
    generated_screen_builder.py
    generated_organism_builder.py
    wireframe_to_puck.py
    puck_to_wireframe.py
  schemas/
    source_import.py
    screen_source.py
    organism_source.py
    wireframe.py
    generation_job.py
    generated_screen.py
    generated_organism.py
    puck_edit.py
```

## 6. Next.js 모듈

```text
apps/web/
  app/
    source-imports/
    screen-sources/
    screen-sources/[screenCode]/
    screen-sources/[screenCode]/generate/
    generation-jobs/[jobId]/
    generated-screen-sets/[setId]/
    generated-screens/[generatedScreenId]/
    generated-organisms/[generatedOrganismId]/edit/
  components/
    mobile-preview/
    puck-editor/
    source-import-panel/
    organism-source-list/
    generation-panel/
```

## 7. API 표면

요청/응답의 상세 JSON 필드는 구현 스키마와 [DATA_MAP.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 따른다.

| Method | Path | 책임 |
|---|---|---|
| `POST` | `/source-imports` | SB/OGN JSON 검증 및 적재 |
| `GET` | `/screen-sources` | SB 화면 소스 목록 조회 |
| `GET` | `/screen-sources/{screen_code}` | SB 상세와 연결 OGN 조회 |
| `GET` | `/screen-sources/{screen_code}/organism-sources` | 생성 컨텍스트용 OGN 목록 조회 |
| `POST` | `/screen-sources/{screen_code}/generate` | 초기 와이어프레임 생성 |
| `GET` | `/generation-jobs/{job_id}` | 생성 작업과 최신 생성 묶음 조회 |
| `POST` | `/generation-jobs/{job_id}/regenerate` | 피드백 기반 생성 묶음 재생성 |
| `GET` | `/generated-screen-sets/{set_id}` | 생성 묶음과 하위 화면/OGN 섹션 조회 |
| `POST` | `/generated-screens/{generated_screen_id}/regenerate` | 특정 생성 화면 재생성 |
| `GET` | `/generated-screens/{generated_screen_id}` | 생성 화면과 하위 OGN 섹션 조회 |
| `POST` | `/generated-organisms/{generated_organism_id}/regenerate` | 특정 OGN 섹션 재생성 |
| `PATCH` | `/generated-organisms/{generated_organism_id}/edit` | Puck 편집 결과를 internal wireframe JSON으로 역변환해 임시 저장 |
| `POST` | `/generated-organisms/{generated_organism_id}/publish` | 저장된 internal wireframe JSON 편집본 발행 |
| `POST` | `/generated-screen-sets/{set_id}/review` | Codex 기반 생성 묶음 검수 |
| `POST` | `/generated-screens/{generated_screen_id}/review` | Codex 기반 개별 화면 검수 |
| `POST` | `/generated-organisms/{generated_organism_id}/review` | Codex 기반 개별 OGN 섹션 검수 |

## 8. 생성 계약

Claude는 HTML이 아니라 `mobile-wireframe` JSON을 반환해야 한다.

생성 결과는 `generated_screen_sets`를 묶음 단위로 하고, 실제 화면은 `generated_screens`의 개별 row로 저장한다. 화면 안의 OGN 섹션과 하위 component JSON은 `generated_organisms`에 저장한다.

SB의 기본 화면은 `generated_screens.screen_type = 'base'`, SB `caseBranches[]`는 `generated_screens.screen_type = 'variant'`로 생성한다.

Codex는 Claude의 생성 결과를 검수한다. 검수 기준은 JSON 스키마 통과 여부, SB/OGN 근거 반영 여부, 디자인 패턴 문서 준수 여부, 재생성 필요 여부다.

Claude 생성과 Codex 검수는 Agent SDK를 통해 실행한다. Agent SDK는 먼저 로컬 AI 세션을 탐색한다. 사용 가능한 로컬 세션이 있으면 해당 세션을 사용하고, 없거나 실패하면 원격 API로 fallback한다.

와이어프레임 JSON 스키마의 최종 정의는 FastAPI `schemas/wireframe.py`에서 관리한다. 문서상 데이터 흐름과 저장 위치는 [DATA_MAP.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DATA_MAP.md)의 생성 테이블을 참조한다.

## 9. Puck OGN 섹션 편집 정책

Puck은 생성 결과를 자유 배치형 디자인 툴로 바꾸기 위한 레이어가 아니다. Claude가 만든 `generated_organisms`를 사람이 검토하면서 OGN 섹션 블록 단위로 조정하기 위한 후편집 레이어다.

공식 저장 포맷은 Puck 데이터가 아니라 internal wireframe JSON이다. Puck 데이터는 에디터 화면 안에서만 사용하는 임시 표현이다.

```text
generated_organisms.layout_json + components_json
-> internal wireframe JSON을 Puck data로 변환
-> Puck에서 사용자 편집
-> Puck data를 internal wireframe JSON으로 역변환
-> generated_organisms.edited_json 저장
```

Puck 편집 원칙:

- 편집 대상은 `generated_organisms`의 개별 OGN 섹션이다.
- AI 생성 원본은 `layout_json`, `components_json`에 보존하고, 사용자 편집본은 internal wireframe JSON으로 `edited_json`에 저장한다.
- OGN 섹션 렌더링은 `published edited_json`, `draft edited_json`, `layout_json + components_json` 순서로 선택한다.
- 간격, 정렬, 노출 여부, 문구처럼 안전한 prop만 편집 가능하게 연다.
- 간격 값은 자유 숫자가 아니라 `none`, `xs`, `sm`, `md`, `lg`, `xl` 같은 디자인 토큰으로 제한한다.
- Puck block은 기본적으로 `generated_organisms`와 매핑하고, block 내부 props/children은 `components_json`과 매핑한다.

초기 Puck 컴포넌트 후보:

| Puck 컴포넌트 | 역할 |
|---|---|
| `MobileScreen` | 모바일 화면 루트 |
| `OrganismSection` | OGN 섹션 블록 |
| `HeaderBar` | 상단 앱바/타이틀 영역 |
| `FormSection` | 입력 폼 OGN 섹션 |
| `TermList` | 약관/동의 OGN 섹션 |
| `CTAButton` | 주요 액션 컴포넌트 |
| `BottomSheet` | 바텀시트 OGN 섹션 |
| `AlertDialog` | 팝업/알럿 OGN 섹션 |
| `EmptyState` | 빈 상태/안내 OGN 섹션 |

## 10. Screen Variant 생성 정책

SB의 `caseBranches[]`는 별도 화면으로 누락하지 않고 Screen Variant로 생성한다.

| 구분 | 생성 대상 | 저장 위치 |
|---|---|---|
| Base Screen | SB 기본 화면 | `generated_screens.screen_type = 'base'` |
| Screen Variant | SB 케이스 분기 화면 | `generated_screens.screen_type = 'variant'` |

Variant 생성 원칙:

- Variant의 `screen_code`는 SB `case_screen_code`와 일치해야 한다.
- Variant는 Base 전체를 새로 만드는 것이 아니라 케이스 조건에 필요한 차이만 반영한다.
- Variant에는 `trigger`, `difference_from_base`, `follow_up`을 포함한다.
- 특정 Variant만 재생성할 수 있어야 한다.

Codex 검수 기준:

- SB 케이스 분기 수와 생성된 Variant 수가 일치한다.
- 각 Variant의 `screen_code`가 원천 `case_screen_code`와 일치한다.
- Variant의 차이가 케이스 설명과 후속 처리에 부합한다.
- Variant가 Base 구조를 불필요하게 변경하지 않는다.

## 11. Agent SDK 실행 정책

| 상황 | 실행 방식 |
|---|---|
| 로컬 Claude 세션 있음 | Claude Agent SDK의 `resume` 또는 `continue`로 생성 세션 재사용 |
| 로컬 Claude 세션 없음 | Claude API 사용 |
| 로컬 Codex CLI 사용 가능 | Codex CLI 또는 OpenAI 로컬 런타임을 검수 실행기로 사용 |
| 로컬 Codex CLI 사용 불가 | 설정된 Codex Review API 사용 |
| 로컬 세션 실패 | 실패 사유 기록 후 원격 API fallback |

로컬 세션 사용 여부는 생성 이력에 기록한다. 세부 저장 필드는 [DATA_MAP.md](/Users/plusx/Documents/Codex/2026-05-18/next-js-fastapi/documents/rnd-screen-generator/docs/development/DATA_MAP.md)의 생성 테이블을 따른다.

주의할 점:

- Claude는 Claude Agent SDK에서 세션 파일을 로컬에 저장하고 `resume`, `continue`, `fork`를 지원하므로, 생성 작업의 이전 세션을 재사용할 수 있다.
- Codex는 OpenAI Agents SDK가 Codex 앱의 기존 대화 세션에 직접 attach하는 방식으로 보지 않는다.
- Codex 검수의 로컬 우선 실행은 `codex` CLI 실행 또는 OpenAI Agents SDK의 로컬 런타임/쉘 실행 루프를 감싼 adapter로 구현한다.
- 따라서 구현체는 `local_session_resolver.py`에서 `claude` 세션과 `codex` 실행 가능 여부를 서로 다른 방식으로 감지해야 한다.

## 12. 로컬 환경 변수

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CODEX_REVIEW_MODEL=
AGENT_SDK_LOCAL_SESSION_ENABLED=true
AGENT_SDK_REMOTE_FALLBACK_ENABLED=true
```
