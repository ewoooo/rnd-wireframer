import {
	resolveCompositePatternByComponentType,
	resolveRegionPatternFromScreenPattern,
} from "@cx/layout-pattern-store/resolver";
import type { PatternLayerCandidate } from "@cx/orchestration/types";
import type { SourceSpec, SourceSpecRegionSlot } from "@cx/schema";

export function resolveSmokePatternLayerCandidates(
	sourceSpec: SourceSpec,
): PatternLayerCandidate[] {
	return [
		createScreenLayerCandidate(sourceSpec),
		...sourceSpec.sourceShape.screen.regions.map((region) =>
			createRegionLayerCandidate({
				screenPattern: { id: "commerce-detail-screen", variant: "default" },
				slot: region.slot,
				sourceScreenId: sourceSpec.sourceShape.screen.screenCode,
			}),
		),
		...sourceSpec.sourceShape.screen.regions.flatMap((region) =>
			region.children.flatMap((area) => [
				createAreaLayerCandidate({
					componentCount: area.children.length,
					sourceAreaId: area.sourceAreaId,
					slot: region.slot,
				}),
				...area.children.map((component) =>
					createComponentLayerCandidate({
						sourceAreaId: area.sourceAreaId,
						sourceComponentId: component.sourceComponentId,
					}),
				),
			]),
		),
	];
}

function createScreenLayerCandidate(sourceSpec: SourceSpec): PatternLayerCandidate {
	const slots = sourceSpec.sourceShape.screen.regions.map((region) => region.slot).join(", ");

	return {
		constraints: [
			"Use one Screen root node.",
			"Keep source region order when arranging Screen.Header, Screen.Contents, and Screen.Bottom.",
		],
		id: "layer.screen.composition",
		level: "screen",
		pattern: {
			id: "commerce-detail-screen",
			target: "screen",
			variant: "default",
		},
		reason: `SourceSpec contains screen regions: ${slots || "none"}.`,
		targetRef: sourceSpec.sourceShape.screen.screenCode,
		title: "Screen composition layer",
	};
}

function createRegionLayerCandidate(input: {
	screenPattern: { id: string; variant?: string };
	slot: SourceSpecRegionSlot;
	sourceScreenId: string;
}): PatternLayerCandidate {
	const typeBySlot = {
		bottom: "Screen.Bottom",
		contents: "Screen.Contents",
		header: "Screen.Header",
		unknown: "Screen.Contents",
	} as const satisfies Record<
		SourceSpecRegionSlot,
		"Screen.Bottom" | "Screen.Contents" | "Screen.Header"
	>;
	const fallbackByType = {
		"Screen.Bottom": { id: "commerce-detail-bottom-action", variant: "default" },
		"Screen.Contents": { id: "subscription-detail-rich-content", variant: "default" },
		"Screen.Header": { id: "plain-stack", variant: "default" },
	} as const;
	const type = typeBySlot[input.slot];
	const pattern = resolveRegionPatternFromScreenPattern({
		compositionText: input.slot,
		fallbackByType,
		screenPattern: input.screenPattern,
		type,
	});

	return {
		constraints: [`Apply ${type} region structure before area placement.`],
		id: `layer.region.${input.slot}`,
		level: "region",
		pattern: {
			id: pattern.id,
			target: "region",
			variant: pattern.variant,
		},
		reason: `${input.slot} region belongs to ${input.sourceScreenId}.`,
		targetRef: input.slot,
		title: `${input.slot} region layer`,
	};
}

function createAreaLayerCandidate(input: {
	componentCount: number;
	slot: SourceSpecRegionSlot;
	sourceAreaId: string;
}): PatternLayerCandidate {
	return {
		constraints: [
			"Keep components from the same source area grouped together.",
			"Preserve component order from SourceSpec unless validation requires a structural wrapper.",
		],
		id: `layer.area.${input.sourceAreaId}`,
		level: "area",
		pattern: {
			id: input.slot === "header" ? "area-app-bar" : "product-hero-summary",
			target: "area",
			variant: "default",
		},
		reason: `Area ${input.sourceAreaId} belongs to ${input.slot} and contains ${input.componentCount} component(s).`,
		targetRef: input.sourceAreaId,
		title: `Area ${input.sourceAreaId} layer`,
	};
}

function createComponentLayerCandidate(input: {
	sourceAreaId: string;
	sourceComponentId: string;
}): PatternLayerCandidate {
	const pattern = resolveCompositePatternByComponentType(input.sourceComponentId) ?? {
		id: "component-section-message",
		variant: "default",
	};

	return {
		constraints: ["Use the selected composite pattern as component table pattern provenance."],
		id: `layer.component.${input.sourceAreaId}.${input.sourceComponentId}`,
		level: "component",
		pattern: {
			id: pattern.id,
			target: "composite",
			variant: pattern.variant,
		},
		reason: `Component ${input.sourceComponentId} belongs to area ${input.sourceAreaId}.`,
		targetRef: input.sourceComponentId,
		title: `Component ${input.sourceComponentId} layer`,
	};
}
