// Behavior-deduped composites. 49 layoutId componentIDs map to 15 canonical wrappers.
//   - 3 gap-only clusters: CompositeGap0/Gap8/Gap12.
//   - 12 unique presets: one file each, exported under its componentID.
//   - 37 cluster members re-exported as aliases to their canonical wrapper.
// Behavior is byte-identical: same createCompositeWrapper engine + same defaults value.

export { ComponentActionButtonWithTooltipComposite } from "./ComponentActionButtonWithTooltipComposite";
export { ComponentBannerIndicatorComposite } from "./ComponentBannerIndicatorComposite";
export { ComponentChipFilterComposite } from "./ComponentChipFilterComposite";
export { ComponentInfoTextListComposite } from "./ComponentInfoTextListComposite";
export { ComponentLegalTextComposite } from "./ComponentLegalTextComposite";
export { ComponentOptionCardComposite } from "./ComponentOptionCardComposite";
// unique presets (12)
export { ComponentProductInfoComposite } from "./ComponentProductInfoComposite";
export { ComponentSearchBarComposite } from "./ComponentSearchBarComposite";
export { ComponentTabComposite } from "./ComponentTabComposite";
export { CompositeFooterLegalLinksComposite } from "./CompositeFooterLegalLinksComposite";
// canonical cluster wrappers
// gap:0 cluster members (28) → CompositeGap0
export {
	CompositeGap0,
	CompositeGap0 as ComponentAppBarComposite,
	CompositeGap0 as ComponentThumbnailLargeComposite,
	CompositeGap0 as ComponentTextFieldComposite,
	CompositeGap0 as ComponentSectionMessageComposite,
	CompositeGap0 as ComponentButtonComposite,
	CompositeGap0 as ComponentListCellComposite,
	CompositeGap0 as ComponentAccordionComposite,
	CompositeGap0 as ComponentCheckboxComposite,
	CompositeGap0 as ComponentCardSummaryComposite,
	CompositeGap0 as ComponentBadgeComposite,
	CompositeGap0 as ComponentTextButtonComposite,
	CompositeGap0 as ComponentListTextComposite,
	CompositeGap0 as ComponentMapBlockComposite,
	CompositeGap0 as ComponentStoreCardComposite,
	CompositeGap0 as ComponentTitleSectionComposite,
	CompositeGap0 as ComponentAccordionNoticeInfoComposite,
	CompositeGap0 as CompositeTitleInfoTextListComposite,
	CompositeGap0 as CompositeSummaryFilteredTextListComposite,
	CompositeGap0 as CompositeSummarySectionedInfoListComposite,
	CompositeGap0 as CompositeTabChipSearchAccordionListComposite,
	CompositeGap0 as CompositeProductHeroMediaInfoComposite,
	CompositeGap0 as CompositeProductListFilterSortComposite,
	CompositeGap0 as CompositePagestackProductCardListComposite,
	CompositeGap0 as ComponentActionButtonComposite,
	CompositeGap0 as CompositePriceAccordionSelectedListComposite,
	CompositeGap0 as CompositeProductDetailRichImageTabComposite,
	CompositeGap0 as CompositeButtonMoreProductLinkComposite,
	CompositeGap0 as CompositeProductDisclosureNoticeListComposite,
} from "./CompositeGap0";
// gap:8 cluster members (5) → CompositeGap8
export {
	CompositeGap8,
	CompositeGap8 as ComponentFooterComposite,
	CompositeGap8 as CompositeStoreMapListComposite,
	CompositeGap8 as CompositeOptionListStackComposite,
	CompositeGap8 as CompositeMapCardInfoListComposite,
	CompositeGap8 as CompositeCardInfoBrandListComposite,
} from "./CompositeGap8";
// gap:12 cluster members (4) → CompositeGap12
export {
	CompositeGap12,
	CompositeGap12 as CompositeProductSummaryStatusListComposite,
	CompositeGap12 as CompositeListProductHorizontalCardSetComposite,
	CompositeGap12 as CompositeListProductRowCardSetComposite,
	CompositeGap12 as CompositeCouponBenefitCardComposite,
} from "./CompositeGap12";
export { CompositePlainNoticeListComposite } from "./CompositePlainNoticeListComposite";
export { CompositeProductListGroupTitleStackComposite } from "./CompositeProductListGroupTitleStackComposite";
