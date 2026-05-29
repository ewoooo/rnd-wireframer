import type * as React from "react";
import { cn } from "@/components/utils";

export function SidebarProvider({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-wrapper"
			className={cn("flex min-h-svh w-full bg-sidebar", className)}
			{...props}
		/>
	);
}

export function Sidebar({
	className,
	side = "left",
	...props
}: React.ComponentProps<"aside"> & {
	side?: "left" | "right";
}) {
	return (
		<aside
			data-side={side}
			data-slot="sidebar"
			className={cn(
				"flex h-svh min-h-0 w-[var(--sidebar-width,380px)] shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
				side === "left" && "border-r border-sidebar-border",
				side === "right" && "border-l border-sidebar-border",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
	return (
		<main
			data-slot="sidebar-inset"
			className={cn("flex h-svh min-h-0 min-w-0 flex-1 flex-col bg-background", className)}
			{...props}
		/>
	);
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-sidebar="header"
			data-slot="sidebar-header"
			className={cn("flex flex-col gap-1.5 p-4", className)}
			{...props}
		/>
	);
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-sidebar="content"
			data-slot="sidebar-content"
			className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-auto p-4", className)}
			{...props}
		/>
	);
}
