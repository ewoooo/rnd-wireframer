import { HStack, type HStackProps, VStack, type VStackProps } from "@cx/layout/primitives";
import type { CSSProperties } from "react";
import type { LayoutPatternComponentProps } from "../patterns/types";

type CompositeFlow = "horizontal" | "vertical";

export type CompositeWrapperDefaults = {
	flow?: CompositeFlow;
	gap?: number;
	height?: number;
	minHeight?: number;
	paddingBottom?: number;
	paddingTop?: number;
	paddingX?: number;
	paddingY?: number;
	width?: number;
};

export function createCompositeWrapper(defaults: CompositeWrapperDefaults = {}) {
	return function CompositeWrapper({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const flow = resolveCompositeFlow(props, defaults);
		const stackProps = toStackProps(props, defaults, metadata, flow);
		const style = resolveCompositeStyle(props, defaults);
		const Component = flow === "horizontal" ? HStack : VStack;

		return (
			<Component {...stackProps} className={className} style={style}>
				{children}
			</Component>
		);
	};
}

/** props.flow → 스택 방향. primitive-target resolver와 공유하는 단일 진실원. */
export function resolveCompositeFlow(
	props: Record<string, unknown>,
	defaults: CompositeWrapperDefaults,
): CompositeFlow {
	return toCompositeFlow(props.flow) ?? defaults.flow ?? "vertical";
}

/** node/metadata 배관을 제외한 직렬화 가능 스택 레이아웃 props. */
export function resolveCompositeStackLayout(
	props: Record<string, unknown>,
	defaults: CompositeWrapperDefaults,
): { gap?: number; paddingX?: number; paddingY?: number } {
	return {
		gap: toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap,
		paddingX: toNumber(props.paddingX) ?? defaults.paddingX,
		paddingY: toNumber(props.paddingY) ?? defaults.paddingY,
	};
}

function toStackProps(
	props: Record<string, unknown>,
	defaults: CompositeWrapperDefaults,
	metadata: LayoutPatternComponentProps["metadata"],
	flow: CompositeFlow,
): HStackProps | VStackProps {
	return {
		as: "div",
		...resolveCompositeStackLayout(props, defaults),
		node: {
			type: "Layout.Flex",
			metadata: {
				id: metadata?.id ?? "composite-wrapper",
				title: metadata?.title,
			},
			props: {
				direction: flow === "horizontal" ? "row" : "column",
			},
		},
	};
}

export function resolveCompositeStyle(
	props: Record<string, unknown>,
	defaults: CompositeWrapperDefaults,
): CSSProperties | undefined {
	const buttonHeight = toNumber(props.buttonHeight);
	const height = toNumber(props.height) ?? buttonHeight ?? defaults.height;
	const minHeight = toNumber(props.minHeight) ?? defaults.minHeight;
	const paddingTop = toNumber(props.paddingTop) ?? defaults.paddingTop;
	const paddingBottom = toNumber(props.paddingBottom) ?? defaults.paddingBottom;
	const width = toNumber(props.width) ?? defaults.width;

	const style: CSSProperties = {};
	if (height !== undefined) style.height = height;
	if (minHeight !== undefined) style.minHeight = minHeight;
	if (paddingTop !== undefined) style.paddingTop = paddingTop;
	if (paddingBottom !== undefined) style.paddingBottom = paddingBottom;
	if (width !== undefined) style.width = width;

	return Object.keys(style).length > 0 ? style : undefined;
}

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toCompositeFlow(value: unknown): CompositeFlow | undefined {
	return value === "horizontal" || value === "vertical" ? value : undefined;
}
