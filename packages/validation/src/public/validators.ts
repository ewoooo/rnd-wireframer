import { canonicalizeComponentType, getComponentCatalogStatus } from "@cx/external/resolver";
import {
	getLayoutCatalogEntry,
	getLayoutNodeTypeContract,
	isLayoutNodeType,
} from "@cx/layout/resolver";
import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentPropType,
	GenerationArtifactKind,
	JsonSchemaDocument,
	SchemaPropBinding,
	SourceSpec,
} from "@cx/schema";
import {
	getJsonSchema,
	isRecord,
	RENDER_TREE_NODE_TYPE,
	RENDER_TREE_NODE_TYPE_GROUPS,
} from "@cx/schema";
import type { ErrorObject, ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import type { RuleContext } from "../rules/define-rule";
import { QUALITY_RULES } from "../rules/index";
import {
	collectMaterializationSourceRefs,
	collectSourceRefLabelIndex,
	collectSourceSpecRefs,
	refIsMaterialized,
	STATE_COVERAGE_TERMS,
	STATEFUL_SURFACE_TERMS,
} from "../rules/source-spec";
import { VALIDATION_CODE_REGISTRY } from "./registry";
import type { ValidationIssue, ValidationReport, ValidationTarget } from "./types";

export type ValidationOptions = {
	allowedLayoutIds?: string[];
	componentCatalog?: ComponentCatalog;
	generatedArtifact?: unknown;
	sourceSpec?: SourceSpec;
};

export type CompositionPlanValidationOptions = {
	generatedArtifact?: unknown;
	sourceSpec?: SourceSpec;
};

export type ComponentUsageInput = {
	type: string;
	props?: Record<string, unknown>;
};

type Path = Array<string | number>;
type IssueInput = Omit<ValidationIssue, "severity">;

const STRUCTURAL_NODE_TYPES = new Set<string>([
	...RENDER_TREE_NODE_TYPE_GROUPS.screenRoot,
	...RENDER_TREE_NODE_TYPE_GROUPS.screenRegion,
	...RENDER_TREE_NODE_TYPE_GROUPS.layout,
	...RENDER_TREE_NODE_TYPE_GROUPS.wrapper,
	...RENDER_TREE_NODE_TYPE_GROUPS.area,
]);

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

export function validateJsonSchema(
	schema: JsonSchemaDocument,
	input: unknown,
	target: ValidationTarget = "output-contract",
): ValidationReport {
	const issues: ValidationIssue[] = [];
	const value = parseJsonLikeInput(input, issues);
	if (value === undefined) return buildReport(target, issues);

	const validate = ajv.compile(schema);
	if (validate(value)) return buildReport(target, issues);

	for (const error of validate.errors ?? []) {
		addIssue(issues, {
			code: "schema-invalid",
			message: formatSchemaError(error),
			path: parseJsonPointer(error.instancePath),
		});
	}

	return buildReport(target, issues);
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

	if ("tableGenerationResult" in value) {
		issues.push(...validateTableGenerationResult(value.tableGenerationResult).issues);
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

	if (!children.some((node) => isRecord(node) && node.type === RENDER_TREE_NODE_TYPE.screen)) {
		addIssue(issues, {
			code: "invalid-render-node",
			message: "RenderTree must include a Screen root node.",
			path: ["children"],
		});
	}

	validateLayoutCandidateCoverage(input, [], options.allowedLayoutIds, issues);
	validateSourceRefCoverage(options.sourceSpec, options.generatedArtifact ?? input, issues);
	validateStateCoverage(options.sourceSpec, options.generatedArtifact ?? input, issues);
	runQualityRules(
		"render-tree",
		{
			artifact: options.generatedArtifact ?? input,
			sourceSpec: options.sourceSpec,
			tree: input,
		},
		issues,
	);

	return buildReport("render-tree", issues);
}

function runQualityRules(
	target: ValidationTarget,
	ctx: Omit<RuleContext, "report">,
	issues: ValidationIssue[],
) {
	for (const rule of QUALITY_RULES) {
		if (rule.target !== target) continue;
		if (rule.requires?.includes("sourceSpec") && !ctx.sourceSpec) continue;
		rule.check({
			...ctx,
			report: (issue) => addIssue(issues, { code: rule.code, ...issue }),
		});
	}
}

export function validateTableGenerationResult(
	input: unknown,
	options: Pick<ValidationOptions, "allowedLayoutIds"> = {},
): ValidationReport {
	const schemaReport = validateSchemaArtifact("table-generation-result", input);
	const issues = [...schemaReport.issues];
	const value = parseJsonLikeInput(input, issues);
	if (!isRecord(value)) return buildReport("table-generation-result", issues);

	validateLayoutRef(value.screen, "screen", ["screen", "layout"], issues);
	validateRegionLayoutRef(value, "header", issues);
	validateRegionLayoutRef(value, "contents", issues);
	validateRegionLayoutRef(value, "bottom", issues);

	if (Array.isArray(value.areas)) {
		value.areas.forEach((area, index) => {
			validateLayoutRef(area, "area", ["areas", index, "layout"], issues);
		});
	}

	if (Array.isArray(value.components)) {
		value.components.forEach((component, index) => {
			validateLayoutRef(component, "composite", ["components", index, "layout"], issues);
		});
	}

	validateLayoutCandidateCoverage(input, [], options.allowedLayoutIds, issues);

	return buildReport("table-generation-result", issues);
}

export function validateCompositionPlan(
	input: unknown,
	options: CompositionPlanValidationOptions = {},
): ValidationReport {
	const schemaReport = validateSchemaArtifact("composition-plan", input);
	const issues = [...schemaReport.issues];
	const value = parseJsonLikeInput(input, issues);
	if (!isRecord(value)) return buildReport("composition-plan", issues);

	validateCompositionPlanSourceRefs(value, options.sourceSpec, issues);
	validateCompositionPlanMaterialization(
		value,
		options.generatedArtifact,
		options.sourceSpec,
		issues,
	);

	return buildReport("composition-plan", issues);
}

export type ComponentProposalValidationOptions = {
	allowedRefs?: string[];
	catalogComponentTypes?: string[];
	maxProposals?: number;
};

/**
 * Validates a non-binding component-proposal artifact stays bounded.
 * 근거(allowedRefs)·최근접 카탈로그 매치·개수 상한을 확인할 뿐, 카탈로그를 반영하지 않는다.
 */
export function validateComponentProposal(
	input: unknown,
	options: ComponentProposalValidationOptions = {},
): ValidationReport {
	const schemaReport = validateSchemaArtifact("component-proposal", input);
	const issues = [...schemaReport.issues];
	const value = parseJsonLikeInput(input, issues);
	if (!isRecord(value)) return buildReport("component-proposal", issues);

	const proposals = Array.isArray(value.proposals) ? value.proposals : [];
	const maxProposals = options.maxProposals ?? 5;
	if (proposals.length > maxProposals) {
		addIssue(issues, {
			code: "proposal-limit-exceeded",
			message: `component-proposal returned ${proposals.length} proposals but at most ${maxProposals} are allowed.`,
			path: ["proposals"],
		});
	}

	const allowedRefs = options.allowedRefs ? new Set(options.allowedRefs) : undefined;
	const catalogTypes = options.catalogComponentTypes
		? new Set(options.catalogComponentTypes)
		: undefined;

	proposals.forEach((proposal, proposalIndex) => {
		if (!isRecord(proposal)) return;

		if (allowedRefs) {
			const evidence = Array.isArray(proposal.sourceEvidence) ? proposal.sourceEvidence : [];
			evidence.forEach((ref, refIndex) => {
				if (typeof ref !== "string" || allowedRefs.has(ref)) return;
				addIssue(issues, {
					code: "proposal-source-evidence-missing",
					message: `Component proposal sourceEvidence is not in allowedRefs: ${ref}.`,
					path: ["proposals", proposalIndex, "sourceEvidence", refIndex],
				});
			});
		}

		if (
			catalogTypes &&
			typeof proposal.nearestCatalogMatch === "string" &&
			!catalogTypes.has(proposal.nearestCatalogMatch)
		) {
			addIssue(issues, {
				code: "proposal-nearest-match-unknown",
				message: `Component proposal nearestCatalogMatch is not a catalog component type: ${proposal.nearestCatalogMatch}.`,
				path: ["proposals", proposalIndex, "nearestCatalogMatch"],
			});
		}
	});

	return buildReport("component-proposal", issues);
}

function validateCompositionPlanSourceRefs(
	input: Record<string, unknown>,
	sourceSpec: SourceSpec | undefined,
	issues: ValidationIssue[],
) {
	if (!sourceSpec) return;
	const availableRefs = collectSourceSpecRefs(sourceSpec);
	const sections = Array.isArray(input.sections) ? input.sections : [];

	sections.forEach((section, sectionIndex) => {
		if (!isRecord(section) || !Array.isArray(section.sourceRefs)) return;
		section.sourceRefs.forEach((sourceRef, sourceRefIndex) => {
			if (typeof sourceRef !== "string" || sourceRef.length === 0) return;
			if (availableRefs.has(sourceRef)) return;
			addIssue(issues, {
				code: "unknown-source-ref",
				message: `CompositionPlan sourceRef does not exist in SourceSpec: ${sourceRef}.`,
				path: ["sections", sectionIndex, "sourceRefs", sourceRefIndex],
				// sourceRef는 plan의 추적 메타데이터일 뿐 RenderTree 정합성이 아니다.
				// 형식 변덕(짧은 ID ↔ JSONPath)으로 완성된 화면을 hard-fail시키지 않도록
				// source-ref-not-materialized와 동일하게 warning으로 표시한다.
			});
		});
	});
}

function validateCompositionPlanMaterialization(
	input: Record<string, unknown>,
	generatedArtifact: unknown,
	sourceSpec: SourceSpec | undefined,
	issues: ValidationIssue[],
) {
	if (generatedArtifact === undefined) return;
	const generatedText = JSON.stringify(generatedArtifact);
	const labelIndex = sourceSpec
		? collectSourceRefLabelIndex(sourceSpec)
		: new Map<string, string[]>();
	const sections = Array.isArray(input.sections) ? input.sections : [];

	sections.forEach((section, sectionIndex) => {
		if (!isRecord(section) || !Array.isArray(section.sourceRefs)) return;
		section.sourceRefs.forEach((sourceRef, sourceRefIndex) => {
			if (typeof sourceRef !== "string" || sourceRef.length === 0) return;
			if (refIsMaterialized(sourceRef, generatedText, labelIndex)) return;
			addIssue(issues, {
				code: "source-ref-not-materialized",
				message: `CompositionPlan sourceRef is not visible in generated artifact: ${sourceRef}.`,
				path: ["sections", sectionIndex, "sourceRefs", sourceRefIndex],
			});
		});
	});
}

function validateSourceRefCoverage(
	sourceSpec: SourceSpec | undefined,
	generatedArtifact: unknown,
	issues: ValidationIssue[],
) {
	if (!sourceSpec) return;
	const generatedText = JSON.stringify(generatedArtifact);
	const labelIndex = collectSourceRefLabelIndex(sourceSpec);
	const sourceRefs = collectMaterializationSourceRefs(sourceSpec);

	sourceRefs.forEach((sourceRef) => {
		if (refIsMaterialized(sourceRef, generatedText, labelIndex)) return;
		addIssue(issues, {
			code: "source-ref-not-materialized",
			message: `SourceSpec ref is not visible in generated artifact: ${sourceRef}.`,
			path: [],
		});
	});
}

function validateStateCoverage(
	sourceSpec: SourceSpec | undefined,
	generatedArtifact: unknown,
	issues: ValidationIssue[],
) {
	if (!sourceSpec || !needsStateCoverage(sourceSpec)) return;
	const generatedText = JSON.stringify(generatedArtifact).toLowerCase();
	const hasStateRole = STATE_COVERAGE_TERMS.some((term) => generatedText.includes(term));
	if (hasStateRole) return;

	addIssue(issues, {
		code: "state-coverage-missing",
		message:
			"SourceSpec implies a stateful surface, but generated artifact does not expose loading, empty, error, disabled, or validation state coverage.",
		path: [],
	});
}

function needsStateCoverage(sourceSpec: SourceSpec): boolean {
	const sourceText = JSON.stringify(sourceSpec).toLowerCase();
	return STATEFUL_SURFACE_TERMS.some((term) => sourceText.includes(term));
}

function validateLayoutCandidateCoverage(
	input: unknown,
	path: Path,
	allowedLayoutIds: string[] | undefined,
	issues: ValidationIssue[],
) {
	if (!allowedLayoutIds || allowedLayoutIds.length === 0) return;
	const allowed = new Set(allowedLayoutIds);
	collectLayoutRefs(input, path).forEach((layoutRef) => {
		if (allowed.has(layoutRef.layout)) return;
		addIssue(issues, {
			code: "layout-ref-outside-candidates",
			message: `Layout ref is outside selected pattern candidates: ${layoutRef.layout}.`,
			path: layoutRef.path,
		});
	});
}

function collectLayoutRefs(input: unknown, path: Path): Array<{ layout: string; path: Path }> {
	if (Array.isArray(input)) {
		return input.flatMap((item, index) => collectLayoutRefs(item, [...path, index]));
	}
	if (!isRecord(input)) return [];

	const current =
		typeof input.layout === "string" ? [{ layout: input.layout, path: [...path, "layout"] }] : [];
	return [
		...current,
		...Object.entries(input).flatMap(([key, value]) => {
			if (key === "layout") return [];
			return collectLayoutRefs(value, [...path, key]);
		}),
	];
}

function validateRegionLayoutRef(
	input: Record<string, unknown>,
	region: "bottom" | "contents" | "header",
	issues: ValidationIssue[],
) {
	const screen = isRecord(input.screen) ? input.screen : undefined;
	const regions =
		isRecord(screen?.screen) && isRecord(screen.screen.regions) ? screen.screen.regions : undefined;
	const regionRecord = isRecord(regions?.[region]) ? regions[region] : undefined;
	validateLayoutRef(
		regionRecord,
		"region",
		["screen", "screen", "regions", region, "layout"],
		issues,
	);
}

function validateLayoutRef(
	input: unknown,
	target: "area" | "composite" | "region" | "screen",
	path: Path,
	issues: ValidationIssue[],
) {
	if (!isRecord(input)) return;
	const layout = input.layout;
	if (typeof layout !== "string" || layout.length === 0) return;

	const resolved = findLayoutPatternComponentByLayoutId(layout);
	if (!resolved || resolved.target !== target) {
		addIssue(issues, {
			code: "unknown-layout-ref",
			message: `Unknown ${target} layout ref: ${layout}.`,
			path,
		});
		return;
	}
}

function findLayoutPatternComponentByLayoutId(layoutId: string) {
	return getLayoutCatalogEntry(layoutId);
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

	const hasKnownLayout =
		typeof input.layout === "string" && findLayoutPatternComponentByLayoutId(input.layout);
	const hasRenderableChildren = Array.isArray(input.children) && input.children.length > 0;

	if (
		!canRenderNodeType(input.type, options.componentCatalog) &&
		!(hasKnownLayout && hasRenderableChildren)
	) {
		addIssue(issues, {
			code: "unknown-component-type",
			message: `Render node type is not known to the renderer contract: ${input.type}.`,
			path: [...path, "type"],
		});
	}

	if (
		getComponentCatalogStatus(canonicalizeComponentType(input.type) ?? input.type) === "candidate"
	) {
		addIssue(issues, {
			code: "uses-candidate-component",
			message: `Component '${input.type}' is a catalog candidate, not yet promoted to stable.`,
			path: [...path, "type"],
		});
	}

	validateNodeMetadata(input, path, issues, ids);
	validateDisplay(input.display, [...path, "display"], issues);
	validateRequiredLayoutPatternForNode(input.type, input.layout, [...path, "layout"], issues);
	validateLayoutPatternIdForNode(input.type, input.layout, [...path, "layout"], issues);

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
		validateListTextVisibleTextProps(input.type, props, [...path, "props"], issues);
	}

	if (input.type === RENDER_TREE_NODE_TYPE.screen) {
		validateScreenStructure(input, path, issues);
	}

	if (Array.isArray(input.children)) {
		input.children.forEach((child, index) => {
			validateNode(child, [...path, "children", index], options, issues, ids);
		});
	}
}

function validateListTextVisibleTextProps(
	nodeType: string,
	props: Record<string, unknown>,
	path: Path,
	issues: ValidationIssue[],
) {
	if (nodeType !== "ListText") return;
	const table = props.table;
	const hasTitle = typeof props.title === "string" && props.title.length > 0;
	const hasSubText = typeof props.subText === "string" && props.subText.length > 0;
	if (table !== "dot" || !hasTitle || hasSubText) return;

	addIssue(issues, {
		code: "list-text-dot-subtext-missing",
		message:
			"ListText dot rows render subText as the visible row text, but this node only provides title.",
		path,
	});
}

function validateLayoutPatternIdForNode(
	nodeType: string,
	input: unknown,
	path: Path,
	issues: ValidationIssue[],
) {
	if (input === undefined) return;
	if (typeof input !== "string" || input.length === 0) {
		addIssue(issues, {
			code: "unknown-layout-ref",
			message: "Layout pattern id must be a non-empty string.",
			path,
		});
		return;
	}

	const resolved = findLayoutPatternComponentByLayoutId(input);
	if (!resolved) {
		addIssue(issues, {
			code: "unknown-layout-ref",
			message: `Unknown layout pattern id: ${input}.`,
			path,
		});
		return;
	}

	const expectedTarget = getExpectedLayoutTargetForNodeType(nodeType);
	if (expectedTarget && resolved.target !== expectedTarget) {
		addIssue(issues, {
			code: "unknown-layout-ref",
			message: `${nodeType} nodes must use layout.${expectedTarget}.* refs, but received ${input}.`,
			path,
		});
	}
}

function validateRequiredLayoutPatternForNode(
	nodeType: string,
	input: unknown,
	path: Path,
	issues: ValidationIssue[],
) {
	if (input !== undefined) return;
	const expectedTarget = getExpectedLayoutTargetForNodeType(nodeType);
	if (!expectedTarget) return;

	addIssue(issues, {
		code: "required-field-missing",
		message: `${nodeType} nodes must include a layout.${expectedTarget}.* ref.`,
		path,
	});
}

function getExpectedLayoutTargetForNodeType(
	nodeType: string,
): "area" | "composite" | "region" | "screen" | undefined {
	if (nodeType === RENDER_TREE_NODE_TYPE.screen) return "screen";
	if (RENDER_TREE_NODE_TYPE_GROUPS.screenRegion.some((regionType) => regionType === nodeType))
		return "region";
	if (nodeType.startsWith("area.")) return "area";
	if (RENDER_TREE_NODE_TYPE_GROUPS.layout.some((layoutType) => layoutType === nodeType))
		return undefined;
	return "composite";
}

function validateScreenStructure(
	node: Record<string, unknown>,
	path: Path,
	issues: ValidationIssue[],
) {
	const children = node.children;
	const expectedTypes = RENDER_TREE_NODE_TYPE_GROUPS.screenRegion;

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

	const title = node.metadata.title;
	if (typeof title === "string" && isInternalVisibleTitle(title)) {
		addIssue(issues, {
			code: "internal-visible-title",
			message: `Render node metadata.title looks like an internal source name: ${title}.`,
			path: [...path, "metadata", "title"],
		});
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

function isInternalVisibleTitle(value: string): boolean {
	return /(?:Section|Component)$/.test(value);
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

// 컴포넌트 catalog·layout 노드 타입·layout 패턴이 공유하는 단일 prop-contract 모양.
type PropTypeContract = {
	type: string;
	values?: readonly string[];
	aiWritable?: boolean;
	required?: boolean;
};

// external/layout 어느 catalog에서 왔든 prop 계약은 이 한 함수로 검증한다.
function validatePropsAgainstContract(
	label: string,
	contract: Record<string, PropTypeContract>,
	props: Record<string, unknown>,
	path: Path,
	issues: ValidationIssue[],
) {
	for (const [propName, propContract] of Object.entries(contract)) {
		if (propContract.required && !(propName in props)) {
			addIssue(issues, {
				code: "required-field-missing",
				message: `${label}.${propName} is required.`,
				path: [...path, propName],
			});
		}
	}

	for (const [propName, value] of Object.entries(props)) {
		const propContract = contract[propName];
		if (!propContract) {
			addIssue(issues, {
				code: "unknown-prop",
				message: `${label}.${propName} is not declared in the catalog.`,
				path: [...path, propName],
			});
			continue;
		}

		validatePropValue(label, propName, propContract, value, [...path, propName], issues);
	}
}

function validatePropsAgainstCatalog(
	entry: ComponentCatalogEntry,
	props: Record<string, unknown>,
	path: Path,
	issues: ValidationIssue[],
) {
	validatePropsAgainstContract(entry.type, entry.props, props, path, issues);
}

function validatePropValue(
	label: string,
	propName: string,
	contract: PropTypeContract,
	value: unknown,
	path: Path,
	issues: ValidationIssue[],
) {
	if (contract.aiWritable === false) {
		addIssue(issues, {
			code: "readonly-prop-written",
			message: `${label}.${propName} is not AI-writable.`,
			path,
		});
	}

	if (isBindingCandidate(value)) {
		validateBinding(value, path, issues);
		return;
	}

	const check = COMPONENT_PROP_TYPE_CHECKS[contract.type as ComponentPropType];
	if (check && !check(value)) {
		addIssue(issues, {
			code: "invalid-prop-type",
			message: `${label}.${propName} must be ${contract.type}.`,
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
			message: `${label}.${propName} must be one of: ${contract.values.join(", ")}.`,
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

	const contract = getLayoutNodeTypeContract(type);
	if (!contract) {
		addIssue(issues, {
			code: "invalid-layout-prop",
			message: `Unsupported layout prop contract for ${type}.`,
			path,
		});
		return;
	}

	// 중첩 layout(Flex) prop은 구조 prop이라 catalog 계약 밖이다 → unknown-prop 제외 후 별도 검증.
	const { layout: nestedLayout, ...declaredProps } = props;
	validatePropsAgainstContract(type, contract, declaredProps, path, issues);

	if ("layout" in props) {
		validateLayoutPropsForType(
			RENDER_TREE_NODE_TYPE.layoutFlex,
			nestedLayout as Record<string, unknown>,
			[...path, "layout"],
			issues,
		);
	}
}

function validateBinding(input: SchemaPropBinding, path: Path, issues: ValidationIssue[]) {
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
	const canonicalType = canonicalizeComponentType(type, catalog);
	return canonicalType ? catalog[canonicalType] : undefined;
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
	return isLayoutNodeType(type);
}

function isBindingCandidate(input: unknown): input is SchemaPropBinding {
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
function addIssue(issues: ValidationIssue[], issue: IssueInput) {
	issues.push({
		severity: VALIDATION_CODE_REGISTRY[issue.code].severity,
		...issue,
	});
}

function buildReport(target: ValidationTarget, issues: ValidationIssue[]): ValidationReport {
	const errorCount = issues.reduce(
		(count, issue) => (issue.severity === "error" ? count + 1 : count),
		0,
	);
	const warningCount = issues.length - errorCount;
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
