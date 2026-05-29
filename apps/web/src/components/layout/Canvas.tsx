import { SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import type { ScreenSummary } from "@/lib/screen-sources";
import { RenderedScreen } from "../screen/RenderedScreen";

type CanvasProps = {
	selectedScreen?: ScreenSummary;
};

export function Canvas({ selectedScreen }: CanvasProps) {
	return (
		<SidebarInset className="overflow-hidden">
			<SidebarHeader className="h-14 shrink-0 justify-center border-b border-sidebar-border bg-background px-5 py-0">
				<h1 className="truncate text-base font-semibold">
					{selectedScreen?.title ?? "Screen Preview"}
				</h1>
			</SidebarHeader>
			<SidebarContent className="items-center justify-center overflow-hidden bg-secondary/50 p-6">
				<RenderedScreen node={selectedScreen?.renderTree} />
			</SidebarContent>
		</SidebarInset>
	);
}
