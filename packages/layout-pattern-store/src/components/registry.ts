import { PageStackAreaPattern } from "./area/PageStackAreaPattern";
import type { LayoutPatternComponentEntry } from "./types";

const areaPageStackLayouts: Array<{
	layoutId: LayoutPatternComponentEntry["layoutId"];
	name: string;
	props: LayoutPatternComponentEntry["pattern"]["props"];
}> = [
	{
		layoutId: "layout.area.accordionList",
		name: "Accordion List Area",
		props: pageStackProps({ gap: 0 }),
	},
	{
		layoutId: "layout.area.checkboxStack",
		name: "Checkbox Stack Area",
		props: pageStackProps({ gap: 12 }),
	},
	{
		layoutId: "layout.area.fieldStack",
		name: "Field Stack Area",
		props: pageStackProps({ gap: 12 }),
	},
	{ layoutId: "layout.area.listStack", name: "List Stack Area", props: pageStackProps({ gap: 8 }) },
	{
		layoutId: "layout.area.messageStack",
		name: "Message Stack Area",
		props: pageStackProps({ gap: 12 }),
	},
];

const layoutPatternComponents: LayoutPatternComponentEntry[] = areaPageStackLayouts.map(
	(entry) => ({
		component: PageStackAreaPattern,
		layoutId: entry.layoutId,
		pattern: {
			layoutId: entry.layoutId,
			target: "area",
			name: entry.name,
			componentID: "PageStackAreaPattern",
			children: {
				accepts: "component",
				min: 1,
			},
			props: entry.props,
			status: "draft",
		},
		target: "area",
	}),
);

export function listRegisteredLayoutPatternComponents(): LayoutPatternComponentEntry[] {
	return layoutPatternComponents;
}

export function findRegisteredLayoutPatternComponentByLayoutId(
	layoutId: string,
): LayoutPatternComponentEntry | undefined {
	return layoutPatternComponents.find((entry) => entry.layoutId === layoutId);
}

export function findRegisteredLayoutPatternComponent(
	patternId: string,
): LayoutPatternComponentEntry | undefined {
	return layoutPatternComponents.find((entry) => entry.pattern.layoutId === patternId);
}

function pageStackProps(defaults: {
	gap: number;
}): LayoutPatternComponentEntry["pattern"]["props"] {
	return {
		gap: {
			type: "number",
			default: defaults.gap,
			description: "Gap between children inside the PageStack contents slot.",
		},
		itemPaddingX: {
			type: "number",
			default: 20,
		},
		itemTemplate: {
			type: "enum",
			values: ["card-0", "default-20", "plain"],
			default: "default-20",
		},
		paddingY: {
			type: "number",
			default: 28,
		},
		sectionPaddingX: {
			type: "number",
			default: 12,
		},
		titleMode: {
			type: "enum",
			values: ["hidden", "none", "visible"],
			default: "visible",
		},
	};
}
