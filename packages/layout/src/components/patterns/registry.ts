import { getEntry } from "../../public/catalog";
import {
	AccordionListArea,
	ActionStackArea,
	AreaAppBarArea,
	AreaVerticalArea,
	AuthCodeEntryArea,
	AuthMethodListArea,
	BenefitBrandListArea,
	BottomActionArea,
	CardInfoBrandListArea,
	FieldStackArea,
	FilterChipTextListArea,
	HiddenTitlePagestackCardListArea,
	HorizontalCardListArea,
	ListStackArea,
	ListSummaryCardArea,
	MapCardInfoListArea,
	NearbyStoreListArea,
	NoticeAccordionStackArea,
	OptionListSectionArea,
	PlainInfoTextListArea,
	ProductDisclosureAccordionArea,
	ProductFooterLegalArea,
	ProductHeroSummaryArea,
	ProductInfoSectionArea,
	ProductListChipSortArea,
	ProductListGroupArea,
	ProductOptionGridArea,
	RowCardListArea,
	TabChipSearchAccordionArea,
	TextListGroupArea,
} from "../areas";
import {
	ComponentAccordionComposite,
	ComponentAccordionNoticeInfoComposite,
	ComponentActionButtonComposite,
	ComponentActionButtonWithTooltipComposite,
	ComponentAppBarComposite,
	ComponentBadgeComposite,
	ComponentBannerIndicatorComposite,
	ComponentButtonComposite,
	ComponentCardSummaryComposite,
	ComponentCheckboxComposite,
	ComponentChipFilterComposite,
	ComponentFooterComposite,
	ComponentInfoTextListComposite,
	ComponentLegalTextComposite,
	ComponentListCellComposite,
	ComponentListTextComposite,
	ComponentMapBlockComposite,
	ComponentOptionCardComposite,
	ComponentProductInfoComposite,
	ComponentSearchBarComposite,
	ComponentSectionMessageComposite,
	ComponentStoreCardComposite,
	ComponentTabComposite,
	ComponentTextButtonComposite,
	ComponentTextFieldComposite,
	ComponentThumbnailLargeComposite,
	ComponentTitleSectionComposite,
	CompositeButtonMoreProductLinkComposite,
	CompositeCardInfoBrandListComposite,
	CompositeCouponBenefitCardComposite,
	CompositeFooterLegalLinksComposite,
	CompositeListProductHorizontalCardSetComposite,
	CompositeListProductRowCardSetComposite,
	CompositeMapCardInfoListComposite,
	CompositeOptionListStackComposite,
	CompositePagestackProductCardListComposite,
	CompositePlainNoticeListComposite,
	CompositePriceAccordionSelectedListComposite,
	CompositeProductDetailRichImageTabComposite,
	CompositeProductDisclosureNoticeListComposite,
	CompositeProductHeroMediaInfoComposite,
	CompositeProductListFilterSortComposite,
	CompositeProductListGroupTitleStackComposite,
	CompositeProductSummaryStatusListComposite,
	CompositeStoreMapListComposite,
	CompositeSummaryFilteredTextListComposite,
	CompositeSummarySectionedInfoListComposite,
	CompositeTabChipSearchAccordionListComposite,
	CompositeTitleInfoTextListComposite,
} from "./composite";
import { PlainStackRegion } from "../regions/RegionStack";
import { MobileScreen } from "../chromes/MobileScreen";
import type { LayoutPatternComponent, LayoutPatternComponentEntry } from "./types";

// layoutId → 실제 렌더 named component. 계약 데이터(props/name/children/status)는 catalog가 소유한다.
const COMPONENTS_BY_LAYOUT_ID: Record<string, LayoutPatternComponent> = {
	// area — pageStack
	"layout.area.accordionList": AccordionListArea,
	"layout.area.actionStack": ActionStackArea,
	"layout.area.authCodeEntry": AuthCodeEntryArea,
	"layout.area.authMethodList": AuthMethodListArea,
	"layout.area.fieldStack": FieldStackArea,
	"layout.area.listStack": ListStackArea,
	"layout.area.noticeAccordionStackArea": NoticeAccordionStackArea,
	"layout.area.plainInfoTextListArea": PlainInfoTextListArea,
	"layout.area.productDisclosureAccordion": ProductDisclosureAccordionArea,
	"layout.area.productInfoSection": ProductInfoSectionArea,
	"layout.area.tabChipSearchAccordionArea": TabChipSearchAccordionArea,
	"layout.area.textListGroupArea": TextListGroupArea,
	// area — collection
	"layout.area.productOptionGrid": ProductOptionGridArea,
	"layout.area.benefitBrandList": BenefitBrandListArea,
	"layout.area.nearbyStoreList": NearbyStoreListArea,
	"layout.area.optionListSectionArea": OptionListSectionArea,
	"layout.area.mapCardInfoListArea": MapCardInfoListArea,
	"layout.area.cardInfoBrandListArea": CardInfoBrandListArea,
	"layout.area.listSummaryCardArea": ListSummaryCardArea,
	"layout.area.filterChipTextListArea": FilterChipTextListArea,
	"layout.area.productListGroupArea": ProductListGroupArea,
	"layout.area.productListChipSortArea": ProductListChipSortArea,
	"layout.area.horizontalCardListArea": HorizontalCardListArea,
	"layout.area.rowCardListArea": RowCardListArea,
	"layout.area.hiddenTitlePagestackCardListArea": HiddenTitlePagestackCardListArea,
	// area — general
	"layout.area.areaVertical": AreaVerticalArea,
	"layout.area.bottomActionArea": BottomActionArea,
	"layout.area.productHeroSummary": ProductHeroSummaryArea,
	"layout.area.productFooterLegal": ProductFooterLegalArea,
	"layout.area.areaAppBar": AreaAppBarArea,
	// region
	"layout.region.header": PlainStackRegion,
	"layout.region.contents": PlainStackRegion,
	"layout.region.bottom": PlainStackRegion,
	// screen
	"layout.screen.mobileScreen": MobileScreen,
	// composite (layoutId → named export, name === componentID)
	"layout.composite.componentAppBar": ComponentAppBarComposite,
	"layout.composite.componentThumbnailLarge": ComponentThumbnailLargeComposite,
	"layout.composite.componentTextField": ComponentTextFieldComposite,
	"layout.composite.componentSectionMessage": ComponentSectionMessageComposite,
	"layout.composite.componentButton": ComponentButtonComposite,
	"layout.composite.componentListCell": ComponentListCellComposite,
	"layout.composite.componentAccordion": ComponentAccordionComposite,
	"layout.composite.componentCheckbox": ComponentCheckboxComposite,
	"layout.composite.componentProductInfo": ComponentProductInfoComposite,
	"layout.composite.componentCardSummary": ComponentCardSummaryComposite,
	"layout.composite.componentBadge": ComponentBadgeComposite,
	"layout.composite.componentTextButton": ComponentTextButtonComposite,
	"layout.composite.componentListText": ComponentListTextComposite,
	"layout.composite.componentOptionCard": ComponentOptionCardComposite,
	"layout.composite.componentBannerIndicator": ComponentBannerIndicatorComposite,
	"layout.composite.componentFooter": ComponentFooterComposite,
	"layout.composite.componentLegalText": ComponentLegalTextComposite,
	"layout.composite.componentMapBlock": ComponentMapBlockComposite,
	"layout.composite.componentStoreCard": ComponentStoreCardComposite,
	"layout.composite.componentTitleSection": ComponentTitleSectionComposite,
	"layout.composite.componentInfoTextList": ComponentInfoTextListComposite,
	"layout.composite.componentChipFilter": ComponentChipFilterComposite,
	"layout.composite.componentTab": ComponentTabComposite,
	"layout.composite.componentSearchBar": ComponentSearchBarComposite,
	"layout.composite.componentAccordionNoticeInfo": ComponentAccordionNoticeInfoComposite,
	"layout.composite.compositeTitleInfoTextList": CompositeTitleInfoTextListComposite,
	"layout.composite.compositeSummaryFilteredTextList": CompositeSummaryFilteredTextListComposite,
	"layout.composite.compositeSummarySectionedInfoList": CompositeSummarySectionedInfoListComposite,
	"layout.composite.compositePlainNoticeList": CompositePlainNoticeListComposite,
	"layout.composite.compositeTabChipSearchAccordionList":
		CompositeTabChipSearchAccordionListComposite,
	"layout.composite.compositeProductHeroMediaInfo": CompositeProductHeroMediaInfoComposite,
	"layout.composite.compositeProductSummaryStatusList": CompositeProductSummaryStatusListComposite,
	"layout.composite.compositeStoreMapList": CompositeStoreMapListComposite,
	"layout.composite.compositeFooterLegalLinks": CompositeFooterLegalLinksComposite,
	"layout.composite.compositeProductListFilterSort": CompositeProductListFilterSortComposite,
	"layout.composite.compositeProductListGroupTitleStack":
		CompositeProductListGroupTitleStackComposite,
	"layout.composite.compositeListProductHorizontalCardSet":
		CompositeListProductHorizontalCardSetComposite,
	"layout.composite.compositeListProductRowCardSet": CompositeListProductRowCardSetComposite,
	"layout.composite.compositePagestackProductCardList":
		CompositePagestackProductCardListComposite,
	"layout.composite.componentActionButton": ComponentActionButtonComposite,
	"layout.composite.componentActionButtonWithTooltip": ComponentActionButtonWithTooltipComposite,
	"layout.composite.compositePriceAccordionSelectedList":
		CompositePriceAccordionSelectedListComposite,
	"layout.composite.compositeProductDetailRichImageTab":
		CompositeProductDetailRichImageTabComposite,
	"layout.composite.compositeButtonMoreProductLink": CompositeButtonMoreProductLinkComposite,
	"layout.composite.compositeOptionListStack": CompositeOptionListStackComposite,
	"layout.composite.compositeCouponBenefitCard": CompositeCouponBenefitCardComposite,
	"layout.composite.compositeMapCardInfoList": CompositeMapCardInfoListComposite,
	"layout.composite.compositeCardInfoBrandList": CompositeCardInfoBrandListComposite,
	"layout.composite.compositeProductDisclosureNoticeList":
		CompositeProductDisclosureNoticeListComposite,
};

function buildEntry(
	layoutId: string,
	component: LayoutPatternComponent,
): LayoutPatternComponentEntry | undefined {
	const pattern = getEntry(layoutId);
	if (!pattern) return undefined; // parity 테스트가 orphan을 잡는다
	return { component, layoutId: pattern.id, pattern, target: pattern.target };
}

const layoutPatternComponents: LayoutPatternComponentEntry[] = Object.entries(
	COMPONENTS_BY_LAYOUT_ID,
)
	.map(([id, component]) => buildEntry(id, component))
	.filter((e): e is LayoutPatternComponentEntry => e !== undefined);

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
