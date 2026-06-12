export const TOKEN_ROLES = [
	"spacing",
	"radius",
	"elevation",
	"size.icon",
	"size.avatar",
	"color.surface",
	"color.surface.brand",
	"color.surface.inverse",
	"color.surface.elevated",
	"color.surface.muted",
	"color.text",
	"color.text.brand",
	"color.text.inverse",
	"color.text.muted",
	"color.text.error",
	"color.border",
	"color.border.subtle",
	"color.border.strong",
	"color.icon",
	"color.icon.brand",
	"color.icon.muted",
	"typography.title",
	"typography.subtitle",
	"typography.body",
	"typography.caption",
	"typography.label",
	"motion.duration",
	"motion.easing",
] as const;

export type TokenRole = (typeof TOKEN_ROLES)[number];
export type TokenSlot = "surface" | "text" | "border" | "icon" | "shadow";

const TOKEN_ROLE_SET: ReadonlySet<string> = new Set(TOKEN_ROLES);

export function isTokenRole(value: string): value is TokenRole {
	return TOKEN_ROLE_SET.has(value);
}

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

export type ComponentPropContract = {
	type: ComponentPropType;
	role?: ComponentPropRole;
	required?: boolean;
	values?: readonly string[];
	defaultValue?: unknown;
	description?: string;
	aiWritable?: boolean;
	tokenRole?: TokenRole;
	variantTokens?: Record<string, Partial<Record<TokenSlot, TokenRole>>>;
};

export type RenderTreeNodeKind = string;

/** kiki barrel(공식 export, stable) | kiki draft(WIP, candidate) */
export type ComponentCatalogSource = "kiki-barrel" | "kiki-draft";

export type ComponentCatalogEntry = {
	type: string;
	source: ComponentCatalogSource;
	label: string;
	version: string;
	description?: string;
	kind?: RenderTreeNodeKind;
	props: Record<string, ComponentPropContract>;
	tokens?: Partial<Record<TokenSlot, TokenRole>>;
};

export type ComponentCatalog = Record<string, ComponentCatalogEntry>;

export type ComponentCatalogStatus = "stable" | "candidate";
