"use client";

import { GripHorizontal } from "lucide-react";
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

function ResizableHandle({ className, ...props }: React.ComponentProps<typeof Separator>) {
	return (
		<Separator
			data-slot="resizable-handle"
			className={cn(
				"group flex h-2 w-full items-center justify-center border-y border-sidebar-border bg-background/40 transition-colors hover:bg-sidebar-accent",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
				className,
			)}
			{...props}
		>
			<GripHorizontal className="size-3.5 text-muted-foreground/45 transition-colors group-hover:text-muted-foreground" />
		</Separator>
	);
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
