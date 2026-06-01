import { Divider } from "@cx/components";
import { Children, isValidElement, type ReactNode } from "react";

export type LayoutDivider =
	| false
	| true
	| "contents"
	| "section"
	| "between-accordion-rows"
	| "between-info-text-rows"
	| {
			type?: "contents" | "section";
			between?: string[];
	  };

type DividerType = "contents" | "section";

export function resolveDivider(
	value: unknown,
	defaultDivider?: LayoutDivider,
): LayoutDivider | undefined {
	if (value === false) return false;
	if (value === undefined) return defaultDivider;
	return toLayoutDivider(value);
}

/**
 * Wraps area stack content with a trailing 4px section divider when sectionDivider is true.
 * 행 사이 divider(renderChildrenWithDividers)와 직교한다. 섹션(area) 간 구분에 쓴다.
 */
export function withTrailingSectionDivider(content: ReactNode, sectionDivider: unknown): ReactNode {
	if (sectionDivider !== true) return content;
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
	const dividerType = toDividerType(divider);
	if (!dividerType) return children;

	const childItems = Children.toArray(children);
	const shouldRenderTrailingDivider = divider === true;
	if (childItems.length === 0 || (childItems.length < 2 && !shouldRenderTrailingDivider)) {
		return children;
	}

	return childItems.flatMap((child, index) =>
		index === childItems.length - 1 && !shouldRenderTrailingDivider
			? [child]
			: [child, <Divider key={`layout-divider-${readChildKey(child)}`} type={dividerType} />],
	);
}

function readChildKey(child: ReactNode): string {
	if (isValidElement(child) && child.key !== null) return String(child.key);
	if (typeof child === "string" || typeof child === "number") return String(child);
	return "anonymous-child";
}

function toLayoutDivider(value: unknown): LayoutDivider | undefined {
	if (value === true || value === false) {
		return value;
	}

	if (
		value === "contents" ||
		value === "section" ||
		value === "between-accordion-rows" ||
		value === "between-info-text-rows"
	) {
		return value;
	}

	if (isDividerObject(value)) {
		return value;
	}

	return undefined;
}

function toDividerType(divider?: LayoutDivider): DividerType | undefined {
	if (!divider) return undefined;
	if (divider === true) return "contents";
	if (divider === "section") return "section";
	if (divider === "contents") return "contents";
	if (divider === "between-accordion-rows" || divider === "between-info-text-rows") {
		return "contents";
	}
	return divider.type;
}

function isDividerObject(value: unknown): value is Extract<LayoutDivider, object> {
	if (typeof value !== "object" || value === null) return false;
	const type = (value as { type?: unknown }).type;
	return type === undefined || type === "contents" || type === "section";
}
