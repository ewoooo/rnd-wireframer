import type {
	WireframeScreenBottomNode,
	WireframeScreenContentsNode,
	WireframeScreenHeaderNode,
	WireframeScreenNode,
} from "@cx/wireframe";
import type { ReactNode } from "react";

import { AppScreenRoot } from "./AppScreenRoot";
import { ScreenRegion } from "./ScreenRegion";

export type AppScreenProps = {
	bottom?: ReactNode;
	children: ReactNode;
	header?: ReactNode;
	node: WireframeScreenNode;
};

export function AppScreen({ bottom, children, header, node }: AppScreenProps) {
	const [headerNode, contentsNode, bottomNode] = node.children;

	return (
		<AppScreenRoot node={node}>
			<ScreenRegion node={headerNode as WireframeScreenHeaderNode}>{header}</ScreenRegion>
			<ScreenRegion node={contentsNode as WireframeScreenContentsNode}>{children}</ScreenRegion>
			<ScreenRegion node={bottomNode as WireframeScreenBottomNode}>{bottom}</ScreenRegion>
		</AppScreenRoot>
	);
}
