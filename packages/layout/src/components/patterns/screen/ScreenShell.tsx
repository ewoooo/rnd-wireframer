import { VStack } from "@cx/layout/primitives";
import type { CSSProperties } from "react";
import type { LayoutPatternComponentProps } from "../types";

type ScreenShellDefaults = {
	contentWidth?: number;
	gap?: number;
};

const defaultScreenWidth = 393;

export const MobileScreen = createScreenShell({ contentWidth: defaultScreenWidth, gap: 0 });

function createScreenShell(defaults: ScreenShellDefaults) {
	return function ScreenLayout({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<VStack
				as="div"
				className={className}
				gap={toNumber(props.gap) ?? defaults.gap}
				node={{
					type: "Layout.Flex",
					metadata: {
						id: metadata?.id ?? "screen-shell",
						title: metadata?.title,
					},
					props: {
						direction: "column",
					},
				}}
				style={toScreenStyle(props, defaults)}
			>
				{children}
			</VStack>
		);
	};
}

function toScreenStyle(
	props: Record<string, unknown>,
	defaults: ScreenShellDefaults,
): CSSProperties | undefined {
	const contentWidth = toNumber(props.contentWidth) ?? defaults.contentWidth;
	if (contentWidth === undefined) return undefined;

	return {
		marginInline: "auto",
		maxWidth: contentWidth,
		width: "100%",
	};
}

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
