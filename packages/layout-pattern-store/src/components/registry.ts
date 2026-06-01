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
	AreaAppBarArea,
	AreaVerticalArea,
	BottomActionArea,
	ProductFooterLegalArea,
	ProductHeroSummaryArea,
} from "./area/GeneralArea";
import {
	AccordionListArea,
	AccordionNoticeListArea,
	ActionStackArea,
	AuthCodeEntryArea,
	AuthMethodListArea,
	CheckboxStackArea,
	DeliveryInfoAccordionArea,
	FieldStackArea,
	ListStackArea,
	MessageStackArea,
	NoticeAccordionStackArea,
	PagestackInfoTextSectionArea,
	PlainInfoTextListArea,
	PriceAccordionStackArea,
	ProductDisclosureAccordionArea,
	ProductInfoSectionArea,
	TabChipSearchAccordionArea,
	TextListGroupArea,
} from "./area/PageStackArea";
import {
	type CompositeWrapperDefaults,
	createCompositeWrapper,
} from "./composite/CompositeWrapper";
import { PlainStackRegion } from "./region/RegionStack";
import {
	CardListScreen,
	CommerceDetailScreen,
	ScreenShell,
	TextListScreen,
} from "./screen/ScreenShell";
import type { LayoutPatternComponentEntry } from "./types";

const compositePropContractByKey = {
	buttonHeight: { type: "number" },
	collapsedHeight: { type: "number" },
	componentGaps: { type: "array" },
	defaultProps: { type: "object" },
	expandedHeight: { type: "number" },
	figmaOnlyTypes: { type: "array" },
	flow: {
		type: "enum",
		values: ["horizontal", "vertical"],
	},
	fullWidth: { type: "boolean" },
	gap: { type: "number" },
	height: { type: "number" },
	indicator: { type: "boolean" },
	itemHeight: { type: "number" },
	minHeight: { type: "number" },
	paddingBottom: { type: "number" },
	paddingTop: { type: "number" },
	paddingX: { type: "number" },
	paddingY: { type: "number" },
	priceGap: { type: "number" },
	radius: { type: "number" },
	repeatSeparator: { type: "string" },
	rowGap: { type: "number" },
	selectedStroke: { type: "string" },
	size: { type: "string" },
	titleGap: { type: "number" },
	width: { type: "number" },
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

const generalAreaPropContractByKey = {
	bottomPadding: { type: "number" },
	componentGap: { type: "number" },
	divider: {
		type: "boolean",
		description: "When true, render trailing contents dividers between stack children.",
	},
	sectionDivider: {
		type: "boolean",
		description:
			"When true, render a trailing 4px section divider after the area stack to separate it from the next area.",
	},
	filterGap: { type: "number" },
	gap: { type: "number" },
	hideTitle: { type: "boolean" },
	infoPaddingBottom: { type: "number" },
	infoPaddingTop: { type: "number" },
	infoPaddingX: { type: "number" },
	itemPaddingX: { type: "number" },
	itemPaddingY: { type: "number" },
	itemTemplate: {
		type: "enum",
		values: ["card-0", "default-20", "plain"],
	},
	listPresentation: { type: "string" },
	paddingX: { type: "number" },
	paddingY: { type: "number" },
	primaryActionPlacement: { type: "string" },
	rowCount: { type: "number" },
	secondaryActionPlacement: { type: "string" },
	sectionGap: { type: "number" },
	sectionModel: { type: "string" },
	sectionPaddingX: { type: "number" },
	surface: { type: "string" },
	thumbnailHeight: { type: "number" },
	titleGap: { type: "number" },
	titleMode: {
		type: "enum",
		values: ["hidden", "none", "visible"],
	},
} as const satisfies Record<
	string,
	NonNullable<LayoutPatternComponentEntry["pattern"]["props"]>[string]
>;

const compositeLayouts: Array<{
	componentID: string;
	defaults: CompositeWrapperDefaults;
	layoutId: LayoutPatternComponentEntry["layoutId"];
	name: string;
	props: LayoutPatternComponentEntry["pattern"]["props"];
}> = [
	{
		componentID: "ComponentAppBarComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentAppBar",
		name: "앱 바",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentThumbnailLargeComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentThumbnailLarge",
		name: "대형 썸네일",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentTextFieldComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentTextField",
		name: "텍스트 필드",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentSectionMessageComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentSectionMessage",
		name: "섹션 메시지",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentButtonComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentButton",
		name: "버튼",
		props: compositeProps(["fullWidth", "gap", "size"]),
	},
	{
		componentID: "ComponentListCellComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentListCell",
		name: "리스트 셀",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentAccordionComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentAccordion",
		name: "아코디언",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentCheckboxComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentCheckbox",
		name: "체크박스",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentProductInfoComposite",
		defaults: { gap: 8, paddingX: 32 },
		layoutId: "layout.composite.componentProductInfo",
		name: "상품 정보 요약",
		props: compositeProps(["gap", "paddingX", "priceGap", "titleGap"]),
	},
	{
		componentID: "ComponentCardSummaryComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentCardSummary",
		name: "요약 카드",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentBadgeComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentBadge",
		name: "상태 배지",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentTextButtonComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentTextButton",
		name: "텍스트 버튼",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentListTextComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentListText",
		name: "리스트 텍스트",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentOptionCardComposite",
		defaults: { gap: 4, minHeight: 74 },
		layoutId: "layout.composite.componentOptionCard",
		name: "옵션 선택 카드",
		props: compositeProps(["gap", "minHeight", "radius", "selectedStroke"]),
	},
	{
		componentID: "ComponentBannerIndicatorComposite",
		defaults: { gap: 10, height: 112, width: 369 },
		layoutId: "layout.composite.componentBannerIndicator",
		name: "배너 인디케이터",
		props: compositeProps(["gap", "height", "indicator", "width"]),
	},
	{
		componentID: "ComponentFooterComposite",
		defaults: { gap: 8 },
		layoutId: "layout.composite.componentFooter",
		name: "푸터",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentLegalTextComposite",
		defaults: { gap: 6 },
		layoutId: "layout.composite.componentLegalText",
		name: "법적 고지 텍스트",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentMapBlockComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentMapBlock",
		name: "지도 블록",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentStoreCardComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentStoreCard",
		name: "매장 카드",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentTitleSectionComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentTitleSection",
		name: "섹션 타이틀",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "ComponentInfoTextListComposite",
		defaults: { gap: 0, height: 71 },
		layoutId: "layout.composite.componentInfoTextList",
		name: "정보 텍스트 리스트 항목",
		props: compositeProps(["gap", "height"]),
	},
	{
		componentID: "ComponentChipFilterComposite",
		defaults: { flow: "horizontal", gap: 8, height: 57, paddingX: 32 },
		layoutId: "layout.composite.componentChipFilter",
		name: "칩 필터",
		props: compositeProps(["flow", "gap", "height", "itemHeight", "paddingX"]),
	},
	{
		componentID: "ComponentTabComposite",
		defaults: { flow: "horizontal", gap: 0, height: 47 },
		layoutId: "layout.composite.componentTab",
		name: "탭 내비게이션",
		props: compositeProps(["flow", "gap", "height"]),
	},
	{
		componentID: "ComponentSearchBarComposite",
		defaults: { gap: 0, height: 61 },
		layoutId: "layout.composite.componentSearchBar",
		name: "검색 바",
		props: compositeProps(["defaultProps", "gap", "height"]),
	},
	{
		componentID: "ComponentAccordionNoticeInfoComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.componentAccordionNoticeInfo",
		name: "공지 아코디언 항목",
		props: compositeProps(["collapsedHeight", "expandedHeight", "gap"]),
	},
	{
		componentID: "CompositeTitleInfoTextListComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeTitleInfoTextList",
		name: "타이틀 포함 정보 텍스트 리스트",
		props: compositeProps(["gap", "repeatSeparator", "rowGap"]),
	},
	{
		componentID: "CompositeSummaryFilteredTextListComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeSummaryFilteredTextList",
		name: "요약 필터 텍스트 리스트",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "CompositeSummarySectionedInfoListComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeSummarySectionedInfoList",
		name: "요약 섹션형 정보 리스트",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "CompositePlainNoticeListComposite",
		defaults: { gap: 0, paddingX: 32 },
		layoutId: "layout.composite.compositePlainNoticeList",
		name: "기본 공지 텍스트 리스트",
		props: compositeProps(["gap", "paddingX", "repeatSeparator"]),
	},
	{
		componentID: "CompositeTabChipSearchAccordionListComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeTabChipSearchAccordionList",
		name: "탭 칩 검색 아코디언 리스트",
		props: compositeProps(["gap", "repeatSeparator"]),
	},
	{
		componentID: "CompositeProductHeroMediaInfoComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeProductHeroMediaInfo",
		name: "상품 히어로 미디어 정보 조합",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "CompositeProductSummaryStatusListComposite",
		defaults: { gap: 12 },
		layoutId: "layout.composite.compositeProductSummaryStatusList",
		name: "상품 요약 상태 목록 조합",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "CompositeStoreMapListComposite",
		defaults: { gap: 8 },
		layoutId: "layout.composite.compositeStoreMapList",
		name: "지도 매장 리스트 조합",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "CompositeFooterLegalLinksComposite",
		defaults: { gap: 30 },
		layoutId: "layout.composite.compositeFooterLegalLinks",
		name: "푸터 법적 고지 조합",
		props: compositeProps(["gap"]),
	},
	{
		componentID: "CompositeProductListFilterSortComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeProductListFilterSort",
		name: "상품 리스트 필터 정렬 조합",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap"]),
	},
	{
		componentID: "CompositeProductListGroupTitleStackComposite",
		defaults: { gap: 16 },
		layoutId: "layout.composite.compositeProductListGroupTitleStack",
		name: "상품 리스트 그룹 타이틀 스택",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap"]),
	},
	{
		componentID: "CompositeListProductHorizontalCardSetComposite",
		defaults: { gap: 12 },
		layoutId: "layout.composite.compositeListProductHorizontalCardSet",
		name: "가로형 상품 카드 세트",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap"]),
	},
	{
		componentID: "CompositeListProductRowCardSetComposite",
		defaults: { gap: 12 },
		layoutId: "layout.composite.compositeListProductRowCardSet",
		name: "행형 상품 카드 세트",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap"]),
	},
	{
		componentID: "CompositePagestackProductCardListComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositePagestackProductCardList",
		name: "페이지스택 상품 카드 리스트",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap"]),
	},
	{
		componentID: "ComponentActionButtonComposite",
		defaults: { gap: 0, height: 56, paddingX: 20, paddingTop: 22, paddingBottom: 24 },
		layoutId: "layout.composite.componentActionButton",
		name: "하단 액션 버튼",
		props: compositeProps(["buttonHeight", "gap", "paddingBottom", "paddingTop", "paddingX"]),
	},
	{
		componentID: "ComponentActionButtonWithTooltipComposite",
		defaults: { gap: 10, height: 56, paddingX: 12, paddingTop: 10, paddingBottom: 36 },
		layoutId: "layout.composite.componentActionButtonWithTooltip",
		name: "툴팁 포함 하단 액션 버튼",
		props: compositeProps(["buttonHeight", "gap", "paddingBottom", "paddingTop", "paddingX"]),
	},
	{
		componentID: "CompositePriceAccordionSelectedListComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositePriceAccordionSelectedList",
		name: "가격 아코디언 선택 리스트",
		props: compositeProps(["gap", "repeatSeparator", "rowGap"]),
	},
	{
		componentID: "CompositeProductDetailRichImageTabComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeProductDetailRichImageTab",
		name: "상품 상세 이미지 탭 콘텐츠",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap"]),
	},
	{
		componentID: "CompositeButtonMoreProductLinkComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeButtonMoreProductLink",
		name: "상품 더보기 링크",
		props: compositeProps(["componentGaps", "gap"]),
	},
	{
		componentID: "CompositeOptionListStackComposite",
		defaults: { gap: 8 },
		layoutId: "layout.composite.compositeOptionListStack",
		name: "옵션 리스트 스택",
		props: compositeProps(["componentGaps", "gap"]),
	},
	{
		componentID: "CompositeCouponBenefitCardComposite",
		defaults: { gap: 12 },
		layoutId: "layout.composite.compositeCouponBenefitCard",
		name: "쿠폰 혜택 카드",
		props: compositeProps(["componentGaps", "gap"]),
	},
	{
		componentID: "CompositeMapCardInfoListComposite",
		defaults: { gap: 8 },
		layoutId: "layout.composite.compositeMapCardInfoList",
		name: "지도 카드 정보 리스트",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap"]),
	},
	{
		componentID: "CompositeCardInfoBrandListComposite",
		defaults: { gap: 8 },
		layoutId: "layout.composite.compositeCardInfoBrandList",
		name: "브랜드 카드 정보 리스트",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap"]),
	},
	{
		componentID: "CompositeProductDisclosureNoticeListComposite",
		defaults: { gap: 0 },
		layoutId: "layout.composite.compositeProductDisclosureNoticeList",
		name: "상품 고지 아코디언 리스트",
		props: compositeProps(["componentGaps", "figmaOnlyTypes", "gap", "repeatSeparator"]),
	},
];

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

const areaGeneralLayouts: Array<{
	component: LayoutPatternComponentEntry["component"];
	componentID: string;
	layoutId: LayoutPatternComponentEntry["layoutId"];
	name: string;
	props: LayoutPatternComponentEntry["pattern"]["props"];
}> = [
	{
		component: AreaVerticalArea,
		componentID: "AreaVerticalArea",
		layoutId: "layout.area.areaVertical",
		name: "Area Vertical Area",
		props: generalAreaProps(["componentGap", "gap"]),
	},
	{
		component: AuthMethodListArea,
		componentID: "AuthMethodListArea",
		layoutId: "layout.area.authMethodList",
		name: "Auth Method List Area",
		props: generalAreaProps([
			"componentGap",
			"divider",
			"gap",
			"itemPaddingX",
			"itemPaddingY",
			"listPresentation",
			"titleGap",
		]),
	},
	{
		component: AuthCodeEntryArea,
		componentID: "AuthCodeEntryArea",
		layoutId: "layout.area.authCodeEntry",
		name: "Auth Code Entry Area",
		props: generalAreaProps([
			"componentGap",
			"gap",
			"primaryActionPlacement",
			"secondaryActionPlacement",
			"sectionModel",
			"titleGap",
		]),
	},
	{
		component: ActionStackArea,
		componentID: "ActionStackArea",
		layoutId: "layout.area.actionStack",
		name: "Action Stack Area",
		props: generalAreaProps(["componentGap", "gap", "titleGap"]),
	},
	{
		component: BottomActionArea,
		componentID: "BottomActionArea",
		layoutId: "layout.area.bottomActionArea",
		name: "Bottom Action Area",
		props: generalAreaProps(["componentGap", "gap", "paddingY", "titleGap"]),
	},
	{
		component: ProductHeroSummaryArea,
		componentID: "ProductHeroSummaryArea",
		layoutId: "layout.area.productHeroSummary",
		name: "Product Hero Summary Area",
		props: generalAreaProps([
			"componentGap",
			"gap",
			"hideTitle",
			"infoPaddingBottom",
			"infoPaddingTop",
			"infoPaddingX",
			"surface",
			"thumbnailHeight",
		]),
	},
	{
		component: ProductInfoSectionArea,
		componentID: "ProductInfoSectionArea",
		layoutId: "layout.area.productInfoSection",
		name: "Product Info Section Area",
		props: generalAreaProps(["componentGap", "gap", "titleGap"]),
	},
	{
		component: ProductDisclosureAccordionArea,
		componentID: "ProductDisclosureAccordionArea",
		layoutId: "layout.area.productDisclosureAccordion",
		name: "Product Disclosure Accordion Area",
		props: generalAreaProps(["componentGap", "divider", "sectionDivider", "gap", "titleGap"]),
	},
	{
		component: ProductFooterLegalArea,
		componentID: "ProductFooterLegalArea",
		layoutId: "layout.area.productFooterLegal",
		name: "Product Footer Legal Area",
		props: generalAreaProps(["bottomPadding", "gap", "paddingX", "paddingY"]),
	},
	{
		component: PriceAccordionStackArea,
		componentID: "PriceAccordionStackArea",
		layoutId: "layout.area.priceAccordionStackArea",
		name: "Price Accordion Stack Area",
		props: generalAreaProps(["componentGap", "divider", "sectionDivider", "gap", "titleGap"]),
	},
	{
		component: DeliveryInfoAccordionArea,
		componentID: "DeliveryInfoAccordionArea",
		layoutId: "layout.area.deliveryInfoAccordionArea",
		name: "Delivery Info Accordion Area",
		props: generalAreaProps(["componentGap", "divider", "sectionDivider", "gap"]),
	},
	{
		component: NoticeAccordionStackArea,
		componentID: "NoticeAccordionStackArea",
		layoutId: "layout.area.noticeAccordionStackArea",
		name: "Notice Accordion Stack Area",
		props: generalAreaProps(["componentGap", "divider", "sectionDivider", "gap"]),
	},
	{
		component: PagestackInfoTextSectionArea,
		componentID: "PagestackInfoTextSectionArea",
		layoutId: "layout.area.pagestackInfoTextSection",
		name: "Pagestack Info Text Section Area",
		props: generalAreaProps(["componentGap", "divider", "sectionDivider", "gap", "titleGap"]),
	},
	{
		component: TextListGroupArea,
		componentID: "TextListGroupArea",
		layoutId: "layout.area.textListGroupArea",
		name: "Text List Group Area",
		props: generalAreaProps(["componentGap", "divider", "sectionDivider", "gap", "rowCount", "titleGap"]),
	},
	{
		component: PlainInfoTextListArea,
		componentID: "PlainInfoTextListArea",
		layoutId: "layout.area.plainInfoTextListArea",
		name: "Plain Info Text List Area",
		props: generalAreaProps(["componentGap", "divider", "sectionDivider", "gap", "hideTitle", "rowCount"]),
	},
	{
		component: TabChipSearchAccordionArea,
		componentID: "TabChipSearchAccordionArea",
		layoutId: "layout.area.tabChipSearchAccordionArea",
		name: "Tab Chip Search Accordion Area",
		props: generalAreaProps(["componentGap", "filterGap", "gap"]),
	},
	{
		component: AccordionNoticeListArea,
		componentID: "AccordionNoticeListArea",
		layoutId: "layout.area.accordionNoticeListArea",
		name: "Accordion Notice List Area",
		props: generalAreaProps(["componentGap", "divider", "sectionDivider", "gap"]),
	},
	{
		component: AreaAppBarArea,
		componentID: "AreaAppBarArea",
		layoutId: "layout.area.areaAppBar",
		name: "Area App Bar Area",
		props: generalAreaProps(["componentGap", "gap", "hideTitle"]),
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
		component: PlainStackRegion,
		componentID: "HeaderRegion",
		layoutId: "layout.region.header",
		name: "Header Region",
		props: {},
	},
	{
		component: PlainStackRegion,
		componentID: "ContentsRegion",
		layoutId: "layout.region.contents",
		name: "Contents Region",
		props: {},
	},
	{
		component: PlainStackRegion,
		componentID: "BottomRegion",
		layoutId: "layout.region.bottom",
		name: "Bottom Region",
		props: {},
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

const areaGeneralPatternComponents: LayoutPatternComponentEntry[] = areaGeneralLayouts.map(
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

const compositeLayoutPatternComponents: LayoutPatternComponentEntry[] = compositeLayouts.map(
	(entry) => ({
		component: createCompositeWrapper(entry.defaults),
		layoutId: entry.layoutId,
		pattern: {
			id: entry.layoutId,
			target: "composite",
			name: entry.name,
			componentID: entry.componentID,
			children: {
				accepts: "component",
			},
			props: entry.props,
			status: "draft",
		},
		target: "composite",
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
	...areaGeneralPatternComponents,
	...compositeLayoutPatternComponents,
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

function compositeProps(
	keys: Array<
		| "buttonHeight"
		| "collapsedHeight"
		| "componentGaps"
		| "defaultProps"
		| "expandedHeight"
		| "figmaOnlyTypes"
		| "flow"
		| "fullWidth"
		| "gap"
		| "height"
		| "indicator"
		| "itemHeight"
		| "minHeight"
		| "paddingBottom"
		| "paddingTop"
		| "paddingX"
		| "paddingY"
		| "priceGap"
		| "radius"
		| "repeatSeparator"
		| "rowGap"
		| "selectedStroke"
		| "size"
		| "titleGap"
		| "width"
	>,
): LayoutPatternComponentEntry["pattern"]["props"] {
	const contracts: LayoutPatternComponentEntry["pattern"]["props"] = {};
	for (const key of keys) {
		contracts[key] = compositePropContractByKey[key];
	}
	return contracts;
}

function pageStackProps(): LayoutPatternComponentEntry["pattern"]["props"] {
	return {
		componentGap: {
			type: "number",
			description: "Legacy layoutProps.componentGap preserved as the PageStack contents gap.",
		},
		divider: {
			type: "boolean",
			description: "When true, render trailing contents dividers between stack children.",
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

function generalAreaProps(
	keys: Array<
		| "bottomPadding"
		| "componentGap"
		| "divider"
		| "filterGap"
		| "gap"
		| "hideTitle"
		| "infoPaddingBottom"
		| "infoPaddingTop"
		| "infoPaddingX"
		| "itemPaddingX"
		| "itemPaddingY"
		| "itemTemplate"
		| "listPresentation"
		| "paddingX"
		| "paddingY"
		| "primaryActionPlacement"
		| "rowCount"
		| "secondaryActionPlacement"
		| "sectionDivider"
		| "sectionGap"
		| "sectionModel"
		| "sectionPaddingX"
		| "surface"
		| "thumbnailHeight"
		| "titleGap"
		| "titleMode"
	>,
): LayoutPatternComponentEntry["pattern"]["props"] {
	const contracts: LayoutPatternComponentEntry["pattern"]["props"] = {};
	for (const key of keys) {
		contracts[key] = generalAreaPropContractByKey[key];
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
