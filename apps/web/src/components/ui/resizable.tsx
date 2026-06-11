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
 * 패널 분리 드래그 핸들. DoubleBorder처럼 두 방향을 지원한다.
 *   - horizontal: 위아래 패널을 나누는 가로 막대(상하 border, 가로 알약선) — 세로 그룹용.
 *   - vertical: 좌우 패널을 나누는 세로 막대(좌우 border, 세로 알약선) — 가로 그룹용.
 * 방향은 부모 ResizablePanelGroup의 orientation과 맞춰야 한다(가로 그룹 → vertical 핸들).
 */
function ResizableHandle({
	className,
	orientation = "horizontal",
	...props
}: Omit<React.ComponentProps<typeof Separator>, "children"> & {
	orientation?: "horizontal" | "vertical";
}) {
	const isVertical = orientation === "vertical";
	return (
		<Separator
			data-slot="resizable-handle"
			className={cn(
				"group relative flex items-center justify-center bg-transparent transition-colors",
				isVertical
					? "h-full w-4 cursor-col-resize border-x border-divider"
					: "h-4 w-full cursor-row-resize border-y border-divider",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
				className,
			)}
			{...props}
		>
			<div
				className={cn(
					"rounded-full bg-border transition-colors group-hover:bg-muted-foreground/40",
					isVertical ? "h-[100px] w-[3px]" : "h-[3px] w-[100px]",
				)}
			/>
		</Separator>
	);
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
