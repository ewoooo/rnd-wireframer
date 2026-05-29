import type { RenderTreeNode } from "@cx/renderer";
import { Table2 } from "lucide-react";
import type { ScreenSummary } from "@/lib/screen-sources";
import type { NavigatorTab } from "@/model/workbench-view-model";

type InspectionPanelProps = {
	activeTab: NavigatorTab;
	areas: RenderTreeNode[];
	components: RenderTreeNode[];
	screen?: ScreenSummary;
};

export function InspectionPanel({ activeTab, areas, components, screen }: InspectionPanelProps) {
	const title = activeTab === "agent" ? "Agent" : "Information";

	return (
		<aside className="flex h-svh min-w-0 flex-col overflow-hidden border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
			<div className="border-b border-sidebar-border p-4">
				<h2 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
					<Table2 className="size-4" data-icon="inline-start" />
					{title}
				</h2>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				{screen ? (
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1">
							<p className="text-xs font-medium uppercase text-muted-foreground">Selected screen</p>
							<h3 className="truncate text-base font-semibold">{screen.title}</h3>
						</div>
						<div className="flex flex-col gap-2">
							<InfoRow label="Screen ID" value={screen.id} />
							<InfoRow label="Route" value={screen.route ?? "-"} />
							<InfoRow label="Type" value={screen.type ?? "-"} />
							<InfoRow label="Status" value={screen.status ?? "-"} />
						</div>
						<div className="grid grid-cols-2 gap-2">
							<StatCard label="Areas" value={String(areas.length)} />
							<StatCard label="Components" value={String(components.length)} />
						</div>
						<NodeList
							nodes={activeTab === "comp" ? components : areas}
							title={activeTab === "comp" ? "Components" : "Areas"}
						/>
					</div>
				) : (
					<div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
						현재 테이블에서 표시할 MBR 화면을 찾지 못했습니다.
					</div>
				)}
			</div>
		</aside>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-sidebar-border bg-background p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 break-all text-sm font-medium">{value}</p>
		</div>
	);
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-sidebar-border bg-background p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-xl font-semibold">{value}</p>
		</div>
	);
}

function NodeList({ nodes, title }: { nodes: RenderTreeNode[]; title: string }) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-sm font-semibold">{title}</h3>
			{nodes.map((node) => (
				<div
					key={node.metadata.id}
					className="min-w-0 rounded-lg border border-sidebar-border bg-background p-3"
				>
					<p className="truncate text-sm font-medium">{node.metadata.title}</p>
					<p className="mt-1 truncate font-mono text-xs text-muted-foreground">
						{node.metadata.id}
					</p>
					<p className="mt-3 text-xs text-muted-foreground">{node.type}</p>
				</div>
			))}
		</div>
	);
}
