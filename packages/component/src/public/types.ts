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

export interface ComponentPropContract {
	type: ComponentPropType;
	role?: ComponentPropRole;
	required?: boolean;
	values?: readonly string[];
	defaultValue?: unknown;
	description?: string;
	aiWritable?: boolean;
	tokenRole?: TokenRole;
	variantTokens?: Record<string, Partial<Record<TokenSlot, TokenRole>>>;
}

export interface ComponentUsageContract {
	contexts?: readonly string[];
	guidance?: string;
}

export type RenderTreeNodeKind = string;

export type ComponentCatalogSource = "react-component" | "renderer-composite" | "layout-primitive";

export interface ComponentCatalogEntry {
	type: string;
	source: ComponentCatalogSource;
	version: string;
	description?: string;
	usage?: ComponentUsageContract;
	aliases?: readonly string[];
	kind?: RenderTreeNodeKind;
	props: Record<string, ComponentPropContract>;
	tokens?: Partial<Record<TokenSlot, TokenRole>>;
}

export type ComponentCatalog = Record<string, ComponentCatalogEntry>;

export type ComponentCatalogStatus = "stable" | "candidate";

export type InternalComponentCatalogEntry = ComponentCatalogEntry & {
	status: ComponentCatalogStatus;
};

export type InternalComponentCatalog = Record<string, InternalComponentCatalogEntry>;

export type ComponentCatalogIssueCode =
	| "component-not-found"
	| "duplicate-component-type"
	| "schema-invalid"
	| "status-not-candidate"
	| "variantTokens.invalid-token-role"
	| "variantTokens.requires-enum"
	| "variantTokens.unknown-variant";

export type ComponentCatalogIssue = {
	code: ComponentCatalogIssueCode;
	message: string;
	type?: string;
	propName?: string;
	path?: Array<string | number>;
};

export type ComponentCatalogChangeType = "create" | "delete" | "promote" | "update" | "upsert";

export type ComponentCatalogChange = {
	type: ComponentCatalogChangeType;
	componentType: string;
	before?: InternalComponentCatalogEntry;
	after?: InternalComponentCatalogEntry;
};

export type CreateComponentCatalogEntryInput = {
	status: ComponentCatalogStatus;
	entry: ComponentCatalogEntry;
};

export type ReadComponentCatalogEntryInput = {
	type: string;
};

export type UpdateComponentCatalogEntryInput = {
	type: string;
	patch: Partial<Omit<ComponentCatalogEntry, "type">>;
};

export type DeleteComponentCatalogEntryInput = {
	type: string;
};

export type PromoteComponentCatalogEntryInput = {
	type: string;
};

export type UpsertComponentCatalogEntryInput = CreateComponentCatalogEntryInput;

export type ComponentCatalogReadResult =
	| { ok: true; entry: InternalComponentCatalogEntry }
	| { ok: false; issues: ComponentCatalogIssue[] };

export type ComponentCatalogMutationResult =
	| {
			ok: true;
			registry: InternalComponentCatalog;
			catalog: ComponentCatalog;
			entry?: InternalComponentCatalogEntry;
			changes: ComponentCatalogChange[];
	  }
	| { ok: false; issues: ComponentCatalogIssue[] };
