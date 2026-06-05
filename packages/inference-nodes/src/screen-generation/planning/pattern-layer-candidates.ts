import type {
	DecorationArea,
	DecorationAreaPatternRole,
	DecorationPlanContract,
	SourceSpec,
	SourceSpecRegionSlot,
} from "@cx/schema";
import { toLayoutId } from "../shared/layout-id";
import type { PatternLayerCandidate } from "./types";

type LayoutId = string;

export type PatternLayerCandidateResolver = {
	/** Resolves a SourceSpec component into a layout.composite.* candidate id. */
	resolveComponentLayout(input: {
		componentType?: string;
		sourceComponentId: string;
		sourceId?: string;
	}): LayoutId | undefined;
	/** Resolves a Screen region into a layout.region.* candidate id. */
	resolveRegionLayout(input: {
		compositionText: string;
		fallbackByType: Record<"Screen.Bottom" | "Screen.Contents" | "Screen.Header", LayoutId>;
		screenLayout: LayoutId;
		type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header";
	}): LayoutId;
};

/**
 * Builds deterministic screen/region/area/component layer candidates from SourceSpec.
 * The resolver is injected so orchestration does not own layout catalog lookup.
 */
export function buildPatternLayerCandidates(input: {
	decorationPlan?: DecorationPlanContract;
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
				...createAreaLayerCandidates({
					area,
					decorationAreas: findDecorationAreas(input.decorationPlan, area.sourceAreaId),
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

function createAreaLayerCandidates(input: {
	area: SourceSpec["sourceShape"]["screen"]["regions"][number]["children"][number];
	decorationAreas: DecorationArea[];
	slot: SourceSpecRegionSlot;
}): PatternLayerCandidate[] {
	if (input.decorationAreas.length > 0) {
		return input.decorationAreas.map((decorationArea) =>
			createAreaLayerCandidate({
				areaType: input.area.areaType,
				componentCount: decorationArea.componentRefs.length,
				componentTypes: input.area.children.map(
					(component) => component.componentType ?? component.sourceComponentId,
				),
				decorationArea,
				renderNodeType: input.area.renderNodeType,
				sourceAreaId: decorationArea.id,
				sourceAreaName: decorationArea.displayTitle,
				slot: input.slot,
			}),
		);
	}

	return [
		createAreaLayerCandidate({
			areaType: input.area.areaType,
			componentCount: input.area.children.length,
			componentTypes: input.area.children.map(
				(component) => component.componentType ?? component.sourceComponentId,
			),
			renderNodeType: input.area.renderNodeType,
			sourceAreaId: input.area.sourceAreaId,
			sourceAreaName: input.area.sourceAreaName,
			slot: input.slot,
		}),
	];
}

function createAreaLayerCandidate(input: {
	areaType?: "dynamic" | "static";
	componentCount: number;
	componentTypes: string[];
	decorationArea?: DecorationArea;
	renderNodeType?: "area.dynamic" | "area.static";
	slot: SourceSpecRegionSlot;
	sourceAreaId: string;
	sourceAreaName?: string;
}): PatternLayerCandidate {
	const renderNodeType =
		input.renderNodeType ?? (input.areaType === "dynamic" ? "area.dynamic" : "area.static");
	const layout = resolveAreaLayout(input);

	return {
		constraints: [
			"Keep components from the same source area grouped together.",
			`Materialize this source area as a ${renderNodeType} RenderTree wrapper before leaf components.`,
			"Use PageStack or layout wrappers inside the area only when the selected pattern-store candidate needs section/list grouping.",
			"Preserve component order from SourceSpec unless validation requires a structural wrapper.",
		],
		id: `layer.area.${input.sourceAreaId}`,
		level: "area",
		layout,
		reason: `Area ${input.sourceAreaId} belongs to ${input.slot} and contains ${input.componentCount} component(s).`,
		targetRef: input.sourceAreaId,
		title: `Area ${input.sourceAreaId} layer`,
	};
}

function resolveAreaLayout(input: {
	componentTypes: string[];
	decorationArea?: DecorationArea;
	slot: SourceSpecRegionSlot;
	sourceAreaName?: string;
}): LayoutId {
	if (input.decorationArea?.layoutIntent) {
		return toLayoutId(
			"area",
			AREA_LAYOUT_ID_BY_PATTERN_ROLE[input.decorationArea.layoutIntent.areaPatternRole],
		);
	}

	if (input.slot === "header") return toLayoutId("area", "area-app-bar");
	if (input.slot === "bottom") return toLayoutId("area", "bottom-action-area");

	const areaName = input.sourceAreaName?.toLowerCase() ?? "";
	const componentTypes = input.componentTypes.map((type) => type.toLowerCase());

	if (areaName.includes("term") || componentTypes.some((type) => type.includes("list"))) {
		return toLayoutId("area", "list-stack");
	}
	if (componentTypes.some((type) => type.includes("checkbox"))) {
		return toLayoutId("area", "checkbox-stack");
	}
	if (componentTypes.some((type) => type.includes("textfield") || type.includes("text-field"))) {
		return toLayoutId("area", "field-stack");
	}
	if (componentTypes.some((type) => type.includes("message"))) {
		return toLayoutId("area", "message-stack");
	}

	return toLayoutId("area", "list-stack");
}

function findDecorationAreas(
	decorationPlan: DecorationPlanContract | undefined,
	sourceAreaId: string,
): DecorationArea[] {
	return decorationPlan?.areas.filter((area) => area.sourceAreaId === sourceAreaId) ?? [];
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
	"Screen.Bottom": toLayoutId("region", "bottom"),
	"Screen.Contents": toLayoutId("region", "contents"),
	"Screen.Header": toLayoutId("region", "header"),
} as const satisfies Record<"Screen.Bottom" | "Screen.Contents" | "Screen.Header", LayoutId>;

const AREA_LAYOUT_ID_BY_PATTERN_ROLE = {
	"app-bar": "area-app-bar",
	"bottom-action": "bottom-action-area",
	"checkbox-stack": "checkbox-stack",
	"field-stack": "field-stack",
	"list-stack": "list-stack",
	"message-stack": "message-stack",
} as const satisfies Record<DecorationAreaPatternRole, string>;
