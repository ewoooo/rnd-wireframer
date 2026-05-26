import { z } from "zod";

export interface PropBinding {
	bind: string;
	default?: string | number | boolean | null;
}

export type PropValue =
	| string
	| number
	| boolean
	| null
	| PropValue[]
	| { [key: string]: PropValue }
	| PropBinding;

export type RenderTreeAction =
	| {
			action: "navigate";
			url: string;
			target?: "_self" | "_blank";
			params?: Record<string, string>;
	  }
	| {
			action: "setState";
			key: string;
			value?: unknown;
	  }
	| {
			action: "track";
			event: string;
			properties?: Record<string, unknown>;
	  }
	| {
			action: "log";
			message: string;
			level?: "info" | "warn" | "error";
	  }
	| {
			action: "custom";
			handler: string;
			params?: Record<string, unknown>;
	  };

export interface RenderTreeEvents {
	onClick?: RenderTreeAction | RenderTreeAction[];
	onChange?: RenderTreeAction | RenderTreeAction[];
	onFocus?: RenderTreeAction | RenderTreeAction[];
	onBlur?: RenderTreeAction | RenderTreeAction[];
	onSubmit?: RenderTreeAction | RenderTreeAction[];
	onLoad?: RenderTreeAction | RenderTreeAction[];
	onView?: RenderTreeAction | RenderTreeAction[];
	[key: `on${string}`]: RenderTreeAction | RenderTreeAction[] | undefined;
}

export interface RenderTreeDisplay {
	when?: PropBinding | boolean;
}

export interface RenderTreeStyle {
	background?: string;
	opacity?: number;
}

export interface RenderTreeMetadata {
	id: string;
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface RenderTreeNode {
	type: string;
	componentVersion: string;
	metadata: RenderTreeMetadata;
	props?: Record<string, PropValue>;
	className?: string;
	style?: RenderTreeStyle;
	events?: RenderTreeEvents;
	display?: RenderTreeDisplay;
	children?: RenderTreeNode[];
}

export const SCREEN_NODE_TYPE = "Screen" as const;
export const SCREEN_HEADER_NODE_TYPE = "Screen.Header" as const;
export const SCREEN_CONTENTS_NODE_TYPE = "Screen.Contents" as const;
export const SCREEN_BOTTOM_NODE_TYPE = "Screen.Bottom" as const;
export const LAYOUT_FLEX_NODE_TYPE = "Layout.Flex" as const;
export const LAYOUT_GRID_NODE_TYPE = "Layout.Grid" as const;

export const REQUIRED_SCREEN_REGION_TYPES = [
	SCREEN_HEADER_NODE_TYPE,
	SCREEN_CONTENTS_NODE_TYPE,
	SCREEN_BOTTOM_NODE_TYPE,
] as const;

export type RenderTreeScreenRegionType = (typeof REQUIRED_SCREEN_REGION_TYPES)[number];

export type RenderTreeFlexLayoutProps = {
	direction: "row" | "column";
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between";
};

export type RenderTreeGridLayoutProps = {
	columns?: string;
	rows?: string;
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "stretch";
};

export type RenderTreeScreenHeaderNode = Omit<RenderTreeNode, "type" | "props" | "children"> & {
	type: typeof SCREEN_HEADER_NODE_TYPE;
	props: {
		position: "fixed" | "sticky" | "static";
		layout: RenderTreeFlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: RenderTreeNode[];
};

export type RenderTreeScreenContentsNode = Omit<RenderTreeNode, "type" | "props" | "children"> & {
	type: typeof SCREEN_CONTENTS_NODE_TYPE;
	props: {
		layout: RenderTreeFlexLayoutProps;
		scroll: boolean;
	};
	children: RenderTreeNode[];
};

export type RenderTreeScreenBottomNode = Omit<RenderTreeNode, "type" | "props" | "children"> & {
	type: typeof SCREEN_BOTTOM_NODE_TYPE;
	props: {
		position: "fixed" | "sticky" | "static";
		layout: RenderTreeFlexLayoutProps;
		height?: number;
		safeArea?: boolean;
		zIndex?: number;
	};
	children?: RenderTreeNode[];
};

export type RenderTreeScreenNode = Omit<RenderTreeNode, "type" | "children"> & {
	type: typeof SCREEN_NODE_TYPE;
	children: [RenderTreeScreenHeaderNode, RenderTreeScreenContentsNode, RenderTreeScreenBottomNode];
};

export type RenderTreeLayoutFlexNode = Omit<RenderTreeNode, "type" | "props"> & {
	type: typeof LAYOUT_FLEX_NODE_TYPE;
	props: RenderTreeFlexLayoutProps;
};

export type RenderTreeLayoutGridNode = Omit<RenderTreeNode, "type" | "props"> & {
	type: typeof LAYOUT_GRID_NODE_TYPE;
	props: RenderTreeGridLayoutProps;
};

export interface RenderTree {
	version: string;
	minRendererVersion?: string;
	minComponentsVersion?: string;
	metadata: RenderTreeMetadata;
	theme?: {
		mode?: "light" | "dark" | "system";
		primaryColor?: string;
		fontFamily?: string;
	};
	data?: Record<string, unknown>;
	children: RenderTreeNode[];
}

export interface ValidationResult<T = RenderTree> {
	success: boolean;
	errors: string[];
	warnings: string[];
	stats?: RenderTreeValidationStats;
	data?: T;
}

export interface RenderTreeValidationStats {
	componentTypes: string[];
	fallbackTypes: string[];
	maxDepth: number;
	rendererKinds: string[];
	totalNodes: number;
}

export function isBindingValue(value: PropValue): value is PropBinding {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		"bind" in value &&
		typeof (value as PropBinding).bind === "string"
	);
}

export const PropBindingSchema = z.object({
	bind: z.string(),
	default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

export const PropValueSchema: z.ZodType<PropValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(PropValueSchema),
		PropBindingSchema,
		z.record(z.string(), PropValueSchema),
	]),
);

const RenderTreeActionSchema: z.ZodType<RenderTreeAction> = z.discriminatedUnion("action", [
	z.object({
		action: z.literal("navigate"),
		url: z.string(),
		target: z.enum(["_self", "_blank"]).optional(),
		params: z.record(z.string(), z.string()).optional(),
	}),
	z.object({
		action: z.literal("setState"),
		key: z.string(),
		value: z.unknown().optional(),
	}),
	z.object({
		action: z.literal("track"),
		event: z.string(),
		properties: z.record(z.string(), z.unknown()).optional(),
	}),
	z.object({
		action: z.literal("log"),
		message: z.string(),
		level: z.enum(["info", "warn", "error"]).optional(),
	}),
	z.object({
		action: z.literal("custom"),
		handler: z.string(),
		params: z.record(z.string(), z.unknown()).optional(),
	}),
]);

const eventValueSchema = z
	.union([RenderTreeActionSchema, z.array(RenderTreeActionSchema)])
	.optional();

export const RenderTreeEventsSchema = z
	.object({
		onClick: eventValueSchema,
		onChange: eventValueSchema,
		onFocus: eventValueSchema,
		onBlur: eventValueSchema,
		onSubmit: eventValueSchema,
		onLoad: eventValueSchema,
		onView: eventValueSchema,
	})
	.catchall(eventValueSchema);

export const RenderTreeMetadataSchema = z.object({
	id: z.string(),
	title: z.string(),
	author: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	description: z.string().optional(),
});

export const RenderTreeNodeSchema: z.ZodType<RenderTreeNode> = z.lazy(() =>
	z.object({
		type: z.string(),
		componentVersion: z.string(),
		metadata: RenderTreeMetadataSchema,
		props: z.record(z.string(), PropValueSchema).optional(),
		className: z.string().optional(),
		style: z
			.object({
				background: z.string().optional(),
				opacity: z.number().optional(),
			})
			.optional(),
		events: RenderTreeEventsSchema.optional(),
		display: z
			.object({
				when: z.union([PropBindingSchema, z.boolean()]).optional(),
			})
			.optional(),
		children: z.array(RenderTreeNodeSchema).optional(),
	}),
);

export const RenderTreeValidator = z.object({
	version: z.string(),
	minRendererVersion: z.string().optional(),
	minComponentsVersion: z.string().optional(),
	metadata: RenderTreeMetadataSchema,
	theme: z
		.object({
			mode: z.enum(["light", "dark", "system"]).optional(),
			primaryColor: z.string().optional(),
			fontFamily: z.string().optional(),
		})
		.optional(),
	data: z.record(z.string(), z.unknown()).optional(),
	children: z.array(RenderTreeNodeSchema),
});
