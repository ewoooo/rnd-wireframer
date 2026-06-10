# Layout 프리셋 역전 계획 (보류 중)

> 상태: **계획 확정 대기 — 보류** (2026-06-10). 다른 우선 작업으로 중단.
> 재개 시 미결정 2건(아래)부터 확정할 것.

## 동기

layout 패키지가 "4줄 팩토리 파일 + 큰 공유 Frame" 구조라 컴포넌트가 컴포넌트처럼 읽히지 않는다.
`ActionStackArea.tsx`를 열면 JSX가 한 줄도 없다:

```tsx
export const ActionStackArea = createPageStackArea(areaPageStackPresets.actionStack.defaults);
```

"무엇을 그리는가"를 알려면 presets 테이블 → Frame → primitive 세 단계를 따라가야 한다.
export zip이 이 소스를 vendoring하므로 **받은 사람이 읽는 코드**이기도 하다.

현황 분포: page-stack 영역 10개(각 4~7줄 → PageStackFrame 93줄), collection 11개(→ CollectionArea 202줄),
general 5개(GeneralArea 194줄), composite 15개(CompositeWrapper 108줄).

## 목표 상태

```
지금:  presets 테이블(수기) ──→ 팩토리 ──→ 컴포넌트          primitive-target도 테이블 파생
                 (SSOT)

목표:  컴포넌트(평문 JSX, 수기) ──[generator]──→ presets.generated.ts ──→ primitive-target
            (SSOT)                                  (산출물, diff guard)
```

- 컴포넌트 파일을 열면 `<PageStack ...>{children}</PageStack>`이 보인다
- `createPageStackArea` 팩토리와 수기 presets 3파일(composites/page-stack/general) 삭제
- primitive-target resolver는 메커니즘 그대로, 테이블 출처만 generated로 교체
- 기존 `sync-layout-catalog`와 같은 패턴: 생성 스크립트 + `.generated.ts` + diff guard

## 핵심 설계 결정: 추출 방식 (미확정)

**방식 1 (권장) — 컴포넌트 파일이 defaults const를 export, generator는 수집만**

```tsx
// ActionStackArea.tsx — 이 파일이 SSOT
export const areaDefaults = { gap: 12, paddingY: 0, titleGap: 0, ...pageStackBaseDefaults } as const;

export function ActionStackArea({ children, className, props = {} }: LayoutPatternComponentProps) {
	const { rows, trailingSection } = resolveDividerContract(props, areaDefaults);
	return withTrailingSectionDivider(
		<PageStack {...resolveAreaPageStackProps(props, areaDefaults)} className={className}>
			{renderChildrenWithDividers(children, rows)}
		</PageStack>,
		trailingSection,
	);
}
```

generator는 layout registry를 순회하며 각 모듈의 `areaDefaults`(균일 이름 컨벤션)를 import해
`presets.generated.ts`로 모은다. 렌더링·AST 파싱 없음 — 깨질 데가 없다.

**방식 2 — JSX 안 순수 리터럴(`<PageStack gap={12}>`) + 렌더 추출**

generator가 컴포넌트를 빈 props로 호출해 element tree를 걸어가며 primitive props를 읽는다.
컴포넌트는 가장 순수하지만, divider 기본값처럼 props로 안 드러나는 값은 센티널 children +
Divider element 유무로 역추론해야 해서 generator가 추출기 수준으로 복잡해진다.

**권장 조합**: 방식 1로 수집(견고) + 방식 2의 element-tree 추출은 generator가 아니라
**drift 가드 테스트**로 사용 — "컴포넌트를 실제 호출하면 generated 테이블의 defaults가
primitive에 정말 전달되는가"를 41개 전부 한 루프로 검증. 골격이 26개 파일에 수동 반복되므로
한 파일만 어긋나게 수정되는 drift를 이 테스트가 잡는다.

## 단계 계획

| 단계 | 내용 | 규모 |
|---|---|---|
| T1 | page-stack 10개 평문 전개: 팩토리 → 위 골격, defaults const 이동. `createPageStackArea` 삭제, `PageStackFrame`은 `resolveAreaPageStackProps` 등 공유 함수만 남기고 축소 | 파일 10 + Frame |
| T2 | composite 15 + general 5 + RegionStack 동일 전개. `CompositeWrapper`/`GeneralArea`의 resolve* 공유 함수는 유지(골격만 펼침) | 파일 21 |
| T3 | generator(`scripts/sync-layout-presets`): registry 순회 → defaults 수집 → `presets.generated.ts` emit + diff guard 테스트. primitive-target가 generated 테이블 소비, 수기 presets 3파일 삭제 | 스크립트 1 + 교체 |
| T4 | drift 가드: element-tree 검증 테스트(컴포넌트 호출 → primitive props ↔ generated defaults 대조), 기존 parity/primitive-target 테스트 통과 확인 | 테스트 |
| T5 (선택) | collection 11개 평문 전개 — 다중 노드 구조라 generated 테이블 대상 아님(named fallback 유지). 가독성 목적만 | 파일 11 |

기존 자산이 작업을 싸게 만든다: divider 정리(커밋 5f0901a4)로 행동이 전부 순수 함수
(`resolveDividerContract`, `resolveAreaPageStackProps`, `renderChildrenWithDividers` 등)로
빠져 있어 **펼쳐도 로직 복제 0**. `deriveFamilyResolvers`의 "canonical 공유 defaults 불일치 시
throw"와 alias-registry-integrity 테스트는 generated 테이블에도 그대로 적용.

## 리스크

- **골격 반복 26개 파일**: 의도된 비용(독자를 위한 DRY). drift는 T4 테스트가 잡음
- **`pageStackBaseDefaults` 공유분**: 파일별 const에서도 base spread 유지 권장 — 완전 리터럴로
  풀면 base 변경 시 10곳 수정
- **컨벤션 강제**: defaults export 이름이 균일해야 수집 가능 — 누락 시 generator throw로 자연 강제

## 재개 시 확정 필요 (미결정 2건)

1. **방식 1(const + 공유 merge) vs 방식 2(순수 리터럴 + 렌더 추출)** — 권장은 방식 1.
   "JSX에 숫자가 직접 박혀야 한다"가 요구사항이면 방식 2
2. **T5(collection 11종) 포함 여부** — 테이블과 무관한 가독성 작업이라 분리/후속 가능
