"use client";

import type { RegisteredNodeTree } from "@cx/agent";
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
			screens: localWorkbenchData.screens,
		});
	}, [agentRegistry, initializeWorkbench]);

	return (
		<SidebarProvider>
			<div className="grid min-h-screen w-screen grid-cols-[380px_minmax(420px,1fr)_360px]">
				<NavigationPanel />
				<Canvas />
				<InspectionPanel />
			</div>
		</SidebarProvider>
	);
}
