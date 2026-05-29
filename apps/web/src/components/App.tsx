"use client";

import { useState } from "react";
import { Canvas } from "@/components/layout/Canvas";
import { InspectionPanel } from "@/components/layout/InspectionPanel";
import { NavigationPanel } from "@/components/layout/NavigationPanel";
import { NavigationRail } from "@/components/layout/NavigationRail";
import type { ScreenSummary } from "@/lib/screen-sources";
import {
	collectScreenAreas,
	collectScreenComponents,
	createWorkbenchViewModel,
	getInitialScreen,
	type NavigatorTab,
} from "@/model/workbench-view-model";

type AppProps = {
	screens: ScreenSummary[];
};

export function App({ screens }: AppProps) {
	const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
	const initialScreen = getInitialScreen(screens);
	const [selectedScreenId, setSelectedScreenId] = useState(initialScreen?.id ?? "");
	const { screenModules, screenRoutes } = createWorkbenchViewModel(screens);
	const selectedScreen = screens.find((screen) => screen.id === selectedScreenId) ?? screens[0];
	const [activeRouteId, setActiveRouteId] = useState(
		initialScreen?.screenRouteId ?? screenRoutes[0]?.id ?? "",
	);
	const activeRoute =
		screenRoutes.find((route) => route.id === activeRouteId) ??
		screenRoutes.find((route) => route.id === selectedScreen?.screenRouteId) ??
		screenRoutes[0];

	function handleSelectRoute(routeId: string) {
		setActiveRouteId(routeId);
		const nextRoute = screenRoutes.find((route) => route.id === routeId);
		const nextScreenId = nextRoute?.variants[0]?.options[0]?.screen.id;
		if (nextScreenId) setSelectedScreenId(nextScreenId);
	}

	function handleSelectScreen(screenId: string) {
		const nextScreen = screens.find((screen) => screen.id === screenId);
		if (nextScreen?.screenRouteId) setActiveRouteId(nextScreen.screenRouteId);
		setSelectedScreenId(screenId);
	}

	return (
		<main className="flex h-svh w-screen min-w-0 overflow-hidden bg-sidebar">
			<NavigationRail activeTab={activeTab} onSelectTab={setActiveTab} />
			<NavigationPanel
				activeTab={activeTab}
				activeRouteId={activeRoute?.id}
				onSelectRoute={handleSelectRoute}
				onSelectScreen={handleSelectScreen}
				screenModules={screenModules}
				screenRoute={activeRoute}
				selectedScreenId={selectedScreen?.id}
			/>
			<Canvas selectedScreen={selectedScreen} />
			<InspectionPanel
				activeTab={activeTab}
				areas={collectScreenAreas(selectedScreen)}
				components={collectScreenComponents(selectedScreen)}
				screen={selectedScreen}
			/>
		</main>
	);
}
