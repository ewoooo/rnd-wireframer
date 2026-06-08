import { isRecord } from "@cx/schema";
import type {
	FlexLayoutProps,
	GridLayoutProps,
	LayoutNode,
	ScreenNode,
	ScreenRegionNode,
} from "../types";
import { LAYOUT_NODE_TYPES } from "../types";

const flexDirectionValues = new Set(["column", "row"]);
const flexAlignValues = new Set(["center", "end", "start", "stretch"]);
const flexJustifyValues = new Set(["between", "center", "end", "start"]);
const gridJustifyValues = new Set(["center", "end", "start", "stretch"]);
const positionValues = new Set(["fixed", "static", "sticky"]);

export function isFlexLayoutProps(value: unknown): value is FlexLayoutProps {
	if (!isRecord(value)) return false;
	if (!flexDirectionValues.has(String(value.direction))) return false;
	return (
		isOptionalNumber(value.gap) &&
		isOptionalNumber(value.paddingX) &&
		isOptionalNumber(value.paddingY) &&
		isOptionalEnum(value.align, flexAlignValues) &&
		isOptionalEnum(value.justify, flexJustifyValues)
	);
}

export function isGridLayoutProps(value: unknown): value is GridLayoutProps {
	if (!isRecord(value)) return false;
	return (
		isOptionalString(value.columns) &&
		isOptionalString(value.rows) &&
		isOptionalNumber(value.gap) &&
		isOptionalNumber(value.paddingX) &&
		isOptionalNumber(value.paddingY) &&
		isOptionalEnum(value.align, flexAlignValues) &&
		isOptionalEnum(value.justify, gridJustifyValues)
	);
}

export function isLayoutNode(value: unknown): value is LayoutNode {
	return (
		isRecord(value) &&
		typeof value.type === "string" &&
		isRecord(value.metadata) &&
		typeof value.metadata.id === "string"
	);
}

export function isScreenRegionNode(value: unknown): value is ScreenRegionNode {
	if (!isLayoutNode(value)) return false;
	if (!LAYOUT_NODE_TYPES.screenRegion.includes(value.type as ScreenRegionNode["type"]))
		return false;
	const props = (value as Record<string, unknown>).props;
	if (!isRecord(props)) return false;

	if (value.type === "Screen.Contents") {
		return typeof props.scroll === "boolean" && isFlexLayoutProps(props.layout);
	}

	return (
		isOptionalNumber(props.height) &&
		isOptionalNumber(props.zIndex) &&
		isOptionalEnum(props.position, positionValues) &&
		isFlexLayoutProps(props.layout)
	);
}

export function isScreenNode(value: unknown): value is ScreenNode {
	const children = isRecord(value) ? value.children : undefined;
	return (
		isLayoutNode(value) &&
		value.type === LAYOUT_NODE_TYPES.screenRoot[0] &&
		Array.isArray(children) &&
		children.length === 3 &&
		children.every(isScreenRegionNode)
	);
}
function isOptionalNumber(value: unknown): boolean {
	return value === undefined || typeof value === "number";
}

function isOptionalString(value: unknown): boolean {
	return value === undefined || typeof value === "string";
}

function isOptionalEnum(value: unknown, allowed: ReadonlySet<string>): boolean {
	return value === undefined || (typeof value === "string" && allowed.has(value));
}
