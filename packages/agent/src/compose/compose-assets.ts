import { getComponentCatalogEntry } from "@cx/renderer";
import { normalizeComponentType } from "../normalize-component-type";
import type {
	ComponentRawInput,
	ComposedComponentNode,
	ComposedNodeTree,
	ComposedAreaNode,
	ComposedRouteNode,
	ComposedScreenNode,
	ComposedVariantNode,
	RegisteredComponentNode,
	RegisteredNodeTree,
	RegisteredScreenNode,
	RegisteredScreenAreaRef,
	RegisteredVariantNode,
	ScreenAreaRefInput,
} from "../types";

// 우선순위: 본문(content) > 라벨(label) > 제목(title)
const PRIMARY_TEXT_ROLE_PRIORITY = ["content", "label", "title"] as const;

export const PENDING_VALUE = "__pending__";

export interface ComposeAssetContentsOptions {
	now?: () => string;
}

export interface ComposeAssetContentsResult {
	composed: ComposedNodeTree;
	filledComponentIds: string[];
	inheritedEdgeScreenIds: string[];
	strippedComponentRawIds: string[];
	skipped: Array<{ componentId: string; reason: string }>;
	warnings: string[];
}

export function composeAssetContents(
	registered: RegisteredNodeTree,
	_options: ComposeAssetContentsOptions = {},
): ComposeAssetContentsResult {
	const filledComponentIds: string[] = [];
	const strippedComponentRawIds: string[] = [];
	const inheritedEdgeScreenIds: string[] = [];
	const skipped: Array<{ componentId: string; reason: string }> = [];
	const warnings: string[] = [];

	const components = registered.components.map((component) =>
		composeComponent(component, filledComponentIds, strippedComponentRawIds, skipped),
	);
	const componentById = new Map(components.map((component) => [component.id, component]));
	const areas = registered.areas.map((area) =>
		composeArea(area, componentById, warnings),
	);
	const areaById = new Map(areas.map((area) => [area.id, area]));

	const routes: ComposedRouteNode[] = [];
	const variants: ComposedVariantNode[] = [];
	const screens: ComposedScreenNode[] = [];

	for (const route of registered.routes) {
		routes.push({
			id: route.id,
			name: route.name,
			order: route.order,
			...(route.description ? { description: route.description } : {}),
			children: route.variants.map((variant) => ({
				variantId: variant.id,
				order: variant.order,
			})),
		});

		for (const variant of route.variants) {
			variants.push({
				id: variant.id,
				name: variant.name,
				order: variant.order,
				...(variant.description ? { description: variant.description } : {}),
				routeId: route.id,
				children: variant.screens.map((screen) => ({
					screenId: screen.id,
					order: screen.order,
				})),
			});

			for (const screen of composeVariantScreens(variant, inheritedEdgeScreenIds)) {
				screens.push(composeScreen(screen, variant.id, areaById, warnings));
			}
		}
	}

	return {
		composed: {
			routes,
			variants,
			screens,
			areas,
			components,
		},
		filledComponentIds,
		inheritedEdgeScreenIds,
		strippedComponentRawIds,
		skipped,
		warnings,
	};
}

function composeComponent(
	component: RegisteredComponentNode,
	filledComponentIds: string[],
	strippedComponentRawIds: string[],
	skipped: Array<{ componentId: string; reason: string }>,
): ComposedComponentNode {
	const existing = component.props ?? {};
	const raw = component.raw;
	const type = normalizeComponentType(component.type);
	const synthesized = Object.keys(existing).length > 0 || !raw ? {} : synthesizePropsFromRaw(raw);
	const hooks = raw?.hooks ?? [];

	if (!raw && Object.keys(existing).length === 0) {
		skipped.push({ componentId: component.id, reason: "no raw" });
	}
	if (
		raw &&
		Object.keys(existing).length === 0 &&
		Object.keys(synthesized).length === 0 &&
		!hasKnownTextContract(type)
	) {
		skipped.push({ componentId: component.id, reason: "raw insufficient" });
	}
	if (Object.keys(synthesized).length > 0) {
		filledComponentIds.push(component.id);
	}
	if (raw) {
		strippedComponentRawIds.push(component.id);
	}

	return {
		id: component.id,
		name: component.name,
		order: component.order,
		...(component.description ? { description: component.description } : {}),
		type,
		...(component.policyID ? { policyID: component.policyID } : {}),
		props: { ...existing, ...synthesized },
		...(hooks.length > 0 ? { hooks } : {}),
	};
}

function composeArea(
	area: RegisteredNodeTree["areas"][number],
	componentById: Map<string, ComposedComponentNode>,
	warnings: string[],
): ComposedAreaNode {
	for (const ref of area.children) {
		if (!componentById.has(ref.componentId)) {
			warnings.push(`Missing composed component: ${ref.componentId}`);
		}
	}

	return {
		level: "area",
		id: area.id,
		name: area.name,
		order: area.order,
		...(area.description ? { description: area.description } : {}),
		...(area.layout ? { layout: area.layout } : {}),
		children: area.children.map((ref) => ({
			componentId: ref.componentId,
			order: ref.order,
		})),
	};
}

function composeVariantScreens(
	variant: RegisteredVariantNode,
	inheritedEdgeScreenIds: string[],
): RegisteredScreenNode[] {
	const main = findMainScreen(variant.screens);
	if (!main?.areas || main.areas.length === 0) return variant.screens;

	return variant.screens.map((screen) => {
		if (screen.id === main.id || screen.areas.length > 0) return screen;
		inheritedEdgeScreenIds.push(screen.id);
		return {
			...screen,
			areas: main.areas.map((ref) => ({ ...ref })),
		};
	});
}

function composeScreen(
	screen: RegisteredScreenNode,
	variantId: string,
	areaById: Map<string, ComposedAreaNode>,
	warnings: string[],
): ComposedScreenNode {
	const regions = partitionScreenAreas(screen.areas);
	for (const ref of screen.areas) {
		if (!areaById.has(ref.areaId)) {
			warnings.push(`Missing composed area: ${ref.areaId}`);
		}
	}

	return {
		id: screen.id,
		name: screen.name,
		order: screen.order,
		...(screen.description ? { description: screen.description } : {}),
		variantId,
		...(screen.surface ? { surface: screen.surface } : {}),
		children: regions,
	};
}

/**
 * Register가 결정한 ref.slot으로 bucketing. 휴리스틱 없음.
 */
function partitionScreenAreas(refs: RegisteredScreenAreaRef[]) {
	const header: ScreenAreaRefInput[] = [];
	const contents: ScreenAreaRefInput[] = [];
	const bottom: ScreenAreaRefInput[] = [];

	for (const ref of refs) {
		const child = { areaId: ref.areaId, order: ref.order };
		const slot = ref.slot ?? "contents";
		if (slot === "header") header.push(child);
		else if (slot === "bottom") bottom.push(child);
		else contents.push(child);
	}

	return {
		...(header.length > 0 ? { header } : {}),
		contents,
		...(bottom.length > 0 ? { bottom } : {}),
	};
}

function findMainScreen(screens: RegisteredScreenNode[]): RegisteredScreenNode | undefined {
	const explicit = screens.find((screen) => /-0$/i.test(screen.id));
	if (explicit) return explicit;
	return screens[0];
}

function synthesizePropsFromRaw(raw: ComponentRawInput): Record<string, unknown> {
	const props: Record<string, unknown> = {};
	const variant = normalizeVariant(raw.variant);

	if (variant) {
		props.variant = variant;
	}

	const note = trim(raw.note);
	if (note) {
		const max = extractMax(note);
		if (max !== undefined) {
			props.maxLength = max;
		}
	}

	return props;
}

function hasKnownTextContract(type: string | undefined): boolean {
	if (!type) return false;
	const entry = getComponentCatalogEntry(type);
	if (!entry) return false;
	for (const role of PRIMARY_TEXT_ROLE_PRIORITY) {
		for (const contract of Object.values(entry.props)) {
			if (contract.aiWritable === false) continue;
			if (contract.role === role) return true;
		}
	}
	return false;
}

function trim(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	if (trimmed === "-") return undefined;
	return trimmed;
}

function normalizeVariant(value: string | undefined): string | undefined {
	const trimmed = trim(value);
	if (!trimmed) return undefined;
	return trimmed;
}

function extractMax(note: string): number | undefined {
	const match = note.match(/max\s*:\s*(\d+)/i);
	if (!match) return undefined;
	const parsed = Number.parseInt(match[1], 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}
