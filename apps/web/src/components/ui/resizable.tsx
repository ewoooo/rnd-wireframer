"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/components/utils";

function ResizablePanelGroup({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<typeof Group>) {
	return (
		<Group
			data-slot="resizable-panel-group"
			orientation={orientation}
			className={cn(
				"flex h-full w-full",
				orientation === "vertical" ? "flex-col" : "flex-row",
				className,
			)}
			{...props}
		/>
	);
}

const ResizablePanel = Panel;

/**
 * 수평 핸들 (orientation="vertical" 패널 그룹에서 위아래 패널을 나누는 바)
 *
 * 디자인:
 *   - 전체 너비 · 위아래 border만 있는 직사각형
 *   - 중앙에 rounded-full 굵은 선 하나
 */
function ResizableHandle({
	className,
	...props
}: Omit<React.ComponentProps<typeof Separator>, "children">) {
	return (
		<Separator
			data-slot="resizable-handle"
			className={cn(
				"relative flex w-full items-center justify-center",
				"h-4 border-t border-b border-border bg-transparent",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
				className,
			)}
			{...props}
		>
			<div className="h-[3px] w-[100px] rounded-full bg-border" />
		</Separator>
	);
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
