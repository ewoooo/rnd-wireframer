import type { ReactNode } from "react";

type EditSidebarPaneProps = {
	children: ReactNode;
	title: string;
};

export function EditSidebarPane({ children, title }: EditSidebarPaneProps) {
	return (
		<section className="flex min-h-0 flex-1 flex-col border-b border-sidebar-border last:border-b-0">
			<div className="shrink-0 border-b border-sidebar-border px-3 py-2">
				<h3 className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
					{title}
				</h3>
			</div>
			<div className="min-h-0 flex-1 overflow-auto px-2 py-2">{children}</div>
		</section>
	);
}
