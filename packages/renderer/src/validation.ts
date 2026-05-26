import type { ComponentRegistry } from "./component-registry";
import { getRenderTreeNodeKind } from "./runtime";
import {
	LAYOUT_FLEX_NODE_TYPE,
	LAYOUT_GRID_NODE_TYPE,
	REQUIRED_SCREEN_REGION_TYPES,
	type RenderTree,
	type RenderTreeNode,
	type RenderTreeValidationStats,
	RenderTreeValidator,
	SCREEN_NODE_TYPE,
	type ValidationResult,
} from "./schema";

export interface ValidateRenderTreeOptions {
	checkDuplicateIds?: boolean;
	checkRendererCoverage?: boolean;
	checkScreenRegionContract?: boolean;
	registry?: ComponentRegistry;
	checkRegisteredComponents?: boolean;
	checkVersionCompatibility?: boolean;
	strictRendererCoverage?: boolean;
}

const CURRENT_RENDERER_VERSION = "0.1.0";
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const TOKEN_SPACING_VALUES = new Set([
	0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40,
]);
const SPACING_PROP_NAMES = new Set([
	"componentGap",
	"gap",
	"itemPaddingX",
	"paddingX",
	"paddingY",
	"sectionPaddingX",
	"titleGap",
]);
const BUILT_IN_NODE_TYPES = new Set<string>([
	SCREEN_NODE_TYPE,
	...REQUIRED_SCREEN_REGION_TYPES,
	LAYOUT_FLEX_NODE_TYPE,
	LAYOUT_GRID_NODE_TYPE,
	"Area",
]);
const REQUIRED_SCREEN_REGION_TYPE_SET = new Set<string>(REQUIRED_SCREEN_REGION_TYPES);

export function validateRenderTree(schema: unknown): ValidationResult {
	const result = RenderTreeValidator.safeParse(schema);

	if (result.success) {
		return {
			success: true,
			errors: [],
			warnings: [],
			stats: collectRenderTreeStats(result.data),
			data: result.data,
		};
	}

	return {
		success: false,
		errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
		warnings: [],
	};
}

export function validateRenderTreeFull(
	schema: unknown,
	options: ValidateRenderTreeOptions = {},
): ValidationResult {
	const baseResult = validateRenderTree(schema);
	if (!baseResult.success || !baseResult.data) return baseResult;

	const errors: string[] = [];
	const warnings: string[] = [];
	const stats = collectRenderTreeStats(baseResult.data);

	if (options.checkVersionCompatibility ?? true) {
		const versionResult = validateRenderTreeVersions(baseResult.data);
		errors.push(...versionResult.errors);
		warnings.push(...versionResult.warnings);
	}

	if (options.checkDuplicateIds ?? true) {
		const duplicates = findDuplicateNodeIds(baseResult.data);
		if (duplicates.length > 0) {
			errors.push(`Duplicate node IDs found: ${duplicates.join(", ")}`);
		}
	}

	if (options.checkScreenRegionContract ?? true) {
		errors.push(...validateScreenRegionContract(baseResult.data));
	}

	if (options.checkRegisteredComponents && options.registry) {
		const missing = findUnregisteredComponents(baseResult.data, options.registry);
		if (missing.length > 0) {
			errors.push(`Unregistered component types found: ${missing.join(", ")}`);
		}
	}

	if (options.checkRendererCoverage ?? true) {
		const fallbackTypes = findFallbackRendererTypes(baseResult.data);
		if (fallbackTypes.length > 0) {
			const message = `Missing renderer mapping for node types: ${fallbackTypes.join(", ")}`;
			if (options.strictRendererCoverage) {
				errors.push(message);
			} else {
				warnings.push(message);
			}
		}
	}

	const untokenizedSpacingValues = findUntokenizedSpacingValues(baseResult.data);
	if (untokenizedSpacingValues.length > 0) {
		warnings.push(
			`Spacing values are not in @cx/tokens Tailwind spacing keys: ${untokenizedSpacingValues.join(
				", ",
			)}`,
		);
	}

	return {
		success: errors.length === 0,
		errors,
		warnings,
		stats,
		data: baseResult.data,
	};
}

export function findDuplicateNodeIds(schema: RenderTree): string[] {
	const seen = new Set<string>();
	const duplicates = new Set<string>();

	forEachNode(schema.children, (node) => {
		const nodeId = node.metadata.id;
		if (seen.has(nodeId)) {
			duplicates.add(nodeId);
		} else {
			seen.add(nodeId);
		}
	});

	return Array.from(duplicates).sort();
}

export function validateScreenRegionContract(schema: RenderTree): string[] {
	const errors: string[] = [];
	const screenNodes = schema.children.filter((node) => node.type === SCREEN_NODE_TYPE);

	if (screenNodes.length === 0) {
		return [`${SCREEN_NODE_TYPE} node is required at schema.children`];
	}

	if (screenNodes.length > 1) {
		errors.push(`Only one ${SCREEN_NODE_TYPE} node is allowed at schema.children`);
	}

	for (const screenNode of screenNodes) {
		const screenId = screenNode.metadata.id;
		const children = screenNode.children ?? [];
		const directChildTypes = children.map((node) => node.type);

		for (const requiredType of REQUIRED_SCREEN_REGION_TYPES) {
			const count = directChildTypes.filter((type) => type === requiredType).length;
			if (count === 0) {
				errors.push(`${SCREEN_NODE_TYPE}(${screenId}) must include ${requiredType}`);
			}
			if (count > 1) {
				errors.push(`${SCREEN_NODE_TYPE}(${screenId}) must include only one ${requiredType}`);
			}
		}

		const invalidDirectChildren = children.filter(
			(node) => !REQUIRED_SCREEN_REGION_TYPE_SET.has(node.type),
		);
		if (invalidDirectChildren.length > 0) {
			errors.push(
				`${SCREEN_NODE_TYPE}(${screenId}) direct children must be ${REQUIRED_SCREEN_REGION_TYPES.join(
					", ",
				)}. Invalid children: ${invalidDirectChildren
					.map((node) => `${node.type}(${node.metadata.id})`)
					.join(", ")}`,
			);
		}

		const expectedOrder = REQUIRED_SCREEN_REGION_TYPES.join(" > ");
		const actualOrder = directChildTypes.join(" > ");
		if (children.length === REQUIRED_SCREEN_REGION_TYPES.length && actualOrder !== expectedOrder) {
			errors.push(`${SCREEN_NODE_TYPE}(${screenId}) children must be ordered as ${expectedOrder}`);
		}
	}

	return errors;
}

export function extractUsedComponentTypes(schema: RenderTree): string[] {
	const types = new Set<string>();
	forEachNode(schema.children, (node) => types.add(node.type));
	return Array.from(types).sort();
}

export function findUnregisteredComponents(
	schema: RenderTree,
	registry: ComponentRegistry,
): string[] {
	return extractUsedComponentTypes(schema).filter(
		(type) => !BUILT_IN_NODE_TYPES.has(type) && !registry.has(type),
	);
}

export function findFallbackRendererTypes(schema: RenderTree): string[] {
	const fallbackTypes = new Set<string>();

	forEachNode(schema.children, (node) => {
		if (BUILT_IN_NODE_TYPES.has(node.type)) return;
		if (getRenderTreeNodeKind(node) === "fallback") {
			fallbackTypes.add(node.type);
		}
	});

	return Array.from(fallbackTypes).sort();
}

export function collectRenderTreeStats(schema: RenderTree): RenderTreeValidationStats {
	const componentTypes = new Set<string>();
	const fallbackTypes = new Set<string>();
	const rendererKinds = new Set<string>();
	let maxDepth = 0;
	let totalNodes = 0;

	forEachNode(schema.children, (node, depth) => {
		const rendererKind = getRenderTreeNodeKind(node);
		totalNodes += 1;
		maxDepth = Math.max(maxDepth, depth);
		componentTypes.add(node.type);
		rendererKinds.add(rendererKind);
		if (!BUILT_IN_NODE_TYPES.has(node.type) && rendererKind === "fallback") {
			fallbackTypes.add(node.type);
		}
	});

	return {
		componentTypes: Array.from(componentTypes).sort(),
		fallbackTypes: Array.from(fallbackTypes).sort(),
		maxDepth,
		rendererKinds: Array.from(rendererKinds).sort(),
		totalNodes,
	};
}

function findUntokenizedSpacingValues(schema: RenderTree): string[] {
	const values = new Set<string>();

	forEachNode(schema.children, (node) => {
		collectUntokenizedSpacingValues(node.metadata.id, node.props, values);
		collectUntokenizedSpacingValues(node.metadata.id, getNestedRecord(node.props?.layout), values);
	});

	return Array.from(values).sort();
}

function collectUntokenizedSpacingValues(
	nodeId: string,
	props: Record<string, unknown> | undefined,
	values: Set<string>,
) {
	if (!props) return;

	for (const [propName, value] of Object.entries(props)) {
		if (!SPACING_PROP_NAMES.has(propName)) continue;
		if (typeof value !== "number") continue;
		if (!TOKEN_SPACING_VALUES.has(value)) values.add(`${nodeId}.${propName}=${value}`);
	}
}

function getNestedRecord(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
}

function validateRenderTreeVersions(schema: RenderTree) {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!VERSION_PATTERN.test(schema.version)) {
		errors.push(`Invalid schema version format: ${schema.version}`);
	}

	if (schema.minRendererVersion) {
		if (!VERSION_PATTERN.test(schema.minRendererVersion)) {
			errors.push(`Invalid minRendererVersion format: ${schema.minRendererVersion}`);
		} else if (compareVersions(schema.minRendererVersion, CURRENT_RENDERER_VERSION) > 0) {
			errors.push(
				`Renderer ${CURRENT_RENDERER_VERSION} does not satisfy minRendererVersion ${schema.minRendererVersion}`,
			);
		}
	}

	if (schema.minComponentsVersion) {
		warnings.push(
			`minComponentsVersion is deprecated in render tree; componentVersion should be checked per node`,
		);
		if (!VERSION_PATTERN.test(schema.minComponentsVersion)) {
			errors.push(`Invalid minComponentsVersion format: ${schema.minComponentsVersion}`);
		}
	}

	forEachNode(schema.children, (node) => {
		if (!VERSION_PATTERN.test(node.componentVersion)) {
			errors.push(
				`${node.type}(${node.metadata.id}) has invalid componentVersion format: ${node.componentVersion}`,
			);
		}
	});

	return { errors, warnings };
}

function compareVersions(left: string, right: string): number {
	const leftParts = parseVersion(left);
	const rightParts = parseVersion(right);

	for (let index = 0; index < 3; index += 1) {
		const delta = leftParts[index] - rightParts[index];
		if (delta !== 0) return delta;
	}

	return 0;
}

function parseVersion(version: string): [number, number, number] {
	const [major = "0", minor = "0", patch = "0"] = version.split(".");
	return [Number(major) || 0, Number(minor) || 0, Number(patch) || 0];
}

function forEachNode(
	nodes: RenderTreeNode[],
	callback: (node: RenderTreeNode, depth: number) => void,
	depth = 1,
): void {
	for (const node of nodes) {
		callback(node, depth);
		if (node.children) {
			forEachNode(node.children, callback, depth + 1);
		}
	}
}
