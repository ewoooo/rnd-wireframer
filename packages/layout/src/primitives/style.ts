import type { CSSProperties } from "react";
import type { FlexLayoutProps, GridLayoutProps } from "../types";

type FlexAlign = NonNullable<FlexLayoutProps["align"]>;
type FlexJustify = NonNullable<FlexLayoutProps["justify"]>;
type GridJustify = NonNullable<GridLayoutProps["justify"]>;

type SpacingValue = NonNullable<FlexLayoutProps["gap"]>;

const spacingClass: Record<SpacingValue, string> = {
	0: "0",
	2: "cx-2",
	4: "cx-4",
	6: "cx-6",
	8: "cx-8",
	10: "cx-10",
	12: "cx-12",
	14: "cx-14",
	16: "cx-16",
	18: "cx-18",
	20: "cx-20",
	22: "cx-22",
	24: "cx-24",
	28: "cx-28",
	32: "cx-32",
	36: "cx-36",
	40: "cx-40",
};

const alignClass: Record<FlexAlign, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
};

const flexJustifyClass: Record<FlexJustify, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
};

const gridJustifyClass: Record<GridJustify, string> = {
	start: "justify-items-start",
	center: "justify-items-center",
	end: "justify-items-end",
	stretch: "justify-items-stretch",
};

export function cx(...values: Array<string | false | null | undefined>): string {
	return values.filter(Boolean).join(" ");
}

export function spacingUtilityClass(
	prefix: "gap" | "px" | "py",
	value: number | undefined,
): string | undefined {
	return toSpacingClass(prefix, value);
}

export function spacingFallbackStyleValue(value: number | undefined): number | undefined {
	return needsSpacingFallback(value) ? value : undefined;
}

export function flexLayoutClassName(layout: FlexLayoutProps | undefined): string {
	if (!layout) return "flex flex-col";
	return cx(
		"flex",
		layout.direction === "row" ? "flex-row" : "flex-col",
		toSpacingClass("gap", layout.gap),
		toSpacingClass("px", layout.paddingX),
		toSpacingClass("py", layout.paddingY),
		layout.align ? alignClass[layout.align] : undefined,
		layout.justify ? flexJustifyClass[layout.justify] : undefined,
	);
}

export function flexLayoutFallbackStyle(layout: FlexLayoutProps | undefined): CSSProperties {
	if (!layout) return {};
	return {
		gap: spacingFallbackStyleValue(layout.gap),
		paddingInline: spacingFallbackStyleValue(layout.paddingX),
		paddingBlock: spacingFallbackStyleValue(layout.paddingY),
	};
}

export function gridLayoutClassName(layout: GridLayoutProps | undefined): string {
	if (!layout) return "grid";
	return cx(
		"grid",
		toSpacingClass("gap", layout.gap),
		toSpacingClass("px", layout.paddingX),
		toSpacingClass("py", layout.paddingY),
		layout.align ? alignClass[layout.align] : undefined,
		layout.justify ? gridJustifyClass[layout.justify] : undefined,
	);
}

export function gridLayoutFallbackStyle(layout: GridLayoutProps | undefined): CSSProperties {
	if (!layout) return {};
	return {
		gridTemplateColumns: layout.columns,
		gridTemplateRows: layout.rows,
		gap: spacingFallbackStyleValue(layout.gap),
		paddingInline: spacingFallbackStyleValue(layout.paddingX),
		paddingBlock: spacingFallbackStyleValue(layout.paddingY),
	};
}

function toSpacingClass(
	prefix: "gap" | "px" | "py",
	value: number | undefined,
): string | undefined {
	if (value === undefined) return undefined;
	const token = spacingClass[value];
	return token ? `${prefix}-${token}` : undefined;
}

function needsSpacingFallback(value: number | undefined): boolean {
	return value !== undefined && spacingClass[value] === undefined;
}
