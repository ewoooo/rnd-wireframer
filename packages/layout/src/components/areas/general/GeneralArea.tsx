import {
	BottomFixedArea,
	type BottomFixedAreaProps,
	HStack,
	type HStackProps,
	VStack,
	type VStackProps,
} from "@cx/layout/primitives";
import type { LayoutPatternComponentProps } from "../../patterns/types";

// 비-PageStack area 엔진. canonical 컴포넌트(.tsx)들이 이 factory들을 호출한다.
// resolve*Props는 node/metadata 배관을 제외한 직렬화 가능 props만 산출하며
// primitive-target resolver와 공유하는 단일 진실원이다.

export type BottomActionAreaDefaults = {
	gap: number;
	paddingBottom?: number;
	paddingTop?: number;
	paddingX?: number;
	paddingY?: number;
	safeArea?: boolean;
};

export function resolveBottomActionAreaProps(
	props: Record<string, unknown>,
	defaults: BottomActionAreaDefaults,
): Pick<
	BottomFixedAreaProps,
	"gap" | "paddingBottom" | "paddingTop" | "paddingX" | "paddingY" | "safeArea"
> {
	return {
		gap: toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap,
		paddingBottom: toNumber(props.paddingBottom) ?? defaults.paddingBottom,
		paddingTop: toNumber(props.paddingTop) ?? defaults.paddingTop,
		paddingX: toNumber(props.paddingX) ?? defaults.paddingX,
		paddingY: toNumber(props.paddingY) ?? defaults.paddingY,
		safeArea: toBoolean(props.safeArea) ?? defaults.safeArea,
	};
}

export function createBottomActionArea(defaults: BottomActionAreaDefaults) {
	return function BottomActionArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<BottomFixedArea
				{...resolveBottomActionAreaProps(props, defaults)}
				className={className}
				node={flexNode(metadata, "bottom-action-area", "column")}
			>
				{children}
			</BottomFixedArea>
		);
	};
}

export type HeroAreaDefaults = {
	gap: number;
	infoPaddingBottom: number;
	infoPaddingTop: number;
	infoPaddingX: number;
	thumbnailHeight: number;
};

export function resolveHeroAreaProps(
	props: Record<string, unknown>,
	defaults: HeroAreaDefaults,
): Pick<VStackProps, "gap" | "style"> {
	return {
		gap: toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap,
		style: {
			height: toNumber(props.thumbnailHeight) ?? defaults.thumbnailHeight,
			paddingBottom: toNumber(props.infoPaddingBottom) ?? defaults.infoPaddingBottom,
			paddingInline: toNumber(props.infoPaddingX) ?? defaults.infoPaddingX,
			paddingTop: toNumber(props.infoPaddingTop) ?? defaults.infoPaddingTop,
		},
	};
}

export function createHeroArea(defaults: HeroAreaDefaults) {
	return function HeroArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<VStack
				{...resolveHeroAreaProps(props, defaults)}
				className={className}
				node={flexNode(metadata, "hero-area", "column")}
			>
				{children}
			</VStack>
		);
	};
}

export type PlainStackAreaDefaults = {
	bottomPadding?: number;
	gap: number;
	paddingX?: number;
	paddingY?: number;
};

export function resolvePlainStackAreaProps(
	props: Record<string, unknown>,
	defaults: PlainStackAreaDefaults,
): Pick<VStackProps, "gap" | "paddingX" | "paddingY" | "style"> {
	const bottomPadding = toNumber(props.bottomPadding) ?? defaults.bottomPadding;
	return {
		gap: toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap,
		paddingX: toNumber(props.paddingX) ?? defaults.paddingX,
		paddingY: toNumber(props.paddingY) ?? defaults.paddingY,
		style: bottomPadding !== undefined ? { paddingBottom: bottomPadding } : undefined,
	};
}

export function createPlainStack(defaults: PlainStackAreaDefaults) {
	return function PlainStackArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<VStack
				{...resolvePlainStackAreaProps(props, defaults)}
				className={className}
				node={flexNode(metadata, "plain-stack-area", "column")}
			>
				{children}
			</VStack>
		);
	};
}

export type AppBarAreaDefaults = { gap: number };

export function resolveAppBarAreaProps(
	props: Record<string, unknown>,
	defaults: AppBarAreaDefaults,
): Pick<HStackProps, "gap"> {
	return {
		gap: toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap,
	};
}

export function createAppBarArea(defaults: AppBarAreaDefaults) {
	return function AppBarArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<HStack
				{...resolveAppBarAreaProps(props, defaults)}
				className={className}
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
