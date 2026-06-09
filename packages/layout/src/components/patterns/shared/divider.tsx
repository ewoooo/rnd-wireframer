import { Divider } from "@cx/external/registry";
import { Children, isValidElement, type ReactNode } from "react";

export type LayoutDivider = "contents" | "none" | "section";

export function resolveDivider(
	value: unknown,
	defaultDivider?: LayoutDivider,
): LayoutDivider | undefined {
	if (value === false) return "none";
	if (value === undefined) return defaultDivider;
	return toLayoutDivider(value);
}

/**
 * Wraps area stack content with a trailing 4px section divider.
 * divider:"section" is an area break, not a row separator.
 */
export function withTrailingSectionDivider(content: ReactNode, divider: unknown): ReactNode {
	if (divider !== "section") return content;
	return (
		<>
			{content}
			<Divider type="section" />
		</>
	);
}

export function renderChildrenWithDividers(
	children: ReactNode,
	divider?: LayoutDivider,
): ReactNode {
	if (!isContentsDivider(divider)) return children;

	const childItems = Children.toArray(children);
	if (childItems.length < 2) {
		return children;
	}

	return childItems.flatMap((child, index) =>
		index === childItems.length - 1
			? [child]
			: [child, <Divider key={`layout-divider-${readChildKey(child)}`} type="contents" />],
	);
}

function readChildKey(child: ReactNode): string {
	if (isValidElement(child) && child.key !== null) return String(child.key);
	if (typeof child === "string" || typeof child === "number") return String(child);
	return "anonymous-child";
}

function toLayoutDivider(value: unknown): LayoutDivider | undefined {
	if (value === true) {
		return "contents";
	}

	if (value === false) {
		return "none";
	}

	if (value === "contents" || value === "none" || value === "section") {
		return value;
	}

	return undefined;
}

function isContentsDivider(divider?: LayoutDivider): boolean {
	if (divider === "contents") return true;
	return false;
}
