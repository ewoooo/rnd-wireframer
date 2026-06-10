import type { ReactNode } from "react";
import type { ScreenBottomNode, ScreenContentsNode, ScreenHeaderNode, ScreenNode } from "../../types";

import { AppScreenRoot } from "./AppScreenRoot";
import { ScreenRegion } from "./ScreenRegion";
import { SystemHeader } from "./SystemHeader";

export type AppScreenProps = {
	bottom?: ReactNode;
	children: ReactNode;
	header?: ReactNode;
	node: ScreenNode;
};

export function AppScreen({ bottom, children, header, node }: AppScreenProps) {
	const [headerNode, contentsNode, bottomNode] = node.children;

	return (
		<AppScreenRoot node={node}>
			<SystemHeader />
			<ScreenRegion node={headerNode as ScreenHeaderNode}>{header}</ScreenRegion>
			<ScreenRegion node={contentsNode as ScreenContentsNode}>{children}</ScreenRegion>
			<ScreenRegion node={bottomNode as ScreenBottomNode}>{bottom}</ScreenRegion>
		</AppScreenRoot>
	);
}
