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

export type WireframeAction =
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

export interface WireframeEvents {
	onClick?: WireframeAction | WireframeAction[];
	onChange?: WireframeAction | WireframeAction[];
	onFocus?: WireframeAction | WireframeAction[];
	onBlur?: WireframeAction | WireframeAction[];
	onSubmit?: WireframeAction | WireframeAction[];
	onLoad?: WireframeAction | WireframeAction[];
	onView?: WireframeAction | WireframeAction[];
	[key: `on${string}`]: WireframeAction | WireframeAction[] | undefined;
}

export interface WireframeDisplay {
	when?: PropBinding | boolean;
}

export interface WireframeStyle {
	background?: string;
	opacity?: number;
}

export interface WireframeMetadata {
	id: string;
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface WireframeNode {
	type: string;
	componentVersion: string;
	metadata: WireframeMetadata;
	props?: Record<string, PropValue>;
	className?: string;
	style?: WireframeStyle;
	events?: WireframeEvents;
	display?: WireframeDisplay;
	children?: WireframeNode[];
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

export type WireframeScreenRegionType = (typeof REQUIRED_SCREEN_REGION_TYPES)[number];

export type WireframeFlexLayoutProps = {
	direction: "row" | "column";
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between";
};

export type WireframeGridLayoutProps = {
	columns?: string;
	rows?: string;
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "stretch";
};

export type WireframeScreenHeaderNode = Omit<WireframeNode, "type" | "props" | "children"> & {
	type: typeof SCREEN_HEADER_NODE_TYPE;
	props: {
		position: "fixed" | "sticky" | "static";
		layout: WireframeFlexLayoutProps;
		height?: number;
		zIndex?: number;
	};
	children?: WireframeNode[];
};

export type WireframeScreenContentsNode = Omit<WireframeNode, "type" | "props" | "children"> & {
	type: typeof SCREEN_CONTENTS_NODE_TYPE;
	props: {
		layout: WireframeFlexLayoutProps;
		scroll: boolean;
	};
	children: WireframeNode[];
};

export type WireframeScreenBottomNode = Omit<WireframeNode, "type" | "props" | "children"> & {
	type: typeof SCREEN_BOTTOM_NODE_TYPE;
	props: {
		position: "fixed" | "sticky" | "static";
		layout: WireframeFlexLayoutProps;
		height?: number;
		safeArea?: boolean;
		zIndex?: number;
	};
	children?: WireframeNode[];
};

export type WireframeScreenNode = Omit<WireframeNode, "type" | "children"> & {
	type: typeof SCREEN_NODE_TYPE;
	children: [WireframeScreenHeaderNode, WireframeScreenContentsNode, WireframeScreenBottomNode];
};

export type WireframeLayoutFlexNode = Omit<WireframeNode, "type" | "props"> & {
	type: typeof LAYOUT_FLEX_NODE_TYPE;
	props: WireframeFlexLayoutProps;
};

export type WireframeLayoutGridNode = Omit<WireframeNode, "type" | "props"> & {
	type: typeof LAYOUT_GRID_NODE_TYPE;
	props: WireframeGridLayoutProps;
};

export interface WireframeSchema {
	version: string;
	minRendererVersion?: string;
	minComponentsVersion?: string;
	metadata: WireframeMetadata;
	theme?: {
		mode?: "light" | "dark" | "system";
		primaryColor?: string;
		fontFamily?: string;
	};
	data?: Record<string, unknown>;
	children: WireframeNode[];
}

export interface ValidationResult<T = WireframeSchema> {
	success: boolean;
	errors: string[];
	warnings: string[];
	stats?: WireframeValidationStats;
	data?: T;
}

export interface WireframeValidationStats {
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

const WireframeActionSchema: z.ZodType<WireframeAction> = z.discriminatedUnion("action", [
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
	.union([WireframeActionSchema, z.array(WireframeActionSchema)])
	.optional();

export const WireframeEventsSchema = z
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

export const WireframeMetadataSchema = z.object({
	id: z.string(),
	title: z.string(),
	author: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	description: z.string().optional(),
});

export const WireframeNodeSchema: z.ZodType<WireframeNode> = z.lazy(() =>
	z.object({
		type: z.string(),
		componentVersion: z.string(),
		metadata: WireframeMetadataSchema,
		props: z.record(z.string(), PropValueSchema).optional(),
		className: z.string().optional(),
		style: z
			.object({
				background: z.string().optional(),
				opacity: z.number().optional(),
			})
			.optional(),
		events: WireframeEventsSchema.optional(),
		display: z
			.object({
				when: z.union([PropBindingSchema, z.boolean()]).optional(),
			})
			.optional(),
		children: z.array(WireframeNodeSchema).optional(),
	}),
);

export const WireframeSchemaValidator = z.object({
	version: z.string(),
	minRendererVersion: z.string().optional(),
	minComponentsVersion: z.string().optional(),
	metadata: WireframeMetadataSchema,
	theme: z
		.object({
			mode: z.enum(["light", "dark", "system"]).optional(),
			primaryColor: z.string().optional(),
			fontFamily: z.string().optional(),
		})
		.optional(),
	data: z.record(z.string(), z.unknown()).optional(),
	children: z.array(WireframeNodeSchema),
});
