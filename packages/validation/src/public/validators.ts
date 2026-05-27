import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentPropContract,
	ComponentPropType,
} from "@cx/components/types";
import { LAYOUT_NODE_TYPES } from "@cx/layout/types";
import type { PropBinding } from "@cx/renderer";
import type { GenerationArtifactKind } from "@cx/schema";
import { getJsonSchema } from "@cx/schema";
import type { ErrorObject, ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import type {
	ValidationIssue,
	ValidationReport,
	ValidationSeverity,
	ValidationTarget,
} from "./types";

export type ValidationOptions = {
	componentCatalog?: ComponentCatalog;
};

export type ComponentUsageInput = {
	type: string;
	props?: Record<string, unknown>;
};

type Path = Array<string | number>;
type IssueInput = Omit<ValidationIssue, "severity"> & {
	severity?: ValidationSeverity;
};

const STRUCTURAL_NODE_TYPES = new Set<string>([
	...LAYOUT_NODE_TYPES.screenRoot,
	...LAYOUT_NODE_TYPES.screenRegion,
	...LAYOUT_NODE_TYPES.layout,
	"PageStack",
	"area.static",
	"area.dynamic",
]);

const LAYOUT_PROP_CONTRACTS = {
	"Layout.Flex": {
		enumProps: {
			direction: ["row", "column"],
			align: ["start", "center", "end", "stretch"],
			justify: ["start", "center", "end", "between"],
		},
		numberProps: ["gap", "paddingX", "paddingY"],
		stringProps: [],
		booleanProps: [],
		requiredProps: ["direction"],
	},
	"Layout.Grid": {
		enumProps: {
			align: ["start", "center", "end", "stretch"],
			justify: ["start", "center", "end", "stretch"],
		},
		numberProps: ["gap", "paddingX", "paddingY"],
		stringProps: ["columns", "rows"],
		booleanProps: [],
		requiredProps: [],
	},
	"Screen.Header": {
		enumProps: {
			position: ["fixed", "sticky", "static"],
		},
		numberProps: ["height", "zIndex"],
		stringProps: [],
		booleanProps: [],
		requiredProps: ["position", "layout"],
	},
	"Screen.Contents": {
		enumProps: {},
		numberProps: [],
		stringProps: [],
		booleanProps: ["scroll"],
		requiredProps: ["layout", "scroll"],
	},
	"Screen.Bottom": {
		enumProps: {
			position: ["fixed", "sticky", "static"],
		},
		numberProps: ["height", "zIndex"],
		stringProps: [],
		booleanProps: ["safeArea"],
		requiredProps: ["position", "layout"],
	},
} as const;

const COMPONENT_PROP_TYPE_CHECKS = {
	array: Array.isArray,
	boolean: (value: unknown) => typeof value === "boolean",
	enum: (value: unknown) => typeof value === "string",
	node: (value: unknown) => isRecord(value) || Array.isArray(value) || value === null,
	number: (value: unknown) => typeof value === "number" && Number.isFinite(value),
	string: (value: unknown) => typeof value === "string",
} as const satisfies Record<ComponentPropType, (value: unknown) => boolean>;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const schemaValidatorCache = new Map<GenerationArtifactKind, ValidateFunction>();

export function validateSchemaArtifact(
	kind: GenerationArtifactKind,
	input: unknown,
): ValidationReport {
	const issues: ValidationIssue[] = [];
	const value = parseJsonLikeInput(input, issues);
	if (value === undefined) return buildReport("schema-artifact", issues);

	const validate = getSchemaValidator(kind);
	if (validate(value)) return buildReport("schema-artifact", issues);

	for (const error of validate.errors ?? []) {
		addIssue(issues, {
			code: "schema-invalid",
			message: formatSchemaError(error),
			path: parseJsonPointer(error.instancePath),
		});
	}

	return buildReport("schema-artifact", issues);
}

export function validateAgentResult(
	input: unknown,
	options: ValidationOptions = {},
): ValidationReport {
	const issues: ValidationIssue[] = [];
	const value = parseJsonLikeInput(input, issues);
	if (value === undefined) return buildReport("agent-result", issues);

	if (!isRecord(value)) {
		addIssue(issues, {
			code: "json-invalid",
			message: "Agent result must be a JSON object.",
			path: [],
		});
		return buildReport("agent-result", issues);
	}

	collectForbiddenCodeIssues(value, [], issues);

	if ("renderTree" in value) {
		issues.push(...validateRenderTree(value.renderTree, options).issues);
	}

	if ("type" in value && typeof value.type === "string") {
		issues.push(...validateComponentUsage(value as ComponentUsageInput, options).issues);
	}

	return buildReport("agent-result", issues);
}

export function validateComponentUsage(
	input: unknown,
	options: ValidationOptions = {},
): ValidationReport {
	const issues: ValidationIssue[] = [];
	if (!isRecord(input) || typeof input.type !== "string") {
		addIssue(issues, {
			code: "required-field-missing",
			message: "Component usage must include a string type.",
			path: ["type"],
		});
		return buildReport("component-usage", issues);
	}

	const entry = findCatalogEntry(input.type, options.componentCatalog);
	if (!entry) {
		addIssue(issues, {
			code: "unknown-component-type",
			message: `Unknown component type: ${input.type}.`,
			path: ["type"],
		});
		return buildReport("component-usage", issues);
	}

	const props = readProps(input.props, ["props"], issues);
	if (!props) return buildReport("component-usage", issues);

	validatePropsAgainstCatalog(entry, props, ["props"], issues);
	return buildReport("component-usage", issues);
}

export function validateRenderTree(
	input: unknown,
	options: ValidationOptions = {},
): ValidationReport {
	const issues: ValidationIssue[] = [];
	if (!isRecord(input)) {
		addIssue(issues, {
			code: "json-invalid",
			message: "RenderTree must be a JSON object.",
			path: [],
		});
		return buildReport("render-tree", issues);
	}

	if (typeof input.version !== "string" || input.version.length === 0) {
		addIssue(issues, {
			code: "required-field-missing",
			message: "RenderTree version is required.",
			path: ["version"],
		});
	}

	const children = input.children;
	if (!Array.isArray(children)) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "RenderTree children must be an array.",
			path: ["children"],
		});
		return buildReport("render-tree", issues);
	}

	const ids = new Set<string>();
	children.forEach((node, index) => {
		validateNode(node, ["children", index], options, issues, ids);
	});

	if (!children.some((node) => isRecord(node) && node.type === "Screen")) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "RenderTree must include a Screen root node.",
			path: ["children"],
		});
	}

	return buildReport("render-tree", issues);
}

export function validateLayoutProps(input: unknown): ValidationReport {
	const issues: ValidationIssue[] = [];
	if (!isRecord(input) || typeof input.type !== "string") {
		addIssue(issues, {
			code: "required-field-missing",
			message: "Layout validation input must include a string type.",
			path: ["type"],
		});
		return buildReport("layout-props", issues);
	}

	const props = readProps(input.props, ["props"], issues);
	if (!props) return buildReport("layout-props", issues);

	validateLayoutPropsForType(input.type, props, ["props"], issues);
	return buildReport("layout-props", issues);
}

function validateNode(
	input: unknown,
	path: Path,
	options: ValidationOptions,
	issues: ValidationIssue[],
	ids: Set<string>,
) {
	if (!isRecord(input)) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "Render node must be an object.",
			path,
		});
		return;
	}

	if (typeof input.type !== "string" || input.type.length === 0) {
		addIssue(issues, {
			code: "required-field-missing",
			message: "Render node type is required.",
			path: [...path, "type"],
		});
		return;
	}

	if (!canRenderNodeType(input.type, options.componentCatalog)) {
		addIssue(issues, {
			code: "unknown-component-type",
			message: `Render node type is not known to the renderer contract: ${input.type}.`,
			path: [...path, "type"],
		});
	}

	validateNodeMetadata(input, path, issues, ids);
	validateDisplay(input.display, [...path, "display"], issues);

	if ("children" in input && !Array.isArray(input.children)) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "Render node children must be an array when present.",
			path: [...path, "children"],
		});
	}

	const props = "props" in input ? readProps(input.props, [...path, "props"], issues) : {};
	if (props) {
		if (isLayoutType(input.type))
			validateLayoutPropsForType(input.type, props, [...path, "props"], issues);
		const entry = findCatalogEntry(input.type, options.componentCatalog);
		if (entry) validatePropsAgainstCatalog(entry, props, [...path, "props"], issues);
	}

	if (input.type === "Screen") {
		validateScreenStructure(input, path, issues);
	}

	if (Array.isArray(input.children)) {
		input.children.forEach((child, index) => {
			validateNode(child, [...path, "children", index], options, issues, ids);
		});
	}
}

function validateScreenStructure(
	node: Record<string, unknown>,
	path: Path,
	issues: ValidationIssue[],
) {
	const children = node.children;
	const expectedTypes = LAYOUT_NODE_TYPES.screenRegion;

	if (!Array.isArray(children) || children.length !== expectedTypes.length) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "Screen must contain Header, Contents, and Bottom regions.",
			path: [...path, "children"],
		});
		return;
	}

	expectedTypes.forEach((expectedType, index) => {
		const child = children[index];
		if (!isRecord(child) || child.type !== expectedType) {
			addIssue(issues, {
				code: "invalid-render-node",
				message: `Screen region ${index} must be ${expectedType}.`,
				path: [...path, "children", index, "type"],
			});
		}
	});
}

function validateNodeMetadata(
	node: Record<string, unknown>,
	path: Path,
	issues: ValidationIssue[],
	ids: Set<string>,
) {
	if (!isRecord(node.metadata)) {
		addIssue(issues, {
			code: "required-field-missing",
			message: "Render node metadata is required.",
			path: [...path, "metadata"],
		});
		return;
	}

	const id = node.metadata.id;
	if (typeof id !== "string" || id.length === 0) {
		addIssue(issues, {
			code: "required-field-missing",
			message: "Render node metadata.id is required.",
			path: [...path, "metadata", "id"],
		});
		return;
	}

	if (ids.has(id)) {
		addIssue(issues, {
			code: "duplicate-id",
			message: `Duplicate render node id: ${id}.`,
			path: [...path, "metadata", "id"],
		});
	}
	ids.add(id);
}

function validateDisplay(input: unknown, path: Path, issues: ValidationIssue[]) {
	if (input === undefined) return;
	if (typeof input === "boolean") return;
	if (!isRecord(input)) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "Display must be an object when present.",
			path,
		});
		return;
	}

	if ("when" in input) {
		if (isBindingCandidate(input.when)) {
			validateBinding(input.when, [...path, "when"], issues);
		} else if (typeof input.when !== "boolean") {
			addIssue(issues, {
				code: "invalid-render-node",
				message: "Display.when must be a boolean or binding value.",
				path: [...path, "when"],
			});
		}
	}

	if ("stateRole" in input && typeof input.stateRole !== "string") {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "Display.stateRole must be a string.",
			path: [...path, "stateRole"],
		});
	}
}

function validatePropsAgainstCatalog(
	entry: ComponentCatalogEntry,
	props: Record<string, unknown>,
	path: Path,
	issues: ValidationIssue[],
) {
	for (const [propName, contract] of Object.entries(entry.props)) {
		if (contract.required && !(propName in props)) {
			addIssue(issues, {
				code: "required-field-missing",
				message: `${entry.type}.${propName} is required.`,
				path: [...path, propName],
			});
		}
	}

	for (const [propName, value] of Object.entries(props)) {
		const contract = entry.props[propName];
		if (!contract) {
			addIssue(issues, {
				code: "unknown-prop",
				message: `${entry.type}.${propName} is not declared in the component catalog.`,
				path: [...path, propName],
				severity: "warning",
			});
			continue;
		}

		validateComponentPropValue(entry, propName, contract, value, [...path, propName], issues);
	}
}

function validateComponentPropValue(
	entry: ComponentCatalogEntry,
	propName: string,
	contract: ComponentPropContract,
	value: unknown,
	path: Path,
	issues: ValidationIssue[],
) {
	if (contract.aiWritable === false) {
		addIssue(issues, {
			code: "readonly-prop-written",
			message: `${entry.type}.${propName} is not AI-writable.`,
			path,
		});
	}

	if (isBindingCandidate(value)) {
		validateBinding(value, path, issues);
		return;
	}

	if (!COMPONENT_PROP_TYPE_CHECKS[contract.type](value)) {
		addIssue(issues, {
			code: "invalid-prop-type",
			message: `${entry.type}.${propName} must be ${contract.type}.`,
			path,
		});
		return;
	}

	if (
		contract.type === "enum" &&
		contract.values &&
		(typeof value !== "string" || !contract.values.includes(value))
	) {
		addIssue(issues, {
			code: "invalid-enum-value",
			message: `${entry.type}.${propName} must be one of: ${contract.values.join(", ")}.`,
			path,
		});
	}
}

function validateLayoutPropsForType(
	type: string,
	props: Record<string, unknown>,
	path: Path,
	issues: ValidationIssue[],
) {
	if (!isRecord(props)) {
		addIssue(issues, {
			code: "invalid-layout-prop",
			message: `${type} props must be an object.`,
			path,
		});
		return;
	}

	const contract = LAYOUT_PROP_CONTRACTS[type as keyof typeof LAYOUT_PROP_CONTRACTS];
	if (!contract) {
		addIssue(issues, {
			code: "invalid-layout-prop",
			message: `Unsupported layout prop contract for ${type}.`,
			path,
		});
		return;
	}

	for (const propName of contract.requiredProps) {
		if (!(propName in props)) {
			addIssue(issues, {
				code: "required-field-missing",
				message: `${type}.${propName} is required.`,
				path: [...path, propName],
			});
		}
	}

	validateEnumProps(type, props, contract.enumProps, path, issues);
	validateTypedProps(type, props, contract.numberProps, "number", path, issues);
	validateTypedProps(type, props, contract.stringProps, "string", path, issues);
	validateTypedProps(type, props, contract.booleanProps, "boolean", path, issues);

	if ("layout" in props) {
		validateLayoutPropsForType(
			"Layout.Flex",
			props.layout as Record<string, unknown>,
			[...path, "layout"],
			issues,
		);
	}
}

function validateEnumProps(
	type: string,
	props: Record<string, unknown>,
	enumProps: Record<string, readonly string[]>,
	path: Path,
	issues: ValidationIssue[],
) {
	for (const [propName, values] of Object.entries(enumProps)) {
		const value = props[propName];
		if (value === undefined) continue;
		if (typeof value !== "string" || !values.includes(value)) {
			addIssue(issues, {
				code: "invalid-enum-value",
				message: `${type}.${propName} must be one of: ${values.join(", ")}.`,
				path: [...path, propName],
			});
		}
	}
}

function validateTypedProps(
	type: string,
	props: Record<string, unknown>,
	propNames: readonly string[],
	expectedType: "boolean" | "number" | "string",
	path: Path,
	issues: ValidationIssue[],
) {
	for (const propName of propNames) {
		const value = props[propName];
		if (value === undefined) continue;
		if (typeof value !== expectedType || (expectedType === "number" && !Number.isFinite(value))) {
			addIssue(issues, {
				code: "invalid-layout-prop",
				message: `${type}.${propName} must be a ${expectedType}.`,
				path: [...path, propName],
			});
		}
	}
}

function validateBinding(input: PropBinding, path: Path, issues: ValidationIssue[]) {
	if (typeof input.bind !== "string" || input.bind.length === 0) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "Binding bind path must be a non-empty string.",
			path: [...path, "bind"],
		});
	}

	if ("default" in input && !isSafeDefaultValue(input.default)) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "Binding default must be a primitive value or null.",
			path: [...path, "default"],
		});
	}
}

function parseJsonLikeInput(input: unknown, issues: ValidationIssue[]) {
	if (typeof input !== "string") return input;
	try {
		return JSON.parse(input) as unknown;
	} catch {
		addIssue(issues, {
			code: "json-invalid",
			message: "Agent result must be valid JSON.",
			path: [],
		});
		return undefined;
	}
}

function collectForbiddenCodeIssues(input: unknown, path: Path, issues: ValidationIssue[]) {
	if (typeof input === "string") {
		const hasMarkup = /<\/?[a-z][\s\S]*>/i.test(input);
		const hasCode = /\b(import|export|function|const|let|var|className|style=|return\s*\()/u.test(
			input,
		);
		if (hasMarkup || hasCode) {
			addIssue(issues, {
				code: "invalid-render-node",
				message: "Agent result must not contain free HTML, CSS, or React code.",
				path,
			});
		}
		return;
	}

	if (Array.isArray(input)) {
		input.forEach((item, index) => {
			collectForbiddenCodeIssues(item, [...path, index], issues);
		});
		return;
	}

	if (!isRecord(input)) return;
	for (const [key, value] of Object.entries(input)) {
		collectForbiddenCodeIssues(value, [...path, key], issues);
	}
}

function canRenderNodeType(type: string, catalog?: ComponentCatalog) {
	return STRUCTURAL_NODE_TYPES.has(type) || Boolean(findCatalogEntry(type, catalog));
}

function findCatalogEntry(
	type: string,
	catalog?: ComponentCatalog,
): ComponentCatalogEntry | undefined {
	if (!catalog) return undefined;
	if (catalog[type]) return catalog[type];
	return Object.values(catalog).find((entry) => entry.aliases?.includes(type));
}

function readProps(
	input: unknown,
	path: Path,
	issues: ValidationIssue[],
): Record<string, unknown> | undefined {
	if (input === undefined) return {};
	if (isRecord(input)) return input;
	addIssue(issues, {
		code: "invalid-prop-type",
		message: "Props must be an object when present.",
		path,
	});
	return undefined;
}

function isLayoutType(type: string) {
	return type in LAYOUT_PROP_CONTRACTS;
}

function isBindingCandidate(input: unknown): input is PropBinding {
	return isRecord(input) && "bind" in input;
}

function isSafeDefaultValue(input: unknown) {
	return (
		input === null ||
		typeof input === "string" ||
		typeof input === "number" ||
		typeof input === "boolean"
	);
}

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}

function addIssue(issues: ValidationIssue[], issue: IssueInput) {
	issues.push({
		severity: "error",
		...issue,
	});
}

function buildReport(target: ValidationTarget, issues: ValidationIssue[]): ValidationReport {
	const errorCount = issues.filter((issue) => issue.severity === "error").length;
	const warningCount = issues.filter((issue) => issue.severity === "warning").length;
	return {
		issues,
		ok: errorCount === 0,
		summary: {
			errorCount,
			warningCount,
		},
		target,
	};
}

function getSchemaValidator(kind: GenerationArtifactKind): ValidateFunction {
	const cached = schemaValidatorCache.get(kind);
	if (cached) return cached;
	const validate = ajv.compile(getJsonSchema(kind));
	schemaValidatorCache.set(kind, validate);
	return validate;
}

function formatSchemaError(error: ErrorObject) {
	const propertySuffix =
		error.keyword === "additionalProperties" &&
		isRecord(error.params) &&
		typeof error.params.additionalProperty === "string"
			? `: ${error.params.additionalProperty}`
			: "";
	return `${error.message ?? "Schema validation failed"}${propertySuffix}.`;
}

function parseJsonPointer(pointer: string): Path {
	if (!pointer) return [];
	return pointer
		.slice(1)
		.split("/")
		.map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
		.map((segment) => (/^\d+$/u.test(segment) ? Number(segment) : segment));
}
