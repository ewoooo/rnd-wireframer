import type * as React from "react";

import { cn } from "@/components/utils";
import { Separator } from "./separator";

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
				"flex h-svh min-h-0 shrink-0 w-[var(--sidebar-width,380px)] flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
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

export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-sidebar="group"
			data-slot="sidebar-group"
			className={cn("relative flex min-w-0 flex-col gap-2", className)}
			{...props}
		/>
	);
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-sidebar="group-label"
			data-slot="sidebar-group-label"
			className={cn("px-2 text-xs font-medium text-sidebar-foreground/70", className)}
			{...props}
		/>
	);
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-sidebar="group-content"
			data-slot="sidebar-group-content"
			className={cn("min-w-0 text-sm", className)}
			{...props}
		/>
	);
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
	return (
		<Separator
			data-sidebar="separator"
			data-slot="sidebar-separator"
			className={cn("bg-sidebar-border", className)}
			{...props}
		/>
	);
}
