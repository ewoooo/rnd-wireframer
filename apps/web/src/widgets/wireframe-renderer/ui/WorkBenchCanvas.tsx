import { WireframeNodeRenderer } from "@cx/renderer";
import { Smartphone } from "lucide-react";
import { SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import type { SelectedAgentAsset } from "@/features/agent-asset-pipeline/agent-registry-view";
import type { WireframeWorkbenchScreen } from "@/features/wireframe-renderer/tables-to-render-tree";
import type { SelectedCompositeContext, SelectedOrganismContext } from "../model/workbench-store";
import { useWorkbenchStore } from "../model/workbench-store";
import { AgentRegistryPreview } from "./agent/AgentRegistryPreview";
import { RenderedScreen } from "./RenderedScreen";

export function WorkBenchCanvas() {
	const isCompositeView = useWorkbenchStore((state) => state.isCompositeView);
	const isOrganismView = useWorkbenchStore((state) => state.isOrganismView);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const screenNode = useWorkbenchStore((state) => state.screenNode);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);
	const selectedAgentNode = useWorkbenchStore((state) => state.selectedAgentNode);
	const selectedComposite = useWorkbenchStore((state) => state.selectedComposite);
	const selectedOrganism = useWorkbenchStore((state) => state.selectedOrganism);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);

	const selectAgentNode = useWorkbenchStore((state) => state.selectAgentNode);

	return (
		<SidebarInset>
			<SidebarHeader className="border-b border-sidebar-border">
				<h1 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
					<Smartphone data-icon="inline-start" />
					{getCanvasTitle({
						activeTab,
						isCompositeView,
						isOrganismView,
						selectedAgentAsset,
						selectedComposite,
						selectedOrganism,
					})}
				</h1>
				<p className="text-sm text-muted-foreground">
					{getCanvasDescription({
						activeTab,
						isCompositeView,
						isOrganismView,
						selectedAgentAsset,
						selectedComposite,
						selectedOrganism,
						selectedScreen,
					})}
				</p>
			</SidebarHeader>
			<SidebarContent className="items-center justify-center bg-secondary/50 p-6">
				{activeTab === "agent" ? (
					<AgentRegistryPreview
						registry={agentRegistry}
						selectedAsset={selectedAgentAsset}
						selectedNode={selectedAgentNode}
						onSelectNode={selectAgentNode}
					/>
				) : isCompositeView && selectedComposite ? (
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
						<div className="size-full overflow-y-auto bg-background p-7">
							<WireframeNodeRenderer
								data={selectedComposite.screen.schema.data}
								node={selectedComposite.node}
							/>
						</div>
					</div>
				) : isOrganismView && selectedOrganism ? (
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
						<div className="size-full overflow-y-auto bg-background p-7">
							<WireframeNodeRenderer
								data={selectedOrganism.screen.schema.data}
								node={selectedOrganism.node}
							/>
						</div>
					</div>
				) : (
					<RenderedScreen data={selectedScreen?.schema.data} node={screenNode} />
				)}
			</SidebarContent>
		</SidebarInset>
	);
}

function getCanvasTitle({
	activeTab,
	isCompositeView,
	isOrganismView,
	selectedAgentAsset,
	selectedComposite,
	selectedOrganism,
}: {
	activeTab: string;
	isCompositeView: boolean;
	isOrganismView: boolean;
	selectedAgentAsset?: SelectedAgentAsset;
	selectedComposite?: SelectedCompositeContext;
	selectedOrganism?: SelectedOrganismContext;
}) {
	if (activeTab === "agent") return selectedAgentAsset?.item.name ?? "Agent Registry";
	if (isCompositeView) return selectedComposite?.node.metadata.title;
	if (isOrganismView) return selectedOrganism?.node.metadata.title;
	return null;
}

function getCanvasDescription({
	activeTab,
	isCompositeView,
	isOrganismView,
	selectedAgentAsset,
	selectedComposite,
	selectedOrganism,
	selectedScreen,
}: {
	activeTab: string;
	isCompositeView: boolean;
	isOrganismView: boolean;
	selectedAgentAsset?: SelectedAgentAsset;
	selectedComposite?: SelectedCompositeContext;
	selectedOrganism?: SelectedOrganismContext;
	selectedScreen?: WireframeWorkbenchScreen;
}) {
	if (activeTab === "agent" && selectedAgentAsset) {
		return `${selectedAgentAsset.level} · ${selectedAgentAsset.item.id}`;
	}
	if (isCompositeView && selectedComposite) {
		return `${selectedComposite.code} · ${selectedComposite.node.type} · from ${selectedComposite.screen.code}`;
	}
	if (isOrganismView && selectedOrganism) {
		return `${selectedOrganism.code} · from ${selectedOrganism.screen.code}`;
	}
	return selectedScreen?.description;
}
