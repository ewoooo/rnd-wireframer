import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import type { NavigatorTab } from "@/model/workbench-view-model";
import type { NavigationService } from "./types";

type NavigationServiceLinkProps = {
	isActive: boolean;
	onSelect: (tab: NavigatorTab) => void;
	service: NavigationService;
};

export function NavigationServiceLink({ isActive, onSelect, service }: NavigationServiceLinkProps) {
	const Icon = service.icon;

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				aria-label={service.label}
				aria-pressed={isActive}
				className={cn(isActive && "bg-sidebar-accent text-sidebar-accent-foreground")}
				onClick={() => onSelect(service.id)}
				title={service.description}
			>
				<Icon className="size-4 shrink-0" data-icon="inline-start" />
				<span className="truncate text-sm">{service.label}</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
