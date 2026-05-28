import {
	BenefitBrandListArea,
	CardInfoBrandListArea,
	CouponBenefitArea,
	FilterChipTextListArea,
	HiddenTitlePagestackCardListArea,
	HorizontalCardListArea,
	ListSummaryCardArea,
	MapCardInfoListArea,
	NearbyStoreListArea,
	OptionListSectionArea,
	ProductListChipSortArea,
	ProductListGroupArea,
	ProductListSortOnlyArea,
	ProductMoreLinkArea,
	ProductOptionGridArea,
	RichImageTabArea,
	RowCardListArea,
} from "./area/CollectionArea";
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

const collectionPropContractByKey = {
	columns: { type: "number" },
	componentGap: {
		type: "number",
		description: "Legacy layoutProps.componentGap preserved as item/content gap.",
	},
	componentGaps: {
		type: "array",
		description: "Legacy documented per-component gap notes preserved for source trace.",
	},
	controlGap: {
		type: "number",
		description: "Legacy control stack gap, used before generic componentGap.",
	},
	filterGap: {
		type: "number",
		description: "Legacy filter control gap, used before generic componentGap.",
	},
	flow: {
		type: "enum",
		values: ["grid", "horizontal", "stack"],
	},
	gap: { type: "number" },
	itemPaddingX: { type: "number" },
	itemTemplate: {
		type: "enum",
		values: ["card-0", "default-20", "plain"],
	},
	mapHeight: { type: "number" },
	paddingY: { type: "number" },
	sectionGap: { type: "number" },
	sectionPaddingX: { type: "number" },
	slotInsetX: { type: "number" },
	titleGap: {
		type: "number",
		description: "Legacy layoutProps.titleGap preserved as PageStack title-to-contents gap.",
	},
	titleMode: {
		type: "enum",
		values: ["hidden", "none", "visible"],
	},
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

const areaCollectionLayouts: Array<{
	component: LayoutPatternComponentEntry["component"];
	componentID: string;
	layoutId: LayoutPatternComponentEntry["layoutId"];
	name: string;
	props: LayoutPatternComponentEntry["pattern"]["props"];
}> = [
	{
		component: ProductOptionGridArea,
		componentID: "ProductOptionGridArea",
		layoutId: "layout.area.productOptionGrid",
		name: "Product Option Grid Area",
		props: collectionProps(["columns", "componentGap", "flow", "gap", "titleGap"]),
	},
	{
		component: BenefitBrandListArea,
		componentID: "BenefitBrandListArea",
		layoutId: "layout.area.benefitBrandList",
		name: "Benefit Brand List Area",
		props: collectionProps(["componentGap", "flow", "gap", "titleGap"]),
	},
	{
		component: NearbyStoreListArea,
		componentID: "NearbyStoreListArea",
		layoutId: "layout.area.nearbyStoreList",
		name: "Nearby Store List Area",
		props: collectionProps(["componentGap", "flow", "gap", "mapHeight", "titleGap"]),
	},
	{
		component: ProductMoreLinkArea,
		componentID: "ProductMoreLinkArea",
		layoutId: "layout.area.productMoreLinkArea",
		name: "Product More Link Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap"]),
	},
	{
		component: RichImageTabArea,
		componentID: "RichImageTabArea",
		layoutId: "layout.area.richImageTabArea",
		name: "Rich Image Tab Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap"]),
	},
	{
		component: OptionListSectionArea,
		componentID: "OptionListSectionArea",
		layoutId: "layout.area.optionListSectionArea",
		name: "Option List Section Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap", "titleGap"]),
	},
	{
		component: CouponBenefitArea,
		componentID: "CouponBenefitArea",
		layoutId: "layout.area.couponBenefitArea",
		name: "Coupon Benefit Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap"]),
	},
	{
		component: MapCardInfoListArea,
		componentID: "MapCardInfoListArea",
		layoutId: "layout.area.mapCardInfoListArea",
		name: "Map Card Info List Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap", "mapHeight"]),
	},
	{
		component: CardInfoBrandListArea,
		componentID: "CardInfoBrandListArea",
		layoutId: "layout.area.cardInfoBrandListArea",
		name: "Card Info Brand List Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap"]),
	},
	{
		component: ListSummaryCardArea,
		componentID: "ListSummaryCardArea",
		layoutId: "layout.area.listSummaryCardArea",
		name: "List Summary Card Area",
		props: collectionProps(["componentGap", "flow", "gap", "titleMode"]),
	},
	{
		component: FilterChipTextListArea,
		componentID: "FilterChipTextListArea",
		layoutId: "layout.area.filterChipTextListArea",
		name: "Filter Chip Text List Area",
		props: collectionProps(["componentGap", "filterGap", "flow", "gap", "titleGap"]),
	},
	{
		component: ProductListGroupArea,
		componentID: "ProductListGroupArea",
		layoutId: "layout.area.productListGroupArea",
		name: "Product List Group Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap", "titleGap"]),
	},
	{
		component: ProductListChipSortArea,
		componentID: "ProductListChipSortArea",
		layoutId: "layout.area.productListChipSortArea",
		name: "Product List Chip Sort Area",
		props: collectionProps(["componentGap", "componentGaps", "controlGap", "flow", "gap"]),
	},
	{
		component: ProductListSortOnlyArea,
		componentID: "ProductListSortOnlyArea",
		layoutId: "layout.area.productListSortOnlyArea",
		name: "Product List Sort Only Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap"]),
	},
	{
		component: HorizontalCardListArea,
		componentID: "HorizontalCardListArea",
		layoutId: "layout.area.horizontalCardListArea",
		name: "Horizontal Card List Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap"]),
	},
	{
		component: RowCardListArea,
		componentID: "RowCardListArea",
		layoutId: "layout.area.rowCardListArea",
		name: "Row Card List Area",
		props: collectionProps(["componentGap", "componentGaps", "flow", "gap"]),
	},
	{
		component: HiddenTitlePagestackCardListArea,
		componentID: "HiddenTitlePagestackCardListArea",
		layoutId: "layout.area.hiddenTitlePagestackCardListArea",
		name: "Hidden Title Pagestack Card List Area",
		props: collectionProps([
			"componentGap",
			"componentGaps",
			"flow",
			"gap",
			"itemTemplate",
			"titleMode",
		]),
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

const areaCollectionPatternComponents: LayoutPatternComponentEntry[] = areaCollectionLayouts.map(
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
	...areaCollectionPatternComponents,
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

function collectionProps(
	keys: Array<
		| "columns"
		| "componentGap"
		| "componentGaps"
		| "controlGap"
		| "filterGap"
		| "flow"
		| "gap"
		| "itemPaddingX"
		| "itemTemplate"
		| "mapHeight"
		| "paddingY"
		| "sectionGap"
		| "sectionPaddingX"
		| "slotInsetX"
		| "titleGap"
		| "titleMode"
	>,
): LayoutPatternComponentEntry["pattern"]["props"] {
	const contracts: LayoutPatternComponentEntry["pattern"]["props"] = {};
	for (const key of keys) {
		contracts[key] = collectionPropContractByKey[key];
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
