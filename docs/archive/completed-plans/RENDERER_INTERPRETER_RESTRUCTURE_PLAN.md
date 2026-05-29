# Renderer Interpreter Restructure Plan

## 1. 문서 책임

이 문서는 `@cx/renderer`를 순수 RenderTree interpreter로 정리하기 위한 디렉토리 재편, fallback 제거, adapter 분리 계획을 정의한다.

패키지 책임 기준은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), 전체 layout rendering 전환 기준은 [LAYOUT_RENDERING_REDESIGN_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/archive/completed-plans/LAYOUT_RENDERING_REDESIGN_PLAN.md)를 따른다. 이 문서는 renderer 내부 구조와 실행 순서만 다룬다.

## 2. 목표

현재 `@cx/renderer`는 table-to-RenderTree 책임에서는 분리됐지만, 아직 interpreter core와 adapter 조회 로직이 같은 파일 경계에 섞여 있다.

목표:

- renderer core는 RenderTree를 React로 순회/해석하는 책임만 가진다.
- layout pattern, component catalog, primitive renderer 연결은 `adapters/`로 분리한다.
- node kind renderer registry 중심 구조를 줄이고 resolver 기반 interpreter로 단순화한다.
- unknown node, unknown component, missing layout pattern을 fallback UI로 숨기지 않는다.
- validation은 렌더 전에 계약 위반을 검출하고, renderer는 받은 RenderTree를 정직하게 해석한다.
- 디렉토리 이름만 보고도 interpreter core, runtime helper, adapter 책임을 구분할 수 있게 한다.

## 3. 현재 문제

현재 구조:

```text
packages/renderer/src/
  render/render-tree-view.tsx
  nodes/default-node-renderers.tsx
  nodes/area/*
  nodes/component/*
  registry/*
  tree/*
```

문제:

- `default-node-renderers.tsx`가 structural node, page-stack, area, leaf component, composite fallback, fallback UI를 모두 포함한다.
- `render-tree-view.tsx`가 RenderTree 순회와 layout pattern wrapping 정책을 같이 소유한다.
- `@cx/layout-pattern-store/resolver`를 renderer render entry에서 직접 import한다.
- `@cx/components/catalog` 기반 prop coercion이 renderer core와 명확히 분리돼 있지 않다.
- `resolveNodeKind()`가 unknown type을 `"fallback"`으로 바꿔 렌더 실패를 성공처럼 보이게 한다.
- missing layout pattern일 때 wrapper 없이 children만 렌더하는 경로가 있다.

## 4. 목표 구조

```text
packages/renderer/src/
  tree/
    types.ts
    path.ts

  runtime/
    bindings.ts
    resolve-node.ts
    text.ts

  interpreter/
    RenderTreeView.tsx
    RenderNodeView.tsx
    render-node.tsx
    render-screen.tsx
    render-layout.tsx
    render-component.tsx
    types.ts

  adapters/
    index.ts
    create-runtime.ts
    resolve-layout.ts
    resolve-component.ts
    build-component-props.ts
    render-primitive.tsx
    resolve-area.tsx
    missing-policy.tsx

  index.ts
```

## 5. 목표 책임

### `interpreter/`

순수 RenderTree interpreter core다.

책임:

- RenderTree node를 재귀 순회한다.
- display 조건과 prop binding 결과를 적용한다.
- screen root의 header, contents, bottom slot을 렌더한다.
- children을 먼저 렌더한 뒤 node `layout`이 있으면 주입받은 layout resolver로 wrapper component를 찾는다.
- leaf component node는 주입받은 component resolver로 실제 React component를 찾는다.
- layout primitive와 area display policy는 주입받은 adapter helper로만 처리한다.
- missing layout/component/primitive는 주입받은 missing policy에 위임한다.

하지 않는 일:

- `@cx/layout-pattern-store` 직접 import
- `@cx/components` 직접 import
- `@cx/components/catalog` 직접 import
- `@cx/layout/primitives` 직접 import
- table relation 조립
- validation 실행
- fallback UI를 성공 렌더로 처리

### `runtime/`

RenderTree 해석 중 필요한 순수 값 변환만 담당한다.

책임:

- prop binding resolve
- display condition resolve
- text/boolean coercion 같은 작은 helper

### `adapters/`

현재 제품 런타임에 필요한 외부 패키지 연결을 담당한다.

책임:

- `@cx/layout-pattern-store/resolver` 연결
- `@cx/components` leaf component resolve
- `@cx/components/catalog` prop contract 기반 props 정리
- `@cx/layout/primitives` primitive render helper 연결
- `area.static`/`area.dynamic` display policy 연결
- missing policy 구성
- renderer runtime 생성

## 6. Fallback 제거 원칙

현재 fallback UI는 dead code가 아니라 살아있는 계약 회피 경로다. 따라서 단순 삭제가 아니라 테스트와 정책을 먼저 정리한다.

제거 대상:

- `resolveNodeKind() -> "fallback"`
- registry의 `kind: "fallback"`
- `renderFallbackNode`
- node kind renderer registry를 정상 렌더의 중심으로 쓰는 경로
- unknown component를 회색 박스로 그리는 경로
- missing layout pattern일 때 children만 렌더하는 경로
- fallback UI에 의존하는 테스트 fixture의 `UnknownLeaf`

목표 정책:

```text
unknown node type
-> validation error
-> renderer 입력 시 missing component 또는 missing primitive policy 실행

unknown component
-> validation error
-> renderer 입력 시 missing component policy 실행

unknown layout pattern
-> validation error
-> renderer 입력 시 missing layout policy 실행
```

제품 기본 missing policy는 `throw`다. 개발 preview에서만 명시적 error surface를 선택할 수 있다.

## 7. Runtime 주입 계약

interpreter core는 catalog/store를 직접 알지 않는다.

예상 계약:

```ts
export interface RendererRuntime {
	resolveLayout: (input: {
		layoutId: string;
		props: Record<string, unknown>;
	}) => ResolvedLayoutComponent | undefined;
	resolveComponent: (input: {
		type: string;
		props: Record<string, unknown>;
	}) => ResolvedComponent | undefined;
	renderPrimitive: (input: {
		node: RenderTreeNode;
		props: Record<string, unknown>;
		children: ReactNode;
	}) => ReactNode | undefined;
	resolveArea: (input: {
		node: RenderTreeNode;
		props: Record<string, unknown>;
		children: ReactNode;
	}) => ReactNode | undefined;
	onMissingLayout: MissingLayoutHandler;
	onMissingComponent: MissingComponentHandler;
	onMissingPrimitive: MissingPrimitiveHandler;
}
```

layout wrapper 계약:

```ts
export interface ResolvedLayoutComponent {
	Component: LayoutPatternComponent;
	componentProps: Record<string, unknown>;
}

export interface ResolvedComponent {
	Component: React.ComponentType<Record<string, unknown>>;
	componentProps: Record<string, unknown>;
}
```

missing policy 계약:

```ts
export type MissingLayoutHandler = (input: {
	layoutId: string;
	node: RenderTreeNode;
}) => never | ReactNode;

export type MissingComponentHandler = (input: {
	node: RenderTreeNode;
}) => never | ReactNode;

export type MissingPrimitiveHandler = (input: {
	node: RenderTreeNode;
}) => never | ReactNode;
```

제품 adapter는 `never` 경로, 즉 throw를 사용한다.

## 8. 예상 사이드이펙트와 안전장치

이 변경은 renderer 내부 구조 변경이지만, 실제 화면 출력에 영향을 줄 수 있다. 특히 fallback 제거와 layout wrapper 적용 경로 단일화는 이전에 조용히 보이던 문제를 에러로 드러낼 수 있다.

예상 사이드이펙트:

- fallback UI나 children unwrap으로 가려지던 unknown component/layout 문제가 즉시 실패한다.
- layout wrapper 적용 순서가 달라져 padding, gap, width rail, sticky bottom 위치가 바뀔 수 있다.
- component prop coercion 위치가 바뀌면서 title, description, subText, showBack 같은 leaf prop fallback 우선순위가 달라질 수 있다.
- `area.dynamic`의 데이터 없음/error policy 처리 위치가 바뀌면서 empty/loading/error 상태 표시가 달라질 수 있다.
- `Screen.Header`, `Screen.Contents`, `Screen.Bottom` slot 처리 회귀로 header, scroll contents, bottom CTA 배치가 깨질 수 있다.
- validation은 통과하지만 시각 결과가 달라지는 spacing/wrapper 회귀가 발생할 수 있다.

안전장치:

- 구조 변경 전 web preview baseline을 캡처한다.
- fallback 제거 전 테스트 fixture에서 fallback 의존을 먼저 제거한다.
- layout wrapper 적용 경로를 단일화할 때 기존 wrapper depth와 spacing 값을 비교한다.
- component props coercion 이동 전후로 주요 leaf component props snapshot을 비교한다.
- screen slot, sticky bottom, dynamic area 상태를 대표 fixture로 고정한다.
- 각 batch는 `tsc`, 관련 package test, web smoke 중 최소 하나 이상을 통과한 뒤 다음 batch로 넘어간다.

대표 baseline 화면:

- header + contents + bottom CTA가 있는 화면
- list stack area 화면
- form/field stack area 화면
- accordion/list area 화면
- product hero/detail area 화면
- dynamic area 빈 상태 또는 데이터 의존 화면

## 9. 단계별 작업

### Batch 0. Baseline 고정

목표:

- renderer 구조 변경 전 현재 web preview와 주요 RenderTree fixture의 기준 출력을 남긴다.

작업:

- 현재 web preview 첫 화면 smoke 결과를 기록한다.
- 대표 baseline 화면의 screen id와 주요 layout id를 문서 또는 test fixture에 고정한다.
- renderer layout pattern test에서 padding/gap/sticky/header/bottom 관련 assertion이 충분한지 확인한다.

완료 기준:

- 이후 batch에서 화면 출력이 달라졌을 때 비교할 기준이 있다.
- baseline 기준이 fallback UI에 의존하지 않는다.

### Batch 1. Fallback 의존 테스트 제거

목표:

- renderer test fixture에서 `UnknownLeaf`를 제거한다.
- 실제 catalog에 등록된 component를 사용해 layout wrapper 테스트를 유지한다.

작업:

- `packages/renderer/src/__tests__/layout-pattern-render.test.tsx` fixture 갱신
- unknown leaf fallback에 기대는 assertion 제거
- 필요한 경우 작은 test-only component resolver를 명시적으로 주입

완료 기준:

- fallback renderer를 제거하지 않아도 테스트가 fallback UI에 의존하지 않는다.
- `npx vitest run packages/renderer/src/__tests__/layout-pattern-render.test.tsx` 통과

### Batch 2. Missing policy 도입

목표:

- missing layout/component/primitive 처리 방식을 한 곳으로 모은다.

작업:

- `adapters/missing-policy.tsx` 추가
- 제품 기본 `throwMissingComponent`, `throwMissingPrimitive`, `throwMissingLayout` 추가
- 개발 preview 전용 error surface는 명시 옵션으로만 제공
- `render-tree-view.tsx`의 inline fallback 경로를 missing policy 호출로 교체

완료 기준:

- missing layout이 조용히 unwrap되지 않는다.
- missing component/primitive가 fallback UI로 성공 렌더되지 않는다.

### Batch 3. Resolver 기반 interpreter 작성

목표:

- `render-tree-view.tsx`를 interpreter 파일들로 분해하고 registry 중심 렌더를 resolver 중심 렌더로 바꾼다.

작업:

- `interpreter/RenderTreeView.tsx`
- `interpreter/RenderNodeView.tsx`
- `interpreter/render-node.tsx`
- `interpreter/render-screen.tsx`
- `interpreter/render-layout.tsx`
- `interpreter/render-component.tsx`
- `interpreter/types.ts`

완료 기준:

- `interpreter/*`는 layout-pattern-store, components, component catalog, layout primitives를 직접 import하지 않는다.
- node rendering 흐름은 `resolveLayout`, `resolveComponent`, `renderPrimitive`, `resolveArea` 호출로 표현된다.
- public `RenderTreeView`, `RenderNodeView`, `renderJsonNode` API는 유지하거나 명시적으로 migration한다.

### Batch 4. Adapter 분리

목표:

- 현재 `nodes/default-node-renderers.tsx`의 혼합 책임을 `adapters/`로 분해한다.

작업:

- layout pattern resolve를 `adapters/resolve-layout.ts`로 이동
- component resolve를 `adapters/resolve-component.ts`로 이동
- prop coercion을 `adapters/build-component-props.ts`로 이동
- layout primitive render helper를 `adapters/render-primitive.tsx`로 이동
- area display/data policy를 `adapters/resolve-area.tsx`로 이동
- runtime 조립을 `adapters/create-runtime.ts`에서 수행

완료 기준:

- `default-node-renderers.tsx` 삭제
- `adapters/`만 `@cx/layout-pattern-store`, `@cx/components`, `@cx/components/catalog`, `@cx/layout/primitives`를 import한다.

### Batch 5. Node kind registry 축소

목표:

- unknown node type을 `"fallback"` kind로 변환하지 않고, node kind registry를 정상 렌더 경로에서 제거하거나 최소화한다.

작업:

- `resolveNodeKind()` 반환 타입을 `RenderTreeNodeKind | undefined`로 변경
- interpreter가 component/layout/primitive/area resolver로 해석하지 못한 node를 missing policy로 전달
- registry 기본 계약에서 `fallback` kind 제거
- registry가 꼭 필요하면 test/custom extension 전용으로 격리
- validation에 unknown node type coverage가 충분한지 확인

완료 기준:

- renderer registry에 `"fallback"` kind가 없다.
- 정상 제품 렌더 흐름이 node kind renderer registry에 의존하지 않는다.
- unknown type은 validation 또는 missing policy에서 명확히 실패한다.

### Batch 6. Validation 연결 보강

목표:

- renderer가 실패하기 전에 validation이 계약 위반을 잡도록 보강한다.

검증 대상:

- unknown `node.type`
- unknown component catalog entry
- unknown layout pattern
- layout target mismatch
- layout prop contract mismatch
- component prop contract mismatch

완료 기준:

- renderer fallback 제거 후에도 web preview 입력 데이터가 validation 기준으로 통과한다.
- invalid fixture는 validation에서 실패한다.

### Batch 7. 시각 회귀 smoke

목표:

- resolver 기반 interpreter 전환 후 web preview가 기존 baseline과 같은 구조로 렌더되는지 확인한다.

검증 대상:

- header slot 유지
- contents scroll 영역 유지
- bottom CTA/sticky 영역 유지
- 주요 area layout의 padding/gap 유지
- leaf component title/description/subText 표시 유지
- fallback UI 미사용

완료 기준:

- `npx tsc --noEmit --pretty false` 통과
- `npx vitest run` 통과
- web preview 첫 화면 smoke 통과
- 대표 baseline 화면에서 layout wrapper, spacing, slot 배치가 의도 없이 달라지지 않는다.

### Batch 8. Public surface 정리

목표:

- 외부 소비자가 interpreter와 adapter runtime을 명확히 구분할 수 있게 한다.

예상 export:

```text
@cx/renderer
@cx/renderer/renderer
```

root export:

- `RenderTreeView`
- `RenderNodeView`
- `renderJsonNode`
- RenderTree types

내부 전용:

- `adapters/*`
- `interpreter/*` 상세 파일
- `runtime/*` 상세 파일

완료 기준:

- package export가 현재 공개 표면을 깨지 않거나 migration이 문서화된다.
- 내부 파일 직접 import가 없다.

## 10. 완료 기준

- `@cx/renderer`는 table schema, materializer, validation, AI 실행을 import하지 않는다.
- interpreter core는 layout-pattern-store, components catalog, layout primitives를 직접 import하지 않는다.
- fallback UI는 제품 기본 렌더 경로에서 제거된다.
- unknown node/component/layout은 validation 또는 missing policy에서 명확히 실패한다.
- `npx tsc --noEmit --pretty false` 통과
- `npx vitest run` 통과
- web preview 첫 화면 smoke 확인 통과
- 대표 baseline 화면의 slot, wrapper, spacing, 주요 leaf prop 출력이 유지된다.

## 11. 후속 개선

- web inspection panel에 validation report를 연결한다.
- dev preview 전용 missing error surface를 만든다.
- renderer runtime injection 예제를 README에 추가한다.
- Playwright 기반 앱 smoke test를 추가한다.

## 12. 완료 결과

2026-05-29 구현 완료 상태:

- `@cx/renderer`의 정상 렌더 경로를 resolver 기반 interpreter로 전환했다.
- `interpreter/`가 RenderTree 순회, screen slot, layout wrapping, component rendering 흐름을 담당한다.
- `adapters/`가 layout pattern resolve, component resolve, component prop coercion, layout primitive render, area policy, missing policy를 담당한다.
- `default-node-renderers.tsx`, node kind registry, fallback renderer 경로를 제거했다.
- renderer test fixture에서 `UnknownLeaf` 의존을 제거하고 실제 catalog component로 baseline을 유지했다.
- validation은 layout wrapper가 있더라도 leaf component type이 unknown이면 error로 잡는다.
- web preview 첫 화면 smoke에서 HTTP 200과 기존 screen/header/contents/bottom 렌더를 확인했다.

검증:

- `npx tsc --noEmit --pretty false`
- `npx vitest run`
- `npm run dev -- --hostname 127.0.0.1 --port 3000`
- `curl -sS -L http://127.0.0.1:3000/`
