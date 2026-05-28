# Layout Pattern Catalog Inventory

## 1. 문서 책임

이 문서는 `@cx/layout-pattern-store` catalog의 전환 inventory를 기록한다.

전환 계획과 실행 기준은 [LAYOUT_RENDERING_REDESIGN_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/LAYOUT_RENDERING_REDESIGN_PLAN.md)를 따른다. 이 문서는 각 pattern의 현재 상태, 새 `layout.*` id, 예정 `componentID`, 보존해야 하는 spacing key를 추적한다.

## 2. 상태 기준

| 상태 | 의미 |
|---|---|
| `converted` | 새 component catalog entry이며 실제 registered layout component가 있다. |
| `mixed` | 새 component catalog entry와 legacy shape가 섞여 있다. 자동 실행 stop condition이다. |
| `pending` | legacy `layout`/`match` 기반 entry이며 아직 component catalog entry로 전환 전이다. |

## 3. 요약

| target | total | converted | pending |
|---|---:|---:|---:|
| screen | 4 | 0 | 4 |
| region | 16 | 0 | 16 |
| area | 40 | 5 | 35 |
| composite | 49 | 0 | 49 |
| total | 109 | 5 | 104 |

## 4. Inventory

### screen

| target | legacy id | new id | componentID | spacing keys | children | status |
|---|---|---|---|---|---|---|
| screen | `screen-shell` | `layout.screen.screenShell` | `ScreenShellScreen` | gap | region | pending |
| screen | `commerce-detail-screen` | `layout.screen.commerceDetailScreen` | `CommerceDetailScreen` | contentWidth, gap, safeArea | region | pending |
| screen | `text-list-screen` | `layout.screen.textListScreen` | `TextListScreen` | contentWidth, gap, height | region | pending |
| screen | `card-list-screen` | `layout.screen.cardListScreen` | `CardListScreen` | contentWidth, gap | region | pending |

### region

| target | legacy id | new id | componentID | spacing keys | children | status |
|---|---|---|---|---|---|---|
| region | `section-stack` | `layout.region.sectionStack` | `SectionStackRegion` | divider, itemPaddingX, paddingY, sectionGap, sectionPaddingX, slotInsetX | area | pending |
| region | `plain-stack` | `layout.region.plainStack` | `PlainStackRegion` | gap | area | pending |
| region | `commerce-detail-content-stack` | `layout.region.commerceDetailContentStack` | `CommerceDetailContentStackRegion` | contentWidth, divider, gap, itemPaddingX, paddingY, sectionGap, sectionPaddingX, slotInsetX | area | pending |
| region | `commerce-detail-bottom-action` | `layout.region.commerceDetailBottomAction` | `CommerceDetailBottomActionRegion` | gap, paddingX, paddingY | area | pending |
| region | `subscription-detail-rich-content` | `layout.region.subscriptionDetailRichContent` | `SubscriptionDetailRichContentRegion` | contentWidth, divider, gap, itemPaddingX, paddingY, sectionGap, sectionPaddingX, slotInsetX | area | pending |
| region | `gifticon-detail-compact-content` | `layout.region.gifticonDetailCompactContent` | `GifticonDetailCompactContentRegion` | contentWidth, divider, gap | area | pending |
| region | `benefit-brand-detail-content` | `layout.region.benefitBrandDetailContent` | `BenefitBrandDetailContentRegion` | contentWidth, divider, gap, itemPaddingX, paddingY, sectionGap, sectionPaddingX, slotInsetX | area | pending |
| region | `device-detail-option-content` | `layout.region.deviceDetailOptionContent` | `DeviceDetailOptionContentRegion` | contentWidth, divider, gap, itemPaddingX, paddingY, sectionGap, sectionPaddingX, slotInsetX | area | pending |
| region | `summary-text-list-content` | `layout.region.summaryTextListContent` | `SummaryTextListContentRegion` | contentWidth, divider, gap, itemPaddingX, paddingY, sectionGap, sectionPaddingX, slotInsetX | area | pending |
| region | `summary-title-filter-text-list-content` | `layout.region.summaryTitleFilterTextListContent` | `SummaryTitleFilterTextListContentRegion` | contentWidth, divider, gap, itemPaddingX, paddingY, sectionGap, sectionPaddingX, slotInsetX | area | pending |
| region | `filterable-text-list-content` | `layout.region.filterableTextListContent` | `FilterableTextListContentRegion` | contentWidth, gap | area | pending |
| region | `plain-notice-list-content` | `layout.region.plainNoticeListContent` | `PlainNoticeListContentRegion` | contentWidth, gap | area | pending |
| region | `faq-guide-list-content` | `layout.region.faqGuideListContent` | `FaqGuideListContentRegion` | contentWidth, gap | area | pending |
| region | `product-card-sectioned-list-content` | `layout.region.productCardSectionedListContent` | `ProductCardSectionedListContentRegion` | contentWidth, divider, gap, itemPaddingX, paddingY, sectionGap, sectionPaddingX, slotInsetX | area | pending |
| region | `product-card-flat-row-list-content` | `layout.region.productCardFlatRowListContent` | `ProductCardFlatRowListContentRegion` | contentWidth, gap | area | pending |
| region | `product-card-flat-horizontal-list-content` | `layout.region.productCardFlatHorizontalListContent` | `ProductCardFlatHorizontalListContentRegion` | contentWidth, gap | area | pending |

### area

| target | legacy id | new id | componentID | spacing keys | children | status |
|---|---|---|---|---|---|---|
| area | `area-vertical` | `layout.area.areaVertical` | `AreaVerticalArea` | gap | component | pending |
| area | `layout.area.listStack` | `layout.area.listStack` | `ListStackArea` | componentGap, gap, itemPaddingX, paddingY, sectionPaddingX, titleGap | component | converted |
| area | `auth-method-list` | `layout.area.authMethodList` | `AuthMethodListArea` | componentGap, divider, gap, itemPaddingX, itemPaddingY, titleGap | component | pending |
| area | `layout.area.fieldStack` | `layout.area.fieldStack` | `FieldStackArea` | componentGap, gap, itemPaddingX, paddingY, sectionPaddingX, titleGap | component | converted |
| area | `auth-code-entry` | `layout.area.authCodeEntry` | `AuthCodeEntryArea` | componentGap, gap, titleGap | component | pending |
| area | `layout.area.checkboxStack` | `layout.area.checkboxStack` | `CheckboxStackArea` | componentGap, gap, itemPaddingX, paddingY, sectionPaddingX, titleGap | component | converted |
| area | `layout.area.accordionList` | `layout.area.accordionList` | `AccordionListArea` | componentGap, gap, itemPaddingX, paddingY, sectionPaddingX, titleGap | component | converted |
| area | `layout.area.messageStack` | `layout.area.messageStack` | `MessageStackArea` | componentGap, gap, itemPaddingX, paddingY, sectionPaddingX, titleGap | component | converted |
| area | `action-stack` | `layout.area.actionStack` | `ActionStackArea` | componentGap, gap, titleGap | component | pending |
| area | `bottom-action-area` | `layout.area.bottomActionArea` | `BottomActionArea` | componentGap, gap, paddingY, titleGap | component | pending |
| area | `product-hero-summary` | `layout.area.productHeroSummary` | `ProductHeroSummaryArea` | componentGap, gap, thumbnailHeight | component | pending |
| area | `product-option-grid` | `layout.area.productOptionGrid` | `ProductOptionGridArea` | componentGap, gap, titleGap | component | pending |
| area | `product-info-section` | `layout.area.productInfoSection` | `ProductInfoSectionArea` | componentGap, gap, titleGap | component | pending |
| area | `product-disclosure-accordion` | `layout.area.productDisclosureAccordion` | `ProductDisclosureAccordionArea` | componentGap, divider, gap, titleGap | component | pending |
| area | `benefit-brand-list` | `layout.area.benefitBrandList` | `BenefitBrandListArea` | componentGap, gap, titleGap | component | pending |
| area | `nearby-store-list` | `layout.area.nearbyStoreList` | `NearbyStoreListArea` | componentGap, gap, titleGap | component | pending |
| area | `product-footer-legal` | `layout.area.productFooterLegal` | `ProductFooterLegalArea` | gap, paddingX, paddingY | component | pending |
| area | `price-accordion-stack-area` | `layout.area.priceAccordionStackArea` | `PriceAccordionStackArea` | componentGap, divider, gap | component | pending |
| area | `delivery-info-accordion-area` | `layout.area.deliveryInfoAccordionArea` | `DeliveryInfoAccordionArea` | componentGap, divider, gap | component | pending |
| area | `product-more-link-area` | `layout.area.productMoreLinkArea` | `ProductMoreLinkArea` | componentGap, componentGaps, gap | component | pending |
| area | `rich-image-tab-area` | `layout.area.richImageTabArea` | `RichImageTabArea` | componentGap, componentGaps, gap | component | pending |
| area | `option-list-section-area` | `layout.area.optionListSectionArea` | `OptionListSectionArea` | componentGap, componentGaps, gap, titleGap | component | pending |
| area | `coupon-benefit-area` | `layout.area.couponBenefitArea` | `CouponBenefitArea` | componentGap, componentGaps, gap | component | pending |
| area | `map-card-info-list-area` | `layout.area.mapCardInfoListArea` | `MapCardInfoListArea` | componentGap, componentGaps, gap | component | pending |
| area | `card-info-brand-list-area` | `layout.area.cardInfoBrandListArea` | `CardInfoBrandListArea` | componentGap, componentGaps, gap | component | pending |
| area | `notice-accordion-stack-area` | `layout.area.noticeAccordionStackArea` | `NoticeAccordionStackArea` | componentGap, divider, gap | component | pending |
| area | `list-summary-card-area` | `layout.area.listSummaryCardArea` | `ListSummaryCardArea` | componentGap, gap | component | pending |
| area | `pagestack-info-text-section` | `layout.area.pagestackInfoTextSection` | `PagestackInfoTextSectionArea` | componentGap, divider, gap, titleGap | component | pending |
| area | `filter-chip-text-list-area` | `layout.area.filterChipTextListArea` | `FilterChipTextListArea` | componentGap, filterGap, gap, titleGap | component | pending |
| area | `text-list-group-area` | `layout.area.textListGroupArea` | `TextListGroupArea` | componentGap, divider, gap, titleGap | component | pending |
| area | `plain-info-text-list-area` | `layout.area.plainInfoTextListArea` | `PlainInfoTextListArea` | componentGap, divider, gap | component | pending |
| area | `tab-chip-search-accordion-area` | `layout.area.tabChipSearchAccordionArea` | `TabChipSearchAccordionArea` | componentGap, filterGap, gap | component | pending |
| area | `accordion-notice-list-area` | `layout.area.accordionNoticeListArea` | `AccordionNoticeListArea` | componentGap, divider, gap | component | pending |
| area | `product-list-group-area` | `layout.area.productListGroupArea` | `ProductListGroupArea` | componentGap, componentGaps, gap, titleGap | component | pending |
| area | `product-list-chip-sort-area` | `layout.area.productListChipSortArea` | `ProductListChipSortArea` | componentGap, componentGaps, controlGap, gap | component | pending |
| area | `product-list-sort-only-area` | `layout.area.productListSortOnlyArea` | `ProductListSortOnlyArea` | componentGap, componentGaps, gap | component | pending |
| area | `horizontal-card-list-area` | `layout.area.horizontalCardListArea` | `HorizontalCardListArea` | componentGap, componentGaps, gap | component | pending |
| area | `row-card-list-area` | `layout.area.rowCardListArea` | `RowCardListArea` | componentGap, componentGaps, gap | component | pending |
| area | `hidden-title-pagestack-card-list-area` | `layout.area.hiddenTitlePagestackCardListArea` | `HiddenTitlePagestackCardListArea` | componentGap, componentGaps, gap | component | pending |
| area | `area-app-bar` | `layout.area.areaAppBar` | `AreaAppBarArea` | componentGap, gap | component | pending |

### composite

| target | legacy id | new id | componentID | spacing keys | children | status |
|---|---|---|---|---|---|---|
| composite | `component-app-bar` | `layout.composite.componentAppBar` | `ComponentAppBarComposite` | gap | component | pending |
| composite | `component-thumbnail-large` | `layout.composite.componentThumbnailLarge` | `ComponentThumbnailLargeComposite` | gap | component | pending |
| composite | `component-text-field` | `layout.composite.componentTextField` | `ComponentTextFieldComposite` | gap | component | pending |
| composite | `component-section-message` | `layout.composite.componentSectionMessage` | `ComponentSectionMessageComposite` | gap | component | pending |
| composite | `component-button` | `layout.composite.componentButton` | `ComponentButtonComposite` | gap | component | pending |
| composite | `component-list-cell` | `layout.composite.componentListCell` | `ComponentListCellComposite` | gap | component | pending |
| composite | `component-accordion` | `layout.composite.componentAccordion` | `ComponentAccordionComposite` | gap | component | pending |
| composite | `component-checkbox` | `layout.composite.componentCheckbox` | `ComponentCheckboxComposite` | gap | component | pending |
| composite | `component-product-info` | `layout.composite.componentProductInfo` | `ComponentProductInfoComposite` | gap, paddingX, titleGap | component | pending |
| composite | `component-card-summary` | `layout.composite.componentCardSummary` | `ComponentCardSummaryComposite` | gap | component | pending |
| composite | `component-badge` | `layout.composite.componentBadge` | `ComponentBadgeComposite` | gap | component | pending |
| composite | `component-text-button` | `layout.composite.componentTextButton` | `ComponentTextButtonComposite` | gap | component | pending |
| composite | `component-list-text` | `layout.composite.componentListText` | `ComponentListTextComposite` | gap | component | pending |
| composite | `component-option-card` | `layout.composite.componentOptionCard` | `ComponentOptionCardComposite` | gap, minHeight | component | pending |
| composite | `component-banner-indicator` | `layout.composite.componentBannerIndicator` | `ComponentBannerIndicatorComposite` | gap, height, width | component | pending |
| composite | `component-footer` | `layout.composite.componentFooter` | `ComponentFooterComposite` | gap | component | pending |
| composite | `component-legal-text` | `layout.composite.componentLegalText` | `ComponentLegalTextComposite` | gap | component | pending |
| composite | `component-map-block` | `layout.composite.componentMapBlock` | `ComponentMapBlockComposite` | gap | component | pending |
| composite | `component-store-card` | `layout.composite.componentStoreCard` | `ComponentStoreCardComposite` | gap | component | pending |
| composite | `component-title-section` | `layout.composite.componentTitleSection` | `ComponentTitleSectionComposite` | gap | component | pending |
| composite | `component-info-text-list` | `layout.composite.componentInfoTextList` | `ComponentInfoTextListComposite` | gap, height | component | pending |
| composite | `component-chip-filter` | `layout.composite.componentChipFilter` | `ComponentChipFilterComposite` | gap, height, paddingX | component | pending |
| composite | `component-tab` | `layout.composite.componentTab` | `ComponentTabComposite` | gap, height | component | pending |
| composite | `component-search-bar` | `layout.composite.componentSearchBar` | `ComponentSearchBarComposite` | gap, height | component | pending |
| composite | `component-accordion-notice-info` | `layout.composite.componentAccordionNoticeInfo` | `ComponentAccordionNoticeInfoComposite` | gap | component | pending |
| composite | `composite-title-info-text-list` | `layout.composite.compositeTitleInfoTextList` | `CompositeTitleInfoTextListComposite` | gap, rowGap | component | pending |
| composite | `composite-summary-filtered-text-list` | `layout.composite.compositeSummaryFilteredTextList` | `CompositeSummaryFilteredTextListComposite` | gap | component | pending |
| composite | `composite-summary-sectioned-info-list` | `layout.composite.compositeSummarySectionedInfoList` | `CompositeSummarySectionedInfoListComposite` | gap | component | pending |
| composite | `composite-plain-notice-list` | `layout.composite.compositePlainNoticeList` | `CompositePlainNoticeListComposite` | gap, paddingX | component | pending |
| composite | `composite-tab-chip-search-accordion-list` | `layout.composite.compositeTabChipSearchAccordionList` | `CompositeTabChipSearchAccordionListComposite` | gap | component | pending |
| composite | `composite-product-hero-media-info` | `layout.composite.compositeProductHeroMediaInfo` | `CompositeProductHeroMediaInfoComposite` | gap | component | pending |
| composite | `composite-product-summary-status-list` | `layout.composite.compositeProductSummaryStatusList` | `CompositeProductSummaryStatusListComposite` | gap, sectionGap | component | pending |
| composite | `composite-store-map-list` | `layout.composite.compositeStoreMapList` | `CompositeStoreMapListComposite` | gap | component | pending |
| composite | `composite-footer-legal-links` | `layout.composite.compositeFooterLegalLinks` | `CompositeFooterLegalLinksComposite` | gap | component | pending |
| composite | `composite-product-list-filter-sort` | `layout.composite.compositeProductListFilterSort` | `CompositeProductListFilterSortComposite` | componentGaps, gap | component | pending |
| composite | `composite-product-list-group-title-stack` | `layout.composite.compositeProductListGroupTitleStack` | `CompositeProductListGroupTitleStackComposite` | componentGaps, gap | component | pending |
| composite | `composite-list-product-horizontal-card-set` | `layout.composite.compositeListProductHorizontalCardSet` | `CompositeListProductHorizontalCardSetComposite` | componentGaps, gap | component | pending |
| composite | `composite-list-product-row-card-set` | `layout.composite.compositeListProductRowCardSet` | `CompositeListProductRowCardSetComposite` | componentGaps, gap | component | pending |
| composite | `composite-pagestack-product-card-list` | `layout.composite.compositePagestackProductCardList` | `CompositePagestackProductCardListComposite` | componentGaps, gap | component | pending |
| composite | `component-action-button` | `layout.composite.componentActionButton` | `ComponentActionButtonComposite` | gap, paddingX | component | pending |
| composite | `component-action-button-with-tooltip` | `layout.composite.componentActionButtonWithTooltip` | `ComponentActionButtonWithTooltipComposite` | gap, paddingX | component | pending |
| composite | `composite-price-accordion-selected-list` | `layout.composite.compositePriceAccordionSelectedList` | `CompositePriceAccordionSelectedListComposite` | gap, rowGap | component | pending |
| composite | `composite-product-detail-rich-image-tab` | `layout.composite.compositeProductDetailRichImageTab` | `CompositeProductDetailRichImageTabComposite` | componentGaps, gap | component | pending |
| composite | `composite-button-more-product-link` | `layout.composite.compositeButtonMoreProductLink` | `CompositeButtonMoreProductLinkComposite` | componentGaps, gap | component | pending |
| composite | `composite-option-list-stack` | `layout.composite.compositeOptionListStack` | `CompositeOptionListStackComposite` | componentGaps, gap | component | pending |
| composite | `composite-coupon-benefit-card` | `layout.composite.compositeCouponBenefitCard` | `CompositeCouponBenefitCardComposite` | componentGaps, gap | component | pending |
| composite | `composite-map-card-info-list` | `layout.composite.compositeMapCardInfoList` | `CompositeMapCardInfoListComposite` | componentGaps, gap | component | pending |
| composite | `composite-card-info-brand-list` | `layout.composite.compositeCardInfoBrandList` | `CompositeCardInfoBrandListComposite` | componentGaps, gap | component | pending |
| composite | `composite-product-disclosure-notice-list` | `layout.composite.compositeProductDisclosureNoticeList` | `CompositeProductDisclosureNoticeListComposite` | componentGaps, gap | component | pending |
