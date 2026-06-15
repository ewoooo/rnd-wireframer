"use client";

import { AppShell } from "@/components/workbench/AppShell";
import type { NavigatorTab } from "@/model/workbench-view-model";

export function App({ initialTab = "scn" }: { initialTab?: NavigatorTab }) {
	return <AppShell initialTab={initialTab} />;
}
