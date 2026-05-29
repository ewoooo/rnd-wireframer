import { Puck } from "@measured/puck";
import { Workflow } from "lucide-react";
import { AgentRegistryInspection } from "@/components/agent/AgentRegistryInspection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkbenchStore } from "@/model/store";
import { Aside, Panel } from "./Aside";

export function RightAside() {
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const agentWarnings = useWorkbenchStore((state) => state.agentWarnings);
	const screen = useWorkbenchStore((state) => state.activeScreen);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);

	return (
		<Aside side="right">
			{activeTab === "agent" ? (
				<Panel
					title={
						<span className="flex items-center gap-1.5">
							<Workflow className="size-3" />
							Agent
						</span>
					}
				>
					<div className="p-3">
						<AgentRegistryInspection
							registry={agentRegistry}
							selectedAsset={selectedAgentAsset}
							warnings={agentWarnings}
						/>
					</div>
				</Panel>
			) : (
				<>
					<Panel title="Area List" defaultSize={50} minSize={15}>
						{!screen ? (
							<p className="p-3 text-sm text-muted-foreground">스크린을 선택해주세요.</p>
						) : (
							<TooltipProvider>
								<Puck.Components />
							</TooltipProvider>
						)}
					</Panel>

					<Panel title="Properties" defaultSize={50} minSize={20}>
						{screen ? (
							<div className="flex flex-col gap-4">
								<Puck.Fields />
							</div>
						) : null}
					</Panel>
				</>
			)}
		</Aside>
	);
}
