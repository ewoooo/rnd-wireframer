import type { ReactNode } from "react";
import { VStack, type VStackProps } from "./Stack";

export type BottomFixedAreaProps = VStackProps & {
	children?: ReactNode;
	paddingBottom?: number;
	paddingTop?: number;
	safeArea?: boolean;
};

export function BottomFixedArea({
	as = "section",
	children,
	gap = 10,
	paddingBottom,
	paddingTop,
	safeArea = false,
	style,
	...props
}: BottomFixedAreaProps) {
	const hasAsymmetricPadding = paddingTop !== undefined || paddingBottom !== undefined;
	const resolvedPaddingTop = paddingTop ?? 0;
	const resolvedPaddingBottom = paddingBottom ?? 0;

	return (
		<VStack
			as={as}
			gap={gap}
			style={{
				bottom: 0,
				paddingBottom: formatBottomPadding(resolvedPaddingBottom, safeArea),
				paddingTop: hasAsymmetricPadding ? resolvedPaddingTop : undefined,
				position: "sticky",
				zIndex: 10,
				...style,
			}}
			{...props}
		>
			{children}
		</VStack>
	);
}

function formatBottomPadding(paddingBottom: number | undefined, safeArea: boolean) {
	if (!safeArea) return paddingBottom;

	return `calc(${paddingBottom ?? 0}px + env(safe-area-inset-bottom, 0px))`;
}
