import { canonicalizeLayout } from "./canonicalize-catalog";
import { layoutAlias } from "./catalog.alias";
import {
	resolveAppBarAreaProps,
	resolveBottomActionAreaProps,
	resolveHeroAreaProps,
	resolvePlainStackAreaProps,
} from "./components/areas/general/GeneralArea";
import { generalAreaPresets } from "./components/areas/general/presets";
import {
	type AreaPageStackDefaults,
	resolveAreaPageStackProps,
} from "./components/areas/page-stack/PageStackFrame";
import { areaPageStackPresets } from "./components/areas/page-stack/presets";
import {
	type CompositeWrapperDefaults,
	resolveCompositeFlow,
	resolveCompositeStackLayout,
	resolveCompositeStyle,
} from "./components/composites/CompositeWrapper";
import { compositeDefaults } from "./components/composites/presets";
import { resolveDividerContract } from "./components/patterns/shared/divider";
import { regionStackDefaults, resolveRegionStackProps } from "./components/regions/RegionStack";

/**
 * TSX export unwrap용 primitive-target resolver.
 *
 * layoutId(또는 canonical componentKey) + 노드 props → 단일 @cx/layout primitive 표현.
 * defaults는 component-land 테이블(composites/presets, page-stack/presets, general/presets,
 * regionStackDefaults)을 import해서 파생한다 — 값 복제 금지, 단일 진실원.
 * 단일 primitive로 표현 불가한 패밀리(collection 전체, MobileScreen)는 undefined를 반환해
 * 호출자가 named registry 컴포넌트로 fallback하게 한다.
 */
export type PrimitiveTargetName =
	| "BottomFixedArea"
	| "Flex"
	| "Grid"
	| "HStack"
	| "PageStack"
	| "VStack";

export type PrimitiveTarget = {
	primitive: PrimitiveTargetName;
	/** primitive에 그대로 전달할 props (node/metadata 배관 제외, 직렬화 가능한 값만). */
	props: Record<string, unknown>;
	/** primitive가 표현하지 못해 생략한 prop 이름 — export warning 1줄용. */
	droppedProps?: string[];
	/** divider:"contents" — 자식 행 사이 <Divider type="contents" /> 삽입 의미(경계는 호출자가 계산). */
	rowDivider?: true;
	/** divider:"section"(레거시 sectionDivider 포함) — primitive 뒤 형제로 <Divider type="section" />. */
	trailingSectionDivider?: true;
};

type TargetResolver = (props: Record<string, unknown>) => PrimitiveTarget;

/**
 * canonical componentKey 또는 layoutId(canonicalize 내부 수행) → primitive 표현.
 * 단일 primitive로 표현 불가(중첩/슬롯/bespoke)면 undefined.
 */
export function resolvePrimitiveTarget(
	layoutId: string,
	props: Record<string, unknown> = {},
): PrimitiveTarget | undefined {
	const componentKey = canonicalizeLayout(layoutId) ?? layoutId;
	return TARGET_RESOLVERS[componentKey]?.(props);
}

/** resolver가 단일 primitive로 표현하는 canonical componentKey 목록(테스트/리포트용). */
export function listPrimitiveTargetKeys(): string[] {
	return Object.keys(TARGET_RESOLVERS).sort((a, b) => a.localeCompare(b));
}

// --- composite 패밀리: CompositeWrapper(flow→HStack/VStack + 스택/스타일 병합)의 순수 거울 ---

function compositeTarget(
	props: Record<string, unknown>,
	defaults: CompositeWrapperDefaults,
): PrimitiveTarget {
	const flow = resolveCompositeFlow(props, defaults);
	return {
		primitive: flow === "horizontal" ? "HStack" : "VStack",
		props: compactProps({
			...resolveCompositeStackLayout(props, defaults),
			style: resolveCompositeStyle(props, defaults),
		}),
	};
}

// --- page-stack 패밀리: AreaPageStackFrame → PageStack. divider 의미는 계약 필드로 노출 ---

function pageStackTarget(
	props: Record<string, unknown>,
	defaults: AreaPageStackDefaults,
): PrimitiveTarget {
	const { rows, trailingSection } = resolveDividerContract(props, defaults);

	return {
		primitive: "PageStack",
		props: compactProps(resolveAreaPageStackProps(props, defaults)),
		...(rows ? { rowDivider: true as const } : {}),
		...(trailingSection ? { trailingSectionDivider: true as const } : {}),
	};
}

/**
 * alias 테이블 × defaults 테이블에서 canonical componentKey → resolver를 파생한다.
 * 한 canonical을 공유하는 layoutId들의 defaults가 갈리면 단일 표현이 불가능하므로 로드 시 실패.
 */
function deriveFamilyResolvers<Defaults>(input: {
	family: string;
	defaultsOf: (presetKey: string) => Defaults | undefined;
	toResolver: (defaults: Defaults) => TargetResolver;
}): Record<string, TargetResolver> {
	const prefix = `layout.${input.family}.`;
	const byCanonical = new Map<string, Defaults>();

	for (const [layoutId, componentKey] of Object.entries(layoutAlias)) {
		if (!layoutId.startsWith(prefix)) continue;
		const defaults = input.defaultsOf(layoutId.slice(prefix.length));
		if (defaults === undefined) continue;

		const existing = byCanonical.get(componentKey);
		if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(defaults)) {
			throw new Error(
				`primitive-target: canonical "${componentKey}"를 공유하는 ${input.family} defaults 불일치 (${layoutId})`,
			);
		}
		byCanonical.set(componentKey, defaults);
	}

	return Object.fromEntries(
		[...byCanonical].map(([componentKey, defaults]) => [componentKey, input.toResolver(defaults)]),
	);
}

// --- general area 패밀리: 단일 primitive로 표현 가능한 5종. canonical .tsx와 같은 preset 사용 ---

const GENERAL_AREA_RESOLVERS: Record<string, TargetResolver> = {
	AreaAppBarArea: (props) => ({
		primitive: "HStack",
		props: compactProps(resolveAppBarAreaProps(props, generalAreaPresets.areaAppBar)),
	}),
	AreaVerticalArea: (props) => ({
		primitive: "VStack",
		props: compactProps(resolvePlainStackAreaProps(props, generalAreaPresets.areaVertical)),
	}),
	BottomActionArea: (props) => ({
		primitive: "BottomFixedArea",
		props: compactProps(resolveBottomActionAreaProps(props, generalAreaPresets.bottomActionArea)),
	}),
	ProductFooterLegalArea: (props) => ({
		primitive: "VStack",
		props: compactProps(resolvePlainStackAreaProps(props, generalAreaPresets.productFooterLegal)),
	}),
	ProductHeroSummaryArea: (props) => ({
		primitive: "VStack",
		props: compactProps(resolveHeroAreaProps(props, generalAreaPresets.productHeroSummary)),
	}),
};

// --- 디스패치 테이블 (componentKey → resolver). collection/MobileScreen은 의도적으로 없음 ---

const TARGET_RESOLVERS: Record<string, TargetResolver> = {
	...deriveFamilyResolvers({
		family: "composite",
		defaultsOf: (presetKey) => compositeDefaults[presetKey as keyof typeof compositeDefaults],
		toResolver: (defaults) => (props) => compositeTarget(props, defaults),
	}),
	...deriveFamilyResolvers({
		family: "area",
		defaultsOf: (presetKey) =>
			areaPageStackPresets[presetKey as keyof typeof areaPageStackPresets]?.defaults,
		toResolver: (defaults) => (props) => pageStackTarget(props, defaults),
	}),
	...GENERAL_AREA_RESOLVERS,
	PlainStackRegion: (props) => ({
		primitive: "VStack",
		props: compactProps(resolveRegionStackProps(props, regionStackDefaults)),
	}),
};

function compactProps(props: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined));
}
