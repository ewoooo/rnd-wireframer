import type { SCHEMA_VERSION } from "./versions";

export type SchemaPropBinding = {
	bind: string;
	default?: string | number | boolean | null;
};

export type SchemaPropValue =
	| string
	| number
	| boolean
	| null
	| SchemaPropValue[]
	| { [key: string]: SchemaPropValue }
	| SchemaPropBinding;

export type RenderTreeMetadata = {
	id: string;
	author?: string;
	createdAt?: string;
	description?: string;
	updatedAt?: string;
};

export type RenderTreeNodeMetadata = RenderTreeMetadata & {
	title: string;
};

export type RenderTreeNodeContract = {
	children?: RenderTreeNodeContract[];
	componentVersion: string;
	display?: {
		stateRole?: "base" | "disabled" | "empty" | "error" | "expanded" | "loading" | "success";
		when?: SchemaPropBinding | boolean;
	};
	layout?: string;
	metadata: RenderTreeNodeMetadata;
	props?: Record<string, SchemaPropValue>;
	type: string;
};

export type RenderTreeContract = {
	children: RenderTreeNodeContract[];
	data?: Record<string, unknown>;
	metadata: RenderTreeMetadata;
	minRendererVersion?: string;
	theme?: {
		fontFamily?: string;
		mode?: "dark" | "light" | "system";
		primaryColor?: string;
	};
	version: typeof SCHEMA_VERSION.renderTree;
};
