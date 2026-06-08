import type { AgentRunResult } from "@cx/agent/contract";
import type {
	ComponentContractCatalog,
	DesignContextBundleSelection,
	PatternLayerCandidate,
} from "@cx/inference-nodes/screen-generation";
import {
	runPatternLayerCandidatesNode,
	runRequiredRegionLayoutRepairNode,
} from "@cx/inference-nodes/screen-generation";
import type { DecorationPlanContract, DesignContextBundleContent, SourceSpec } from "@cx/schema";
import { isRecord } from "@cx/schema";
import type {
	PipelineMarkdownSourceFile,
	ResolvedStepInputs,
	ScreenGenerationComponentCatalogRefs,
	ScreenGenerationLayoutCatalogRefs,
	ScreenGenerationReferences,
	ScreenGenerationSkillBundleRef,
	SideEffectCommandResult,
	SideEffectExecutionResult,
} from "../../public/types";

/** Resolve the SourceSpec from a step's `source` input (parse-source output). */
export function readSourceSpecInput(inputs: ResolvedStepInputs): SourceSpec {
	const source = inputs.source;
	if (isRecord(source) && "sourceShape" in source) return source as SourceSpec;
	if (isRecord(source) && "sourceSpec" in source && isRecord(source.sourceSpec)) {
		return source.sourceSpec as SourceSpec;
	}
	throw new Error("SourceSpec is required but the source input is missing it.");
}

export function buildScreenGenerationPatternLayerCandidates(
	layoutCatalogs: ScreenGenerationLayoutCatalogRefs,
	sourceSpec: SourceSpec,
	decorationPlan?: DecorationPlanContract,
): PatternLayerCandidate[] {
	return runPatternLayerCandidatesNode({
		decorationPlan,
		resolver: {
			resolveComponentLayout: layoutCatalogs.resolveComponentLayout,
			resolveRegionLayout: layoutCatalogs.resolveRegionLayout,
		},
		sourceSpec,
	});
}

export function buildSourceComponentContractCatalog(
	componentCatalogs: ScreenGenerationComponentCatalogRefs,
	sourceSpec: SourceSpec,
	layerCandidates: PatternLayerCandidate[],
): ComponentContractCatalog {
	const entries = sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) =>
			area.children.map((component) => {
				const componentType = component.componentType ?? component.sourceComponentId;
				const componentEntry = componentCatalogs.getEntry(componentType);
				const sourceRefs = [
					...new Set(
						[
							component.sourceId,
							component.roleAlias,
							component.sourceComponentId,
							component.componentType,
						].filter((ref): ref is string => Boolean(ref)),
					),
				];
				const layoutCandidates = layerCandidates
					.filter(
						(candidate) =>
							candidate.level === "component" &&
							sourceRefs.includes(candidate.targetRef) &&
							candidate.layout.startsWith("layout.composite."),
					)
					.map((candidate) => candidate.layout);

				return {
					componentType,
					layoutCandidates,
					props: Object.fromEntries(
						Object.entries(componentEntry?.props ?? {}).map(([propName, contract]) => [
							propName,
							{
								required: contract.required,
								role: contract.role,
								type: contract.type,
								values: contract.values,
							},
						]),
					),
					sourceRefs,
				};
			}),
		),
	);

	// Expose the registry (status-tagged) beyond the source-mapped entries, so the agent
	// may reach for a better-fitting component. Visibility is independent of status;
	// promotion (candidate->stable) only flips the tag, it does not drop the component.
	const entryCanonicalTypes = new Set(
		entries.map(
			(entry) => componentCatalogs.getEntry(entry.componentType)?.type ?? entry.componentType,
		),
	);
	const available = componentCatalogs
		.getTypes()
		.filter((type) => !entryCanonicalTypes.has(type))
		.filter((type) => !type.startsWith("Layout.") && type !== "PageStack")
		.map((type) => {
			const entry = componentCatalogs.getEntry(type);
			return {
				componentType: type,
				status: componentCatalogs.getStatus(type) ?? ("stable" as const),
				props: Object.fromEntries(
					Object.entries(entry?.props ?? {}).map(([propName, contract]) => [
						propName,
						{
							required: contract.required,
							role: contract.role,
							type: contract.type,
							values: contract.values,
						},
					]),
				),
			};
		});

	return available.length > 0 ? { available, entries } : { entries };
}

export function getSourceFileFromReadResult(
	result: SideEffectExecutionResult,
	sourceKind: PipelineMarkdownSourceFile["kind"],
	sourcePath: string,
): PipelineMarkdownSourceFile {
	const readResult = result.commands?.[0];
	const output = readResult ? getSourceReadOutput(readResult) : undefined;

	if (!output) {
		throw new Error(`Pipeline source read did not return content: ${sourcePath}`);
	}

	return {
		content: output.content,
		kind: output.kind ?? sourceKind,
		path: output.path,
	};
}

function getSourceReadOutput(
	result: SideEffectCommandResult,
): Pick<PipelineMarkdownSourceFile, "content" | "kind" | "path"> | undefined {
	if (!isSourceReadOutput(result.output)) return undefined;
	return result.output;
}

function isSourceReadOutput(
	output: unknown,
): output is Pick<PipelineMarkdownSourceFile, "content" | "kind" | "path"> {
	if (!output || typeof output !== "object") return false;

	const candidate = output as Partial<PipelineMarkdownSourceFile>;
	return typeof candidate.content === "string" && typeof candidate.path === "string";
}

export function countSourceAreas(sourceSpec: SourceSpec): number {
	return sourceSpec.sourceShape.screen.regions.reduce(
		(count, region) => count + region.children.length,
		0,
	);
}

export function countSourceComponents(sourceSpec: SourceSpec): number {
	return sourceSpec.sourceShape.screen.regions.reduce(
		(count, region) =>
			count + region.children.reduce((areaCount, area) => areaCount + area.children.length, 0),
		0,
	);
}

export function extractPayloadArtifact(
	payload: unknown,
	key: "renderTree" | "tableGenerationResult",
) {
	if (!isRecord(payload)) return key === "renderTree" ? payload : undefined;
	return payload[key] ?? (key === "renderTree" ? payload : undefined);
}

export async function loadDesignContextBundleContents(
	designContextBundles: ScreenGenerationReferences["designContextBundles"],
	bundleRefs: DesignContextBundleSelection["bundleRefs"] | undefined,
	disableDesignContext: boolean,
): Promise<DesignContextBundleContent[]> {
	if (disableDesignContext) return [];
	return designContextBundles.loadContents(bundleRefs ?? []);
}

export function findGenerationSkill(
	catalog: ScreenGenerationSkillBundleRef[],
	stage: ScreenGenerationSkillBundleRef["stage"],
): ScreenGenerationSkillBundleRef | undefined {
	return catalog.find((skill) => skill.stage === stage);
}

export function repairAgentRunResultPayload(result: AgentRunResult): AgentRunResult {
	return {
		...result,
		payload: runRequiredRegionLayoutRepairNode(result.payload),
	};
}
