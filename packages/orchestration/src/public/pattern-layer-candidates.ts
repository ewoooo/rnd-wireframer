import type { SourceSpec, SourceSpecRegionSlot } from "@cx/schema";
import type { PatternLayerCandidate } from "./types";

type LayoutId = string;

export type PatternLayerCandidateResolver = {
	resolveComponentLayout(input: {
		componentType?: string;
		sourceComponentId: string;
		sourceId?: string;
	}): LayoutId | undefined;
	resolveRegionLayout(input: {
		compositionText: string;
		fallbackByType: Record<"Screen.Bottom" | "Screen.Contents" | "Screen.Header", LayoutId>;
		screenLayout: LayoutId;
		type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header";
	}): LayoutId;
};

export function buildPatternLayerCandidates(input: {
	resolver: PatternLayerCandidateResolver;
	sourceSpec: SourceSpec;
}): PatternLayerCandidate[] {
	return [
		createScreenLayerCandidate(input.sourceSpec),
		...input.sourceSpec.sourceShape.screen.regions.map((region) =>
			createRegionLayerCandidate({
				resolver: input.resolver,
				slot: region.slot,
				sourceScreenId: input.sourceSpec.sourceShape.screen.screenCode,
			}),
		),
		...input.sourceSpec.sourceShape.screen.regions.flatMap((region) =>
			region.children.flatMap((area) => [
				createAreaLayerCandidate({
					areaType: area.areaType,
					componentCount: area.children.length,
					renderNodeType: area.renderNodeType,
					sourceAreaId: area.sourceAreaId,
					slot: region.slot,
				}),
				...area.children.map((component) =>
					createComponentLayerCandidate({
						componentType: component.componentType,
						resolver: input.resolver,
						sourceAreaId: area.sourceAreaId,
						sourceComponentId: component.sourceComponentId,
						sourceId: component.sourceId,
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
		layout: toLayoutId("screen", "commerce-detail-screen"),
		reason: `SourceSpec contains screen regions: ${slots || "none"}.`,
		targetRef: sourceSpec.sourceShape.screen.screenCode,
		title: "Screen composition layer",
	};
}

function createRegionLayerCandidate(input: {
	resolver: PatternLayerCandidateResolver;
	slot: SourceSpecRegionSlot;
	sourceScreenId: string;
}): PatternLayerCandidate {
	const type = REGION_TYPE_BY_SLOT[input.slot];
	const layout = input.resolver.resolveRegionLayout({
		compositionText: input.slot,
		fallbackByType: REGION_LAYOUT_FALLBACK_BY_TYPE,
		screenLayout: toLayoutId("screen", "commerce-detail-screen"),
		type,
	});

	return {
		constraints: [`Apply ${type} region structure before area placement.`],
		id: `layer.region.${input.slot}`,
		level: "region",
		layout,
		reason: `${input.slot} region belongs to ${input.sourceScreenId}.`,
		targetRef: input.slot,
		title: `${input.slot} region layer`,
	};
}

function createAreaLayerCandidate(input: {
	areaType?: "dynamic" | "static";
	componentCount: number;
	renderNodeType?: "area.dynamic" | "area.static";
	slot: SourceSpecRegionSlot;
	sourceAreaId: string;
}): PatternLayerCandidate {
	const renderNodeType =
		input.renderNodeType ?? (input.areaType === "dynamic" ? "area.dynamic" : "area.static");

	return {
		constraints: [
			"Keep components from the same source area grouped together.",
			`Materialize this source area as a ${renderNodeType} RenderTree wrapper before leaf components.`,
			"Use PageStack or layout wrappers inside the area only when the selected pattern-store candidate needs section/list grouping.",
			"Preserve component order from SourceSpec unless validation requires a structural wrapper.",
		],
		id: `layer.area.${input.sourceAreaId}`,
		level: "area",
		layout: toLayoutId("area", input.slot === "header" ? "area-app-bar" : "product-hero-summary"),
		reason: `Area ${input.sourceAreaId} belongs to ${input.slot} and contains ${input.componentCount} component(s).`,
		targetRef: input.sourceAreaId,
		title: `Area ${input.sourceAreaId} layer`,
	};
}

function createComponentLayerCandidate(input: {
	componentType?: string;
	resolver: PatternLayerCandidateResolver;
	sourceAreaId: string;
	sourceComponentId: string;
	sourceId?: string;
}): PatternLayerCandidate {
	const layout =
		input.resolver.resolveComponentLayout({
			componentType: input.componentType,
			sourceComponentId: input.sourceComponentId,
			sourceId: input.sourceId,
		}) ?? toLayoutId("composite", "component-section-message");
	const targetRef = input.sourceId ?? input.sourceComponentId;

	return {
		constraints: ["Use the selected composite pattern as component table pattern provenance."],
		id: `layer.component.${input.sourceAreaId}.${targetRef}`,
		level: "component",
		layout,
		reason: `Component ${targetRef} belongs to area ${input.sourceAreaId}.`,
		targetRef,
		title: `Component ${targetRef} layer`,
	};
}

const REGION_TYPE_BY_SLOT = {
	bottom: "Screen.Bottom",
	contents: "Screen.Contents",
	header: "Screen.Header",
	unknown: "Screen.Contents",
} as const satisfies Record<
	SourceSpecRegionSlot,
	"Screen.Bottom" | "Screen.Contents" | "Screen.Header"
>;

const REGION_LAYOUT_FALLBACK_BY_TYPE = {
	"Screen.Bottom": toLayoutId("region", "commerce-detail-bottom-action"),
	"Screen.Contents": toLayoutId("region", "subscription-detail-rich-content"),
	"Screen.Header": toLayoutId("region", "plain-stack"),
} as const satisfies Record<"Screen.Bottom" | "Screen.Contents" | "Screen.Header", LayoutId>;

function toLayoutId(target: "area" | "composite" | "region" | "screen", id: string): string {
	return `layout.${target}.${id.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())}`;
}
