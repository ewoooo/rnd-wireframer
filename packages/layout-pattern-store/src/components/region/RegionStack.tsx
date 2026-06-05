import { VStack, type VStackProps } from "@cx/layout/primitives";
import type { LayoutPatternComponentProps } from "../types";

type RegionStackDefaults = {
	gap?: number;
};

const defaultZeroGap = { gap: 0 } as const satisfies RegionStackDefaults;

export const PlainStackRegion = createRegionStack(defaultZeroGap);

function createRegionStack(defaults: RegionStackDefaults) {
	return function RegionStack({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const stackProps = toStackProps(props, defaults, metadata);

		return (
			<VStack {...stackProps} className={className}>
				{children}
			</VStack>
		);
	};
}

function toStackProps(
	props: Record<string, unknown>,
	defaults: RegionStackDefaults,
	metadata: LayoutPatternComponentProps["metadata"],
): VStackProps {
	return {
		as: "section",
		gap: toNumber(props.gap) ?? defaults.gap,
		node: {
			type: "Layout.Flex",
			metadata: {
				id: metadata?.id ?? "region-stack",
				title: metadata?.title,
			},
			props: {
				direction: "column",
			},
		},
	};
}

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
