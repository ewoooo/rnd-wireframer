# 컴포넌트 프로모션 사이클 구현 계획

> **For agentic workers:** TDD, task 단위 red→green→commit. 척추(워크플로) 설계 + RadioGroup으로 end-to-end 동시 검증. candidate 메타는 `candidate-entries.ts`(코드)에 영속.

**Goal:** component-proposal(비반영 메모)을 "사용 가능한 candidate 컴포넌트"로 만드는 반복 가능한 워크플로를 닫고, RadioGroup으로 실제 검증한다 — PU-003에서 AI가 RadioGroup을 써서 휴대폰/PASS/공동인증서 3옵션을 렌더하게.

**Architecture:** candidate는 `candidateCatalogEntries`(코드)에 등록되면 `registry.ts`가 stable과 병합 → generation 팔레트(allowedRefs)에 자동 노출(이미 동작). 빠진 고리는 ① proposal 수집·backlog ② React 구현(수동, 불가피) ③ candidate 사용 출력 flag ④ promote(candidate→stable). RadioGroup이 첫 walkthrough.

**Tech Stack:** TypeScript, `@cx/component`/`@cx/components`(catalog+React), `@cx/renderer`, `@cx/validation`, `@cx/orchestration`(guidance), `apps/smoke`(aggregate CLI), vitest, biome.

---

## 1. 프로모션 사이클 척추 (워크플로 6단계)

| # | 단계 | 자동화 | 산출/소유 |
|---|---|---|---|
| 1 | **Aggregate** — 모든 run의 `component-proposal.json` 수집·dedup(proposedComponentType)·빈도+evidence 랭킹 | ✅ CLI | proposal backlog (우선순위) |
| 2 | **Scaffold** — 선택 proposal → candidate entry 초안(suggestedProps→prop 계약 draft) | ✅ 헬퍼(출력) | 사람이 붙여넣을 entry 초안 |
| 3 | **Implement** — React 컴포넌트 + barrel export (+필요시 renderer 배선) | ❌ 수동/agent | `*.tsx` + `index.ts` |
| 4 | **Expose** — candidate entry가 generation 팔레트에 노출 | ✅ 이미 됨(registry 병합) | allowedRefs 포함 |
| 5 | **Flag** — final-result가 candidate 컴포넌트 사용 시 warning | ✅ validation 규칙 | `uses-candidate-component` |
| 6 | **Promote** — 검증되면 candidate→stable (entry 이동) | ✅ 헬퍼 + `promoteEntry` | stable catalog |

핵심 제약(명시): **3번(React 구현)은 자동 생성 불가** — renderer가 실제 컴포넌트를 요구(오늘 Radio 크래시로 확인). 사이클은 3번을 "사람/agent가 구현하는 명시적 게이트"로 두고 나머지를 자동화한다.

## 2. 기대 효과

- **"알지만 못 쓴다" 해소.** proposal RadioGroup이 backlog→구현→팔레트→AI 사용으로 닫힘. PU-003의 PASS/공동인증서 누락(quality finding #6)이 실제로 메워짐.
- **catalog가 사용 신호로 진화.** aggregate가 "RadioGroup이 N개 화면에서 제안됨"을 보여줘 보강 우선순위를 데이터로 결정. 오늘처럼 수동 추측으로 catalog 고치는 의존 감소.
- **candidate 안전 노출.** flag로 "불안정 컴포넌트 사용" 출력이 표시되니, 검증 전에도 generation에 노출하되 추적 가능. 검증되면 promote로 stable 승격.
- **재현 가능한 절차.** 다음 컴포넌트(TextFieldWithTimer 등)도 같은 6단계로.

## 3. 성공 기준

척추(기능):
- `aggregate-proposals` CLI가 run들의 proposal을 모아 proposedComponentType별 dedup + 빈도 랭킹을 출력. (RadioGroup이 backlog 상위에 나타남)
- candidate entry가 `candidateCatalogEntries`에 있으면 generation `componentContractCatalog.allowedRefs`에 포함된다(단위 검증).
- validation: final-result가 status `candidate` 컴포넌트를 쓰면 `uses-candidate-component` **warning**(error 아님, 파이프라인 안 막음).
- promote 헬퍼가 candidate entry를 stable로 옮긴 뒤 status가 `stable`로 바뀐다(단위 검증, `promoteEntry` 기반).

RadioGroup end-to-end:
- `RadioGroup` 컴포넌트가 `options[]`+`selectedValue`로 N개 radio 행 렌더(단위 테스트, 크래시 없음).
- candidate entry 등록 → generation allowedRefs에 `RadioGroup` 포함.
- interaction-state 번들 규칙: "다중 옵션 단일 선택은 RadioGroup(options 배열), 단일 Radio 반복 금지".
- real `--use-ai`로 PU-003 재생성 → final-result에 RadioGroup 노드(options=[휴대폰 본인인증, PASS, 공동인증서]) 등장, 3옵션 렌더, fidelity finding #6 해소.
- validation에 `uses-candidate-component` warning 1건(RadioGroup), error 0.

검증 명령:
- `bunx tsc -p tsconfig.json --noEmit` exit 0.
- `npx vitest run packages/component packages/renderer packages/validation packages/orchestration apps/smoke` green.
- `npx biome lint <changed>` clean.

## 4. 예상 시스템 변동성 (blast radius)

**변경 파일:**
- `packages/component/src/components/RadioGroup/RadioGroup.tsx` (신규) + `index.ts` barrel export
- `packages/component/src/internal/candidate-entries.ts` — RadioGroup candidate entry
- `packages/renderer/src/__tests__/layout-pattern-render.test.tsx` — RadioGroup 렌더 테스트
- `packages/validation/src/public/validators.ts` + `types.ts` — `uses-candidate-component` 규칙/코드 + 테스트
- `packages/agent/docs/design-context/interaction-state.md` — RadioGroup 규칙
- `apps/smoke/src/aggregate-proposals-cli.ts` (신규) + `apps/smoke/src/proposal-aggregation/*` (순수 로직 + 테스트)
- (promote) `apps/smoke/src/promote-component-cli.ts` 또는 기존 mutations 활용 헬퍼

**동작 변동:**
- **generation 팔레트 확장.** candidate RadioGroup이 allowedRefs에 들어가 AI가 multi-option 화면에서 선택 가능 → 일부 화면의 RenderTree가 달라질 수 있음(의도된 개선). single Radio 화면은 영향 적음.
- **validation에 warning 추가.** candidate 사용 시 warning 1건↑. error 아니므로 ok 상태/파이프라인 불변. 단 `buildGenerationNextAction`의 "warning만 있으면 human-review" 경로가 candidate 사용만으로 트리거될 수 있음 → 완화: 이 규칙은 info/warning 중 **warning**으로 두되, next-action이 candidate-warning을 human-review 트리거에서 제외할지 검토(아래 위험 참고).
- **하위호환.** candidateCatalogEntries가 비어있던 상태→RadioGroup 1개 추가. 기존 stable 컴포넌트·기존 run 무영향.

**위험 & 완화:**
- *candidate 메타만 있고 React 구현 누락 → 크래시*(오늘 Radio 그 자체) → **순서 강제**: entry 등록(Task 3a) 전에 컴포넌트+barrel(Task 3b)을 먼저. 둘을 한 task로 묶어 "구현 없는 candidate 노출" 금지. + Flag 규칙과 별개로, validation의 기존 `unknown-component-type`/renderer parity가 누락을 잡도록.
- *candidate warning이 next-action을 human-review로 흘림* → next-action에서 `uses-candidate-component`는 "정상 운영 신호"라 human-review 트리거 대상에서 제외(코드명으로 필터). 안 그러면 candidate 쓰는 모든 화면이 human-review로 빠짐.
- *AI가 source 노트에서 옵션 추출 실패* → guidance에 "options를 source note의 나열에서 추출(휴대폰→PASS→공동인증서)" 명시. proposal evidence가 이미 옵션을 식별했으므로 가능성 높음.
- *옆 세션 validators.ts/test 겹침* → 규칙 추가는 additive(새 함수+코드), 기존 케이스 무변. 커밋 직후 충돌 확인.
- *promote가 코드 이동이라 수동성* → candidate→stable은 entry를 candidate-entries.ts에서 component-entries.ts로 옮기는 코드 편집. 헬퍼는 "무엇을 옮길지" 안내 + `promoteEntry` 순수 검증. 완전 자동 파일 이동은 범위 밖.

## 5. File Structure

```
packages/component/src/components/RadioGroup/RadioGroup.tsx   (신규: options→N ListSelected radio)
packages/component/src/index.ts                              (barrel export 추가)
packages/component/src/internal/candidate-entries.ts         (RadioGroup candidate entry)
packages/renderer/src/__tests__/layout-pattern-render.test.tsx (렌더 테스트)
packages/validation/src/public/{validators,types}.ts        (uses-candidate-component)
packages/validation/src/__tests__/validators.test.ts        (테스트)
packages/agent/docs/design-context/interaction-state.md     (RadioGroup 규칙)
apps/smoke/src/proposal-aggregation/{aggregate,types}.ts     (순수 수집·랭킹)
apps/smoke/src/proposal-aggregation/aggregate.test.ts
apps/smoke/src/aggregate-proposals-cli.ts                    (CLI)
```

---

## Task 1: RadioGroup 컴포넌트 + barrel (TDD)

**Files:** Create `packages/component/src/components/RadioGroup/RadioGroup.tsx`; Modify `packages/component/src/index.ts`; Test `packages/renderer/src/__tests__/layout-pattern-render.test.tsx`

- [ ] **Step 1: 실패 테스트** (렌더러 테스트에 추가)

```tsx
it("renders a RadioGroup node as one selectable row per option", () => {
	render(
		<RenderNodeView
			node={{
				type: "RadioGroup",
				componentVersion: "0.1.0",
				metadata: { id: "rg-1", title: "인증수단" },
				props: { options: ["휴대폰 본인인증", "PASS", "공동인증서"], selectedValue: "휴대폰 본인인증" },
			}}
		/>,
	);
	expect(screen.getByText("휴대폰 본인인증")).toBeInTheDocument();
	expect(screen.getByText("PASS")).toBeInTheDocument();
	expect(screen.getByText("공동인증서")).toBeInTheDocument();
});
```

- [ ] **Step 2: red** — `npx vitest run packages/renderer -t "RadioGroup"` → FAIL(Unknown component type 'RadioGroup').

- [ ] **Step 3: 컴포넌트 구현** — `RadioGroup.tsx`

```tsx
import { ListSelected } from "../ListSelected/ListSelected";

interface RadioGroupProps {
	options?: string[];
	selectedValue?: string;
	label?: string;
}

export function RadioGroup({ options = [], selectedValue }: RadioGroupProps) {
	return (
		<div className="flex flex-col">
			{options.map((option) => (
				<ListSelected
					key={option}
					type="radio"
					label={option}
					checked={option === selectedValue}
					showButton={false}
					showPrice={false}
				/>
			))}
		</div>
	);
}
```

- [ ] **Step 4: barrel export** — `packages/component/src/index.ts`에 추가(알파벳 위치):

```ts
export { RadioGroup } from "./components/RadioGroup/RadioGroup";
```

- [ ] **Step 5: green** — `npx vitest run packages/renderer` PASS. (resolveComponentByType이 barrel에서 RadioGroup 찾음 — 별도 renderer 배선 불필요)

- [ ] **Step 6: commit** — `feat(component): add RadioGroup (options array of radio rows)`

## Task 2: RadioGroup candidate catalog entry (Expose)

**Files:** Modify `packages/component/src/internal/candidate-entries.ts`

- [ ] **Step 1: candidate entry 추가**

```ts
import type { ComponentCatalog } from "../public/types";

export const candidateCatalogEntries = {
	RadioGroup: {
		type: "RadioGroup",
		source: "react-component",
		version: "1.0.0",
		aliases: ["radio-group"],
		props: {
			options: { type: "array", role: "data" },
			selectedValue: { type: "string", role: "value" },
			label: { type: "string", role: "label" },
		},
	},
} as const satisfies ComponentCatalog;
```

- [ ] **Step 2: 노출 검증 테스트** (orchestration 또는 component 테스트) — generation allowedRefs에 RadioGroup 포함, status candidate.

```ts
// component catalog: RadioGroup이 candidate status로 조회됨
import { getComponentCatalogEntry } from "@cx/components/catalog";
expect(getComponentCatalogEntry("RadioGroup")?.type).toBe("RadioGroup");
```

- [ ] **Step 3: tsc + green** — `bunx tsc -p tsconfig.json --noEmit && npx vitest run packages/component`

- [ ] **Step 4: commit** — `feat(component): register RadioGroup as candidate catalog entry`

## Task 3: uses-candidate-component validation flag (TDD)

**Files:** Modify `packages/validation/src/public/{validators,types}.ts`; Test `packages/validation/src/__tests__/validators.test.ts`

- [ ] **Step 1: 타입 코드 추가** — `types.ts` `ValidationIssueCode`에 `"uses-candidate-component"` 추가.

- [ ] **Step 2: 실패 테스트** — render tree에 candidate 컴포넌트(RadioGroup) 노드 → warning 1건.

```ts
it("flags use of a candidate-status component as a warning", () => {
	const report = validateRenderTree(treeWith("RadioGroup"), { componentCatalog });
	const issue = report.issues.find((i) => i.code === "uses-candidate-component");
	expect(issue?.severity).toBe("warning");
	expect(report.ok).toBe(true); // warning은 ok를 깨지 않음
});
```

- [ ] **Step 3: 구현** — validateRenderTree 순회에서 각 component 노드의 catalog entry status가 `"candidate"`면 warning 추가(기존 `findCatalogEntry` 활용).

- [ ] **Step 4: green** — `npx vitest run packages/validation`

- [ ] **Step 5: next-action 보호** — `packages/orchestration/src/public/next-action.ts`에서 `uses-candidate-component` warning은 human-review 트리거 집계에서 제외(정상 운영 신호). 테스트 1건 추가.

- [ ] **Step 6: commit** — `feat(validation): flag candidate-component usage as bounded warning`

## Task 4: RadioGroup guidance (interaction-state)

**Files:** Modify `packages/agent/docs/design-context/interaction-state.md`

- [ ] **Step 1: 폼 조합/선택 규칙에 추가**

```md
- 다중 옵션 단일 선택(예: 인증수단 휴대폰/PASS/공동인증서)은 `RadioGroup`(props.options 배열 + selectedValue)으로 표현한다. 단일 `Radio`를 옵션 수만큼 나열하거나, 옵션이 source 노트에만 있다고 1개만 렌더하지 않는다. options는 source의 나열(순서=A → B → C)에서 추출한다.
```

- [ ] **Step 2: commit** — `docs(design-context): use RadioGroup for multi-option single-select`

## Task 5: aggregate-proposals 척추 (TDD)

**Files:** Create `apps/smoke/src/proposal-aggregation/{types,aggregate}.ts` + `aggregate.test.ts` + `apps/smoke/src/aggregate-proposals-cli.ts`

- [ ] **Step 1: 순수 집계 함수 테스트** — proposal 배열 입력 → proposedComponentType별 dedup + count + evidence 합집합, count 내림차순.

```ts
const backlog = aggregateProposals([
	{ proposals: [{ proposedComponentType: "RadioGroup", sourceEvidence: ["A"], nearestCatalogMatch: "Radio", rationale: "" }] },
	{ proposals: [{ proposedComponentType: "RadioGroup", sourceEvidence: ["B"], nearestCatalogMatch: "Radio", rationale: "" }] },
]);
expect(backlog[0]).toMatchObject({ proposedComponentType: "RadioGroup", count: 2 });
expect(backlog[0].evidence.sort()).toEqual(["A", "B"]);
```

- [ ] **Step 2: 구현** — 순수 reduce. run artifact 읽기는 CLI가 담당(IO 분리).

- [ ] **Step 3: CLI** — `aggregate-proposals-cli.ts`: `data/runs/screen-generation/*/artifacts/component-proposal.json` glob 읽어 `aggregateProposals` 호출, 표 출력. 루트 스크립트 `smoke:proposals` 선택.

- [ ] **Step 4: green + 실제 실행** — `npx vitest run apps/smoke`; `npx tsx apps/smoke/src/aggregate-proposals-cli.ts` → RadioGroup 등 backlog 출력 확인.

- [ ] **Step 5: commit** — `feat(smoke): aggregate component proposals into a ranked backlog`

## Task 6: promote 헬퍼 (candidate→stable)

**Files:** Create `apps/smoke/src/promote-component-cli.ts` (또는 mutations 기반 검증 헬퍼)

- [ ] **Step 1: promote 검증** — 대상 type이 candidate인지 `promoteEntry`로 확인하고, "candidate-entries.ts에서 제거 → component-entries.ts에 추가" 가이드(diff/지시) 출력. 완전 자동 파일 이동은 범위 밖(코드 영속이라 사람 확인).
- [ ] **Step 2: commit** — `feat(smoke): add component promotion helper (candidate->stable)`

## Task 7: RadioGroup end-to-end 검증 (real --use-ai)

- [ ] **Step 1: PU-003 재생성** — `npx tsx apps/smoke/src/cli.ts --target "data/client-imports/{id}/260528_mbr/NOVA-MBR-PU-003-0.md" --use-ai --run-id mbr-base-ai-NOVA-MBR-PU-003-0`
- [ ] **Step 2: 검증** — final-result에 `RadioGroup` 노드(options 3개) 존재, web에서 3옵션 렌더, validation `uses-candidate-component` warning 1건·error 0, quality finding #6(RadioOptionsUnderRepresented) 사라짐.
- [ ] **Step 3: (선택) promote** — 검증 통과 시 Task 6 헬퍼로 RadioGroup을 stable 승격(별도 커밋).

---

## Out of scope (다음)
- 품질 루프(점수 기반 표적 revision) — 별도 plan 존재.
- 완전 자동 candidate 파일 이동/코드 생성(React 구현 자동화).
- proposal→candidate prop 계약 자동 정합(현재는 초안 + 사람 정제).
- 다른 proposal(TextFieldWithTimer 등) 구현 — 같은 6단계로 후속.
