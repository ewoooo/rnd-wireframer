"use client";

import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { loadLocalWorkbenchData } from "@/data/local-workbench-data-loader";
import { useWorkbenchStore } from "@/model/store";
import { Canvas } from "./layout/Canvas";
import { InspectionPanel } from "./layout/InspectionPanel";
import { NavigationPanel } from "./layout/NavigationPanel";

const localWorkbenchData = loadLocalWorkbenchData();

export function App() {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);

	useEffect(() => {
		initializeWorkbench({
			areas: localWorkbenchData.areas,
			components: localWorkbenchData.components,
			renderTrees: localWorkbenchData.renderTrees,
			screens: localWorkbenchData.screens,
		});
	}, [initializeWorkbench]);

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
