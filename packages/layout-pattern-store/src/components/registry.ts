import {
	AccordionListArea,
	CheckboxStackArea,
	FieldStackArea,
	ListStackArea,
	MessageStackArea,
} from "./area/PageStackArea";
import type { LayoutPatternComponentEntry } from "./types";

const areaPageStackLayouts: Array<{
	component: LayoutPatternComponentEntry["component"];
	componentID: string;
	layoutId: LayoutPatternComponentEntry["layoutId"];
	name: string;
	props: LayoutPatternComponentEntry["pattern"]["props"];
}> = [
	{
		component: AccordionListArea,
		componentID: "AccordionListArea",
		layoutId: "layout.area.accordionList",
		name: "Accordion List Area",
		props: pageStackProps(),
	},
	{
		component: CheckboxStackArea,
		componentID: "CheckboxStackArea",
		layoutId: "layout.area.checkboxStack",
		name: "Checkbox Stack Area",
		props: pageStackProps(),
	},
	{
		component: FieldStackArea,
		componentID: "FieldStackArea",
		layoutId: "layout.area.fieldStack",
		name: "Field Stack Area",
		props: pageStackProps(),
	},
	{
		component: ListStackArea,
		componentID: "ListStackArea",
		layoutId: "layout.area.listStack",
		name: "List Stack Area",
		props: pageStackProps(),
	},
	{
		component: MessageStackArea,
		componentID: "MessageStackArea",
		layoutId: "layout.area.messageStack",
		name: "Message Stack Area",
		props: pageStackProps(),
	},
];

const layoutPatternComponents: LayoutPatternComponentEntry[] = areaPageStackLayouts.map(
	(entry) => ({
		component: entry.component,
		layoutId: entry.layoutId,
		pattern: {
			id: entry.layoutId,
			target: "area",
			name: entry.name,
			componentID: entry.componentID,
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
	return layoutPatternComponents.find((entry) => entry.pattern.id === patternId);
}

function pageStackProps(): LayoutPatternComponentEntry["pattern"]["props"] {
	return {
		componentGap: {
			type: "number",
			description: "Legacy layoutProps.componentGap preserved as the PageStack contents gap.",
		},
		gap: {
			type: "number",
			description: "Gap between children inside the PageStack contents slot.",
		},
		itemPaddingX: {
			type: "number",
		},
		itemTemplate: {
			type: "enum",
			values: ["card-0", "default-20", "plain"],
		},
		paddingY: {
			type: "number",
		},
		sectionPaddingX: {
			type: "number",
		},
		titleGap: {
			type: "number",
			description: "Legacy layoutProps.titleGap preserved as the title-to-contents gap.",
		},
		titleMode: {
			type: "enum",
			values: ["hidden", "none", "visible"],
		},
	};
}
