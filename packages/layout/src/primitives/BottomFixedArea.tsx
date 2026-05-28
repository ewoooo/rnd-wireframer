import type { ReactNode } from "react";
import { VStack, type VStackProps } from "./Stack";

export type BottomFixedAreaProps = VStackProps & {
	children?: ReactNode;
};

export function BottomFixedArea({
	as = "section",
	children,
	gap = 10,
	paddingX = 12,
	paddingY = 10,
	style,
	...props
}: BottomFixedAreaProps) {
	return (
		<VStack
			as={as}
			gap={gap}
			paddingX={paddingX}
			paddingY={paddingY}
			style={{ bottom: 0, position: "sticky", zIndex: 10, ...style }}
			{...props}
		>
			{children}
		</VStack>
	);
}
