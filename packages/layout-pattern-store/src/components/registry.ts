import {
	AccordionListArea,
	CheckboxStackArea,
	FieldStackArea,
	ListStackArea,
	MessageStackArea,
} from "./area/PageStackArea";
import {
	BenefitBrandDetailContentRegion,
	CommerceDetailBottomActionRegion,
	CommerceDetailContentStackRegion,
	DeviceDetailOptionContentRegion,
	FaqGuideListContentRegion,
	FilterableTextListContentRegion,
	GifticonDetailCompactContentRegion,
	PlainNoticeListContentRegion,
	PlainStackRegion,
	ProductCardFlatHorizontalListContentRegion,
	ProductCardFlatRowListContentRegion,
	ProductCardSectionedListContentRegion,
	SectionStackRegion,
	SubscriptionDetailRichContentRegion,
	SummaryTextListContentRegion,
	SummaryTitleFilterTextListContentRegion,
} from "./region/RegionStack";
import {
	CardListScreen,
	CommerceDetailScreen,
	ScreenShell,
	TextListScreen,
} from "./screen/ScreenShell";
import type { LayoutPatternComponentEntry } from "./types";

const regionPropContractByKey = {
	bottomSafeArea: { type: "number" },
	contentWidth: { type: "number" },
	divider: { type: "object" },
	gap: { type: "number" },
	itemPaddingX: { type: "number" },
	paddingX: { type: "number" },
	paddingY: { type: "number" },
	sectionGap: { type: "number" },
	sectionPaddingX: { type: "number" },
	slotInsetX: { type: "number" },
	sticky: { type: "boolean" },
} as const satisfies Record<
	string,
	NonNullable<LayoutPatternComponentEntry["pattern"]["props"]>[string]
>;

const screenPropContractByKey = {
	contentWidth: { type: "number" },
	gap: { type: "number" },
	headerHeight: { type: "number" },
	height: { type: "number" },
	safeArea: { type: "string" },
} as const satisfies Record<
	string,
	NonNullable<LayoutPatternComponentEntry["pattern"]["props"]>[string]
>;

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

const regionStackLayouts: Array<{
	component: LayoutPatternComponentEntry["component"];
	componentID: string;
	layoutId: LayoutPatternComponentEntry["layoutId"];
	name: string;
	props: LayoutPatternComponentEntry["pattern"]["props"];
}> = [
	{
		component: SectionStackRegion,
		componentID: "SectionStackRegion",
		layoutId: "layout.region.sectionStack",
		name: "Section Stack Region",
		props: regionStackProps([
			"divider",
			"itemPaddingX",
			"paddingY",
			"sectionGap",
			"sectionPaddingX",
			"slotInsetX",
		]),
	},
	{
		component: PlainStackRegion,
		componentID: "PlainStackRegion",
		layoutId: "layout.region.plainStack",
		name: "Plain Stack Region",
		props: regionStackProps(["gap"]),
	},
	{
		component: CommerceDetailContentStackRegion,
		componentID: "CommerceDetailContentStackRegion",
		layoutId: "layout.region.commerceDetailContentStack",
		name: "Commerce Detail Content Stack Region",
		props: regionStackProps([
			"contentWidth",
			"divider",
			"gap",
			"itemPaddingX",
			"paddingY",
			"sectionGap",
			"sectionPaddingX",
			"slotInsetX",
		]),
	},
	{
		component: CommerceDetailBottomActionRegion,
		componentID: "CommerceDetailBottomActionRegion",
		layoutId: "layout.region.commerceDetailBottomAction",
		name: "Commerce Detail Bottom Action Region",
		props: regionStackProps(["bottomSafeArea", "gap", "paddingX", "paddingY", "sticky"]),
	},
	{
		component: SubscriptionDetailRichContentRegion,
		componentID: "SubscriptionDetailRichContentRegion",
		layoutId: "layout.region.subscriptionDetailRichContent",
		name: "Subscription Detail Rich Content Region",
		props: regionStackProps([
			"contentWidth",
			"divider",
			"gap",
			"itemPaddingX",
			"paddingY",
			"sectionGap",
			"sectionPaddingX",
			"slotInsetX",
		]),
	},
	{
		component: GifticonDetailCompactContentRegion,
		componentID: "GifticonDetailCompactContentRegion",
		layoutId: "layout.region.gifticonDetailCompactContent",
		name: "Gifticon Detail Compact Content Region",
		props: regionStackProps(["contentWidth", "divider", "gap"]),
	},
	{
		component: BenefitBrandDetailContentRegion,
		componentID: "BenefitBrandDetailContentRegion",
		layoutId: "layout.region.benefitBrandDetailContent",
		name: "Benefit Brand Detail Content Region",
		props: regionStackProps([
			"contentWidth",
			"divider",
			"gap",
			"itemPaddingX",
			"paddingY",
			"sectionGap",
			"sectionPaddingX",
			"slotInsetX",
		]),
	},
	{
		component: DeviceDetailOptionContentRegion,
		componentID: "DeviceDetailOptionContentRegion",
		layoutId: "layout.region.deviceDetailOptionContent",
		name: "Device Detail Option Content Region",
		props: regionStackProps([
			"contentWidth",
			"divider",
			"gap",
			"itemPaddingX",
			"paddingY",
			"sectionGap",
			"sectionPaddingX",
			"slotInsetX",
		]),
	},
	{
		component: SummaryTextListContentRegion,
		componentID: "SummaryTextListContentRegion",
		layoutId: "layout.region.summaryTextListContent",
		name: "Summary Text List Content Region",
		props: regionStackProps([
			"contentWidth",
			"divider",
			"gap",
			"itemPaddingX",
			"paddingY",
			"sectionGap",
			"sectionPaddingX",
			"slotInsetX",
		]),
	},
	{
		component: SummaryTitleFilterTextListContentRegion,
		componentID: "SummaryTitleFilterTextListContentRegion",
		layoutId: "layout.region.summaryTitleFilterTextListContent",
		name: "Summary Title Filter Text List Content Region",
		props: regionStackProps([
			"contentWidth",
			"divider",
			"gap",
			"itemPaddingX",
			"paddingY",
			"sectionGap",
			"sectionPaddingX",
			"slotInsetX",
		]),
	},
	{
		component: FilterableTextListContentRegion,
		componentID: "FilterableTextListContentRegion",
		layoutId: "layout.region.filterableTextListContent",
		name: "Filterable Text List Content Region",
		props: regionStackProps(["contentWidth", "gap"]),
	},
	{
		component: PlainNoticeListContentRegion,
		componentID: "PlainNoticeListContentRegion",
		layoutId: "layout.region.plainNoticeListContent",
		name: "Plain Notice List Content Region",
		props: regionStackProps(["contentWidth", "gap"]),
	},
	{
		component: FaqGuideListContentRegion,
		componentID: "FaqGuideListContentRegion",
		layoutId: "layout.region.faqGuideListContent",
		name: "Faq Guide List Content Region",
		props: regionStackProps(["contentWidth", "gap"]),
	},
	{
		component: ProductCardSectionedListContentRegion,
		componentID: "ProductCardSectionedListContentRegion",
		layoutId: "layout.region.productCardSectionedListContent",
		name: "Product Card Sectioned List Content Region",
		props: regionStackProps([
			"contentWidth",
			"divider",
			"gap",
			"itemPaddingX",
			"paddingY",
			"sectionGap",
			"sectionPaddingX",
			"slotInsetX",
		]),
	},
	{
		component: ProductCardFlatRowListContentRegion,
		componentID: "ProductCardFlatRowListContentRegion",
		layoutId: "layout.region.productCardFlatRowListContent",
		name: "Product Card Flat Row List Content Region",
		props: regionStackProps(["contentWidth", "gap"]),
	},
	{
		component: ProductCardFlatHorizontalListContentRegion,
		componentID: "ProductCardFlatHorizontalListContentRegion",
		layoutId: "layout.region.productCardFlatHorizontalListContent",
		name: "Product Card Flat Horizontal List Content Region",
		props: regionStackProps(["contentWidth", "gap"]),
	},
];

const screenShellLayouts: Array<{
	component: LayoutPatternComponentEntry["component"];
	componentID: string;
	layoutId: LayoutPatternComponentEntry["layoutId"];
	name: string;
	props: LayoutPatternComponentEntry["pattern"]["props"];
}> = [
	{
		component: ScreenShell,
		componentID: "ScreenShell",
		layoutId: "layout.screen.screenShell",
		name: "Screen Shell",
		props: screenShellProps(["gap"]),
	},
	{
		component: CommerceDetailScreen,
		componentID: "CommerceDetailScreen",
		layoutId: "layout.screen.commerceDetailScreen",
		name: "Commerce Detail Screen",
		props: screenShellProps(["contentWidth", "gap", "safeArea"]),
	},
	{
		component: TextListScreen,
		componentID: "TextListScreen",
		layoutId: "layout.screen.textListScreen",
		name: "Text List Screen",
		props: screenShellProps(["contentWidth", "gap", "height", "headerHeight"]),
	},
	{
		component: CardListScreen,
		componentID: "CardListScreen",
		layoutId: "layout.screen.cardListScreen",
		name: "Card List Screen",
		props: screenShellProps(["contentWidth", "gap"]),
	},
];

const areaLayoutPatternComponents: LayoutPatternComponentEntry[] = areaPageStackLayouts.map(
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

const regionLayoutPatternComponents: LayoutPatternComponentEntry[] = regionStackLayouts.map(
	(entry) => ({
		component: entry.component,
		layoutId: entry.layoutId,
		pattern: {
			id: entry.layoutId,
			target: "region",
			name: entry.name,
			componentID: entry.componentID,
			children: {
				accepts: "area-or-component",
			},
			props: entry.props,
			status: "draft",
		},
		target: "region",
	}),
);

const screenLayoutPatternComponents: LayoutPatternComponentEntry[] = screenShellLayouts.map(
	(entry) => ({
		component: entry.component,
		layoutId: entry.layoutId,
		pattern: {
			id: entry.layoutId,
			target: "screen",
			name: entry.name,
			componentID: entry.componentID,
			children: {
				accepts: "region",
			},
			props: entry.props,
			status: "draft",
		},
		target: "screen",
	}),
);

const layoutPatternComponents: LayoutPatternComponentEntry[] = [
	...areaLayoutPatternComponents,
	...regionLayoutPatternComponents,
	...screenLayoutPatternComponents,
];

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

function regionStackProps(
	keys: Array<
		| "bottomSafeArea"
		| "contentWidth"
		| "divider"
		| "gap"
		| "itemPaddingX"
		| "paddingX"
		| "paddingY"
		| "sectionGap"
		| "sectionPaddingX"
		| "slotInsetX"
		| "sticky"
	>,
): LayoutPatternComponentEntry["pattern"]["props"] {
	const contracts: LayoutPatternComponentEntry["pattern"]["props"] = {};
	for (const key of keys) {
		contracts[key] = regionPropContractByKey[key];
	}
	return contracts;
}

function screenShellProps(
	keys: Array<"contentWidth" | "gap" | "headerHeight" | "height" | "safeArea">,
): LayoutPatternComponentEntry["pattern"]["props"] {
	const contracts: LayoutPatternComponentEntry["pattern"]["props"] = {};
	for (const key of keys) {
		contracts[key] = screenPropContractByKey[key];
	}
	return contracts;
}
