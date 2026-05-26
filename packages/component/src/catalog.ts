import type { ComponentCatalog, ComponentCatalogEntry, ComponentPropContract } from "@cx/types";

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
		props: {
			gap: { type: "number", role: "layout", tokenRole: "spacing" },
			paddingX: { type: "number", role: "layout", tokenRole: "spacing" },
			paddingY: { type: "number", role: "layout", tokenRole: "spacing" },
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
		props: {
			title: { type: "string", role: "title" },
			showBack: { type: "boolean", role: "visibility", defaultValue: false },
			showLogo: { type: "boolean", role: "visibility", defaultValue: false },
			rightItem: { type: "node", role: "slot", aiWritable: false },
		},
	},
	Badge: {
		type: "Badge",
		source: "react-component",
		version: "1.0.0",
		props: {
			children: { type: "string", role: "content", required: true },
			variant: {
				type: "enum",
				role: "styleVariant",
				values: ["gray", "black", "blue"],
				defaultValue: "gray",
			},
		},
	},
	BannerIndicaterMedium: {
		type: "BannerIndicaterMedium",
		kind: "banner-indicator",
		source: "react-component",
		version: "1.0.0",
		description: "Medium banner carousel item with an indicator, matching Figma spelling.",
		aliases: ["BannerIndicatorMedium", "banner-indicator", "banner"],
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
		props: {
			type: {
				type: "enum",
				role: "styleVariant",
				values: ["contents", "section"],
				defaultValue: "contents",
			},
		},
	},
	Footer: {
		type: "Footer",
		kind: "footer",
		source: "react-component",
		version: "1.0.0",
		description: "Low-emphasis legal/help footer for detail screens.",
		aliases: ["footer"],
		props: {
			title: { type: "string", role: "title" },
			description: { type: "string", role: "description" },
			links: { type: "array", role: "data" },
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
		aliases: ["legal-text"],
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
	ListSelected: {
		type: "ListSelected",
		kind: "list-cell",
		source: "react-component",
		version: "1.0.0",
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
		aliases: ["Map", "map"],
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
		aliases: ["option-card", "select-card"],
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
		aliases: ["product-info"],
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
		aliases: ["store-card"],
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
		props: {
			items: { type: "array", role: "data", required: true },
			activeKey: { type: "string", role: "state", required: true },
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
	ThumbnailLarge: {
		type: "ThumbnailLarge",
		kind: "thumbnail-large",
		source: "react-component",
		version: "1.0.0",
		description: "Large product visual block used at the top of commerce detail screens.",
		aliases: ["thumbnail-large"],
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
