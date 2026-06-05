"use client";

import type { RegisteredNodeTree } from "@cx/agent";
import { Puck } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { useEffect, useMemo } from "react";
import { mockAgentAssetRegistry } from "@/agent/mock-agent-assets";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AppArea, AppScreen } from "@/adapters/tables-to-render-tree";
import type { AppScreenModule, NavigatorTab } from "@/model/store";
import { buildAreaComponentCatalog, useWorkbenchStore } from "@/model/store";
import { buildPuckConfig, buildPuckData, buildPuckOverrides } from "./screen/puck-config";
import { buildAreaPuckConfig, buildAreaPuckData } from "./area/area-puck-config";
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
const NAV_TAB_STORAGE_KEY = "workbench:nav-tab";
const NAV_TABS = new Set<string>(["run", "scn", "ogn", "comp", "agent"]);

export function App({ agentRegistry = mockAgentAssetRegistry, initialData }: AppProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const selectTab = useWorkbenchStore((state) => state.selectTab);
	const areas = useWorkbenchStore((state) => state.areas);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);
	const selectedArea = useWorkbenchStore((state) => state.selectedArea);
	const isAreaView = useWorkbenchStore((state) => state.isAreaView);
	const reorderScreenAreas = useWorkbenchStore((state) => state.reorderScreenAreas);
	const reorderAreaChildren = useWorkbenchStore((state) => state.reorderAreaChildren);

	useEffect(() => {
		initializeWorkbench({
			agentRegistry,
			areas: initialData.areas,
			modules: initialData.modules ?? [],
			routes: initialData.routes ?? [],
			screens: initialData.screens,
		});
	}, [agentRegistry, initializeWorkbench, initialData]);

	// nav 탭 선택을 새로고침 후에도 유지. 마운트 후(하이드레이션 이후) 복원하여
	// 서버 기본값("scn")과의 하이드레이션 불일치를 피한다.
	useEffect(() => {
		const saved = window.localStorage.getItem(NAV_TAB_STORAGE_KEY);
		if (saved && NAV_TABS.has(saved)) {
			selectTab(saved as NavigatorTab);
		}
	}, [selectTab]);

	useEffect(() => {
		window.localStorage.setItem(NAV_TAB_STORAGE_KEY, activeTab);
	}, [activeTab]);

	const areaComponentCatalog = useMemo(() => buildAreaComponentCatalog(areas), [areas]);
	const puckConfig = useMemo(
		() => (isAreaView ? buildAreaPuckConfig(areaComponentCatalog) : buildPuckConfig(areas, selectedScreen)),
		[isAreaView, areaComponentCatalog, areas, selectedScreen],
	);
	const puckData = useMemo(
		() => (isAreaView ? buildAreaPuckData(selectedArea?.node) : buildPuckData(selectedScreen)),
		[isAreaView, selectedArea?.node, selectedScreen],
	);
	const puckOverrides = useMemo(() => buildPuckOverrides(puckConfig), [puckConfig]);

	const puckKey = isAreaView ? `area:${selectedArea?.code ?? "none"}` : selectedScreen?.code ?? "no-screen";

	return (
		<Puck
			key={puckKey}
			config={puckConfig}
			data={puckData}
			overrides={puckOverrides}
			iframe={{ enabled: false }}
			onChange={(data) => {
				const nextCodes = data.content.map((item) => item.type as string);
				if (isAreaView) {
					if (!selectedArea) return;
					const currentCodes = (selectedArea.node.children ?? []).map((child) => child.metadata.id);
					const unchanged =
						nextCodes.length === currentCodes.length &&
						nextCodes.every((code, index) => code === currentCodes[index]);
					if (unchanged) return;
					reorderAreaChildren(selectedArea.code, nextCodes);
					return;
				}
				if (!selectedScreen) return;
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
