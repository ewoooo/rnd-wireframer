import {
	BUILT_IN_NODE_TYPES,
	type ValidationIssue,
	type ValidationResult,
	type ValidationStats,
} from "@cx/types";
import type { ComponentRegistry } from "./component-registry";
import { getRenderTreeNodeKind } from "./runtime";
import {
	REQUIRED_SCREEN_REGION_TYPES,
	type RenderTree,
	type RenderTreeNode,
	RenderTreeValidator,
	SCREEN_NODE_TYPE,
} from "./schema";

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
const REQUIRED_SCREEN_REGION_TYPE_SET = new Set<string>(REQUIRED_SCREEN_REGION_TYPES);

export interface ValidationContext {
	registry?: ComponentRegistry;
	rendererVersion: string;
	strictRendererCoverage: boolean;
}

export type ValidationCheck = (tree: RenderTree, ctx: ValidationContext) => ValidationIssue[];

export interface ValidateRenderTreeOptions {
	checkDuplicateIds?: boolean;
	checkRendererCoverage?: boolean;
	checkScreenRegionContract?: boolean;
	registry?: ComponentRegistry;
	checkRegisteredComponents?: boolean;
	checkVersionCompatibility?: boolean;
	strictRendererCoverage?: boolean;
}

/** Schema (Zod) — 구조적 파싱. 실패 시 issues로 변환. */
export function validateRenderTree(schema: unknown): ValidationResult<RenderTree> {
	const parsed = RenderTreeValidator.safeParse(schema);

	if (parsed.success) {
		return {
			ok: true,
			issues: [],
			data: parsed.data,
			stats: collectRenderTreeStats(parsed.data),
		};
	}

	const issues: ValidationIssue[] = parsed.error.issues.map((issue) => ({
		code: "schema.invalid",
		severity: "error",
		layer: "schema",
		message: issue.message,
		path: issue.path.filter(
			(segment): segment is string | number =>
				typeof segment === "string" || typeof segment === "number",
		),
	}));

	return { ok: false, issues };
}

export function validateRenderTreeFull(
	schema: unknown,
	options: ValidateRenderTreeOptions = {},
): ValidationResult<RenderTree> {
	const base = validateRenderTree(schema);
	if (!base.ok || !base.data) return base;

	const ctx: ValidationContext = {
		registry: options.registry,
		rendererVersion: CURRENT_RENDERER_VERSION,
		strictRendererCoverage: options.strictRendererCoverage ?? false,
	};

	const checks: ValidationCheck[] = [];
	if (options.checkVersionCompatibility ?? true) checks.push(versionCheck);
	if (options.checkDuplicateIds ?? true) checks.push(duplicateIdCheck);
	if (options.checkScreenRegionContract ?? true) checks.push(screenRegionContractCheck);
	if (options.checkRegisteredComponents && options.registry) checks.push(registryCoverageCheck);
	if (options.checkRendererCoverage ?? true) checks.push(rendererCoverageCheck);
	checks.push(tokenSpacingCheck);

	const issues = runChecks(base.data, checks, ctx);

	return {
		ok: !issues.some((issue) => issue.severity === "error"),
		issues,
		data: base.data,
		stats: collectRenderTreeStats(base.data),
	};
}

export function runChecks(
	tree: RenderTree,
	checks: readonly ValidationCheck[],
	ctx: ValidationContext,
): ValidationIssue[] {
	return checks.flatMap((check) => check(tree, ctx));
}

// ─── Checks ──────────────────────────────────────────────────────────────

export const duplicateIdCheck: ValidationCheck = (tree) => {
	const seen = new Set<string>();
	const duplicates = new Set<string>();

	forEachNode(tree.children, (node) => {
		const nodeId = node.metadata.id;
		if (seen.has(nodeId)) duplicates.add(nodeId);
		else seen.add(nodeId);
	});

	return Array.from(duplicates)
		.sort()
		.map<ValidationIssue>((nodeId) => ({
			code: "reference.duplicate-id",
			severity: "error",
			layer: "reference",
			message: `Duplicate node ID: ${nodeId}`,
			nodeId,
		}));
};

export const screenRegionContractCheck: ValidationCheck = (tree) => {
	const issues: ValidationIssue[] = [];
	const screenNodes = tree.children.filter((node) => node.type === SCREEN_NODE_TYPE);

	if (screenNodes.length === 0) {
		issues.push({
			code: "contract.screen.missing",
			severity: "error",
			layer: "contract",
			message: `${SCREEN_NODE_TYPE} node is required at schema.children`,
		});
		return issues;
	}

	if (screenNodes.length > 1) {
		issues.push({
			code: "contract.screen.duplicate",
			severity: "error",
			layer: "contract",
			message: `Only one ${SCREEN_NODE_TYPE} node is allowed at schema.children`,
			data: { count: screenNodes.length },
		});
	}

	for (const screenNode of screenNodes) {
		const screenId = screenNode.metadata.id;
		const children = screenNode.children ?? [];
		const directChildTypes = children.map((node) => node.type);

		for (const requiredType of REQUIRED_SCREEN_REGION_TYPES) {
			const count = directChildTypes.filter((type) => type === requiredType).length;
			if (count === 0) {
				issues.push({
					code: "contract.region.invalid-child",
					severity: "error",
					layer: "contract",
					message: `${SCREEN_NODE_TYPE}(${screenId}) must include ${requiredType}`,
					nodeId: screenId,
					data: { requiredType, count },
				});
			}
			if (count > 1) {
				issues.push({
					code: "contract.region.invalid-child",
					severity: "error",
					layer: "contract",
					message: `${SCREEN_NODE_TYPE}(${screenId}) must include only one ${requiredType}`,
					nodeId: screenId,
					data: { requiredType, count },
				});
			}
		}

		const invalidChildren = children.filter(
			(node) => !REQUIRED_SCREEN_REGION_TYPE_SET.has(node.type),
		);
		if (invalidChildren.length > 0) {
			issues.push({
				code: "contract.screen.invalid-child",
				severity: "error",
				layer: "contract",
				message: `${SCREEN_NODE_TYPE}(${screenId}) direct children must be ${REQUIRED_SCREEN_REGION_TYPES.join(", ")}. Invalid children: ${invalidChildren
					.map((node) => `${node.type}(${node.metadata.id})`)
					.join(", ")}`,
				nodeId: screenId,
				data: { invalidChildren: invalidChildren.map((n) => ({ type: n.type, id: n.metadata.id })) },
			});
		}

		const expectedOrder = REQUIRED_SCREEN_REGION_TYPES.join(" > ");
		const actualOrder = directChildTypes.join(" > ");
		if (children.length === REQUIRED_SCREEN_REGION_TYPES.length && actualOrder !== expectedOrder) {
			issues.push({
				code: "contract.screen.order",
				severity: "error",
				layer: "contract",
				message: `${SCREEN_NODE_TYPE}(${screenId}) children must be ordered as ${expectedOrder}`,
				nodeId: screenId,
				data: { expected: expectedOrder, actual: actualOrder },
			});
		}
	}

	return issues;
};

export const registryCoverageCheck: ValidationCheck = (tree, ctx) => {
	if (!ctx.registry) return [];
	const missing = extractUsedComponentTypes(tree).filter(
		(type) => !BUILT_IN_NODE_TYPES.has(type) && !ctx.registry?.has(type),
	);
	if (missing.length === 0) return [];
	return [
		{
			code: "node-type.unregistered",
			severity: "error",
			layer: "node-type",
			message: `Unregistered component types found: ${missing.join(", ")}`,
			data: { types: missing },
		},
	];
};

export const rendererCoverageCheck: ValidationCheck = (tree, ctx) => {
	const fallbackTypes = findFallbackRendererTypes(tree);
	if (fallbackTypes.length === 0) return [];
	return [
		{
			code: "node-type.unknown",
			severity: ctx.strictRendererCoverage ? "error" : "warning",
			layer: "node-type",
			message: `Missing renderer mapping for node types: ${fallbackTypes.join(", ")}`,
			data: { types: fallbackTypes },
		},
	];
};

export const tokenSpacingCheck: ValidationCheck = (tree) => {
	const values = findUntokenizedSpacingValues(tree);
	if (values.length === 0) return [];
	return [
		{
			code: "tokens.untokenized-spacing",
			severity: "warning",
			layer: "tokens",
			message: `Spacing values are not in @cx/tokens Tailwind spacing keys: ${values.join(", ")}`,
			data: { values },
		},
	];
};

export const versionCheck: ValidationCheck = (tree, ctx) => {
	const issues: ValidationIssue[] = [];

	if (!VERSION_PATTERN.test(tree.version)) {
		issues.push({
			code: "version.invalid",
			severity: "error",
			layer: "version",
			message: `Invalid schema version format: ${tree.version}`,
			data: { value: tree.version },
		});
	}

	if (tree.minRendererVersion) {
		if (!VERSION_PATTERN.test(tree.minRendererVersion)) {
			issues.push({
				code: "version.invalid",
				severity: "error",
				layer: "version",
				message: `Invalid minRendererVersion format: ${tree.minRendererVersion}`,
				data: { value: tree.minRendererVersion },
			});
		} else if (compareVersions(tree.minRendererVersion, ctx.rendererVersion) > 0) {
			issues.push({
				code: "version.incompatible",
				severity: "error",
				layer: "version",
				message: `Renderer ${ctx.rendererVersion} does not satisfy minRendererVersion ${tree.minRendererVersion}`,
				data: { rendererVersion: ctx.rendererVersion, minRendererVersion: tree.minRendererVersion },
			});
		}
	}

	if (tree.minComponentsVersion) {
		issues.push({
			code: "version.invalid",
			severity: "warning",
			layer: "version",
			message:
				"minComponentsVersion is deprecated in render tree; componentVersion should be checked per node",
		});
		if (!VERSION_PATTERN.test(tree.minComponentsVersion)) {
			issues.push({
				code: "version.invalid",
				severity: "error",
				layer: "version",
				message: `Invalid minComponentsVersion format: ${tree.minComponentsVersion}`,
				data: { value: tree.minComponentsVersion },
			});
		}
	}

	forEachNode(tree.children, (node) => {
		if (!VERSION_PATTERN.test(node.componentVersion)) {
			issues.push({
				code: "version.invalid",
				severity: "error",
				layer: "version",
				message: `${node.type}(${node.metadata.id}) has invalid componentVersion format: ${node.componentVersion}`,
				nodeId: node.metadata.id,
				nodeType: node.type,
				data: { value: node.componentVersion },
			});
		}
	});

	return issues;
};

// ─── Helpers (legacy public API 유지) ─────────────────────────────────────

export function findDuplicateNodeIds(tree: RenderTree): string[] {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	forEachNode(tree.children, (node) => {
		const nodeId = node.metadata.id;
		if (seen.has(nodeId)) duplicates.add(nodeId);
		else seen.add(nodeId);
	});
	return Array.from(duplicates).sort();
}

export function extractUsedComponentTypes(tree: RenderTree): string[] {
	const types = new Set<string>();
	forEachNode(tree.children, (node) => types.add(node.type));
	return Array.from(types).sort();
}

export function findUnregisteredComponents(
	tree: RenderTree,
	registry: ComponentRegistry,
): string[] {
	return extractUsedComponentTypes(tree).filter(
		(type) => !BUILT_IN_NODE_TYPES.has(type) && !registry.has(type),
	);
}

export function findFallbackRendererTypes(tree: RenderTree): string[] {
	const fallbackTypes = new Set<string>();
	forEachNode(tree.children, (node) => {
		if (BUILT_IN_NODE_TYPES.has(node.type)) return;
		if (getRenderTreeNodeKind(node) === "fallback") fallbackTypes.add(node.type);
	});
	return Array.from(fallbackTypes).sort();
}

export function collectRenderTreeStats(tree: RenderTree): ValidationStats {
	const componentTypes = new Set<string>();
	const fallbackTypes = new Set<string>();
	const rendererKinds = new Set<string>();
	let maxDepth = 0;
	let totalNodes = 0;

	forEachNode(tree.children, (node, depth) => {
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

export function validateScreenRegionContract(tree: RenderTree): ValidationIssue[] {
	return screenRegionContractCheck(tree, {
		rendererVersion: CURRENT_RENDERER_VERSION,
		strictRendererCoverage: false,
	});
}

// ─── Internal utilities ──────────────────────────────────────────────────

function findUntokenizedSpacingValues(tree: RenderTree): string[] {
	const values = new Set<string>();
	forEachNode(tree.children, (node) => {
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
		if (node.children) forEachNode(node.children, callback, depth + 1);
	}
}
