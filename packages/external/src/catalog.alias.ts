// 손으로 유지하는 alias → canonical(kiki.X) 매핑.
// canonicalize-catalog.ts에서만 소비된다. 값은 반드시 catalog의 실제 키여야 한다(무결성 검증이 강제).
export const catalogAlias: Record<string, string> = {
	// PageStack → kiki.Pagestack (대소문자 리네임)
	Pagestack: "kiki.Pagestack",
	pagestack: "kiki.Pagestack",
	"Default 20/PagestackItemTemplate": "kiki.Pagestack",

	// ActionButton
	"action-button": "kiki.ActionButton",

	// AppBar
	"app-bar": "kiki.AppBar",
	appbar: "kiki.AppBar",
	AppBarHeaderTopNav: "kiki.AppBar",

	// Badge
	badge: "kiki.Badge",
	BadgeProductStatus: "kiki.Badge",

	// Button
	button: "kiki.Button",

	// CardContentsFilled
	"card-contents-filled": "kiki.CardContentsFilled",
	CardText: "kiki.CardContentsFilled",
	"card-text": "kiki.CardContentsFilled",

	// CardSummary
	"card-summary": "kiki.CardSummary",
	CardSummaryProductSummary: "kiki.CardSummary",
	Local_Summary: "kiki.CardSummary",

	// AccordionNoticeInfo
	"accordion-notice-info": "kiki.AccordionNoticeInfo",
	AccordionList: "kiki.AccordionNoticeInfo",
	"faq-accordion": "kiki.AccordionNoticeInfo",
	"notice-accordion": "kiki.AccordionNoticeInfo",

	// AccordionPriceInfo
	"accordion-price-info": "kiki.AccordionPriceInfo",

	// Checkbox
	checkbox: "kiki.Checkbox",

	// Chip
	chip: "kiki.Chip",
	"filter-chip": "kiki.Chip",
	ChipFilter: "kiki.Chip",
	Local_Chips: "kiki.Chip",

	// Divider
	divider: "kiki.Divider",
	"section-divider": "kiki.Divider",
	"content-divider": "kiki.Divider",

	// Footer
	footer: "kiki.Footer",
	FooterLegal: "kiki.Footer",
	"legal-footer": "kiki.Footer",

	// FilterSorting
	"filter-sorting": "kiki.FilterSorting",
	"filter-sort": "kiki.FilterSorting",
	FilterSort: "kiki.FilterSorting",
	SortFilter: "kiki.FilterSorting",

	// InfoTextList
	"info-text-list": "kiki.InfoTextList",
	InfoTextListDefault: "kiki.InfoTextList",
	InfoTextListWithBadge: "kiki.InfoTextList",
	Local_ListInfo: "kiki.InfoTextList",

	// Coupon
	coupon: "kiki.Coupon",
	Coupon: "kiki.Coupon",
	Local_Coupon: "kiki.Coupon",
	"coupon-benefit": "kiki.Coupon",

	// ListProductHorizontal
	"list-product-horizontal": "kiki.ListProductHorizontal",
	"product-horizontal-card": "kiki.ListProductHorizontal",
	"horizontal-product-card": "kiki.ListProductHorizontal",

	// ListProductRow
	"list-product-row": "kiki.ListProductRow",
	"product-row-card": "kiki.ListProductRow",
	"row-product-card": "kiki.ListProductRow",

	// ListSelected
	"list-selected": "kiki.ListSelected",

	// ListText
	"list-text": "kiki.ListText",
	ListTextProductInfo: "kiki.ListText",

	// MapBlock → kiki.Map (리네임)
	Map: "kiki.Map",
	map: "kiki.Map",
	"map-block": "kiki.Map",

	// OptionList
	"option-list": "kiki.OptionList",
	Local_OptionList: "kiki.OptionList",
	OptionList: "kiki.OptionList",

	// ProductInfo
	"product-info": "kiki.ProductInfo",
	ProductInfoSummary: "kiki.ProductInfo",

	// RadioText → kiki.Radio (리네임)
	Radio: "kiki.Radio",
	radio: "kiki.Radio",

	// Tab
	tab: "kiki.Tab",
	tabs: "kiki.Tab",
	UnderlineTab: "kiki.Tab",
	TabNavigation: "kiki.Tab",

	// TextButton
	ButtonTextUnderline: "kiki.TextButton",
	ButtonMore: "kiki.TextButton",
	ButtonMoreProduct: "kiki.TextButton",
	"button-text-underline": "kiki.TextButton",
	"button-more": "kiki.TextButton",
	"button-more-product": "kiki.TextButton",
	"text-button": "kiki.TextButton",

	// TextField
	"text-field": "kiki.TextField",
	"text-area": "kiki.TextField",

	// SearchBar
	"search-bar": "kiki.SearchBar",
	SearchInput: "kiki.SearchBar",
	SearchBarLLM: "kiki.SearchBar",

	// TitleSection
	"title-section": "kiki.TitleSection",
	TitleContents: "kiki.TitleSection",
	ContentsTitle: "kiki.TitleSection",
	TextListGroupTitle: "kiki.TitleSection",
};
