"use client";

import type { RegisteredNodeTree } from "@cx/agent/types";
import { useEffect } from "react";
import { mockAgentAssetRegistry } from "@/agent/mock-agent-assets";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AppArea, AppComponent, AppScreen } from "@/adapters/tables-to-render-tree";
import { useWorkbenchStore } from "@/model/store";
import { Canvas } from "./layout/Canvas";
import { InspectionPanel } from "./layout/InspectionPanel";
import { NavigationPanel } from "./layout/NavigationPanel";

interface AppProps {
	agentRegistry?: RegisteredNodeTree;
	initialData: {
		screens: AppScreen[];
		areas: AppArea[];
		components: AppComponent[];
	};
}

export function App({ agentRegistry = mockAgentAssetRegistry, initialData }: AppProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);

	useEffect(() => {
		initializeWorkbench({
			agentRegistry,
			areas: initialData.areas,
			components: initialData.components,
			screens: initialData.screens,
		});
	}, [agentRegistry, initializeWorkbench, initialData]);

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
