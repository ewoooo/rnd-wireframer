import type { CSSProperties, ReactNode } from "react";
import { cx } from "../primitives";
import type { ScreenNode } from "../types";

export type AppScreenRootProps = {
	children: ReactNode;
	className?: string;
	node?: ScreenNode;
	style?: CSSProperties;
};

export function AppScreenRoot({ children, className, node, style }: AppScreenRootProps) {
	return (
		<div
			className={cx(
				"flex min-h-0 flex-col overflow-hidden bg-[var(--semantic-surface-page-normal,#ffffff)]",
				className,
			)}
			data-node-id={node?.metadata.id}
			data-node-type={node?.type ?? "Screen"}
			style={{
				height: "min(100%, var(--cx-app-screen-max-height, 844px))",
				maxHeight: "var(--cx-app-screen-max-height, 844px)",
				maxWidth: "var(--cx-app-screen-max-width, 390px)",
				width: "min(100%, var(--cx-app-screen-max-width, 390px))",
				...style,
			}}
		>
			{children}
		</div>
	);
}
