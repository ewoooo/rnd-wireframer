"use client";

import type { RegisteredNodeTree } from "@cx/agent";
import { Puck } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { useEffect, useMemo } from "react";
import { mockAgentAssetRegistry } from "@/agent/mock-agent-assets";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AppArea, AppScreen } from "@/adapters/tables-to-render-tree";
import type { AppScreenModule } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import { buildPuckConfig, buildPuckData, buildPuckOverrides } from "./screen/puck-config";
import { Canvas } from "./layout/Canvas";
import { LeftAside } from "./layout/LeftAside";
import { Rail } from "./layout/Rail";
import { RightAside } from "./layout/RightAside";

interface AppProps {
	agentRegistry?: RegisteredNodeTree;
	initialData: {
		modules: AppScreenModule[];
		routes: { id: string; moduleId: string; name: string; order: number }[];
		screens: AppScreen[];
		areas: AppArea[];
	};
}

const ASIDE_WIDTH = "380px";

export function App({ agentRegistry = mockAgentAssetRegistry, initialData }: AppProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const selectTab = useWorkbenchStore((state) => state.selectTab);
	const areas = useWorkbenchStore((state) => state.areas);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);
	const reorderScreenAreas = useWorkbenchStore((state) => state.reorderScreenAreas);

	useEffect(() => {
		initializeWorkbench({
			agentRegistry,
			areas: initialData.areas,
			modules: initialData.modules ?? [],
			routes: initialData.routes ?? [],
			screens: initialData.screens,
		});
	}, [agentRegistry, initializeWorkbench, initialData]);

	const puckConfig = useMemo(() => buildPuckConfig(areas, selectedScreen), [areas, selectedScreen]);
	const puckData = useMemo(() => buildPuckData(selectedScreen), [selectedScreen]);
	const puckOverrides = useMemo(() => buildPuckOverrides(puckConfig), [puckConfig]);

	return (
		<Puck
			key={selectedScreen?.code ?? "no-screen"}
			config={puckConfig}
			data={puckData}
			overrides={puckOverrides}
			iframe={{ enabled: false }}
			onChange={(data) => {
				if (!selectedScreen) return;
				const nextCodes = data.content.map((item) => item.type as string);
				const currentCodes = [...selectedScreen.areas]
					.sort((a, b) => a.order - b.order)
					.map((area) => area.areaCode);
				const unchanged =
					nextCodes.length === currentCodes.length &&
					nextCodes.every((code, index) => code === currentCodes[index]);
				if (unchanged) return;
				reorderScreenAreas(selectedScreen.code, nextCodes);
			}}
		>
			<div className="flex h-screen w-screen overflow-hidden">
				<Rail activeTab={activeTab} onSelectTab={selectTab} />
				<div className="h-full w-[6px] shrink-0 border-x border-sidebar-border bg-sidebar" />
				<SidebarProvider
					className="flex-1 overflow-hidden"
					style={{ "--sidebar-width": ASIDE_WIDTH } as React.CSSProperties}
				>
					<LeftAside />
					<div className="h-full w-[6px] shrink-0 border-x border-sidebar-border bg-sidebar" />
					<Canvas />
					<div className="h-full w-[6px] shrink-0 border-x border-sidebar-border bg-sidebar" />
					<RightAside />
				</SidebarProvider>
			</div>
		</Puck>
	);
}
