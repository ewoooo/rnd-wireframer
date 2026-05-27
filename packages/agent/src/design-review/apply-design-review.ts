import { getComponentCatalogEntry } from "@cx/renderer";
import { NODE_TYPES } from "@cx/types";
import { normalizeComponentType } from "../normalize-component-type";
import { isCompositePattern, listPatterns } from "@cx/pattern-store";
import type {
	DecoratedAreaNode,
	DecoratedComponentNode,
	DecoratedNodeTree,
	DecoratedScreenNode,
	NodeDisplay,
	PatternRef,
	RegionSlot,
	ScreenAreaRefInput,
} from "../types";
import { REGION_SLOTS, SYNTHETIC_REGION_AREA_CONTRACTS } from "./design-review-contracts";
import {
	type DesignReview,
	type DesignReviewOperation,
	designReviewSchema,
} from "./design-review-schema";

export interface ApplyDesignReviewResult {
	review: DesignReview;
	reviewed: DecoratedNodeTree;
	appliedOperationIds: string[];
	skippedOperations: Array<{ id: string; reason: string }>;
	createdPatternIds: string[];
	warnings: string[];
}

export function applyDesignReview(
	decorated: DecoratedNodeTree,
	reviewInput: unknown,
): ApplyDesignReviewResult {
	const review = designReviewSchema.parse(reviewInput);
	const reviewed = cloneDecoratedTree(decorated);
	const context = createApplyContext(reviewed);
	const appliedOperationIds: string[] = [];
	const skippedOperations: Array<{ id: string; reason: string }> = [];
	const createdPatternIds: string[] = [];
	const warnings: string[] = [];

	for (const operation of review.operations) {
		const result = applyOperation(operation, context);
		if (result.applied === true) {
			appliedOperationIds.push(operation.id);
			const createdPatternId = readCreatedPatternId(operation);
			if (createdPatternId) createdPatternIds.push(createdPatternId);
			continue;
		}
		skippedOperations.push({ id: operation.id, reason: result.reason });
	}

	if (createdPatternIds.length > 0) {
		warnings.push(
			`Created pattern proposals are not persisted automatically: ${createdPatternIds.join(", ")}`,
		);
	}

	reviewed.warnings = [
		...(reviewed.warnings ?? []),
		...review.warnings.map((warning) => `DesignReview: ${warning}`),
		...context.warnings,
		...warnings,
		...skippedOperations.map(
			(entry) => `Skipped design review operation ${entry.id}: ${entry.reason}`,
		),
	];

	return {
		review,
		reviewed,
		appliedOperationIds,
		skippedOperations,
		createdPatternIds,
		warnings,
	};
}

interface ApplyContext {
	tree: DecoratedNodeTree;
	areasById: Map<string, DecoratedAreaNode>;
	componentsById: Map<string, DecoratedComponentNode>;
	screensById: Map<string, DecoratedScreenNode>;
	warnings: string[];
}

function createApplyContext(tree: DecoratedNodeTree): ApplyContext {
	return {
		tree,
		areasById: new Map(tree.areas.map((area) => [area.id, area])),
		componentsById: new Map(tree.components.map((component) => [component.id, component])),
		screensById: new Map(tree.screens.map((screen) => [screen.id, screen])),
		warnings: [],
	};
}

function applyOperation(
	operation: DesignReviewOperation,
	context: ApplyContext,
): { applied: true } | { applied: false; reason: string } {
	const applier = DESIGN_REVIEW_OPERATION_APPLIERS[operation.operation] as OperationApplier;
	return applier(operation, context);
}

type ApplyResult = { applied: true } | { applied: false; reason: string };
type OperationApplier<TOperation extends DesignReviewOperation = DesignReviewOperation> = (
	operation: TOperation,
	context: ApplyContext,
) => ApplyResult;

const DESIGN_REVIEW_OPERATION_APPLIERS = {
	moveComponent: applyMoveComponent,
	updatePattern: applyUpdatePattern,
	setDisplay: applySetDisplay,
	updateComponentProps: applyUpdateComponentProps,
	createComponent: applyCreateComponent,
	createNewPattern: () => ({ applied: true }),
	createComposite: applyCreateComposite,
} satisfies {
	[K in DesignReviewOperation["operation"]]: OperationApplier<
		Extract<DesignReviewOperation, { operation: K }>
	>;
};

type CreatedPatternReader = (operation: DesignReviewOperation) => string | undefined;

const CREATED_PATTERN_ID_READERS: Partial<
	Record<DesignReviewOperation["operation"], CreatedPatternReader>
> = {
	createNewPattern: (operation) => ("pattern" in operation ? operation.pattern.id : undefined),
};

function readCreatedPatternId(operation: DesignReviewOperation) {
	const reader = CREATED_PATTERN_ID_READERS[operation.operation];
	return reader?.(operation);
}

function applyMoveComponent(
	operation: Extract<DesignReviewOperation, { operation: "moveComponent" }>,
	context: ApplyContext,
) {
	const component = context.componentsById.get(operation.componentId);
	if (!component) return { applied: false as const, reason: "component not found" };

	const removed = removeComponentFromAreas(operation.componentId, context, operation.from.areaId);
	if (!removed) return { applied: false as const, reason: "source component reference not found" };

	if (operation.to.areaId) {
		const targetArea = context.areasById.get(operation.to.areaId);
		if (!targetArea) return { applied: false as const, reason: "target area not found" };
		insertAreaChild(targetArea, operation.componentId, operation.to.order, operation.to);
		return { applied: true as const };
	}

	if (operation.to.screenRegion) {
		const screen = operation.to.screenId
			? context.screensById.get(operation.to.screenId)
			: findScreenContainingArea(context, operation.from.areaId);
		if (!screen) return { applied: false as const, reason: "target screen not found" };
		const area = getOrCreateRegionArea(screen, operation.to.screenRegion, context);
		insertAreaChild(area, operation.componentId, operation.to.order, operation.to);
		return { applied: true as const };
	}

	return { applied: false as const, reason: "target location is not actionable" };
}

function applyUpdatePattern(
	operation: Extract<DesignReviewOperation, { operation: "updatePattern" }>,
	context: ApplyContext,
) {
	const pattern: PatternRef = { id: operation.pattern.id, variant: operation.pattern.variant };
	return PATTERN_TARGET_UPDATERS[operation.target.level](operation.target, pattern, context);
}

type PatternTarget = Extract<DesignReviewOperation, { operation: "updatePattern" }>["target"];
type PatternTargetUpdater = (
	target: PatternTarget,
	pattern: PatternRef,
	context: ApplyContext,
) => ApplyResult;

const PATTERN_TARGET_UPDATERS = {
	screen: (target, pattern, context) => {
		const screen = context.screensById.get(target.id);
		if (!screen) return { applied: false, reason: "screen not found" };
		screen.pattern = pattern;
		return { applied: true };
	},
	region: (target, pattern, context) => {
		const resolved = resolveRegionPatternTarget(target, context);
		if (!resolved) return { applied: false, reason: "region target not found" };
		resolved.screen.regionPatterns = {
			...(resolved.screen.regionPatterns ?? {}),
			[resolved.region]: pattern,
		};
		return { applied: true };
	},
	area: (target, pattern, context) => {
		const area = context.areasById.get(target.id);
		if (!area) return { applied: false, reason: "area not found" };
		area.pattern = pattern;
		return { applied: true };
	},
	component: updateComponentLikePatternTarget,
	composite: updateComponentLikePatternTarget,
} satisfies Record<PatternTarget["level"], PatternTargetUpdater>;

function updateComponentLikePatternTarget(
	target: PatternTarget,
	pattern: PatternRef,
	context: ApplyContext,
): ApplyResult {
	const component = context.componentsById.get(target.id);
	if (!component) return { applied: false, reason: "component not found" };
	component.pattern = pattern;
	return { applied: true };
}

function applySetDisplay(
	operation: Extract<DesignReviewOperation, { operation: "setDisplay" }>,
	context: ApplyContext,
) {
	const component = context.componentsById.get(operation.componentId);
	if (!component) return { applied: false as const, reason: "component not found" };
	component.display = operation.display as NodeDisplay;
	return { applied: true as const };
}

function applyUpdateComponentProps(
	operation: Extract<DesignReviewOperation, { operation: "updateComponentProps" }>,
	context: ApplyContext,
) {
	const component = context.componentsById.get(operation.componentId);
	if (!component) return { applied: false as const, reason: "component not found" };
	const nextProps =
		operation.mode === "replace"
			? operation.props
			: { ...(component.props ?? {}), ...operation.props };
	const validation = validateComponentProps(component.type, nextProps);
	if (validation.valid === false) return { applied: false as const, reason: validation.reason };
	component.props = nextProps;
	return { applied: true as const };
}

function applyCreateComponent(
	operation: Extract<DesignReviewOperation, { operation: "createComponent" }>,
	context: ApplyContext,
) {
	if (context.componentsById.has(operation.component.id)) {
		return { applied: false as const, reason: "component already exists" };
	}
	const validation = validateComponentProps(operation.component.type, operation.component.props);
	if (validation.valid === false) return { applied: false as const, reason: validation.reason };
	const pattern = operation.component.pattern ?? resolveComponentPattern(operation.component.type);
	if (!pattern) {
		return { applied: false as const, reason: "component pattern not found" };
	}

	const component: DecoratedComponentNode = {
		id: operation.component.id,
		name: operation.component.name,
		order: context.tree.components.length + 1,
		type: operation.component.type,
		description: operation.component.description,
		props: operation.component.props,
		hooks: operation.component.hooks,
		pattern,
	};
	context.tree.components.push(component);
	context.componentsById.set(component.id, component);

	if (operation.insertInto.areaId) {
		const targetArea = context.areasById.get(operation.insertInto.areaId);
		if (!targetArea) return { applied: false as const, reason: "target area not found" };
		insertAreaChild(targetArea, component.id, operation.insertInto.order, operation.insertInto);
		return { applied: true as const };
	}

	if (operation.insertInto.screenRegion) {
		const screen = operation.insertInto.screenId
			? context.screensById.get(operation.insertInto.screenId)
			: context.tree.screens[0];
		if (!screen) return { applied: false as const, reason: "target screen not found" };
		const area = getOrCreateRegionArea(screen, operation.insertInto.screenRegion, context);
		insertAreaChild(area, component.id, operation.insertInto.order, operation.insertInto);
		return { applied: true as const };
	}

	return { applied: false as const, reason: "insert target is not actionable" };
}

function applyCreateComposite(
	operation: Extract<DesignReviewOperation, { operation: "createComposite" }>,
	context: ApplyContext,
) {
	if (context.componentsById.has(operation.composite.id)) {
		return { applied: false as const, reason: "composite component already exists" };
	}

	const missing = operation.composite.componentIds.filter((id) => !context.componentsById.has(id));
	if (missing.length > 0) {
		return {
			applied: false as const,
			reason: `composite child components not found: ${missing.join(", ")}`,
		};
	}

	const sourceArea = operation.replace?.areaId
		? context.areasById.get(operation.replace.areaId)
		: findAreaContainingAllComponents(context, operation.composite.componentIds);
	if (!sourceArea) return { applied: false as const, reason: "composite source area not found" };

	const orderedChildIds = orderComponentIdsByArea(sourceArea, operation.composite.componentIds);
	if (orderedChildIds.length !== operation.composite.componentIds.length) {
		return {
			applied: false as const,
			reason: "composite source components are not all in the same area",
		};
	}

	const firstOrder = Math.min(
		...sourceArea.children
			.filter((child) => orderedChildIds.includes(child.componentId))
			.map((child) => child.order ?? Number.MAX_SAFE_INTEGER),
	);

	const composite: DecoratedComponentNode = {
		id: operation.composite.id,
		name: operation.composite.name,
		order: context.tree.components.length + 1,
		type: NODE_TYPES.layout[0],
		description: operation.composite.description,
		props: {
			direction: "column",
			gap: 0,
		},
		pattern: operation.composite.pattern,
		children: orderedChildIds.map((componentId, index) => ({ componentId, order: index + 1 })),
	};

	context.tree.components.push(composite);
	context.componentsById.set(composite.id, composite);

	const replacedIds = new Set(operation.replace?.componentIds ?? orderedChildIds);
	sourceArea.children = [
		...sourceArea.children.filter((child) => !replacedIds.has(child.componentId)),
		{ componentId: composite.id, order: firstOrder },
	]
		.sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
		.map((child, index) => ({ ...child, order: index + 1 }));

	return { applied: true as const };
}

function removeComponentFromAreas(
	componentId: string,
	context: ApplyContext,
	areaId: string | undefined,
): boolean {
	const areas = areaId ? [context.areasById.get(areaId)].filter(isDefined) : context.tree.areas;
	let removed = false;
	for (const area of areas) {
		const nextChildren = area.children.filter((child) => child.componentId !== componentId);
		if (nextChildren.length === area.children.length) continue;
		area.children = nextChildren.map((child, index) => ({ ...child, order: index + 1 }));
		removed = true;
	}
	return removed;
}

function insertAreaChild(
	area: DecoratedAreaNode,
	componentId: string,
	order: number | undefined,
	destination?: {
		placement?: "first" | "last" | "before" | "after" | "replace";
		relativeToComponentId?: string;
	},
) {
	const withoutExisting = area.children.filter((child) => child.componentId !== componentId);
	const relativeIndex = destination?.relativeToComponentId
		? withoutExisting.findIndex((child) => child.componentId === destination.relativeToComponentId)
		: -1;
	const nextChild = { componentId, order: order ?? withoutExisting.length + 1 };
	const placement = destination?.placement ?? "last";
	area.children = normalizeAreaChildrenOrder(
		PLACEMENT_APPLIERS[placement](withoutExisting, nextChild, relativeIndex),
	);
}

type AreaChild = DecoratedAreaNode["children"][number];
type Placement = NonNullable<Parameters<typeof insertAreaChild>[3]>["placement"];
type PlacementApplier = (
	children: AreaChild[],
	nextChild: AreaChild,
	relativeIndex: number,
) => AreaChild[];

const PLACEMENT_APPLIERS = {
	first: (children, nextChild) => [nextChild, ...children],
	before: (children, nextChild, relativeIndex) =>
		relativeIndex >= 0
			? [...children.slice(0, relativeIndex), nextChild, ...children.slice(relativeIndex)]
			: [...children, nextChild],
	after: (children, nextChild, relativeIndex) =>
		relativeIndex >= 0
			? [...children.slice(0, relativeIndex + 1), nextChild, ...children.slice(relativeIndex + 1)]
			: [...children, nextChild],
	replace: (children, nextChild, relativeIndex) =>
		relativeIndex >= 0
			? [...children.slice(0, relativeIndex), nextChild, ...children.slice(relativeIndex + 1)]
			: [...children, nextChild],
	last: (children, nextChild) =>
		[...children, nextChild].sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
} satisfies Record<NonNullable<Placement>, PlacementApplier>;

function normalizeAreaChildrenOrder(children: AreaChild[]) {
	return children.map((child, index) => ({ ...child, order: index + 1 }));
}

function findScreenContainingArea(context: ApplyContext, areaId: string | undefined) {
	if (!areaId) return undefined;
	return context.tree.screens.find((screen) =>
		Object.values(screen.children).some((refs: ScreenAreaRefInput[] | undefined) =>
			(refs ?? []).some((ref: ScreenAreaRefInput) => ref.areaId === areaId),
		),
	);
}

function getOrCreateRegionArea(
	screen: DecoratedScreenNode,
	region: RegionSlot,
	context: ApplyContext,
) {
	const contract = SYNTHETIC_REGION_AREA_CONTRACTS[region];
	const existingRef = screen.children[region]?.find((ref) =>
		ref.areaId.endsWith(`-${contract.idSuffix}`),
	);
	if (existingRef) {
		const existing = context.areasById.get(existingRef.areaId);
		if (existing) return existing;
	}

	const areaId = `${screen.id}-${contract.idSuffix}`;
	const refs = screen.children[region] ?? [];
	const area: DecoratedAreaNode = {
		level: "area",
		id: areaId,
		name: contract.name,
		order: refs.length + 1,
		layout: contract.layout,
		children: [],
		pattern: contract.pattern,
	};
	context.tree.areas.push(area);
	context.areasById.set(area.id, area);

	const nextRef: ScreenAreaRefInput = { areaId, order: refs.length + 1 };
	screen.children = {
		...screen.children,
		[region]: [...refs, nextRef],
	};
	return area;
}

function resolveRegionPatternTarget(
	target: Extract<DesignReviewOperation, { operation: "updatePattern" }>["target"],
	context: ApplyContext,
): { screen: DecoratedScreenNode; region: RegionSlot } | undefined {
	if (target.screenId && target.screenRegion) {
		const screen = context.screensById.get(target.screenId);
		return screen ? { screen, region: target.screenRegion } : undefined;
	}

	const explicit = parseRegionTargetId(target.id);
	if (explicit) {
		const screen = context.screensById.get(explicit.screenId);
		return screen ? { screen, region: explicit.region } : undefined;
	}

	const onlyScreen = context.tree.screens.length === 1 ? context.tree.screens[0] : undefined;
	if (onlyScreen && isRegionSlot(target.id)) return { screen: onlyScreen, region: target.id };
	return undefined;
}

function parseRegionTargetId(id: string): { screenId: string; region: RegionSlot } | undefined {
	const match = new RegExp(`^(?<screenId>.+?)(?::|\\.)(?<region>${REGION_SLOTS.join("|")})$`).exec(
		id,
	);
	if (!match?.groups) return undefined;
	const region = match.groups.region;
	if (!isRegionSlot(region)) return undefined;
	return { screenId: match.groups.screenId, region };
}

function isRegionSlot(value: string): value is RegionSlot {
	return (REGION_SLOTS as readonly string[]).includes(value);
}

function findAreaContainingAllComponents(
	context: ApplyContext,
	componentIds: string[],
): DecoratedAreaNode | undefined {
	return context.tree.areas.find((area) => {
		const childIds = new Set(area.children.map((child) => child.componentId));
		return componentIds.every((componentId) => childIds.has(componentId));
	});
}

function orderComponentIdsByArea(area: DecoratedAreaNode, componentIds: string[]): string[] {
	const expected = new Set(componentIds);
	return [...area.children]
		.sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
		.map((child) => child.componentId)
		.filter((componentId) => expected.has(componentId));
}

function validateComponentProps(
	type: string | undefined,
	props: Record<string, unknown>,
): { valid: true } | { valid: false; reason: string } {
	const normalizedType = normalizeComponentType(type);
	if (!normalizedType) return { valid: true };
	const entry = getComponentCatalogEntry(normalizedType);
	if (!entry) return { valid: true };

	for (const [propName, value] of Object.entries(props)) {
		const contract = entry.props[propName];
		if (!contract) return { valid: false, reason: `unknown prop '${propName}' for ${entry.type}` };
		if (contract.aiWritable === false) {
			return { valid: false, reason: `prop '${propName}' is not AI-writable for ${entry.type}` };
		}
		if (contract.type === "enum" && contract.values && !contract.values.includes(String(value))) {
			return { valid: false, reason: `invalid enum value for ${entry.type}.${propName}` };
		}
	}

	for (const [propName, contract] of Object.entries(entry.props)) {
		if (!contract.required || props[propName] !== undefined) continue;
		return { valid: false, reason: `required prop '${propName}' is missing for ${entry.type}` };
	}

	return { valid: true };
}

function resolveComponentPattern(type: string | undefined): PatternRef | undefined {
	const normalizedType = normalizeComponentType(type);
	if (!normalizedType) return undefined;
	const candidates = listPatterns("composite").filter(isCompositePattern);
	const matched = candidates.filter((pattern) => {
		const matcher = pattern.resolution?.componentTypes;
		if (!matcher) return false;
		if (matcher.noneOf?.includes(normalizedType)) return false;
		if (matcher.allOf?.length)
			return matcher.allOf.every((candidate) => candidate === normalizedType);
		return matcher.anyOf?.includes(normalizedType) ?? false;
	});
	matched.sort(
		(left, right) => (right.resolution?.priority ?? 0) - (left.resolution?.priority ?? 0),
	);
	const pattern = matched[0];
	if (!pattern) return undefined;
	return {
		id: pattern.id,
		variant: pattern.defaultVariant,
		reasons: [`component pattern-store match: ${normalizedType}`],
	};
}

function cloneDecoratedTree(tree: DecoratedNodeTree): DecoratedNodeTree {
	return JSON.parse(JSON.stringify(tree)) as DecoratedNodeTree;
}

function isDefined<T>(value: T | undefined): value is T {
	return value !== undefined;
}
