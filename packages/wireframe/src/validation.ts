import type { ComponentRegistry } from "./registry";
import {
	LAYOUT_FLEX_NODE_TYPE,
	LAYOUT_GRID_NODE_TYPE,
	REQUIRED_SCREEN_REGION_TYPES,
	SCREEN_NODE_TYPE,
	type ValidationResult,
	type WireframeNode,
	type WireframeSchema,
	WireframeSchemaValidator,
} from "./types";

export interface ValidateWireframeOptions {
	checkDuplicateIds?: boolean;
	checkScreenRegionContract?: boolean;
	registry?: ComponentRegistry;
	checkRegisteredComponents?: boolean;
}

const BUILT_IN_NODE_TYPES = new Set<string>([
	SCREEN_NODE_TYPE,
	...REQUIRED_SCREEN_REGION_TYPES,
	LAYOUT_FLEX_NODE_TYPE,
	LAYOUT_GRID_NODE_TYPE,
	"Organism.Section",
]);
const REQUIRED_SCREEN_REGION_TYPE_SET = new Set<string>(REQUIRED_SCREEN_REGION_TYPES);

export function validateWireframeSchema(schema: unknown): ValidationResult {
	const result = WireframeSchemaValidator.safeParse(schema);

	if (result.success) {
		return {
			success: true,
			errors: [],
			warnings: [],
			data: result.data,
		};
	}

	return {
		success: false,
		errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
		warnings: [],
	};
}

export function validateWireframeSchemaFull(
	schema: unknown,
	options: ValidateWireframeOptions = {},
): ValidationResult {
	const baseResult = validateWireframeSchema(schema);
	if (!baseResult.success || !baseResult.data) return baseResult;

	const errors: string[] = [];
	const warnings: string[] = [];

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

	return {
		success: errors.length === 0,
		errors,
		warnings,
		data: baseResult.data,
	};
}

export function findDuplicateNodeIds(schema: WireframeSchema): string[] {
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

export function validateScreenRegionContract(schema: WireframeSchema): string[] {
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

export function extractUsedComponentTypes(schema: WireframeSchema): string[] {
	const types = new Set<string>();
	forEachNode(schema.children, (node) => types.add(node.type));
	return Array.from(types).sort();
}

export function findUnregisteredComponents(
	schema: WireframeSchema,
	registry: ComponentRegistry,
): string[] {
	return extractUsedComponentTypes(schema).filter(
		(type) => !BUILT_IN_NODE_TYPES.has(type) && !registry.has(type),
	);
}

function forEachNode(nodes: WireframeNode[], callback: (node: WireframeNode) => void): void {
	for (const node of nodes) {
		callback(node);
		if (node.children) {
			forEachNode(node.children, callback);
		}
	}
}
