import type { ScreenSummary } from "@/lib/screen-sources";
import { RenderedScreen } from "../screen/RenderedScreen";

type CanvasProps = {
	selectedScreen?: ScreenSummary;
};

export function Canvas({ selectedScreen }: CanvasProps) {
	return (
		<section className="flex h-svh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
			<header className="flex h-14 shrink-0 items-center border-b border-sidebar-border bg-background px-5">
				<h1 className="truncate text-base font-semibold">
					{selectedScreen?.title ?? "Screen Preview"}
				</h1>
			</header>
			<div className="flex min-h-0 flex-1 items-center justify-center bg-secondary/50 p-6">
				<RenderedScreen node={selectedScreen?.renderTree} />
			</div>
		</section>
	);
}
