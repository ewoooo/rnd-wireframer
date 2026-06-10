import { render } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { LayoutPatternComponentProps } from "../components/patterns/types";
import { BottomFixedArea, Flex, Grid, HStack, PageStack, VStack } from "../components/primitives";
import { type PrimitiveTarget, resolvePrimitiveTarget } from "../primitive-target";
import {
	ComponentChipFilterComposite,
	ComponentProductInfoComposite,
	CompositeGap0,
	ListStackArea,
} from "../registry.generated";

const PRIMITIVES: Record<PrimitiveTarget["primitive"], ComponentType<Record<string, unknown>>> = {
	BottomFixedArea,
	Flex,
	Grid,
	HStack,
	PageStack,
	VStack,
} as Record<PrimitiveTarget["primitive"], ComponentType<Record<string, unknown>>>;

describe("resolvePrimitiveTarget — composite 패밀리", () => {
	it("defaults 테이블의 gap을 병합해 VStack으로 환원한다", () => {
		expect(resolvePrimitiveTarget("layout.composite.componentFooter", {})).toEqual({
			primitive: "VStack",
			props: { gap: 8 },
		});
	});

	it("flow horizontal defaults는 HStack + style(height)로 환원한다", () => {
		expect(resolvePrimitiveTarget("layout.composite.componentChipFilter", {})).toEqual({
			primitive: "HStack",
			props: { gap: 8, paddingX: 32, style: { height: 57 } },
		});
	});

	it("props.gap > props.componentGap > defaults.gap 순서로 우선한다", () => {
		expect(
			resolvePrimitiveTarget("layout.composite.componentFooter", { componentGap: 4 })?.props.gap,
		).toBe(4);
		expect(
			resolvePrimitiveTarget("layout.composite.componentFooter", { componentGap: 4, gap: 2 })?.props
				.gap,
		).toBe(2);
	});

	it("canonical componentKey를 직접 받아도 동일하게 해석한다", () => {
		expect(resolvePrimitiveTarget("CompositeGap12", {})).toEqual(
			resolvePrimitiveTarget("layout.composite.compositeCouponBenefitCard", {}),
		);
	});
});

describe("resolvePrimitiveTarget — page-stack 패밀리", () => {
	it("preset defaults를 병합해 PageStack으로 환원한다", () => {
		expect(resolvePrimitiveTarget("layout.area.listStack", {})).toEqual({
			primitive: "PageStack",
			props: {
				gap: 8,
				itemPaddingX: 20,
				itemTemplate: "default-20",
				paddingY: 28,
				sectionGap: 8,
				sectionPaddingX: 12,
			},
		});
	});

	it("divider prop은 생략하되 droppedProps로 보고한다", () => {
		const target = resolvePrimitiveTarget("layout.area.fieldStack", { divider: "section" });
		expect(target?.primitive).toBe("PageStack");
		expect(target?.droppedProps).toEqual(["divider"]);
		expect(target?.props).not.toHaveProperty("divider");
	});

	it("divider가 none으로 해석되면 droppedProps가 없다", () => {
		expect(
			resolvePrimitiveTarget("layout.area.listStack", { divider: false })?.droppedProps,
		).toBeUndefined();
	});

	it("preset divider 기본값(contents)도 생략 보고 대상이다", () => {
		expect(resolvePrimitiveTarget("layout.area.plainInfoTextListArea", {})?.droppedProps).toEqual([
			"divider",
		]);
	});
});

describe("resolvePrimitiveTarget — region/general 패밀리", () => {
	it("region은 section VStack으로 환원한다", () => {
		expect(resolvePrimitiveTarget("layout.region.contents", {})).toEqual({
			primitive: "VStack",
			props: { as: "section", gap: 0 },
		});
	});

	it("bottomActionArea는 BottomFixedArea로 환원한다", () => {
		expect(resolvePrimitiveTarget("layout.area.bottomActionArea", {})).toEqual({
			primitive: "BottomFixedArea",
			props: { gap: 0 },
		});
	});

	it("productFooterLegal은 padding defaults + bottomPadding style을 보존한다", () => {
		expect(resolvePrimitiveTarget("layout.area.productFooterLegal", {})).toEqual({
			primitive: "VStack",
			props: { gap: 30, paddingX: 32, paddingY: 32, style: { paddingBottom: 120 } },
		});
	});

	it("areaAppBar는 HStack으로 환원한다", () => {
		expect(resolvePrimitiveTarget("layout.area.areaAppBar", {})).toEqual({
			primitive: "HStack",
			props: { gap: 0 },
		});
	});
});

describe("resolvePrimitiveTarget — 미매핑은 undefined (named fallback)", () => {
	it.each([
		"layout.area.rowCardListArea",
		"layout.area.hiddenTitlePagestackCardListArea",
		"layout.area.productOptionGrid",
		"layout.screen.mobileScreen",
		"layout.area.doesNotExist",
	])("%s → undefined", (layoutId) => {
		expect(resolvePrimitiveTarget(layoutId, {})).toBeUndefined();
	});
});

// --- 런타임 일치 가드: 실제 canonical 컴포넌트 render와 target primitive render의 구조 동등성 ---

function renderTargetRoot(target: PrimitiveTarget, children: ReactNode): HTMLElement {
	const Primitive = PRIMITIVES[target.primitive];
	const { container } = render(<Primitive {...target.props}>{children}</Primitive>);
	return container.firstElementChild as HTMLElement;
}

function renderPatternRoot(
	Pattern: ComponentType<LayoutPatternComponentProps>,
	props: Record<string, unknown>,
	children: ReactNode,
): HTMLElement {
	const { container } = render(
		<Pattern metadata={{ id: "guard" }} props={props}>
			{children}
		</Pattern>,
	);
	return container.firstElementChild as HTMLElement;
}

/** 비교 대상은 시각 구조(태그/클래스/스타일)다. data-node-* 배관은 의도적으로 제외. */
function structureOf(element: HTMLElement) {
	return {
		className: element.className,
		style: element.getAttribute("style") ?? "",
		tag: element.tagName,
	};
}

describe("런타임 일치 가드 — canonical render ↔ target primitive render", () => {
	const guardCases: [
		string,
		ComponentType<LayoutPatternComponentProps>,
		Record<string, unknown>,
	][] = [
		["layout.composite.componentAppBar", CompositeGap0, {}],
		["layout.composite.componentChipFilter", ComponentChipFilterComposite, {}],
		["layout.composite.componentProductInfo", ComponentProductInfoComposite, { gap: 20 }],
	];

	it.each(guardCases)("%s 구조 동등", (layoutId, Pattern, props) => {
		const target = resolvePrimitiveTarget(layoutId, props);
		expect(target).toBeDefined();
		if (!target) return;

		const child = <span>guard</span>;
		expect(structureOf(renderTargetRoot(target, child))).toEqual(
			structureOf(renderPatternRoot(Pattern, props, child)),
		);
	});

	it("page-stack: ListStackArea(divider 없음) ↔ PageStack target 구조 동등(내부 스택 포함)", () => {
		const target = resolvePrimitiveTarget("layout.area.listStack", {});
		expect(target).toBeDefined();
		if (!target) return;

		const child = <span>row</span>;
		const patternRoot = renderPatternRoot(ListStackArea, {}, child);
		const targetRoot = renderTargetRoot(target, child);

		expect(structureOf(targetRoot)).toEqual(structureOf(patternRoot));
		expect(structureOf(targetRoot.firstElementChild as HTMLElement)).toEqual(
			structureOf(patternRoot.firstElementChild as HTMLElement),
		);
	});
});
