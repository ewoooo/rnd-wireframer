# Pipeline Stage Protocol

## 1. 문서 책임

이 문서는 `@cx/pipeline`이 실행하는 stage 순서, stage 간 입출력, side effect 경계를 정의한다.

제품 방향은 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 패키지 관계망은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), 저장소 구조는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 따른다.

이 문서는 개별 validator 규칙 본문이나 prompt 원문을 소유하지 않는다. 해당 내용은 각 패키지와 [`packages/agent/docs/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs)에서 관리한다.

## 2. 목적

`@cx/pipeline`은 실행 가능한 pipeline과 side effect를 소유한다. 이 문서는 다음 두 가지를 고정한다.

- 어떤 stage가 어떤 순서와 책임으로 실행되는가
- 각 stage에서 어느 패키지가 입력 조립, AI 실행, 검증, 파일 반영을 소유하는가

## 3. 소유 경계

```text
source artifact read
-> @cx/parser
-> @cx/orchestration
-> @cx/agent
-> @cx/validation
-> @cx/pipeline side effects
```

경계 규칙:

- `@cx/pipeline`: stage 순서, runtime context, command 실행, artifact write
- `@cx/orchestration`: 각 stage의 순수 입력 조립
- `@cx/agent`: Claude 실행과 세션 정책
- `@cx/validation`: schema/catalog/layout 검증 리포트 반환
- `@cx/renderer`: 완료된 RenderTree preview 소비만 담당

## 4. 현재 pipeline 식별자

현재 실행 가능한 pipeline id:

- `screen-generation`

## 5. 현재 stage 순서

현재 `screen-generation` 기준 stage 순서:

```text
read-source
-> parse-source
-> derive-screen-intent
-> plan-composition
-> derive-decoration-plan
-> select-pattern
-> generate-render-tree
-> validate-render-tree
-> revise-render-tree-if-invalid
-> validate-render-tree-after-revision
-> write-artifacts
```

stage 순서는 `@cx/pipeline`이 소유한다. `@cx/orchestration`은 이 순서를 결정하지 않는다.

## 6. Stage 입출력 계약

### `read-source`

- 입력: source path, source kind
- 실행 소유: `@cx/pipeline`
- 출력: `PipelineMarkdownSourceFile`
- side effect: source artifact read

### `parse-source`

- 입력: `PipelineMarkdownSourceFile`
- 실행 소유: `@cx/pipeline` -> `@cx/parser`
- 출력: `SourceSpec`, parser issues
- side effect: 없음

### `derive-screen-intent`

- 입력 조립 소유: `@cx/orchestration`
- AI 실행 소유: `@cx/agent`
- 출력: `screen-intent` agent result
- side effect: 없음

### `plan-composition`

- 입력 조립 소유: `@cx/orchestration`
- AI 실행 소유: `@cx/agent`
- 출력: `composition-plan` agent result
- side effect: 없음

### `derive-decoration-plan`

- 입력 조립 소유: `@cx/orchestration`
- 실행 소유: `@cx/pipeline` -> `@cx/orchestration`
- 출력: deterministic `DecorationPlan`
- 책임: SourceSpec 내부 이름과 사용자 노출 구조를 분리하고, 약관 목록/동의 controls처럼 source section 안에서 역할이 갈리는 area를 contract에 따라 split한다.
- side effect: 없음

### `select-pattern`

- 입력 조립 소유: `@cx/orchestration`
- AI 실행 소유: `@cx/agent`
- 출력: pattern-selection agent result, DecorationPlan 기반 layer candidates 참조
- side effect: 없음

### `generate-render-tree`

- 입력 조립 소유: `@cx/orchestration`
- AI 실행 소유: `@cx/agent`
- 출력: 최소 `tableGenerationResult` + `renderTree`를 포함하는 생성 결과
- 참조 자산: `@cx/agent` 내부 생성 자산 문서
- side effect: 없음

### `validate-render-tree`

- 입력: generation result
- 실행 소유: `@cx/validation`
- 출력: validation report
- side effect: 없음

### `revise-render-tree-if-invalid`

- 조건: 초기 validation report가 실패일 때만 revision 실행
- 입력 조립 소유: `@cx/orchestration`
- AI 실행 소유: `@cx/agent`
- 출력: revised generation result
- side effect: 없음

### `validate-render-tree-after-revision`

- 입력: revision result
- 실행 소유: `@cx/validation`
- 출력: 후속 validation report
- side effect: 없음

### `write-artifacts`

- 입력: sourceSpec, agent result, validation report, 부가 artifact
- 실행 소유: `@cx/pipeline`
- 출력: versioned artifacts, run log, pipeline result envelope
- side effect: 있음

## 7. Stage별 금지 사항

- `@cx/orchestration`은 파일 IO를 하지 않는다.
- `@cx/orchestration`은 stage 순서와 retry 정책을 소유하지 않는다.
- `@cx/agent`는 artifact write를 하지 않는다.
- `@cx/validation`은 다음 액션을 결정하지 않는다.
- `@cx/pipeline`은 prompt 원문과 validator 세부 규칙을 소유하지 않는다.

## 8. 실패와 중단 규칙

- `parse-source`가 실패하면 이후 design stage는 건너뛰고 `write-artifacts`만 수행할 수 있다.
- validation 실패는 곧바로 파일 반영 금지를 뜻하지 않지만, revision 또는 후속 next action 판단의 입력이 된다.
- 어느 stage를 재시도할지의 실행 판단은 `@cx/pipeline`이 소유하되, 재개 세션 해석은 `@cx/agent` 프로토콜을 따른다.

## 9. Artifact 추적 규칙

pipeline은 가능한 한 각 stage의 입력과 결과를 감사 가능한 artifact로 남긴다.

대표 예시:

- source read result
- parse result / `SourceSpec`
- screen-intent agent input/result
- composition-plan agent input/result
- decoration plan
- pattern-selection input/result
- generation input/result
- validation reports
- pipeline result summary

## 10. 관련 참조 자산

- stage 순수 입력 조립: `@cx/orchestration`
- agent prompt/checklist/output 규약: [`packages/agent/docs/`](/Users/plusx/Documents/rnd-screen-generator/packages/agent/docs)
- 확장 설계 맥락: [SCREEN_DESIGN_STAGE_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_DESIGN_STAGE_PLAN.md)

## 11. 검증 기준

- `PipelineStageId`와 문서의 stage 목록이 일치한다.
- stage 순서 소유자가 `@cx/pipeline`으로 유지된다.
- stage 입력 조립 소유자가 `@cx/orchestration`으로 유지된다.
- `write-artifacts`만 side effect stage라는 기준이 유지된다.
