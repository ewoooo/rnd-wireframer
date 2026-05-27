"use client";

import type { RegisteredNodeTree } from "@cx/agent/types";
import { useEffect } from "react";
import { mockAgentAssetRegistry } from "@/agent/mock-agent-assets";
import { SidebarProvider } from "@/components/ui/sidebar";
import { loadLocalWorkbenchData } from "@/data/local-workbench-data-loader";
import { useWorkbenchStore } from "@/model/store";
import { Canvas } from "./layout/Canvas";
import { InspectionPanel } from "./layout/InspectionPanel";
import { NavigationPanel } from "./layout/NavigationPanel";

interface AppProps {
	agentRegistry?: RegisteredNodeTree;
}

const localWorkbenchData = loadLocalWorkbenchData();

export function App({ agentRegistry = mockAgentAssetRegistry }: AppProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);

	useEffect(() => {
		initializeWorkbench({
			agentRegistry,
			areas: localWorkbenchData.areas,
			components: localWorkbenchData.components,
			renderTrees: localWorkbenchData.renderTrees,
			screens: localWorkbenchData.screens,
		});
	}, [agentRegistry, initializeWorkbench]);

	return (
		<SidebarProvider className="overflow-hidden">
			<div className="grid h-svh min-w-0 flex-1 grid-cols-[clamp(280px,18.5vw,380px)_minmax(0,1fr)_clamp(280px,17.5vw,360px)] overflow-hidden">
				<NavigationPanel />
				<Canvas />
				<InspectionPanel />
			</div>
		</SidebarProvider>
	);
}
