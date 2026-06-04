import { Blocks } from "lucide-react";
import { SidebarHeader } from "@/components/ui/sidebar";
import { type EditScope, readEditScopeTitle } from "@/model/puck-edit-scope";

type EditSidebarHeaderProps = {
	scope?: EditScope;
	title?: string;
};

export function EditSidebarHeader({ scope, title }: EditSidebarHeaderProps) {
	return (
		<SidebarHeader className="h-14 shrink-0 justify-center border-b border-sidebar-border px-3 py-0">
			<h2 className="flex min-w-0 items-center gap-2 text-base font-semibold leading-none tracking-normal">
				<Blocks className="size-4 shrink-0" data-icon="inline-start" />
				<span className="truncate">{title ?? readEditScopeTitle(scope)}</span>
			</h2>
		</SidebarHeader>
	);
}
