import {
	buildDecorationPlan,
	buildDesignContextBundleRefs,
	buildDesignSkillSelection,
	buildGenerationNextAction,
	buildPatternLayerCandidates,
} from "@cx/orchestration";
import type {
	DesignContextBundleSelection,
	GenerationNextAction,
	PatternLayerCandidate,
} from "@cx/orchestration/types";
import type {
	DecorationPlanContract,
	DesignSkillSelectionContract,
	SourceSpec,
	ValidationReportContract,
} from "@cx/schema";

export type ScreenGenerationLayoutResolver = Parameters<
	typeof buildPatternLayerCandidates
>[0]["resolver"];

export function runPatternLayerCandidatesNode(input: {
	decorationPlan?: DecorationPlanContract;
	resolver: ScreenGenerationLayoutResolver;
	sourceSpec: SourceSpec;
}): PatternLayerCandidate[] {
	return buildPatternLayerCandidates(input);
}

export function runDesignSkillSelectionNode(input: {
	layerCandidates: PatternLayerCandidate[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
}): DesignSkillSelectionContract {
	return buildDesignSkillSelection(input);
}

export function runDesignContextBundleRefsNode(input: {
	compositionPlan?: unknown;
	layerCandidates?: PatternLayerCandidate[];
	screenIntent?: unknown;
	sourceSpec: SourceSpec;
	validationReport?: ValidationReportContract;
}): DesignContextBundleSelection {
	return buildDesignContextBundleRefs(input);
}

export function runDecorationPlanNode(input: {
	compositionPlan?: unknown;
	sourceSpec: SourceSpec;
}): DecorationPlanContract {
	return buildDecorationPlan(input);
}

export function runGenerationNextActionNode(input: {
	initialValidationReport?: ValidationReportContract;
	qualityInspection?: unknown;
	retryCount: number;
	validationReport?: ValidationReportContract;
}): GenerationNextAction {
	return buildGenerationNextAction(input);
}

export function runRequiredRegionLayoutRepairNode<T>(payload: T): T {
	const repaired = repairValue(payload);
	return repaired as T;
}

function repairValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(repairValue);
	if (!isRecord(value)) return value;

	const repaired = Object.fromEntries(
		Object.entries(value).map(([key, entry]) => [key, repairValue(entry)]),
	) as Record<string, unknown>;
	const layout = readRequiredRegionLayout(repaired.type);
	if (layout && typeof repaired.layout !== "string") {
		repaired.layout = layout;
	}
	return repaired;
}

function readRequiredRegionLayout(type: unknown): string | undefined {
	if (type === "Screen.Header") return "layout.region.header";
	if (type === "Screen.Contents") return "layout.region.contents";
	if (type === "Screen.Bottom") return "layout.region.bottom";
	return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
