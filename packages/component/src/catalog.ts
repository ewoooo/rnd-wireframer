import type { ComponentCatalog, ComponentCatalogEntry, ComponentPropContract } from "@cx/types/component-catalog";
import { isTokenRole } from "@cx/types/tokens";
export const componentCatalog = {
	"Layout.Flex": {
		type: "Layout.Flex",
		kind: "layout-flex",
		source: "layout-primitive",
		version: "1.0.0",
		description: "Vertical/horizontal flex container with token-driven spacing.",
		props: {
			direction: {
				type: "enum",
				role: "layout",
				values: ["row", "column"],
				defaultValue: "column",
			},
			gap: { type: "number", role: "layout", tokenRole: "spacing" },
			paddingX: { type: "number", role: "layout", tokenRole: "spacing" },
			paddingY: { type: "number", role: "layout", tokenRole: "spacing" },
			align: {
				type: "enum",
				role: "layout",
				values: ["start", "center", "end", "stretch"],
			},
			justify: {
				type: "enum",
				role: "layout",
				values: ["start", "center", "end", "between"],
			},
		},
	},
	"Layout.Grid": {
		type: "Layout.Grid",
		kind: "layout-grid",
		source: "layout-primitive",
		version: "1.0.0",
		description: "CSS grid container with token-driven spacing.",
		props: {
			columns: { type: "string", role: "layout" },
			rows: { type: "string", role: "layout" },
			gap: { type: "number", role: "layout", tokenRole: "spacing" },
			paddingX: { type: "number", role: "layout", tokenRole: "spacing" },
			paddingY: { type: "number", role: "layout", tokenRole: "spacing" },
			align: {
				type: "enum",
				role: "layout",
				values: ["start", "center", "end", "stretch"],
			},
			justify: {
				type: "enum",
				role: "layout",
				values: ["start", "center", "end", "stretch"],
			},
		},
	},
	PageStack: {
		type: "PageStack",
		kind: "page-stack",
		source: "layout-primitive",
		version: "1.0.0",
		description: "Region inset wrapper. Edge padding + safe-area aware vertical stack.",
		aliases: ["Pagestack", "pagestack", "Default 20/PagestackItemTemplate"],
		props: {
			gap: { type: "number", role: "layout", tokenRole: "spacing" },
			paddingX: { type: "number", role: "layout", tokenRole: "spacing" },
			paddingY: { type: "number", role: "layout", tokenRole: "spacing" },
			itemPaddingX: { type: "number", role: "layout", tokenRole: "spacing" },
			sectionPaddingX: { type: "number", role: "layout", tokenRole: "spacing" },
			sectionGap: { type: "number", role: "layout", tokenRole: "spacing" },
			slotInsetX: { type: "number", role: "layout", tokenRole: "spacing" },
			itemTemplate: {
				type: "enum",
				role: "styleVariant",
				values: ["card-0", "default-20", "plain"],
				defaultValue: "default-20",
			},
			titleMode: {
				type: "enum",
				role: "visibility",
				values: ["hidden", "none", "visible"],
				defaultValue: "none",
			},
		},
	},
	ActionButton: {
		type: "ActionButton",
		kind: "action",
		source: "react-component",
		version: "1.0.0",
		description: "Bottom action rail button backed by @cx/components ActionButton.",
		aliases: ["action-button"],
		props: {
			label: { type: "string", role: "label", required: true },
			variant: {
				type: "enum",
				role: "styleVariant",
				values: ["primary", "secondary", "solid"],
				defaultValue: "primary",
				variantTokens: {
					primary: { surface: "color.surface.brand", text: "color.text.inverse" },
					secondary: { surface: "color.surface.muted", text: "color.text" },
					solid: { surface: "color.surface", text: "color.text", border: "color.border.strong" },
				},
			},
			size: {
				type: "enum",
				role: "layout",
				values: ["xsmall", "small", "medium", "large", "xlarge"],
				defaultValue: "xlarge",
			},
			fullWidth: { type: "boolean", role: "layout", defaultValue: true },
			rightIcon: { type: "node", role: "slot", aiWritable: false },
		},
	},
	AppBar: {
		type: "AppBar",
		kind: "header",
		source: "react-component",
		version: "1.0.0",
		aliases: ["app-bar", "appbar", "AppBarHeaderTopNav"],
		props: {
			title: { type: "string", role: "title" },
			showBack: { type: "boolean", role: "visibility", defaultValue: false },
			showLogo: { type: "boolean", role: "visibility", defaultValue: false },
			rightItem: { type: "node", role: "slot", aiWritable: false },
		},
	},
	Badge: {
		type: "Badge",
		kind: "badge",
		source: "react-component",
		version: "1.0.0",
		aliases: ["badge", "BadgeProductStatus"],
		props: {
			children: { type: "string", role: "content", required: true },
			variant: {
				type: "enum",
				role: "styleVariant",
				values: ["gray", "black", "blue"],
				defaultValue: "gray",
				variantTokens: {
					gray: { surface: "color.surface.muted", text: "color.text" },
					black: { surface: "color.surface.inverse", text: "color.text.inverse" },
					blue: { surface: "color.surface.brand", text: "color.text.inverse" },
				},
			},
		},
	},
	BannerIndicaterMedium: {
		type: "BannerIndicaterMedium",
		kind: "banner-indicator",
		source: "react-component",
		version: "1.0.0",
		description: "Medium banner carousel item with an indicator, matching Figma spelling.",
		aliases: ["BannerIndicatorMedium", "banner-indicator", "banner", "carousel-banner"],
		props: {
			title: { type: "string", role: "title", required: true },
			description: { type: "string", role: "description" },
			imageUrl: { type: "string", role: "data" },
			current: { type: "number", role: "state", defaultValue: 1 },
			total: { type: "number", role: "state", defaultValue: 1 },
		},
	},
	BottomNavigation: {
		type: "BottomNavigation",
		source: "react-component",
		version: "1.0.0",
		props: {
			items: { type: "array", role: "data", required: true },
			activeKey: { type: "string", role: "state", required: true },
		},
	},
	Button: {
		type: "Button",
		kind: "action",
		source: "react-component",
		version: "1.0.0",
		aliases: ["button"],
		props: {
			label: { type: "string", role: "label", required: true },
			variant: {
				type: "enum",
				role: "styleVariant",
				values: ["primary", "secondary", "solid"],
				defaultValue: "primary",
				variantTokens: {
					primary: { surface: "color.surface.brand", text: "color.text.inverse" },
					secondary: { surface: "color.surface.muted", text: "color.text" },
					solid: { surface: "color.surface", text: "color.text", border: "color.border.strong" },
				},
			},
			size: {
				type: "enum",
				role: "layout",
				values: ["xsmall", "small", "medium", "large", "xlarge"],
				defaultValue: "medium",
			},
			fullWidth: { type: "boolean", role: "layout", defaultValue: false },
			rightIcon: { type: "node", role: "slot", aiWritable: false },
		},
	},
	Callout: {
		type: "Callout",
		kind: "section-message",
		source: "react-component",
		version: "1.0.0",
		props: {
			title: { type: "string", role: "title" },
			children: { type: "string", role: "content", required: true },
		},
	},
	CardContentsFilled: {
		type: "CardContentsFilled",
		kind: "card-contents",
		source: "react-component",
		version: "1.0.0",
		description: "Filled content card with a slot-like text surface.",
		aliases: ["card-contents-filled", "CardText", "card-text"],
		props: {
			title: { type: "string", role: "title" },
			description: { type: "string", role: "description" },
		},
	},
	CardSummary: {
		type: "CardSummary",
		kind: "card-summary",
		source: "react-component",
		version: "1.0.0",
		description: "Summary card for product, rating, price, or calculation sections.",
		aliases: ["card-summary", "CardSummaryProductSummary", "Local_Summary"],
		props: {
			title: { type: "string", role: "title", required: true },
			subText: { type: "string", role: "description" },
			rightText: { type: "string", role: "value" },
			items: { type: "array", role: "data" },
			buttonLabel: { type: "string", role: "label" },
		},
	},
	Accordion: {
		type: "Accordion",
		kind: "accordion",
		source: "renderer-composite",
		version: "1.0.0",
		aliases: ["accordion"],
		props: {
			title: { type: "string", role: "title", required: true },
			description: { type: "string", role: "description" },
			expanded: { type: "boolean", role: "state", defaultValue: false },
		},
	},
	AccordionNoticeInfo: {
		type: "AccordionNoticeInfo",
		kind: "accordion-info",
		source: "react-component",
		version: "1.0.0",
		description: "Notice accordion for PRDD detail/spec information sections.",
		aliases: ["accordion-notice-info", "AccordionList", "faq-accordion", "notice-accordion"],
		props: {
			title: { type: "string", role: "title", required: true },
			description: { type: "string", role: "description" },
			expanded: { type: "boolean", role: "state", defaultValue: false },
		},
	},
	AccordionPriceInfo: {
		type: "AccordionPriceInfo",
		kind: "accordion-info",
		source: "react-component",
		version: "1.0.0",
		description: "Price accordion for PRDD subsidy/price comparison sections.",
		aliases: ["accordion-price-info"],
		props: {
			title: { type: "string", role: "title", required: true },
			description: { type: "string", role: "description" },
			priceText: { type: "string", role: "value" },
			expanded: { type: "boolean", role: "state", defaultValue: false },
		},
	},
	Checkbox: {
		type: "Checkbox",
		kind: "checkbox",
		source: "renderer-composite",
		version: "1.0.0",
		description: "Checkbox item rendered through @cx/components ListSelected checkbox mode.",
		aliases: ["checkbox"],
		props: {
			label: { type: "string", role: "label", required: true },
			checked: { type: "boolean", role: "state", defaultValue: false },
			variant: {
				type: "enum",
				role: "styleVariant",
				values: ["small", "medium"],
				defaultValue: "medium",
			},
		},
	},
	Chip: {
		type: "Chip",
		source: "react-component",
		version: "1.0.0",
		description: "Selectable horizontal filter chip item.",
		aliases: ["chip", "filter-chip", "ChipFilter", "Local_Chips"],
		props: {
			children: { type: "string", role: "content", required: true },
			selected: { type: "boolean", role: "state", defaultValue: false },
		},
	},
	Divider: {
		type: "Divider",
		kind: "divider",
		source: "react-component",
		version: "1.0.0",
		aliases: ["divider", "section-divider", "content-divider"],
		props: {
			type: {
				type: "enum",
				role: "styleVariant",
				values: ["contents", "section"],
				defaultValue: "contents",
				variantTokens: {
					contents: { border: "color.border.subtle" },
					section: { border: "color.border.strong" },
				},
			},
		},
	},
	Footer: {
		type: "Footer",
		kind: "footer",
		source: "react-component",
		version: "1.0.0",
		description: "Low-emphasis legal/help footer for detail screens.",
		aliases: ["footer", "FooterLegal", "legal-footer"],
		props: {
			title: { type: "string", role: "title" },
			description: { type: "string", role: "description" },
			links: { type: "array", role: "data" },
		},
	},
	FilterSorting: {
		type: "FilterSorting",
		kind: "filter-sorting",
		source: "react-component",
		version: "1.0.0",
		description: "List result count, filter, and sort control row for browse screens.",
		aliases: ["filter-sorting", "filter-sort", "FilterSort", "SortFilter"],
		props: {
			countLabel: { type: "string", role: "label", defaultValue: "전체 0개" },
			filterLabel: { type: "string", role: "label", defaultValue: "필터" },
			sortLabel: { type: "string", role: "label", defaultValue: "추천순" },
			showFilter: { type: "boolean", role: "visibility", defaultValue: true },
			showSort: { type: "boolean", role: "visibility", defaultValue: true },
			activeFilterCount: { type: "number", role: "state", defaultValue: 0 },
		},
	},
	HeaderBase: {
		type: "HeaderBase",
		kind: "header",
		source: "renderer-composite",
		version: "1.0.0",
		description: "Renderer header node mapped to AppBar.",
		aliases: ["TopNavigation", "top-navigation"],
		props: {
			titleContent: { type: "string", role: "title" },
			titleSize: { type: "string", role: "styleVariant" },
			showBackButton: { type: "boolean", role: "visibility", defaultValue: true },
			showLogo: { type: "boolean", role: "visibility", defaultValue: false },
		},
	},
	InfoTextList: {
		type: "InfoTextList",
		kind: "list-cell",
		source: "react-component",
		version: "1.0.0",
		description: "Text list row with title, category/date, optional badge, or right-side value.",
		aliases: ["info-text-list", "InfoTextListDefault", "InfoTextListWithBadge", "Local_ListInfo"],
		props: {
			title: { type: "string", role: "title" },
			category: { type: "string", role: "description" },
			date: { type: "string", role: "data" },
			badge: { type: "string", role: "styleVariant" },
			rightText: { type: "string", role: "value" },
		},
	},
	LegalText: {
		type: "LegalText",
		kind: "legal-text",
		source: "react-component",
		version: "1.0.0",
		description: "Fine print list for product legal notices.",
		aliases: ["legal-text", "LegalNotice", "legal-notice"],
		props: {
			title: { type: "string", role: "title" },
			items: { type: "array", role: "data", required: true },
		},
	},
	ListCell: {
		type: "ListCell",
		kind: "list-cell",
		source: "renderer-composite",
		version: "1.0.0",
		aliases: ["list-cell"],
		props: {
			title: { type: "string", role: "title", required: true },
			description: { type: "string", role: "description" },
			required: { type: "boolean", role: "state" },
			checked: { type: "boolean", role: "state" },
		},
	},
	ListProductHorizontal: {
		type: "ListProductHorizontal",
		kind: "product-card",
		source: "react-component",
		version: "1.0.0",
		description: "Horizontal product card row for SKT card-list browse screens.",
		aliases: ["list-product-horizontal", "product-horizontal-card", "horizontal-product-card"],
		props: {
			title: { type: "string", role: "title", required: true },
			brand: { type: "string", role: "label" },
			description: { type: "string", role: "description" },
			price: { type: "string", role: "value" },
			originalPrice: { type: "string", role: "value" },
			discountRate: { type: "string", role: "value" },
			imageUrl: { type: "string", role: "data" },
			imageAlt: { type: "string", role: "description" },
			badges: { type: "array", role: "data" },
			meta: { type: "string", role: "data" },
			benefitText: { type: "string", role: "description" },
			ctaLabel: { type: "string", role: "label" },
		},
	},
	ListProductRow: {
		type: "ListProductRow",
		kind: "product-card",
		source: "react-component",
		version: "1.0.0",
		description: "Large product row card for SKT device/subscription browse screens.",
		aliases: ["list-product-row", "product-row-card", "row-product-card"],
		props: {
			title: { type: "string", role: "title", required: true },
			brand: { type: "string", role: "label" },
			description: { type: "string", role: "description" },
			price: { type: "string", role: "value" },
			originalPrice: { type: "string", role: "value" },
			discountRate: { type: "string", role: "value" },
			imageUrl: { type: "string", role: "data" },
			imageAlt: { type: "string", role: "description" },
			badges: { type: "array", role: "data" },
			specs: { type: "array", role: "data" },
			benefitText: { type: "string", role: "description" },
			ctaLabel: { type: "string", role: "label" },
		},
	},
	ListSelected: {
		type: "ListSelected",
		kind: "list-cell",
		source: "react-component",
		version: "1.0.0",
		aliases: ["list-selected"],
		props: {
			type: {
				type: "enum",
				role: "styleVariant",
				values: ["radio", "checkbox"],
				defaultValue: "radio",
			},
			label: { type: "string", role: "label", required: true },
			price: { type: "string", role: "value" },
			buttonLabel: { type: "string", role: "label" },
			checked: { type: "boolean", role: "state", defaultValue: false },
			showPrice: { type: "boolean", role: "visibility", defaultValue: true },
			showButton: { type: "boolean", role: "visibility", defaultValue: true },
		},
	},
	ListSelectedRightItem: {
		type: "ListSelectedRightItem",
		kind: "list-cell",
		source: "react-component",
		version: "1.0.0",
		props: {
			label: { type: "string", role: "label", required: true },
			type: {
				type: "enum",
				role: "styleVariant",
				values: ["buttonXsmallSolid"],
				defaultValue: "buttonXsmallSolid",
			},
		},
	},
	ListText: {
		type: "ListText",
		kind: "list-cell",
		source: "react-component",
		version: "1.0.0",
		aliases: ["list-text", "ListTextProductInfo"],
		props: {
			table: {
				type: "enum",
				role: "styleVariant",
				values: ["off", "on", "dot", "firstTitle", "secondTitle"],
				defaultValue: "off",
			},
			title: { type: "string", role: "title" },
			subText: { type: "string", role: "description" },
			price: { type: "string", role: "value" },
			showRightItem: { type: "boolean", role: "visibility", defaultValue: true },
		},
	},
	MapBlock: {
		type: "MapBlock",
		kind: "map",
		source: "react-component",
		version: "1.0.0",
		description: "Map placeholder block for nearby store sections.",
		aliases: ["Map", "map", "map-block"],
		props: {
			title: { type: "string", role: "title" },
			address: { type: "string", role: "description" },
		},
	},
	OptionCard: {
		type: "OptionCard",
		kind: "option-card",
		source: "react-component",
		version: "1.0.0",
		description: "Selectable product option card for commerce detail patterns.",
		aliases: ["option-card", "select-card", "OptionSelectCard"],
		props: {
			title: { type: "string", role: "title", required: true },
			description: { type: "string", role: "description" },
			value: { type: "string", role: "value" },
			selected: { type: "boolean", role: "state", defaultValue: false },
			disabled: { type: "boolean", role: "state", defaultValue: false },
		},
	},
	ProductInfo: {
		type: "ProductInfo",
		kind: "product-info",
		source: "react-component",
		version: "1.0.0",
		description: "Product summary block for commerce detail hero sections.",
		aliases: ["product-info", "ProductInfoSummary"],
		props: {
			brand: { type: "string", role: "label" },
			title: { type: "string", role: "title", required: true },
			description: { type: "string", role: "description" },
			price: { type: "string", role: "value" },
			originalPrice: { type: "string", role: "value" },
			discountRate: { type: "string", role: "value" },
			badges: { type: "array", role: "data" },
		},
	},
	RadioText: {
		type: "RadioText",
		source: "react-component",
		version: "1.0.0",
		aliases: ["Radio", "radio"],
		props: {
			label: { type: "string", role: "label", required: true },
			checked: { type: "boolean", role: "state", defaultValue: false },
		},
	},
	StoreCard: {
		type: "StoreCard",
		kind: "store-card",
		source: "react-component",
		version: "1.0.0",
		description: "Nearby store list item for product detail patterns.",
		aliases: ["store-card", "StoreListItem", "nearby-store-card"],
		props: {
			title: { type: "string", role: "title", required: true },
			address: { type: "string", role: "description" },
			distance: { type: "string", role: "value" },
			status: { type: "string", role: "state" },
		},
	},
	SectionHeader: {
		type: "SectionHeader",
		kind: "section-header",
		source: "renderer-composite",
		version: "1.0.0",
		props: {
			title: { type: "string", role: "title", required: true },
			description: { type: "string", role: "description" },
		},
	},
	SectionMessage: {
		type: "SectionMessage",
		kind: "section-message",
		source: "renderer-composite",
		version: "1.0.0",
		aliases: ["section-message"],
		props: {
			variant: {
				type: "enum",
				role: "styleVariant",
				values: ["info", "negative", "positive", "cautionary"],
				defaultValue: "info",
				variantTokens: {
					info: { surface: "color.surface.elevated", text: "color.text", icon: "color.icon.brand" },
					negative: {
						surface: "color.surface.elevated",
						text: "color.text.error",
						icon: "color.icon",
					},
					positive: { surface: "color.surface.elevated", text: "color.text", icon: "color.icon" },
					cautionary: { surface: "color.surface.elevated", text: "color.text", icon: "color.icon" },
				},
			},
			title: { type: "string", role: "title" },
			message: { type: "string", role: "content" },
			description: { type: "string", role: "description" },
		},
	},
	Tab: {
		type: "Tab",
		source: "react-component",
		version: "1.0.0",
		description: "Top tab navigation strip for switching list categories.",
		aliases: ["tab", "tabs", "UnderlineTab", "TabNavigation"],
		props: {
			items: { type: "array", role: "data", required: true },
			activeKey: { type: "string", role: "state", required: true },
		},
	},
	TextButton: {
		type: "TextButton",
		kind: "text-link",
		source: "react-component",
		version: "1.0.0",
		description:
			"Inline text button, including underline link and Figma ButtonMore affordance variants in PRDD specs.",
		aliases: [
			"ButtonTextUnderline",
			"ButtonMore",
			"ButtonMoreProduct",
			"button-text-underline",
			"button-more",
			"button-more-product",
			"text-button",
		],
		props: {
			label: { type: "string", role: "label", required: true },
			underline: { type: "boolean", role: "styleVariant", defaultValue: false },
		},
	},
	TextField: {
		type: "TextField",
		kind: "text-field",
		source: "react-component",
		version: "1.0.0",
		aliases: ["text-field", "text-area"],
		props: {
			label: { type: "string", role: "label" },
			placeholder: { type: "string", role: "description" },
			helperText: { type: "string", role: "description" },
			value: { type: "string", role: "value" },
			inputType: { type: "string", role: "data", defaultValue: "text" },
			state: {
				type: "enum",
				role: "state",
				values: ["default", "focused", "typing", "typed", "disabled"],
				defaultValue: "default",
			},
			error: { type: "boolean", role: "state", defaultValue: false },
			rightElement: { type: "node", role: "slot", aiWritable: false },
		},
	},
	SearchBar: {
		type: "SearchBar",
		kind: "search-bar",
		source: "react-component",
		version: "1.0.0",
		description: "Rounded search input with search and LLM action variants from SKT GenUI.",
		aliases: ["search-bar", "SearchInput", "SearchBarLLM"],
		props: {
			placeholder: { type: "string", role: "description", defaultValue: "검색" },
			value: { type: "string", role: "value" },
			variant: {
				type: "enum",
				role: "styleVariant",
				values: ["search", "llm"],
				defaultValue: "search",
			},
		},
	},
	TitleSection: {
		type: "TitleSection",
		kind: "title-section",
		source: "react-component",
		version: "1.0.0",
		description: "Section title row used by PRDD and SKT Next UI section stacks.",
		aliases: ["title-section", "TitleContents", "ContentsTitle", "TextListGroupTitle"],
		props: {
			title: { type: "string", role: "title", required: true },
			subtitle: { type: "string", role: "description" },
			rightText: { type: "string", role: "label" },
			badge: { type: "string", role: "styleVariant" },
		},
	},
	ThumbnailLarge: {
		type: "ThumbnailLarge",
		kind: "thumbnail-large",
		source: "react-component",
		version: "1.0.0",
		description: "Large product visual block used at the top of commerce detail screens.",
		aliases: ["thumbnail-large", "hero-media", "ProductThumbnailLarge"],
		props: {
			src: { type: "string", role: "data" },
			alt: { type: "string", role: "description" },
			title: { type: "string", role: "title" },
			eyebrow: { type: "string", role: "label" },
			backgroundColor: { type: "string", role: "styleVariant" },
		},
	},
} as const satisfies ComponentCatalog;

export type ComponentCatalogType = keyof typeof componentCatalog;

const componentCatalogEntries = Object.entries(componentCatalog) as Array<
	[ComponentCatalogType, ComponentCatalogEntry]
>;

export const componentCatalogAliases = componentCatalogEntries.reduce<
	Record<string, ComponentCatalogType>
>((aliases, [type, entry]) => {
	for (const alias of entry.aliases ?? []) {
		aliases[alias] = type;
	}
	return aliases;
}, {});

export function getComponentCatalogEntry(type: string): ComponentCatalogEntry | undefined {
	const canonicalType = componentCatalog[type as ComponentCatalogType]
		? (type as ComponentCatalogType)
		: componentCatalogAliases[type];

	if (!canonicalType) return undefined;
	return componentCatalog[canonicalType];
}

export function getComponentPropContract(
	type: string,
	propName: string,
): ComponentPropContract | undefined {
	return getComponentCatalogEntry(type)?.props[propName];
}

export function getComponentCatalogTypes(): ComponentCatalogType[] {
	return Object.keys(componentCatalog).sort() as ComponentCatalogType[];
}

export interface CatalogAuditIssue {
	type: string;
	propName: string;
	code:
		| "variantTokens.unknown-variant"
		| "variantTokens.invalid-token-role"
		| "variantTokens.requires-enum";
	message: string;
}

/**
 * Catalog 자가 검증. variantTokens 키가 values에 포함되는지,
 * 선언된 TokenRole이 어휘 안에 있는지 검사한다.
 */
export function auditComponentCatalog(): CatalogAuditIssue[] {
	const issues: CatalogAuditIssue[] = [];
	for (const [type, entry] of componentCatalogEntries) {
		for (const [propName, contract] of Object.entries(entry.props)) {
			const variantTokens = contract.variantTokens;
			if (!variantTokens) continue;
			if (contract.type !== "enum" || !contract.values) {
				issues.push({
					type,
					propName,
					code: "variantTokens.requires-enum",
					message: `${type}.${propName} has variantTokens but is not an enum with values`,
				});
				continue;
			}
			const allowed = new Set(contract.values);
			for (const [variantKey, slots] of Object.entries(variantTokens)) {
				if (!allowed.has(variantKey)) {
					issues.push({
						type,
						propName,
						code: "variantTokens.unknown-variant",
						message: `${type}.${propName} variantTokens has key "${variantKey}" not in values`,
					});
				}
				for (const role of Object.values(slots ?? {})) {
					if (typeof role !== "string") continue;
					if (!isTokenRole(role)) {
						issues.push({
							type,
							propName,
							code: "variantTokens.invalid-token-role",
							message: `${type}.${propName} variantTokens[${variantKey}] uses unknown token role "${role}"`,
						});
					}
				}
			}
		}
	}
	return issues;
}
