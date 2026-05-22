import type { WireframeNodeKind } from "./runtime";

export type ComponentCatalogSource = "react-component" | "renderer-composite" | "layout-primitive";

export type ComponentPropType = "array" | "boolean" | "enum" | "node" | "number" | "string";

export type ComponentPropRole =
	| "content"
	| "data"
	| "description"
	| "event"
	| "label"
	| "layout"
	| "slot"
	| "state"
	| "styleVariant"
	| "title"
	| "value"
	| "visibility";

export interface ComponentPropContract {
	type: ComponentPropType;
	role?: ComponentPropRole;
	required?: boolean;
	values?: readonly string[];
	defaultValue?: unknown;
	description?: string;
	aiWritable?: boolean;
}

export interface ComponentCatalogEntry {
	type: string;
	source: ComponentCatalogSource;
	version: string;
	description?: string;
	aliases?: readonly string[];
	/**
	 * Renderer kind. Catalog가 type→kind 매핑의 단일 진실 원천.
	 * 미지정 시 runtime이 "fallback" kind로 처리.
	 */
	kind?: WireframeNodeKind;
	props: Record<string, ComponentPropContract>;
}

export type ComponentCatalog = Record<string, ComponentCatalogEntry>;

export const componentCatalog = {
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
	CheckboxText: {
		type: "CheckboxText",
		source: "react-component",
		version: "1.0.0",
		aliases: ["Checkbox", "checkbox"],
		props: {
			label: { type: "string", role: "label", required: true },
			checked: { type: "boolean", role: "state", defaultValue: false },
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
