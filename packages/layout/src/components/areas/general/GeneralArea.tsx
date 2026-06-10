import {
	BottomFixedArea,
	HStack,
	type HStackProps,
	VStack,
	type VStackProps,
} from "@cx/layout/primitives";
import type { LayoutPatternComponentProps } from "../../patterns/types";

// 비-PageStack area 엔진. canonical 컴포넌트(.tsx)들이 이 factory들을 호출한다.
export function createBottomActionArea(defaults: {
	gap: number;
	paddingBottom?: number;
	paddingTop?: number;
	paddingX?: number;
	paddingY?: number;
	safeArea?: boolean;
}) {
	return function BottomActionArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<BottomFixedArea
				className={className}
				gap={toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap}
				node={flexNode(metadata, "bottom-action-area", "column")}
				paddingBottom={toNumber(props.paddingBottom) ?? defaults.paddingBottom}
				paddingTop={toNumber(props.paddingTop) ?? defaults.paddingTop}
				paddingX={toNumber(props.paddingX) ?? defaults.paddingX}
				paddingY={toNumber(props.paddingY) ?? defaults.paddingY}
				safeArea={toBoolean(props.safeArea) ?? defaults.safeArea}
			>
				{children}
			</BottomFixedArea>
		);
	};
}

export function createHeroArea(defaults: {
	gap: number;
	infoPaddingBottom: number;
	infoPaddingTop: number;
	infoPaddingX: number;
	thumbnailHeight: number;
}) {
	return function HeroArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const infoPaddingX = toNumber(props.infoPaddingX) ?? defaults.infoPaddingX;
		const infoPaddingTop = toNumber(props.infoPaddingTop) ?? defaults.infoPaddingTop;
		const infoPaddingBottom = toNumber(props.infoPaddingBottom) ?? defaults.infoPaddingBottom;
		return (
			<VStack
				className={className}
				gap={toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap}
				node={flexNode(metadata, "hero-area", "column")}
				style={{
					height: toNumber(props.thumbnailHeight) ?? defaults.thumbnailHeight,
					paddingBottom: infoPaddingBottom,
					paddingInline: infoPaddingX,
					paddingTop: infoPaddingTop,
				}}
			>
				{children}
			</VStack>
		);
	};
}

export function createPlainStack(defaults: {
	bottomPadding?: number;
	gap: number;
	paddingX?: number;
	paddingY?: number;
}) {
	return function PlainStackArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const paddingY = toNumber(props.paddingY) ?? defaults.paddingY;
		const bottomPadding = toNumber(props.bottomPadding) ?? defaults.bottomPadding;
		return (
			<VStack
				className={className}
				gap={toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap}
				node={flexNode(metadata, "plain-stack-area", "column")}
				paddingX={toNumber(props.paddingX) ?? defaults.paddingX}
				paddingY={paddingY}
				style={bottomPadding !== undefined ? { paddingBottom: bottomPadding } : undefined}
			>
				{children}
			</VStack>
		);
	};
}

export function createAppBarArea(defaults: { gap: number }) {
	return function AppBarArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<HStack
				className={className}
				gap={toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap}
				node={flexNode(metadata, "app-bar-area", "row")}
			>
				{children}
			</HStack>
		);
	};
}

function flexNode(
	metadata: LayoutPatternComponentProps["metadata"],
	fallbackId: string,
	direction: "column" | "row",
): NonNullable<VStackProps["node"] | HStackProps["node"]> {
	return {
		type: "Layout.Flex",
		metadata: {
			id: metadata?.id ?? fallbackId,
			title: metadata?.title,
		},
		props: {
			direction,
		},
	};
}

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined;
}
