import { getComponentCatalogEntry } from "@cx/renderer";
import type {
	ComponentRawInput,
	ComposedComponentNode,
	ComposedNodeTree,
	ComposedOrganismNode,
	ComposedRouteNode,
	ComposedScreenNode,
	ComposedVariantNode,
	RegisteredComponentNode,
	RegisteredNodeTree,
	RegisteredScreenNode,
	RegisteredScreenOrganismRef,
	RegisteredVariantNode,
	ScreenOrganismRefInput,
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
	const organisms = registered.organisms.map((organism) =>
		composeOrganism(organism, componentById, warnings),
	);
	const organismById = new Map(organisms.map((organism) => [organism.id, organism]));

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
				screens.push(composeScreen(screen, variant.id, organismById, warnings));
			}
		}
	}

	return {
		composed: {
			routes,
			variants,
			screens,
			organisms,
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

function normalizeComponentType(type: string | undefined): string | undefined {
	if (type?.toLowerCase() === "action-area") return "button";
	return type;
}

function composeOrganism(
	organism: RegisteredNodeTree["organisms"][number],
	componentById: Map<string, ComposedComponentNode>,
	warnings: string[],
): ComposedOrganismNode {
	for (const ref of organism.children) {
		if (!componentById.has(ref.componentId)) {
			warnings.push(`Missing composed component: ${ref.componentId}`);
		}
	}

	return {
		id: organism.id,
		name: organism.name,
		order: organism.order,
		...(organism.description ? { description: organism.description } : {}),
		...(organism.layout ? { layout: organism.layout } : {}),
		children: organism.children.map((ref) => ({
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
	if (!main?.organisms || main.organisms.length === 0) return variant.screens;

	return variant.screens.map((screen) => {
		if (screen.id === main.id || screen.organisms.length > 0) return screen;
		inheritedEdgeScreenIds.push(screen.id);
		return {
			...screen,
			organisms: main.organisms.map((ref) => ({ ...ref })),
		};
	});
}

function composeScreen(
	screen: RegisteredScreenNode,
	variantId: string,
	organismById: Map<string, ComposedOrganismNode>,
	warnings: string[],
): ComposedScreenNode {
	const regions = partitionScreenOrganisms(screen.organisms, organismById);
	for (const ref of screen.organisms) {
		if (!organismById.has(ref.organismId)) {
			warnings.push(`Missing composed organism: ${ref.organismId}`);
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

function partitionScreenOrganisms(
	refs: RegisteredScreenOrganismRef[],
	organismById: Map<string, ComposedOrganismNode>,
) {
	const header: ScreenOrganismRefInput[] = [];
	const contents: ScreenOrganismRefInput[] = [];
	const bottom: ScreenOrganismRefInput[] = [];

	for (const ref of refs) {
		const child = { organismId: ref.organismId, order: ref.order };
		const organism = organismById.get(ref.organismId);
		const target = resolveScreenRegion(ref, organism);
		if (target === "header") header.push(child);
		else if (target === "bottom") bottom.push(child);
		else contents.push(child);
	}

	return {
		...(header.length > 0 ? { header } : {}),
		contents,
		...(bottom.length > 0 ? { bottom } : {}),
	};
}

function resolveScreenRegion(
	ref: RegisteredScreenOrganismRef,
	organism: ComposedOrganismNode | undefined,
): "bottom" | "contents" | "header" {
	const haystack =
		`${ref.organismId} ${organism?.name ?? ""} ${organism?.description ?? ""}`.toLowerCase();
	if (/(header|top|app-?bar|navigation|nav|상단|헤더)/.test(haystack)) return "header";
	if (/(bottom|footer|cta|action|button|하단|버튼|완료|다음)/.test(haystack)) return "bottom";
	return "contents";
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
