# Catalog Facade Alignment Plan

## 1. 목적

`@cx/components`와 `@cx/layout-pattern-store`는 모두 AI 생성과 검증 과정에서 다음 기능을 제공해야 한다.

- 새로운 후보 제작: Component Candidate, Layout Candidate
- ID 기반 단건 조회: Component, Layout
- 카탈로그 조회: 사용 가능한 계약 surface 목록

현재 두 패키지는 내부 구조가 유사하지만 public export path와 public 함수명이 다르다. 이 문서는 내부 구현 차이를 유지하면서 외부 catalog facade를 동일하게 만드는 계획을 정의한다.

## 2. 현재 코드 기준

### @cx/components

- root export `@cx/components`: React component runtime surface
- catalog export `@cx/components/catalog`: component contract catalog
- catalog 원천: `src/internal/component-entries.ts`, `src/internal/candidate-entries.ts`
- public catalog shape: `Record<string, ComponentCatalogEntry>`
- candidate 상태: internal registry의 `status: "stable" | "candidate"`

주요 파일:

- `packages/component/package.json`
- `packages/component/src/index.ts`
- `packages/component/src/public/catalog.ts`
- `packages/component/src/public/resolver.ts`
- `packages/component/src/public/mutations.ts`
- `packages/component/src/internal/registry.ts`
- `packages/component/src/internal/assembly.ts`

### @cx/layout-pattern-store

- root export `@cx/layout-pattern-store`: layout component runtime surface
- catalog export `@cx/layout-pattern-store/catalog`: layout pattern catalog facade와 기존 pattern store read API
- runtime component compatibility export `@cx/layout-pattern-store/components`: layout component registry
- catalog 원천: `src/catalog/*.json`
- runtime store shape: `{ patterns: PatternStorePattern[] }`
- layout catalog entry shape: `layout.<target>.*`, `target`, `componentID`, `children`, `props`, `status`
- candidate 상태 후보: 현재 `status: "draft" | "ready" | "deprecated"` 중 `draft`가 candidate에 가장 가깝다.

주요 파일:

- `packages/layout-pattern-store/package.json`
- `packages/layout-pattern-store/src/public/catalog.ts`
- `packages/layout-pattern-store/src/public/components.ts`
- `packages/layout-pattern-store/src/public/resolver.ts`
- `packages/layout-pattern-store/src/public/mutations.ts`
- `packages/layout-pattern-store/src/internal/data.ts`
- `packages/layout-pattern-store/src/internal/store.ts`
- `packages/layout-pattern-store/src/internal/schema.ts`
- `packages/layout-pattern-store/src/catalog/*.json`

## 3. 통일 원칙

패키지 내부 데이터 모델은 강제로 동일하게 만들지 않는다.

- Component catalog는 `type` keyed registry가 자연스럽다.
- Layout catalog는 `target`과 `layout.<target>.*` ID를 가진 pattern list가 자연스럽다.

대신 외부 public facade를 동일하게 만든다.

```ts
import { createCandidate, getEntry, listCatalog, listCatalogIds } from "@cx/components/catalog";
import { createCandidate, getEntry, listCatalog, listCatalogIds } from "@cx/layout-pattern-store/catalog";
```

공통 의미:

| API | 책임 |
|---|---|
| `createCandidate(input)` | 새로운 후보 entry를 순수 결과로 생성한다. 파일 쓰기는 하지 않는다. |
| `getEntry(id, options?)` | ID로 단건 entry를 조회한다. |
| `listCatalog(options?)` | catalog entry 배열을 반환한다. |
| `listCatalogIds(options?)` | catalog ID 배열을 반환한다. |

## 4. Target Export Subpath

두 패키지는 최소한 아래 subpath를 같은 의미로 제공한다.

```json
{
  ".": "./src/index.ts",
  "./catalog": "./src/public/catalog.ts",
  "./resolver": "./src/public/resolver.ts",
  "./mutations": "./src/public/mutations.ts",
  "./types": "./src/public/types.ts"
}
```

추가 subpath는 패키지 책임에 따라 유지한다.

`@cx/components`:

```json
{
  "./puck": "./src/public/puck.ts",
  "./styles.css": "./src/styles.css",
  "./tokens": "./src/tokens/index.ts",
  "./tokens.css": "./src/tokens/variables.css",
  "./tailwind.css": "./src/tailwind/theme.css"
}
```

`@cx/layout-pattern-store`:

```json
{
  "./components": "./src/public/components.ts"
}
```

`@cx/layout-pattern-store` root는 runtime layout component surface로 맞춘다. catalog read API는 `@cx/layout-pattern-store/catalog`로 이동한다.

## 5. 개선된 디렉토리 기준

### @cx/components

```text
src/
  index.ts
  public/
    catalog.ts
    resolver.ts
    mutations.ts
    types.ts
    puck.ts
  internal/
    catalog-store.ts
    registry.ts
    component-entries.ts
    candidate-entries.ts
    mutations.ts
    assembly.ts
    audit.ts
  components/
  candidates/
  tokens/
  tailwind/
```

`catalog-store.ts`는 public facade가 사용할 내부 조회 helper를 모은다. 현재 `registry.ts`, `assembly.ts`, `resolver.ts`에 흩어진 catalog 조립과 lookup 코드를 단계적으로 모은다.

### @cx/layout-pattern-store

```text
src/
  index.ts
  public/
    catalog.ts
    components.ts
    resolver.ts
    mutations.ts
    types.ts
  internal/
    catalog-store.ts
    data.ts
    store.ts
    schema.ts
    mutations.ts
    matcher.ts
  catalog/
    area-patterns.json
    composite-patterns.json
    region-patterns.json
    screen-patterns.json
  components/
```

`catalog-store.ts`는 JSON catalog load, normalized store 조회, `layout.<target>.*` ID와 normalized pattern ID 변환을 public facade에서 직접 알지 않도록 숨긴다.

## 6. API 설계

### @cx/components/catalog

```ts
export type ComponentCatalogListOptions = {
  status?: "stable" | "candidate";
};

export type CreateComponentCandidateInput = {
  entry: ComponentCatalogEntry;
};

export function createCandidate(input: CreateComponentCandidateInput): ComponentCatalogMutationResult;
export function getEntry(id: string): ComponentCatalogEntry | undefined;
export function listCatalog(options?: ComponentCatalogListOptions): ComponentCatalogEntry[];
export function listCatalogIds(options?: ComponentCatalogListOptions): string[];
```

Compatibility export는 유지한다.

```ts
export const componentCatalog: ComponentCatalog;
export const getComponentCatalogEntry: typeof getEntry;
export const getComponentCatalogTypes: typeof listCatalogIds;
export const createComponentCatalogEntry: ...;
```

### @cx/layout-pattern-store/catalog

```ts
export type LayoutCatalogListOptions = {
  status?: "deprecated" | "draft" | "ready";
  target?: "screen" | "region" | "area" | "composite";
};

export type CreateLayoutCandidateInput = {
  entry: LayoutPatternCatalogEntry;
};

export function createCandidate(input: CreateLayoutCandidateInput): PatternStoreMutationResult;
export function getEntry(id: string, options?: Pick<LayoutCatalogListOptions, "target">): LayoutPatternCatalogEntry | undefined;
export function listCatalog(options?: LayoutCatalogListOptions): LayoutPatternCatalogEntry[];
export function listCatalogIds(options?: LayoutCatalogListOptions): string[];
```

Compatibility export는 유지한다.

```ts
export function loadPatternStore(): PatternStore;
export function findPattern(...): Pattern | undefined;
export function listPatterns(...): Pattern[];
export function createLayoutPattern(...): PatternStoreMutationResult;
```

## 7. Rollout

1. `@cx/layout-pattern-store/catalog` export를 추가한다.
2. 두 패키지의 `public/catalog.ts`에 `createCandidate`, `getEntry`, `listCatalog`, `listCatalogIds` facade를 추가한다.
3. repo 내부 catalog 소비처를 표준 facade로 옮긴다.
4. `@cx/layout-pattern-store` root import에서 catalog read API 사용을 제거한다.
5. `@cx/layout-pattern-store` root를 runtime layout component surface로 전환한다.
6. `@cx/layout-pattern-store/components` compatibility subpath 제거 여부는 별도 breaking-change 시점에 결정한다.

## 8. 검증 기준

두 패키지에 동일한 public facade contract test를 둔다.

- `@cx/*/catalog`에서 `createCandidate`, `getEntry`, `listCatalog`, `listCatalogIds`가 export된다.
- `getEntry(id)`는 public entry를 반환하며 internal-only 상태 필드를 섞지 않는다.
- `listCatalog()`는 배열을 반환한다.
- `listCatalogIds()`는 string 배열을 반환한다.
- candidate 생성은 순수 결과만 반환하고 원본 JSON/mock 입력을 수정하지 않는다.
- legacy/compat API는 migration 기간 동안 계속 동작한다.

추가 검증:

- `pnpm exec tsc --noEmit --pretty false --incremental false`
- `pnpm exec vitest run packages/component/src/__tests__/catalog-public-contract.test.ts packages/layout-pattern-store/src/__tests__/public-api.test.ts`
- `git diff --check`

## 9. 열린 결정

- layout candidate의 public 상태명을 `draft` 그대로 둘지, facade에서 `candidate`로 매핑할지 결정해야 한다.
- layout `getEntry(id)`가 `layout.area.listStack` 같은 layout ID만 받을지, normalized pattern ID `list-stack`도 받을지 결정해야 한다.
- `@cx/layout-pattern-store/components`를 장기적으로 유지할지, root runtime surface만 남길지 결정해야 한다.
- 공통 facade 타입을 별도 패키지에 둘 필요는 아직 없다. 중복이 실제 유지보수 문제로 커질 때만 고려한다.
