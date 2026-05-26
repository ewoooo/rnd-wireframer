import { type AreaResolutionInput, createPatternResolver } from "../pattern/pattern-resolver";
import type { AiPatternSelectorResult } from "./ai-pattern-selector";
import type {
	ComposedAreaChildRef,
	ComposedAreaNode,
	ComposedComponentNode,
	ComposedNodeTree,
	ComposedRouteNode,
	ComposedScreenNode,
	ComposedVariantNode,
	DecoratedAreaNode,
	DecoratedComponentNode,
	DecoratedNodeTree,
	DecoratedRouteNode,
	DecoratedScreenNode,
	DecoratedVariantNode,
	PatternRef,
	PatternResolver,
	RegionSlot,
} from "../types";

export interface DecorateRegisteredAssetsOptions {
	resolvePattern?: PatternResolver;
	/**
	 * AI Pattern Selector 결과. 주어진 areaId의 pattern은 deterministic resolver
	 * 결과 대신 이 값으로 대체된다. 없는 areaId는 deterministic을 유지.
	 */
	aiPatternSelections?: AiPatternSelectorResult["selections"];
}

export function decorateRegisteredAssets(
	composed: ComposedNodeTree,
	options: DecorateRegisteredAssetsOptions = {},
): DecoratedNodeTree {
	const resolvePattern = options.resolvePattern ?? createPatternResolver();
	const aiSelections = options.aiPatternSelections;

	// 1) Composer-AI가 만든 synthesized component를 적절한 region/synthetic area에 배치.
	//    이 단계가 끝나면 ComposedNodeTree의 areas/screens.children이 갱신된 상태.
	const placed = placeSynthesizedComponents(composed);

	const components: DecoratedComponentNode[] = (placed.components ?? []).map((component) =>
		attachPattern(component, "component", resolvePattern),
	);
	const componentTypeById = new Map<string, string>();
	for (const component of components) {
		if (component.type) componentTypeById.set(component.id, component.type);
	}

	const areas: DecoratedAreaNode[] = (placed.areas ?? []).map((area) => {
		const decorated = attachAreaPattern(area, componentTypeById, resolvePattern);
		const aiOverride = aiSelections?.get(area.id);
		return aiOverride ? { ...decorated, pattern: aiOverride } : decorated;
	});

	const screens: DecoratedScreenNode[] = placed.screens.map((screen) =>
		attachPattern(screen, "screen", resolvePattern),
	);
	const variants: DecoratedVariantNode[] = placed.variants.map((variant) =>
		attachPattern(variant, "variant", resolvePattern),
	);
	const routes: DecoratedRouteNode[] = placed.routes.map((route) =>
		attachPattern(route, "route", resolvePattern),
	);

	return { routes, variants, screens, areas, components, warnings: [] };
}

/**
 * Composer-AI가 `synthesized: { screenId, region }` 메타와 함께 등록한 component를
 * 해당 screen의 region에 배치한다.
 *
 *   - 동일 screen/region에 대해 idempotent: 같은 synthetic area를 재사용.
 *   - Component가 이미 다른 area에 속해 있다면 placement 생략 (이중 배치 방지).
 *   - 배치 후에도 component의 `synthesized` 메타는 보존 — materialize에서 strip 가능.
 */
function placeSynthesizedComponents(composed: ComposedNodeTree): ComposedNodeTree {
	const components = composed.components ?? [];
	const synthesized = components.filter((c) => c.synthesized);
	if (synthesized.length === 0) return composed;

	const areas: ComposedAreaNode[] = [...(composed.areas ?? [])];
	const screens = composed.screens.map((screen) => ({
		...screen,
		children: {
			header: [...(screen.children.header ?? [])],
			contents: [...(screen.children.contents ?? [])],
			bottom: [...(screen.children.bottom ?? [])],
		},
	}));
	const screenById = new Map(screens.map((s) => [s.id, s]));

	// 이미 어떤 area에 들어가 있는지 추적: 중복 배치 방지
	const componentAreaIndex = new Set<string>();
	for (const area of areas) {
		for (const ref of area.children ?? []) componentAreaIndex.add(ref.componentId);
	}

	for (const component of synthesized) {
		if (componentAreaIndex.has(component.id)) continue;
		const { screenId, region } = component.synthesized!;
		const screen = screenById.get(screenId);
		if (!screen) continue;

		const syntheticAreaId = `synth-${region}-${screenId}`;
		let area = areas.find((a) => a.id === syntheticAreaId);
		if (!area) {
			area = createSyntheticArea(syntheticAreaId, region, screen);
			areas.push(area);
		}

		const childRef: ComposedAreaChildRef = {
			componentId: component.id,
			order: (area.children?.length ?? 0) + 1,
		};
		area.children = [...(area.children ?? []), childRef];
		componentAreaIndex.add(component.id);

		// screen.children[region]에 area ref가 이미 있다면 추가 안 함
		const regionRefs = screen.children[region];
		if (!regionRefs?.some((ref) => ref.areaId === area.id)) {
			screen.children[region] = [
				...(regionRefs ?? []),
				{ areaId: area.id, order: (regionRefs?.length ?? 0) + 1 },
			];
		}
	}

	return { ...composed, screens, areas };
}

function createSyntheticArea(
	id: string,
	region: RegionSlot,
	_screen: ComposedScreenNode,
): ComposedAreaNode {
	// Renderer가 area.name을 라벨로 출력하기 때문에, chrome용 synthetic area는
	// 빈 name으로 두어 라벨 노출을 막는다. id는 디버깅용으로만 사용.
	return {
		level: "area",
		id,
		order: 0,
		name: "",
		layout: "vertical",
		areaType: "static",
		children: [],
	};
}

function attachPattern<
	TLevel extends "route" | "variant" | "screen" | "component",
	TNode extends
		| ComposedRouteNode
		| ComposedVariantNode
		| ComposedScreenNode
		| ComposedComponentNode,
>(node: TNode, level: TLevel, resolvePattern: PatternResolver): TNode & { pattern: PatternRef } {
	const pattern = resolvePattern({ level, node }) ?? fallbackPattern(level);
	return { ...node, pattern };
}

function attachAreaPattern(
	area: ComposedAreaNode,
	componentTypeById: ReadonlyMap<string, string>,
	resolvePattern: PatternResolver,
): DecoratedAreaNode {
	const componentTypes = new Set<string>();
	for (const ref of area.children ?? []) {
		const type = componentTypeById.get(ref.componentId);
		if (type) componentTypes.add(type);
	}
	const resolverInput: AreaResolutionInput = { ...area, __componentTypes: componentTypes };
	const pattern = resolvePattern({ level: "area", node: resolverInput }) ?? fallbackPattern("area");
	return { ...area, pattern };
}

function fallbackPattern(level: string): PatternRef {
	return { id: `${level}-unknown`, variant: "default", reasons: ["no matching pattern"] };
}
