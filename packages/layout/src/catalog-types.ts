// @cx/layout catalog 계약 타입. @cx/external의 ComponentCatalogEntry와 평행 구조.
//   external: type / kind|source / props / status   → registry component
//   layout:   id   / target      / props / status   → (alias→) registry component

export type LayoutPatternTarget = "screen" | "region" | "area" | "composite";

export type LayoutPatternPropType =
	| "array"
	| "boolean"
	| "enum"
	| "node"
	| "number"
	| "object"
	| "string";

export type LayoutPatternPropContract = {
	type: LayoutPatternPropType;
	aiWritable?: boolean;
	description?: string;
	required?: boolean;
	values?: string[];
};

export type LayoutPatternChildrenContract = {
	accepts: "any" | "area" | "area-or-component" | "component" | "none" | "region";
	max?: number;
	min?: number;
};

export type LayoutCatalogStatus = "stable" | "draft" | "deprecated";

/** catalog.generated.ts의 entry. 계약만 든다(defaults는 component-land presets 소유). */
export type LayoutCatalogEntry = {
	id: `layout.${LayoutPatternTarget}.${string}`;
	target: LayoutPatternTarget;
	name: string;
	props?: Record<string, LayoutPatternPropContract>;
	children?: LayoutPatternChildrenContract;
	description?: string;
	status?: LayoutCatalogStatus;
};

/** 컴포넌트 옆 `<id>.meta.ts`가 선언하는 값 = entry 계약 그대로. */
export type LayoutCatalogMeta = LayoutCatalogEntry;
