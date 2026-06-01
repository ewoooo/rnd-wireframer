import { Puck } from "@measured/puck";
import { Workflow } from "lucide-react";
import { AgentRegistryInspection } from "@/components/agent/AgentRegistryInspection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkbenchStore } from "@/model/store";
import { Aside, Divider, Panel } from "./Aside";

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
					<Panel title="Properties" defaultSize={50} minSize={20}>
						{screen ? (
							<div className="flex flex-col gap-4">
								<Puck.Fields />
							</div>
						) : null}
					</Panel>

					{/* Area List = Screen 페이지 전용 패널. area를 화면에 꺼내주는 드로어(텐키처럼) */}
					{activeTab === "scn" ? (
						<>
							<Divider />

							<Panel title="Area List" defaultSize={50} minSize={15}>
								<TooltipProvider>
									<div className="area-list-drawer">
										<Puck.Components />
									</div>
								</TooltipProvider>
							</Panel>
						</>
					) : null}
				</>
			)}
		</Aside>
	);
}
