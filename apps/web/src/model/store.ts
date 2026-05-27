import type { RegisteredNodeTree } from "@cx/agent";
import type { RenderTreeNode, RenderTreeScreenNode, ValidationStats } from "@cx/renderer";
import { create } from "zustand";
import {
	type AppArea,
	type AppScreen,
	getInitialScreenCode,
	getScreenNode,
	getSelectedScreen,
	getValidationStatus,
} from "@/adapters/tables-to-render-tree";
import {
	type AgentNodeSelection,
	findSelectedAgentAsset,
	getDefaultAgentSelection,
	type SelectedAgentAsset,
} from "@/agent/agent-registry-view";

export type NavigatorTab = "agent" | "comp" | "ogn" | "scn";

export interface AppComponent {
	code: string;
	name: string;
	parentAreaCode?: string;
	sourceScreenCode: string;
	type: string;
}

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
	variantName: string;
}

export interface SelectedAreaContext {
	code: string;
	node: RenderTreeNode;
	screen: AppScreen;
}

export interface SelectedComponentContext {
	code: string;
	node: RenderTreeNode;
	area?: SelectedAreaContext;
	screen: AppScreen;
}

interface InitializeWorkbenchInput {
	agentRegistry?: RegisteredNodeTree;
	areas: AppArea[];
	screens: AppScreen[];
}

interface WorkbenchState {
	activeNavigatorTab: NavigatorTab;
	activeScreen?: AppScreen;
	agentGenerationMessage: string;
	agentGenerationStatus: "error" | "idle" | "loading" | "success";
	agentImports: AgentClientImport[];
	agentRegistry?: RegisteredNodeTree;
	agentWarnings: string[];
	components: AppComponent[];
	initializeWorkbench: (input: InitializeWorkbenchInput) => void;
	isComponentView: boolean;
	isAreaView: boolean;
	areas: AppArea[];
	screenNode?: RenderTreeScreenNode;
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
	setAgentImports: (imports: AgentClientImport[]) => void;
	setAgentRegistry: (registry?: RegisteredNodeTree) => void;
	selectedAgentAsset?: SelectedAgentAsset;
	selectedAgentNode: AgentNodeSelection;
	selectedComponent?: SelectedComponentContext;
	selectedComponentCode: string;
	selectedArea?: SelectedAreaContext;
	selectedAreaCode: string;
	selectedScreen?: AppScreen;
	selectedScreenCode: string;
	validationErrors: string[];
	validationLabel: string;
	validationStats?: ValidationStats;
	validationSuccess: boolean;
	validationWarnings: string[];
}

export interface AgentClientImport {
	id: string;
	areaFiles: number;
	screenFiles: number;
}

const initialWorkbenchState = {
	activeNavigatorTab: "scn" as NavigatorTab,
	activeScreen: undefined,
	agentGenerationMessage: "",
	agentGenerationStatus: "idle" as const,
	agentImports: [],
	agentRegistry: undefined,
	agentWarnings: [],
	components: [],
	isComponentView: false,
	isAreaView: false,
	areas: [],
	screenNode: undefined,
	screenRoutes: [],
	screens: [],
	selectedAgentAsset: undefined,
	selectedAgentNode: {
		level: "screen" as const,
		id: "",
	},
	selectedComponent: undefined,
	selectedComponentCode: "",
	selectedArea: undefined,
	selectedAreaCode: "",
	selectedScreen: undefined,
	selectedScreenCode: "",
	validationErrors: [],
	validationLabel: "screen source + render tree valid",
	validationStats: undefined,
	validationSuccess: true,
	validationWarnings: [],
};

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
	...initialWorkbenchState,
	initializeWorkbench: ({ agentRegistry, areas, screens }) => {
		const components = getComponentCatalog(screens);
		const screenRoutes = getScreenRouteCatalog(screens);
		const state = get();
		const selectedAgentNode =
			agentRegistry && findSelectedAgentAsset(agentRegistry, state.selectedAgentNode)
				? state.selectedAgentNode
				: getDefaultAgentSelection(agentRegistry);
		const selectedScreenCode = screens.some((screen) => screen.code === state.selectedScreenCode)
			? state.selectedScreenCode
			: getInitialScreenCode(screens);
		const selectedAreaCode = areas.some(
			(area) => area.code === state.selectedAreaCode,
		)
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
			activeNavigatorTab: "agent",
			selectedAgentNode: node,
		} satisfies WorkbenchState;

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
		const nextState = {
			...state,
			screens: nextScreens,
		} satisfies WorkbenchState;

		set({
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
			activeNavigatorTab: "scn",
			selectedScreenCode: screenCode,
		} satisfies WorkbenchState;

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
			activeNavigatorTab: "scn",
			selectedScreenCode: screenCode,
		} satisfies WorkbenchState;

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
			activeNavigatorTab: "comp",
			selectedComponentCode: componentCode,
		} satisfies WorkbenchState;

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
			activeNavigatorTab: "ogn",
			selectedAreaCode: areaCode,
		} satisfies WorkbenchState;

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
			activeNavigatorTab: "scn",
			selectedScreenCode: screenCode,
		} satisfies WorkbenchState;

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
		} satisfies WorkbenchState;

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
	setAgentImports: (imports) => {
		set({ agentImports: imports });
	},
	setAgentRegistry: (registry) => {
		const state = get();
		const selectedAgentNode = getDefaultAgentSelection(registry);
		const nextState = {
			...state,
			agentGenerationStatus: "success",
			agentRegistry: registry,
			agentWarnings: registry?.warnings ?? [],
			selectedAgentNode,
		} satisfies WorkbenchState;

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
		| "screens"
		| "selectedAgentNode"
		| "selectedComponentCode"
		| "selectedAreaCode"
		| "selectedScreenCode"
	>,
) {
	const selectedScreen = getSelectedScreen(state.screens, state.selectedScreenCode);
	const selectedArea = getSelectedAreaContext(state.screens, state.selectedAreaCode);
	const selectedComponent = getSelectedComponentContext(state.screens, state.selectedComponentCode);
	const isAreaView = state.activeNavigatorTab === "ogn" && Boolean(selectedArea);
	const isComponentView = state.activeNavigatorTab === "comp" && Boolean(selectedComponent);
	const activeScreen = isComponentView
		? selectedComponent?.screen
		: isAreaView
			? selectedArea?.screen
			: selectedScreen;
	const validationStatus = getValidationStatus(activeScreen);

	return {
		activeScreen,
		isComponentView,
		isAreaView,
		screenNode: getScreenNode(selectedScreen),
		selectedAgentAsset: findSelectedAgentAsset(state.agentRegistry, state.selectedAgentNode),
		selectedComponent: isComponentView ? selectedComponent : undefined,
		selectedArea: isAreaView ? selectedArea : undefined,
		selectedScreen,
		validationErrors: validationStatus.errors,
		validationLabel: validationStatus.label,
		validationStats: validationStatus.stats ?? activeScreen?.validationStats,
		validationSuccess: validationStatus.success,
		validationWarnings: validationStatus.warnings,
	};
}

function reorderWorkbenchScreenAreas(screen: AppScreen, areaCodes: string[]): AppScreen {
	const areaByCode = new Map(
		screen.areas.map((area) => [area.areaCode, area]),
	);
	const nextAreas = areaCodes.map((areaCode, index) => {
		const area = areaByCode.get(areaCode);
		return {
			...area,
			order: index + 1,
			areaCode: areaCode,
		};
	});
	const schema = cloneSchema(screen.schema);
	const screenNode = getScreenNode({ ...screen, schema });
	const contentsNode = screenNode?.children.find((node) => node.type === "Screen.Contents");

	if (contentsNode?.children) {
		contentsNode.children = reorderAreaContainers(contentsNode.children, areaCodes);
	}

	return {
		...screen,
		areas: nextAreas,
		schema,
	};
}

function reorderAreaContainers(nodes: RenderTreeNode[], areaCodes: string[]) {
	const areaContainerByCode = new Map(
		nodes
			.map((node) => {
				const areaCode = getContainedAreaCode(node);
				return areaCode ? ([areaCode, node] as const) : undefined;
			})
			.filter(isAreaContainerEntry),
	);
	const nextAreaContainers = areaCodes
		.map((areaCode) => areaContainerByCode.get(areaCode))
		.filter(isRenderTreeNode);
	let nextAreaIndex = 0;

	return nodes.map((node) => {
		if (!getContainedAreaCode(node)) return node;
		const nextNode = nextAreaContainers[nextAreaIndex];
		nextAreaIndex += 1;
		return nextNode ?? node;
	});
}

function getContainedAreaCode(node: RenderTreeNode): string | undefined {
	if (node.type === "Organism") return getOrganismCode(node);
	const childOrganism = node.children?.find((child) => child.type === "Organism");
	return childOrganism ? getOrganismCode(childOrganism) : undefined;
}

function cloneSchema<T>(schema: T): T {
	return JSON.parse(JSON.stringify(schema)) as T;
}

function isAreaContainerEntry(
	entry: readonly [string, RenderTreeNode] | undefined,
): entry is readonly [string, RenderTreeNode] {
	return Boolean(entry);
}

function isRenderTreeNode(node: RenderTreeNode | undefined): node is RenderTreeNode {
	return Boolean(node);
}

function getComponentCatalog(screens: AppScreen[]): AppComponent[] {
	const byCode = new Map<string, AppComponent>();

	for (const screen of screens) {
		forEachCompositeNode(screen.schema.children, undefined, (node, parentAreaCode) => {
			const code = node.metadata.id;
			if (byCode.has(code)) return;

			byCode.set(code, {
				code,
				name: node.metadata.title,
				parentAreaCode,
				sourceScreenCode: screen.code,
				type: node.type,
			});
		});
	}

	return Array.from(byCode.values());
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
			variantName: screen.screenVariantName,
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

function getSelectedAreaContext(
	screens: AppScreen[],
	selectedAreaCode: string,
): SelectedAreaContext | undefined {
	for (const screen of screens) {
		const node = findOrganismNode(screen.schema.children, selectedAreaCode);
		if (node) {
			return {
				code: selectedAreaCode,
				node,
				screen,
			};
		}
	}
	return undefined;
}

function getSelectedComponentContext(
	screens: AppScreen[],
	selectedComponentCode: string,
): SelectedComponentContext | undefined {
	for (const screen of screens) {
		const found = findCompositeNode(screen.schema.children, selectedComponentCode);
		if (found) {
			return {
				code: selectedComponentCode,
				node: found.node,
				area: found.parentOrganismCode
					? getSelectedAreaContext([screen], found.parentOrganismCode)
					: undefined,
				screen,
			};
		}
	}
	return undefined;
}

function findOrganismNode(nodes: RenderTreeNode[], organismCode: string): RenderTreeNode | undefined {
	for (const node of nodes) {
		if (
			node.type === "Organism" &&
			String(node.props?.organismCode ?? node.metadata.id) === organismCode
		) {
			return node;
		}
		const childMatch = node.children ? findOrganismNode(node.children, organismCode) : undefined;
		if (childMatch) return childMatch;
	}
	return undefined;
}

function findCompositeNode(
	nodes: RenderTreeNode[],
	compositeCode: string,
	parentOrganismCode?: string,
): { node: RenderTreeNode; parentOrganismCode?: string } | undefined {
	for (const node of nodes) {
		const nextParentOrganismCode = getOrganismCode(node) ?? parentOrganismCode;
		if (isCompositeNode(node) && node.metadata.id === compositeCode) {
			return {
				node,
				parentOrganismCode,
			};
		}
		const childMatch = node.children
			? findCompositeNode(node.children, compositeCode, nextParentOrganismCode)
			: undefined;
		if (childMatch) return childMatch;
	}
	return undefined;
}

function forEachCompositeNode(
	nodes: RenderTreeNode[],
	parentAreaCode: string | undefined,
	callback: (node: RenderTreeNode, parentAreaCode?: string) => void,
) {
	for (const node of nodes) {
		const nextParentAreaCode = getOrganismCode(node) ?? parentAreaCode;
		if (isCompositeNode(node)) {
			callback(node, parentAreaCode);
		}
		if (node.children) {
			forEachCompositeNode(node.children, nextParentAreaCode, callback);
		}
	}
}

function getOrganismCode(node: RenderTreeNode) {
	if (node.type !== "Organism") return undefined;
	return String(node.props?.organismCode ?? node.metadata.id);
}

function isCompositeNode(node: RenderTreeNode) {
	return ![
		"Screen",
		"Screen.Header",
		"Screen.Contents",
		"Screen.Bottom",
		"Organism",
		"PageStack",
	].includes(node.type);
}
