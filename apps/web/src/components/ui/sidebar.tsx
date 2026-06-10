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
	collapsible,
	side = "left",
	...props
}: React.ComponentProps<"aside"> & {
	collapsible?: "icon" | "none";
	side?: "left" | "right";
}) {
	return (
		<aside
			data-collapsible={collapsible}
			data-side={side}
			data-slot="sidebar"
			className={cn(
				"flex h-svh min-h-0 w-[var(--sidebar-width,380px)] shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
				// 가장자리 border는 DoubleBorder가 담당하므로 Sidebar 자체 border 제거
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
			className={cn("flex flex-col gap-1.5 px-3 py-3", className)}
			{...props}
		/>
	);
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-sidebar="content"
			data-slot="sidebar-content"
			className={cn(
				"flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-auto px-2 py-2",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-sidebar="footer"
			data-slot="sidebar-footer"
			className={cn("flex flex-col gap-1.5 border-t border-sidebar-border px-2 py-2", className)}
			{...props}
		/>
	);
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group"
			className={cn("flex min-w-0 flex-col gap-1", className)}
			{...props}
		/>
	);
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group-label"
			className={cn(
				"flex h-7 shrink-0 items-center px-2 text-xs font-semibold text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarGroupAction({ className, ...props }: React.ComponentProps<"button">) {
	return (
		<button
			type="button"
			data-slot="sidebar-group-action"
			className={cn(
				"flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group-content"
			className={cn("flex min-w-0 flex-col gap-1", className)}
			{...props}
		/>
	);
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="sidebar-menu"
			className={cn("flex min-w-0 flex-col gap-1", className)}
			{...props}
		/>
	);
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
	return <li data-slot="sidebar-menu-item" className={cn("min-w-0", className)} {...props} />;
}

export function SidebarMenuButton({ className, ...props }: React.ComponentProps<"button">) {
	return (
		<button
			type="button"
			data-slot="sidebar-menu-button"
			className={cn(
				"flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="sidebar-menu-badge"
			className={cn("ml-auto shrink-0 text-xs text-muted-foreground", className)}
			{...props}
		/>
	);
}

export function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="sidebar-menu-sub"
			className={cn(
				"ml-4 flex min-w-0 flex-col gap-1 border-l border-sidebar-border pl-2",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarRail({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			aria-hidden="true"
			data-slot="sidebar-rail"
			className={cn("absolute inset-y-0 right-0 w-px bg-sidebar-border", className)}
			{...props}
		/>
	);
}
