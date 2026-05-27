import type { RegisteredNodeTree } from "@cx/agent/types";
import type { QualityBacklog } from "@cx/types/quality-backlog";
import type { QualityReport } from "@cx/types/quality-report";
import { create } from "zustand";
import {
	type AppArea,
	type AppComponent,
	type AppScreen,
	getInitialScreenCode,
	getSelectedScreen,
} from "@/adapters/tables-to-render-tree";
import {
	type AgentNodeSelection,
	findSelectedAgentAsset,
	getDefaultAgentSelection,
	type SelectedAgentAsset,
} from "@/agent/agent-registry-view";

export type NavigatorTab = "agent" | "comp" | "ogn" | "scn";

export type { AppComponent };

export interface AppScreenRoute {
	code: string;
	module: string;
	name: string;
	screenVariants: AppScreenVariant[];
	screenCount: number;
}

export interface AppScreenVariant {
	id: string;
	name: string;
	order: number;
	options: AppScreenVariantOption[];
}

export interface AppScreenVariantOption {
	code: string;
	label: string;
	name: string;
	screenCode: string;
	type: AppScreen["screenVariantType"];
}

interface InitializeWorkbenchInput {
	agentRegistry?: RegisteredNodeTree;
	areas: AppArea[];
	components: AppComponent[];
	screens: AppScreen[];
}

interface WorkbenchState {
	activeNavigatorTab: NavigatorTab;
	activeScreen?: AppScreen;
	agentGenerationMessage: string;
	agentGenerationStatus: "error" | "idle" | "loading" | "success";
	agentDraftTablesResult?: AgentDraftTablesResult;
	agentImports: AgentClientImport[];
	agentRegistry?: RegisteredNodeTree;
	agentWarnings: string[];
	areaOrderOverrides: Record<string, string[]>;
	components: AppComponent[];
	initializeWorkbench: (input: InitializeWorkbenchInput) => void;
	isComponentView: boolean;
	isAreaView: boolean;
	areas: AppArea[];
	screenRoutes: AppScreenRoute[];
	screens: AppScreen[];
	reorderScreenAreas: (screenCode: string, areaCodes: string[]) => void;
	selectAgentNode: (node: AgentNodeSelection) => void;
	selectComponent: (componentCode: string) => void;
	selectArea: (areaCode: string) => void;
	selectScreenRoute: (screenRouteId: string) => void;
	selectScreenVariant: (screenCode: string) => void;
	selectScreen: (screenCode: string) => void;
	selectTab: (tab: NavigatorTab) => void;
	setAgentGenerationMessage: (message: string) => void;
	setAgentGenerationStatus: (status: WorkbenchState["agentGenerationStatus"]) => void;
	setAgentDraftTablesResult: (result?: AgentDraftTablesResult) => void;
	setAgentImports: (imports: AgentClientImport[]) => void;
	setAgentRegistry: (registry?: RegisteredNodeTree) => void;
	selectedAgentAsset?: SelectedAgentAsset;
	selectedAgentNode: AgentNodeSelection;
	selectedComponentCode: string;
	selectedAreaCode: string;
	selectedScreen?: AppScreen;
	selectedScreenCode: string;
}

export interface AgentClientImport {
	id: string;
	screenFiles: number;
}

export interface AgentDraftTablesResult {
	importId: string;
	backlog?: QualityBacklog;
	backlogPath?: string;
	screenCount: number;
	writtenDir: string;
	results: AgentDraftTablesScreenResult[];
}

export interface AgentDraftTablesScreenResult {
	screenFile: string;
	ok: boolean;
	stage: string;
	writtenPaths: {
		artifact: string;
		qualityReport: string;
		materialized: string;
	};
	qualityReport?: QualityReport;
}

const initialWorkbenchState = {
	activeNavigatorTab: "scn" as NavigatorTab,
	activeScreen: undefined,
	agentDraftTablesResult: undefined,
	agentGenerationMessage: "",
	agentGenerationStatus: "idle" as const,
	agentImports: [],
	agentRegistry: undefined,
	agentWarnings: [],
	areaOrderOverrides: {},
	components: [],
	isComponentView: false,
	isAreaView: false,
	areas: [],
	screenRoutes: [],
	screens: [],
	selectedAgentAsset: undefined,
	selectedAgentNode: {
		level: "screen" as const,
		id: "",
	},
	selectedComponentCode: "",
	selectedAreaCode: "",
	selectedScreen: undefined,
	selectedScreenCode: "",
};

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
	...initialWorkbenchState,
	initializeWorkbench: ({ agentRegistry, areas, components, screens }) => {
		const screenRoutes = getScreenRouteCatalog(screens);
		const state = get();
		const selectedAgentNode =
			agentRegistry && findSelectedAgentAsset(agentRegistry, state.selectedAgentNode)
				? state.selectedAgentNode
				: getDefaultAgentSelection(agentRegistry);
		const selectedScreenCode = screens.some((screen) => screen.code === state.selectedScreenCode)
			? state.selectedScreenCode
			: getInitialScreenCode(screens);
		const selectedAreaCode = areas.some((area) => area.code === state.selectedAreaCode)
			? state.selectedAreaCode
			: (areas[0]?.code ?? "");
		const selectedComponentCode = components.some(
			(component) => component.code === state.selectedComponentCode,
		)
			? state.selectedComponentCode
			: (components[0]?.code ?? "");

		const nextState = {
			activeNavigatorTab: state.activeNavigatorTab,
			agentRegistry,
			agentWarnings: agentRegistry?.warnings ?? [],
			areaOrderOverrides: state.areaOrderOverrides,
			components,
			areas,
			screenRoutes,
			screens,
			selectedAgentNode,
			selectedComponentCode,
			selectedAreaCode,
			selectedScreenCode,
		};

		set({
			...nextState,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectAgentNode: (node) => {
		const state = get();
		const nextState = {
			...state,
			activeNavigatorTab: "agent" as NavigatorTab,
			selectedAgentNode: node,
		};

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			selectedAgentNode: node,
			...getDerivedWorkbenchState(nextState),
		});
	},
	reorderScreenAreas: (screenCode, areaCodes) => {
		const state = get();
		const nextScreens = state.screens.map((screen) => {
			if (screen.code !== screenCode) return screen;
			return reorderWorkbenchScreenAreas(screen, areaCodes);
		});
		const areaOrderOverrides = {
			...state.areaOrderOverrides,
			[screenCode]: areaCodes,
		};
		const nextState = {
			...state,
			areaOrderOverrides,
			screens: nextScreens,
		};

		set({
			areaOrderOverrides,
			screens: nextScreens,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectScreenRoute: (screenRouteId) => {
		const state = get();
		const route = state.screenRoutes.find((candidate) => candidate.code === screenRouteId);
		const screenCode = route?.screenVariants[0]?.options[0]?.screenCode ?? state.selectedScreenCode;
		const nextState = {
			...state,
			activeNavigatorTab: "scn" as NavigatorTab,
			selectedScreenCode: screenCode,
		};

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			selectedScreenCode: screenCode,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectScreenVariant: (screenCode) => {
		const state = get();
		const nextState = {
			...state,
			activeNavigatorTab: "scn" as NavigatorTab,
			selectedScreenCode: screenCode,
		};

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			selectedScreenCode: screenCode,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectComponent: (componentCode) => {
		const state = get();
		const nextState = {
			...state,
			activeNavigatorTab: "comp" as NavigatorTab,
			selectedComponentCode: componentCode,
		};

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			selectedComponentCode: componentCode,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectArea: (areaCode) => {
		const state = get();
		const nextState = {
			...state,
			activeNavigatorTab: "ogn" as NavigatorTab,
			selectedAreaCode: areaCode,
		};

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			selectedAreaCode: areaCode,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectScreen: (screenCode) => {
		const state = get();
		const nextState = {
			...state,
			activeNavigatorTab: "scn" as NavigatorTab,
			selectedScreenCode: screenCode,
		};

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			selectedScreenCode: screenCode,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectTab: (tab) => {
		const state = get();
		const nextState = {
			...state,
			activeNavigatorTab: tab,
		};

		set({
			activeNavigatorTab: tab,
			...getDerivedWorkbenchState(nextState),
		});
	},
	setAgentGenerationStatus: (status) => {
		set({ agentGenerationStatus: status });
	},
	setAgentGenerationMessage: (message) => {
		set({ agentGenerationMessage: message });
	},
	setAgentDraftTablesResult: (result) => {
		set({ agentDraftTablesResult: result });
	},
	setAgentImports: (imports) => {
		set({ agentImports: imports });
	},
	setAgentRegistry: (registry) => {
		const state = get();
		const selectedAgentNode = getDefaultAgentSelection(registry);
		const nextState = {
			...state,
			agentGenerationStatus: "success" as const,
			agentRegistry: registry,
			agentWarnings: registry?.warnings ?? [],
			selectedAgentNode,
		};

		set({
			agentGenerationStatus: nextState.agentGenerationStatus,
			agentRegistry: registry,
			agentWarnings: nextState.agentWarnings,
			selectedAgentNode,
			...getDerivedWorkbenchState(nextState),
		});
	},
}));

function getDerivedWorkbenchState(
	state: Pick<
		WorkbenchState,
		| "agentRegistry"
		| "activeNavigatorTab"
		| "components"
		| "areas"
		| "screens"
		| "selectedAgentNode"
		| "selectedComponentCode"
		| "selectedAreaCode"
		| "selectedScreenCode"
	>,
) {
	const selectedScreen = getSelectedScreen(state.screens, state.selectedScreenCode);
	const hasSelectedArea = state.areas.some((area) => area.code === state.selectedAreaCode);
	const hasSelectedComponent = state.components.some(
		(component) => component.code === state.selectedComponentCode,
	);
	const isAreaView = state.activeNavigatorTab === "ogn" && hasSelectedArea;
	const isComponentView = state.activeNavigatorTab === "comp" && hasSelectedComponent;
	const activeScreen = isComponentView
		? (getScreenForComponent(state.screens, state.components, state.selectedComponentCode) ??
			selectedScreen)
		: isAreaView
			? (getScreenForArea(state.screens, state.selectedAreaCode) ?? selectedScreen)
			: selectedScreen;

	return {
		activeScreen,
		isComponentView,
		isAreaView,
		selectedAgentAsset: findSelectedAgentAsset(state.agentRegistry, state.selectedAgentNode),
		selectedScreen,
	};
}

function reorderWorkbenchScreenAreas(screen: AppScreen, areaCodes: string[]): AppScreen {
	const areaByCode = new Map(screen.areas.map((area) => [area.areaCode, area]));
	const nextAreas = areaCodes.map((areaCode, index) => {
		const area = areaByCode.get(areaCode);
		return {
			...area,
			order: index + 1,
			areaCode,
		};
	});

	return {
		...screen,
		areas: nextAreas,
	};
}

function getScreenForComponent(
	screens: AppScreen[],
	components: AppComponent[],
	componentCode: string,
) {
	const component = components.find((candidate) => candidate.code === componentCode);
	if (!component) return undefined;
	return screens.find((screen) => screen.code === component.sourceScreenCode);
}

function getScreenForArea(screens: AppScreen[], areaCode: string) {
	return screens.find((screen) => screen.areas.some((area) => area.areaCode === areaCode));
}

function getScreenRouteCatalog(screens: AppScreen[]): AppScreenRoute[] {
	const byCode = new Map<string, AppScreenRoute>();

	for (const screen of screens) {
		const screenOption: AppScreenVariantOption = {
			code: screen.code,
			label: getScreenVariantLabel(screen),
			name: screen.name,
			screenCode: screen.code,
			type: screen.screenVariantType,
		};

		let route = byCode.get(screen.screenRouteId);
		if (!route) {
			route = {
				code: screen.screenRouteId,
				module: screen.module,
				name: screen.screenRouteName,
				screenCount: 0,
				screenVariants: [],
			};
			byCode.set(screen.screenRouteId, route);
		}

		let variant = route.screenVariants.find((candidate) => candidate.id === screen.screenVariantId);
		if (!variant) {
			variant = {
				id: screen.screenVariantId,
				name: screen.screenVariantName,
				order: screen.screenVariantOrder,
				options: [],
			};
			route.screenVariants.push(variant);
		}
		if (!variant.options.some((option) => option.screenCode === screenOption.screenCode)) {
			variant.options.push(screenOption);
		}
		route.screenCount += 1;
	}

	for (const route of byCode.values()) {
		route.screenVariants.sort(
			(left, right) => left.order - right.order || left.name.localeCompare(right.name),
		);
		for (const screenVariant of route.screenVariants) {
			screenVariant.options.sort(
				(left, right) =>
					getScreenVariantLabelOrder(left.label) - getScreenVariantLabelOrder(right.label) ||
					left.code.localeCompare(right.code),
			);
		}
	}

	return Array.from(byCode.values());
}

function getScreenVariantLabel(screen: AppScreen) {
	const suffix = screen.code.match(/(?:^|[-_])(0|e\d+)$/i)?.[1];
	if (suffix) return suffix.toUpperCase();
	return screen.code;
}

function getScreenVariantLabelOrder(label: string) {
	if (label === "0") return 0;

	const edgeNumber = label.match(/^E(\d+)$/)?.[1];
	return edgeNumber ? Number(edgeNumber) : Number.MAX_SAFE_INTEGER;
}
