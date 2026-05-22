import type {
	ComponentAssetInput,
	ComponentRawInput,
	RegisterAssetsInput,
	ScreenAssetInput,
	ScreenVariantAssetInput,
} from "./types";

export interface ComposeAssetContentsOptions {
	now?: () => string;
}

export interface ComposeAssetContentsResult {
	composed: RegisterAssetsInput;
	filledComponentIds: string[];
	inheritedEdgeScreenIds: string[];
	skipped: Array<{ componentId: string; reason: string }>;
	warnings: string[];
}

export function composeAssetContents(
	input: RegisterAssetsInput,
	_options: ComposeAssetContentsOptions = {},
): ComposeAssetContentsResult {
	const filledComponentIds: string[] = [];
	const skipped: Array<{ componentId: string; reason: string }> = [];
	const warnings: string[] = [];

	const components = (input.components ?? []).map((component) => {
		const next = composeComponent(component, filledComponentIds, skipped);
		return next;
	});

	const inheritedEdgeScreenIds: string[] = [];
	const routes = input.routes.map((route) => ({
		...route,
		variants: route.variants.map((variant) =>
			propagateEdgeScreens(variant, inheritedEdgeScreenIds),
		),
	}));

	const composed: RegisterAssetsInput = {
		...input,
		components,
		routes,
	};

	return { composed, filledComponentIds, inheritedEdgeScreenIds, skipped, warnings };
}

function propagateEdgeScreens(
	variant: ScreenVariantAssetInput,
	inheritedEdgeScreenIds: string[],
): ScreenVariantAssetInput {
	const main = findMainScreen(variant.screens);
	if (!main?.organisms || main.organisms.length === 0) {
		return variant;
	}

	const screens = variant.screens.map((screen) => {
		if (screen.id === main.id) return screen;
		const hasOrganisms = screen.organisms && screen.organisms.length > 0;
		if (hasOrganisms) return screen;

		inheritedEdgeScreenIds.push(screen.id);
		return {
			...screen,
			organisms: main.organisms?.map((ref) => ({ ...ref })),
		};
	});

	return { ...variant, screens };
}

function findMainScreen(screens: ScreenAssetInput[]): ScreenAssetInput | undefined {
	const explicit = screens.find((screen) => /-0$/i.test(screen.id));
	if (explicit) return explicit;
	return screens[0];
}

function composeComponent(
	component: ComponentAssetInput,
	filledComponentIds: string[],
	skipped: Array<{ componentId: string; reason: string }>,
): ComponentAssetInput {
	const normalizedType = normalizeContentComponentType(component.type);
	const typedComponent =
		normalizedType === component.type ? component : { ...component, type: normalizedType };
	const existing = component.props ?? {};
	if (Object.keys(existing).length > 0) {
		return typedComponent;
	}

	if (!typedComponent.raw) {
		skipped.push({ componentId: component.id, reason: "no raw" });
		return typedComponent;
	}

	const synthesized = synthesizePropsFromRaw(typedComponent.type, typedComponent.raw);
	if (Object.keys(synthesized).length === 0) {
		skipped.push({ componentId: component.id, reason: "raw insufficient" });
		return typedComponent;
	}

	filledComponentIds.push(component.id);
	return {
		...typedComponent,
		props: synthesized,
	};
}

function normalizeContentComponentType(type: string | undefined): string | undefined {
	if ((type ?? "").toLowerCase() === "action-area") return "button";
	return type;
}

function synthesizePropsFromRaw(
	type: string | undefined,
	raw: ComponentRawInput,
): Record<string, unknown> {
	const props: Record<string, unknown> = {};
	const description = trim(raw.description);
	const variant = normalizeVariant(raw.variant);
	const labelKey = labelKeyForType(type);

	if (description) {
		props[labelKey] = description;
	}
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

function labelKeyForType(type: string | undefined): string {
	switch ((type ?? "").toLowerCase()) {
		case "text-field":
		case "text-area":
			return "label";
		case "list-cell":
		case "accordion":
			return "title";
		case "section-message":
			return "message";
		case "button":
			return "label";
		default:
			return "label";
	}
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
