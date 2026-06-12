# 판단-중심 understand 계약 + Figma SOT 정답지 하네스 (설계)

> 상태: **설계 승인 — 구현 계획 대기** (2026-06-10).
> 다음 단계: 이 spec 리뷰 → 구현 계획(writing-plans) → 구현.

## 동기

현재 understand 단계(`02-screen-intent`)는 소스에서 의도를 추출하지만, 그 의도가
"사용자가 무슨 **판단**을 내려야 하는가"라는 결정-중심 프레임으로 정리돼 있지 않다.
또 Figma SOT(정본 디자인)에 축적된 "이런 상황엔 이런 화면 구조를 썼다"는 판단 자산
(`docs/design/reference/figma-sot-observations.md`, 86KB)이 생성 파이프라인에
구조적으로 연결돼 있지 않아, compose 단계가 매번 처음부터 구조를 추론한다.

목표는 두 가지다:
1. **understand 결과 계약을 판단-중심 6질문 골격으로 개선** (단, 단계 책임은 안 깨뜨림)
2. **Figma SOT 기반 "정답지" 코퍼스 + 그것을 단계에 전달하는 하네스 신설**

## 6질문과 단계 배치

understand가 6질문을 다 떠안으면 단계 책임이 충돌한다. Q3(현재 배치 평가)·Q5(조합 제안)는
배치 결정이라 compose 소유여야 한다. 최종 배치:

| 질문 | 소유 단계 | 계약 필드 |
|---|---|---|
| Q1 Core Judgment — 핵심 판단 | understand | `coreJudgment` |
| Q2 First Understanding — 먼저 이해할 정보 | understand | `firstUnderstanding` |
| Q6 CTA Promise — CTA가 약속하는 것 | understand | `ctaPromise` |
| Q4 Reference Match — 유사 SOT 상황 | understand(분류) → compose(구조 읽기) | `referenceMatch{referenceIds, matchedPattern}` |
| Q3 Current Fit — 소스 원본 배치가 판단을 돕는가 | compose | `currentFitAssessment{supportsJudgment, problems}` |
| Q5 Composition Proposal — 더 나은 Area/Composite | compose | `compositionProposal{shouldChangeAreaComposite, recommendedAreas}` |

**Q4를 두 단계로 쪼개는 이유:** 레퍼런스 *매칭*("어떤 상황인가")은 판단이라 understand에,
레퍼런스 *구조 추출*("그래서 어떤 area를 쓰나")은 배치라 compose에 둔다. understand는 경량
인덱스만 보고 `referenceIds`를 지목하고, compose가 그 id의 본문 구조를 읽어 제안에 반영한다.

## 데이터 흐름

```
SourceSpec
   │
   ▼
[understand : screen-intent v0.2]   ◀── reference-screen-index (frontmatter+한줄요약, 경량)
   │   출력: coreJudgment, firstUnderstanding, ctaPromise,
   │         referenceMatch{ referenceIds[], matchedPattern },
   │         + source-fidelity 필드(contentPriority, sourceInterpretation,
   │           missingDecisions, stateCoverageHints, usedSkills)
   ▼
[compose : composition-plan]        ◀── reference-screen-catalog (전체 본문)
       LLM이 screen-intent context의 referenceMatch.referenceIds로 필터
       출력: currentFitAssessment{ supportsJudgment, problems },
             compositionProposal{ shouldChangeAreaComposite, recommendedAreas },
             + 기존 composition 필드(visualHierarchy, primaryUserAction,
               sectionRhythm, density, patternRationale, rejectedPatterns)
```

## understand 출력 계약: screen-intent **v0.2**

`packages/schema/src/screen-intent.ts` + `json-schema-registry.ts`.

**추가 (신규 required):**
- `coreJudgment: string` — 이 화면에서 사용자가 내려야 하는 핵심 판단
- `firstUnderstanding: string` — 가장 먼저 이해해야 하는 정보
- `ctaPromise: string` — 이 상태에서 CTA가 사용자에게 약속하는 것

**추가 (신규 optional — 매칭 실패 가능):**
- `referenceMatch?: { referenceIds: string[]; matchedPattern: string }`

**제거:**
- `screenPurpose` (screen-intent 전용, `coreJudgment`로 대체)
- `primaryUserAction?` (screen-intent 전용 optional, `ctaPromise`로 대체)
  - ⚠️ `primaryUserAction`은 **composition-plan에도 별도로 존재하며 거긴 required + load-bearing**
    (`composition-plan.ts:22`, `action-clarity-review`가 소비, design-skill 4종 예시).
    **compose의 `primaryUserAction`은 건드리지 않는다.** 레이어가 다르다:
    `ctaPromise`=의도의 약속(understand), `primaryUserAction`=액션 슬롯 결정(compose).

**유지 (source-fidelity 추적 — `source-fidelity-review`/`state-coverage-review`가 소비):**
- `contentPriority: string[]`, `sourceInterpretation{preserve, summarize, defer}`,
  `missingDecisions?`, `stateCoverageHints?`, `usedSkills?`, `rationale?`, `audience?`,
  `primaryTask?`, `successMoment?`

**required 최종:** `[schemaVersion, coreJudgment, firstUnderstanding, ctaPromise, contentPriority, sourceInterpretation]`

**버전:** `screen-intent.v0.1 → v0.2`. 신규 required라 비호환. RnD라 데이터 마이그레이션 없음
(기존 `data/runs/**/context/screen-intent.json`은 과거 산출물로 둠).

**영향 받는 프롬프트:** `packages/agent/docs/prompts/screen-intent.md` — capture 지시(L29)를
신규 필드로 교체, referenceMatch 작성 지시 추가, output JSON Schema 갱신.

## compose 출력 계약: composition-plan 추가

`packages/schema/src/composition-plan.ts` + `json-schema-registry.ts`.

**추가:**
- `currentFitAssessment: { supportsJudgment: boolean; problems: string[] }`
- `compositionProposal: { shouldChangeAreaComposite: boolean; recommendedAreas: string[] }`

기존 필드(`visualHierarchy`, `primaryUserAction`, `sectionRhythm`, `density`,
`patternRationale`, `rejectedPatterns`)는 모두 유지. compose는 understand가 준
`referenceMatch.referenceIds`(screen-intent context)로 `reference-screen-catalog` 본문을 필터해
`currentFitAssessment`/`compositionProposal`을 근거 있게 작성한다.

**영향 받는 프롬프트:** `packages/agent/docs/prompts/composition-planning.md` — currentFit/proposal
작성 지시 + referenceIds로 정답지 본문 참조 지시 추가.

## 정답지 코퍼스

**위치 (category별 디렉토리, 각자 생성 카탈로그 보유):**
```
packages/agent/docs/references/
  screens/
    {screenID}.md             ← 수기 SSOT (frontmatter + 본문)
    catalog.generated.ts      ← screens/*.md 의 {id, frontmatter, sourceRef} 자동 취합 (생성물, body 제외)
  areas/                       ← 나중 category (지금 미생성)
    {areaID}.md
    catalog.generated.ts
```

**형식 (frontmatter + 본문):**
```markdown
---
id: ref-conflict-resolution-001
situation: 두 항목이 충돌해 사용자가 하나를 선택/해소해야 하는 상황
tags: [conflict-resolution, choice, irreversible]
sotNodeRef: <docs/design/reference/figma-source.md의 node id>
---
## 상황
## 선택한 화면 구조 (areas / composites)
## 그 구조를 쓴 이유 (판단)
```

frontmatter `id`는 안정적 식별자(기존 스킬들이 `id: source-fidelity-review`를 쓰는 관례와 동일).
`referenceMatch.referenceIds`가 이 id를 지목한다.

**저술:** `figma-sot-observations.md`를 읽어 상황별 reference 마크다운으로 증류
(Claude 초안 + 사람 검토), `figma-source.md`의 node id로 SOT 근거 고정.
**시드 5~10개**로 시작해 점진 확장. 자동 추출 아님 — "상황→구조→이유" 판단이 핵심.

## 하네스 / resolver 설계 (flat kind + 단일 제네릭 리졸버)

knowledge kind 이름에 category를 박되(`reference-{category}-{index|catalog}`), **리졸버는 하나로
일반화**한다. category가 늘어도 새 kind·리졸버·메소드를 만들지 않는 것이 설계 목표다.
본문 로딩은 기존 `stage-skillset`(`skillset-catalog/catalog.ts:145`, `readAgentMarkdownDocument`)을
미러링 — 새로 발명할 메커니즘 없음.

### 단일 카테고리 레지스트리 (확장의 단일 진실원)

```ts
// @cx/agent — category 추가 = 여기 한 줄
export const REFERENCE_CATEGORIES = {
  screen: "../docs/references/screens",
  // area: "../docs/references/areas",   ← 나중에
} as const;
```

resolver와 sync 스크립트가 **이 레지스트리 하나만** 본다. `design-skills/design-fundamentals/source/`는 reference catalog 레지스트리에
없으므로 건드리지 않는다.

### 제네릭 리졸버 (메소드 1개)

```ts
// @cx/agent
export function resolveReferenceForInference(category, mode /* "index" | "catalog" */) {
  const dir = REFERENCE_CATEGORIES[category];
  if (!dir) throw new Error(`Unknown reference category: ${category}`);
  // {dir}/catalog.generated.ts 사용 (id + frontmatter + sourceRef)
  // mode === "index"   → frontmatter만 (body 드롭)
  // mode === "catalog" → + readAgentMarkdownDocument(sourceRef) body
  // → SsotObject<"reference-catalog", { category, entries }>
}
```

### knowledge-base 분기 (한 군데)

`reference-*`는 `KNOWLEDGE_RESOLVERS` 맵을 거치지 않고 정규식 한 갈래로 처리 — kind마다 맵
엔트리를 추가하지 않는다.

```ts
// knowledge-base.ts createInferenceKnowledgeBase().resolve
async resolve(ref) {
  const m = /^reference-(.+)-(index|catalog)$/.exec(ref.source);
  if (m) return resolveReferenceForInference(m[1], m[2]);
  const resolver = KNOWLEDGE_RESOLVERS[ref.source];
  if (resolver.requiresId) readRequiredKnowledgeId(ref);
  return resolver.resolve(ref);
}
```

### index vs catalog, 그리고 compose 필터

- understand: `knowledge("reference-screen-index")` → frontmatter만(경량). LLM이 `referenceIds` 지목.
- compose: `knowledge("reference-screen-catalog")` → 전체 본문. LLM이 context의
  `referenceMatch.referenceIds`로 필터.

compose가 전체 본문을 받는다(매칭분만이 아님). 시드 5~10개일 땐 무해. 코퍼스가 수십 개로 커지면
`log`로 경고하고, context 기반 동적 id 해석(후속: `KnowledgeRef`+worker resolution 확장)으로
승격한다 — index/catalog가 이미 분리돼 있어 compose resolver만 교체하면 됨.

### sync 스크립트 (category별 catalog.generated.ts 자동 취합)

`scripts/sync-reference-catalog`:
- `REFERENCE_CATEGORIES`를 순회
- 각 category 디렉토리의 `*.md` frontmatter(`id`, `situation`, `tags`, `sotNodeRef`) +
  상대경로(`sourceRef`)를 취합 → **그 디렉토리에** `catalog.generated.ts` emit (body 제외)
- **diff guard 테스트** (`sync-layout-catalog`와 동일) — .md 변경 후 재생성 안 하면 CI 실패
- frontmatter `id` 누락/중복 시 throw (alias-registry-integrity 류 가드)

### 건드릴 곳 (코드 근거)

1. **`step.ts:7-17`** — `KnowledgeRef.source` 유니온에 `` `reference-${string}` `` 추가
   (template literal — category·mode마다 추가 불필요).
2. **`knowledge-base.ts:44`** — `createInferenceKnowledgeBase().resolve`에 `reference-*` 정규식
   분기 1개 (위). `KNOWLEDGE_RESOLVERS`는 안 건드림.
3. **`@cx/agent` 신규 모듈** `packages/agent/src/reference-catalog/` — `REFERENCE_CATEGORIES` +
   `resolveReferenceForInference(category, mode)` (메소드 1개). `@cx/schema` SSOT
   타입(`InferenceReference`)에 `reference-catalog` object 종류 등록.
4. **`scripts/sync-reference-catalog`** — 위 (category별 `catalog.generated.ts` + diff guard).
5. **파이프라인** `screen-generation-v1.ts` — `02-screen-intent`에 `knowledge("reference-screen-index")`,
   `03-composition`에 `knowledge("reference-screen-catalog")`.
6. **프롬프트** `screen-intent.md` / `composition-planning.md` — 위 §understand/§compose 참조.

### category 추가 비용 (나중에 areas)

1. `references/areas/*.md` 정답지 작성
2. `REFERENCE_CATEGORIES`에 `area: "../docs/references/areas"` **한 줄**
3. `pnpm sync:reference` → `areas/catalog.generated.ts` 자동 생성

→ `step.ts`·`knowledge-base.ts`·리졸버 **안 건드림, 새 메소드 0개.** 호출부만
`knowledge("reference-area-index")` / `knowledge("reference-area-catalog")`.

## 단계별 작업 (구현 계획에서 세분)

| 단계 | 내용 |
|---|---|
| S1 | screen-intent v0.2 스키마(타입+json-schema) + `screen-intent.md` 프롬프트. 기존 source-fidelity 필드 유지, screenPurpose/understand-primaryUserAction 제거 |
| S2 | composition-plan에 currentFitAssessment/compositionProposal 추가 + `composition-planning.md` 프롬프트 |
| S3 | `references/screens/` 디렉토리 + 시드 5~10개 증류(`figma-sot-observations.md` 기반) |
| S4 | `@cx/agent` `REFERENCE_CATEGORIES` + `resolveReferenceForInference`(제네릭 1개) + `sync-reference-catalog`(category별 `catalog.generated.ts`) + diff guard |
| S5 | `step.ts` `reference-${string}` 유니온 + `knowledge-base.ts` `reference-*` 정규식 분기 + 파이프라인 references 주입 |
| S6 | 테스트: 스키마 검증, resolver 단위, diff guard, 파이프라인 authoring, source-fidelity-review 참조 정합 |

## 리스크

- **source-fidelity-review가 screenPurpose를 가정하면 깨짐** — 현재 grep상 prompt 텍스트
  외 코드 소비처는 없으나, S1에서 review 스킬/프롬프트 참조를 함께 확인.
- **compose의 primaryUserAction 혼동** — understand의 ctaPromise와 별개 레이어. 제거 대상 아님.
  스키마/프롬프트 양쪽에서 명시적으로 구분.
- **reference-catalog 전체 본문 주입 토큰** — 코퍼스 성장 시 증가. 동적 id 해석 승격 트리거를
  `log` 경고로 가시화.
- **정답지 품질** — 자동 추출 아닌 판단 증류라 시드 품질이 전체 가치를 좌우. 소수 고품질 우선.
- **template literal union(`reference-${string}`) 트레이드오프** — 유효 category 자동완성을 잃는다.
  대신 `REFERENCE_CATEGORIES`에 없는 category는 런타임 throw로 잡고, 오타 kind는 정규식 미스 →
  `KNOWLEDGE_RESOLVERS` 미스로 명확히 실패. "리졸버 안 늘리기"의 의도된 대가.

## 미결 / 후속

- 동적 id 해석(compose가 매칭 id 본문만 로드) 승격 시점 — 코퍼스 규모 기준 미정. 운영하며 결정.
- 두 번째 category(`areas` 등) 도입 시점 — 축은 열어둠. 실제 정답지는 필요해질 때 작성.
- referenceMatch를 검증하는 별도 review 스킬(`reference-fidelity-review`) 도입 여부 — 후속.
