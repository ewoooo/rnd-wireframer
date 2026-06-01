# 화면 추론 완성도 고도화 — 디자인 컨텍스트 주입 설계

> 상태: 확정(2026-05-29). 구현 진행상황은 동일 디렉토리의 `SUPERPOWERS_2026-05-29_DESIGN_CONTEXT_INJECTION_PLAN.md`에서 추적한다.

## 1. 배경과 문제

현재 screen-generation 파이프라인은 정교한 다단계 AI 추론(intent → composition → pattern-selection → generation → validation → quality-review → revision)을 갖추고 있으나, 산출물이 입력 Markdown(SourceSpec)을 사실상 1:1로 전사한 수준에 머문다. "AI 추론을 넣어도 안 넣은 것과 결과가 거의 같다"는 증상의 근본 원인은 세 가지 누수다.

1. **디자인 지식이 프롬프트에 들어가지 않는다.** `buildDesignContextBundleRefs`(`packages/orchestration/src/public/design-context.ts`)는 번들 id·이유·**파일 경로 문자열**만 전달한다. `docs/design/*.md`(약 2,156줄)의 실제 본문은 한 번도 로드되지 않는다.
2. **에이전트에 파일 도구가 없다.** Claude는 `--tools ""`로 실행된다(`packages/agent/src/claude/claude-agent-sdk-runner.ts:34`). 경로를 줘도 모델이 파일을 열 수 없다.
3. **프롬프트가 전사(transcription) 지향이다.** 디자인 지식이 없는 상태에서 모델이 할 수 있는 일은 SourceSpec을 그대로 옮기는 것뿐이다. 세퍼레이터 판단·컴포넌트 제안·스타일링이 안 되는 것도 같은 뿌리다.

참고 사례 nexu-io/open-design은 디자인 지식(DESIGN.md, SKILL.md, references)을 **콘텐츠로 pre-flight 주입**하고, 결정론적 비주얼 방향과 자기비평을 둔다. 이 프로젝트는 결정론·테스트 가능성·카탈로그 소유권 원칙이 강하므로, 그 접근의 "지식 주입"과 "자기비평"은 가져오되 "모델에 자유 파일시스템 부여"는 채택하지 않는다.

## 2. 확정된 방향(접근 B)

| 결정 | 내용 |
|---|---|
| 자율성 경계 | **카탈로그 소유권 유지 + 제안 레이어.** generation은 기존 component/pattern/token에 bounded. AI는 "있으면 좋을 컴포넌트/변형"을 **비파괴 제안 아티팩트**로만 산출하고, 사람이 카탈로그로 승격한다. |
| 지식 전달 | **콘텐츠 주입(결정론 유지).** `--tools ""` 그대로. orchestration은 ref만 산출, pipeline이 번들 본문을 로드해 prompt context에 주입한다. |
| 지식 정본 | `packages/agent/docs/design-context/*.md`를 **실체화**한다(현재는 경로만 가리키는 빈 껍데기). `docs/design/`은 사람용 SSOT로 유지하고 거기서 린트한다. 새 패키지·`docs/design` 이전은 하지 않는다. |
| 1차 범위 | (1) 맥락 기반 세퍼레이터·스페이싱, (2) 컴포넌트 제안 레이어, (3) 시각 위계·강조 스타일링, (4) 디자인 품질 자기비평 루프 — 네 가지 모두 포함하되 단계적으로 쌓는다. |

핵심 설계 원칙: 누수(원인 1·2)를 먼저 막는 **공통 토대(지식 주입)** 위에, 네 가지 기능을 단일 책임 단위로 분리해 올린다. generation은 bounded인 채로 두고, 제안·비평은 각각 독립 아티팩트/리포트로 분리한다.

## 3. 아키텍처

### 3.1 데이터 흐름(변경 후)

```text
SourceSpec
-> orchestration: buildDesignContextBundleRefs  (순수, ref만 선택 — 기존 유지)
-> pipeline: loadDesignContextBundleContents      (신규, 선택된 번들 .md 본문 로드)
-> orchestration: agent-inputs가 context.designContextBundles[].content로 본문 임베드
-> agent: generation (bounded) -> renderTree + tableGenerationResult
-> agent: propose-components (신규) -> ComponentProposal (비파괴)
-> validation: renderTree 검증 + ComponentProposal bounded 검증
-> agent: review-quality (강화) -> QualityInspection + 디자인 차원 점수/findings
-> agent: revise-render-tree-if-invalid (P0/P1 findings 반영)
-> pipeline: write-artifacts (final-result.json + component-proposal.json + design-critique.json)
```

### 3.2 단계별 책임 (기존 경계 준수)

- **orchestration은 순수 유지.** ref 선택은 그대로. 본문 로드는 IO이므로 pipeline 소유([[pipeline-stage-responsibilities]]). orchestration agent-inputs는 "본문이 주어지면 context에 임베드"하는 역할만 추가한다.
- **pipeline이 본문 로드를 소유.** 기존 `skill-catalog.ts`(에이전트 docs를 읽어 주입하는 패턴)를 재사용/확장한 `design-context-catalog.ts`를 둔다. 번들 id→파일 매핑은 **contract 테이블**로 구동한다(문자열 switch 금지, [[feedback_no_hardcoded_switch]]).
- **generation은 카탈로그에 bounded.** 디자인 지식은 "화면 구조·state coverage·interaction·visual foundation·quality gate를 좁히는 용도"로만 쓰고 source/schema/catalog 계약을 우회하지 않는다. 우선순위: source evidence ≥ schema/catalog > 디자인 번들 규칙.
- **제안은 별도 비파괴 아티팩트.** generation 본 산출물에는 임의 컴포넌트가 섞이지 않는다.
- **자기비평은 독립 리포트.** quality-review가 디자인 지식으로 위계/구분/충실도를 점수화. 점수는 freeform 금지, 이산 severity·코드 기반 findings. revision은 P0/P1만 작동.

### 3.3 컴포넌트 단위와 인터페이스

| 단위 | 무엇을 하나 | 어떻게 쓰나 | 무엇에 의존하나 |
|---|---|---|---|
| `DesignContextBundleContent` (schema) | 번들 본문 + provenance를 담는 DTO | orchestration/pipeline이 주입 시 사용 | `@cx/schema` |
| `loadDesignContextBundleContents` (pipeline) | 선택된 번들 .md 본문을 읽어 content DTO 배열 반환 | generate/quality/revision 스테이지 전에 호출 | node fs adapter, 번들 매핑 테이블 |
| `ComponentProposalContract` (schema) | 제안 컴포넌트/변형, 근거, source evidence, 최근접 카탈로그 매치, 제안 props | propose-components 출력 계약 | `@cx/schema` |
| `buildComponentProposalAgentInput` (orchestration) | 제안 태스크 입력 조립 | propose-components 스테이지 | SourceSpec, 카탈로그, 번들 content |
| `propose-components` task (agent) | bounded 제안 산출 | pipeline 스테이지 | runner, prompt-contract |
| `validateComponentProposal` (validation) | 제안이 bounded인지 검증(근거·최근접 매치·개수 상한) | propose 이후 | 카탈로그 contract |
| 강화된 `quality-review` (agent) | 디자인 차원 점수/findings | review-quality 스테이지 | 번들 content |

각 단위는 입력→출력 순수 함수를 우선하고, IO는 pipeline에 둔다.

## 4. 1차 범위의 구현 매핑

1. **맥락 기반 세퍼레이터·스페이싱** — visual-foundation·layout-composition 번들 본문에 구체 규칙(예: 행 사이 1px, 섹션 사이 4px, 카드 그룹핑 시 divider 생략)을 담고, generation 프롬프트의 divider/spacing/grouping 가이드를 본문 근거로 강화. 필요 시 decoration-plan이 결정론적 hint를 보강.
2. **컴포넌트 제안 레이어** — `component-proposal` 태스크/스키마/검증/아티팩트. generation은 bounded 유지.
3. **시각 위계·강조 스타일링** — token/visual-foundation 근거를 generation에 주입해 타이포·강조·그룹을 카탈로그 범위 내에서 적용.
4. **디자인 품질 자기비평 루프** — quality-review에 번들 본문 주입 + 디자인 차원 점수/findings, revision 환류.

## 5. 디렉토리/파일 변경

| 위치 | 변경 |
|---|---|
| `packages/agent/docs/design-context/*.md` | 4개 번들을 `docs/design`에서 린트한 구체·bounded 규칙으로 실체화 |
| `packages/agent/docs/component-proposal/` | 신규: prompt-contract·output-contract·checklist |
| `packages/schema/src/design-context.ts` | `DesignContextBundleContent` 타입 추가 |
| `packages/schema/src/component-proposal.ts` | 신규 `ComponentProposalContract` |
| `packages/schema/src/quality-inspection.ts` | 디자인 차원 점수 필드 확장 |
| `packages/schema/src/{versions,json-schema-registry,index}.ts` | 신규 schemaVersion 등록·export |
| `packages/orchestration/src/public/{agent-inputs,types}.ts` | context에 번들 본문 임베드, `buildComponentProposalAgentInput` 추가 |
| `packages/agent/src/tasks/component-proposal/` | 신규 태스크 + task-catalog 등록, quality-review 프롬프트 강화 |
| `packages/pipeline/src/pipelines/screen-generation/` | `design-context-catalog.ts`(본문 로더), `propose-components` 스테이지, 본문 주입 배선, `component-proposal.json`·`design-critique.json` write |
| `packages/validation/src/` | 제안 아티팩트 bounded 검증 contract 신규 |
| `docs/design/` | 유지(사람용 SSOT). README로 agent/docs 린트 관계 명시 |
| `MASTER_PLAN.md`·`PACKAGE_MAP.md`·`AGENTS_HISTORY.md` | 제안 레이어/비평 스테이지 반영, 비목표 조항 정정 |

## 6. 거버넌스 변경(승인됨)

MASTER_PLAN 비목표 "AI가 component/token/pattern 소유권을 우회해 임의 값을 확정하지 않는다"를 **"확정하지 않는다. 단, AI는 비파괴 제안 아티팩트로 후보를 제시할 수 있으며 확정·반영은 사람의 카탈로그 mutation을 통해서만 이뤄진다"**로 정정한다.

## 7. 성공 기준

1. 같은 SourceSpec에 대해 번들 본문이 prompt context에 실제 포함됨(테스트로 단언). 번들 on/off 시 산출물이 유의미하게 달라짐(divider/spacing/grouping diff).
2. divider 없는 입력에서도 규칙 기반 구분선/간격이 생기고, 카드 그룹핑 화면에선 과잉 divider가 억제됨.
3. `component-proposal.json`이 산출되고, 각 제안이 근거·최근접 카탈로그 매치·제안 props를 갖추며 validation 통과. generation 본 산출물엔 임의 컴포넌트가 새지 않음.
4. `design-critique` 점수/findings가 나오고 P0/P1 지적이 revision에서 실제 수정됨.
5. 기존 12-stage 계약·스키마·validation 테스트 전부 green. 결정론 유지(`--tools ""` 그대로).

## 8. 리스크와 완화

| 리스크 | 완화 |
|---|---|
| 토큰/비용·지연 증가 | 번들을 prose가 아닌 압축 규칙으로 유지, 선택 번들만 주입, 본문 길이 상한 |
| 비목표 충돌 | §6 정정으로 해소(승인됨) |
| 제안 폭주 | source evidence 필수 + 최근접 매치 필수 + 개수 상한 |
| 자기비평 비결정성 | freeform 금지, 이산 severity·코드 findings, revision은 P0/P1만 |
| 규칙 우선순위 드리프트 | source/schema/catalog 우선 순서를 본문 주입 후에도 프롬프트에서 강하게 유지 |
| 분류 매핑 하드코딩 | 번들 id→동작을 contract 테이블로 구동(switch 금지) |
| 효과가 번들 저작 품질에 종속 | 배선과 별개로 디자인 규칙 저작을 1급 작업으로 취급 |

## 9. 비범위(이번 반복에서 제외)

- 모델에 파일시스템/도구 부여(open-design 방식).
- `docs/design`의 클라이언트 패키지 이전.
- 결정론 decorator로 divider/spacing 전면 이관(접근 C).
- media generation(이미지/비디오) 통합.
