import type { AssetRegistry } from "@cx/agent";
import type { WireframeNode, WireframeScreenNode, WireframeValidationStats } from "@cx/renderer";
import { create } from "zustand";
import {
	type AppOrganism,
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

export interface AppComposite {
	code: string;
	name: string;
	parentOrganismCode?: string;
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
}

export interface SelectedOrganismContext {
	code: string;
	node: WireframeNode;
	screen: AppScreen;
}

export interface SelectedCompositeContext {
	code: string;
	node: WireframeNode;
	organism?: SelectedOrganismContext;
	screen: AppScreen;
}

interface InitializeWorkbenchInput {
	agentRegistry?: AssetRegistry;
	organisms: AppOrganism[];
	screens: AppScreen[];
}

interface WorkbenchState {
	activeNavigatorTab: NavigatorTab;
	activeScreen?: AppScreen;
	agentGenerationMessage: string;
	agentGenerationStatus: "error" | "idle" | "loading" | "success";
	agentImports: AgentClientImport[];
	agentRegistry?: AssetRegistry;
	agentWarnings: string[];
	composites: AppComposite[];
	initializeWorkbench: (input: InitializeWorkbenchInput) => void;
	isCompositeView: boolean;
	isOrganismView: boolean;
	organisms: AppOrganism[];
	screenNode?: WireframeScreenNode;
	screenRoutes: AppScreenRoute[];
	screens: AppScreen[];
	reorderScreenOrganisms: (screenCode: string, organismCodes: string[]) => void;
	selectAgentNode: (node: AgentNodeSelection) => void;
	selectComposite: (compositeCode: string) => void;
	selectOrganism: (organismCode: string) => void;
	selectScreenRoute: (screenRouteId: string) => void;
	selectScreenVariant: (screenCode: string) => void;
	selectScreen: (screenCode: string) => void;
	selectTab: (tab: NavigatorTab) => void;
	setAgentGenerationMessage: (message: string) => void;
	setAgentGenerationStatus: (status: WorkbenchState["agentGenerationStatus"]) => void;
	setAgentImports: (imports: AgentClientImport[]) => void;
	setAgentRegistry: (registry?: AssetRegistry) => void;
	selectedAgentAsset?: SelectedAgentAsset;
	selectedAgentNode: AgentNodeSelection;
	selectedComposite?: SelectedCompositeContext;
	selectedCompositeCode: string;
	selectedOrganism?: SelectedOrganismContext;
	selectedOrganismCode: string;
	selectedScreen?: AppScreen;
	selectedScreenCode: string;
	validationErrors: string[];
	validationLabel: string;
	validationStats?: WireframeValidationStats;
	validationSuccess: boolean;
	validationWarnings: string[];
}

export interface AgentClientImport {
	id: string;
	organismFiles: number;
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
	composites: [],
	isCompositeView: false,
	isOrganismView: false,
	organisms: [],
	screenNode: undefined,
	screenRoutes: [],
	screens: [],
	selectedAgentAsset: undefined,
	selectedAgentNode: {
		level: "screen" as const,
		id: "",
	},
	selectedComposite: undefined,
	selectedCompositeCode: "",
	selectedOrganism: undefined,
	selectedOrganismCode: "",
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
	initializeWorkbench: ({ agentRegistry, organisms, screens }) => {
		const composites = getCompositeCatalog(screens);
		const screenRoutes = getScreenRouteCatalog(screens);
		const state = get();
		const selectedAgentNode =
			agentRegistry && findSelectedAgentAsset(agentRegistry, state.selectedAgentNode)
				? state.selectedAgentNode
				: getDefaultAgentSelection(agentRegistry);
		const selectedScreenCode = screens.some((screen) => screen.code === state.selectedScreenCode)
			? state.selectedScreenCode
			: getInitialScreenCode(screens);
		const selectedOrganismCode = organisms.some(
			(organism) => organism.code === state.selectedOrganismCode,
		)
			? state.selectedOrganismCode
			: (organisms[0]?.code ?? "");
		const selectedCompositeCode = composites.some(
			(composite) => composite.code === state.selectedCompositeCode,
		)
			? state.selectedCompositeCode
			: (composites[0]?.code ?? "");

		const nextState = {
			activeNavigatorTab: state.activeNavigatorTab,
			agentRegistry,
			agentWarnings: agentRegistry?.warnings ?? [],
			composites,
			organisms,
			screenRoutes,
			screens,
			selectedAgentNode,
			selectedCompositeCode,
			selectedOrganismCode,
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
	reorderScreenOrganisms: (screenCode, organismCodes) => {
		const state = get();
		const nextScreens = state.screens.map((screen) => {
			if (screen.code !== screenCode) return screen;
			return reorderWorkbenchScreenOrganisms(screen, organismCodes);
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
	selectComposite: (compositeCode) => {
		const state = get();
		const nextState = {
			...state,
			activeNavigatorTab: "comp",
			selectedCompositeCode: compositeCode,
		} satisfies WorkbenchState;

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			selectedCompositeCode: compositeCode,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectOrganism: (organismCode) => {
		const state = get();
		const nextState = {
			...state,
			activeNavigatorTab: "ogn",
			selectedOrganismCode: organismCode,
		} satisfies WorkbenchState;

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			selectedOrganismCode: organismCode,
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
		| "selectedCompositeCode"
		| "selectedOrganismCode"
		| "selectedScreenCode"
	>,
) {
	const selectedScreen = getSelectedScreen(state.screens, state.selectedScreenCode);
	const selectedOrganism = getSelectedOrganismContext(state.screens, state.selectedOrganismCode);
	const selectedComposite = getSelectedCompositeContext(state.screens, state.selectedCompositeCode);
	const isOrganismView = state.activeNavigatorTab === "ogn" && Boolean(selectedOrganism);
	const isCompositeView = state.activeNavigatorTab === "comp" && Boolean(selectedComposite);
	const activeScreen = isCompositeView
		? selectedComposite?.screen
		: isOrganismView
			? selectedOrganism?.screen
			: selectedScreen;
	const validationStatus = getValidationStatus(activeScreen);

	return {
		activeScreen,
		isCompositeView,
		isOrganismView,
		screenNode: getScreenNode(selectedScreen),
		selectedAgentAsset: findSelectedAgentAsset(state.agentRegistry, state.selectedAgentNode),
		selectedComposite: isCompositeView ? selectedComposite : undefined,
		selectedOrganism: isOrganismView ? selectedOrganism : undefined,
		selectedScreen,
		validationErrors: validationStatus.errors,
		validationLabel: validationStatus.label,
		validationStats: validationStatus.stats ?? activeScreen?.validationStats,
		validationSuccess: validationStatus.success,
		validationWarnings: validationStatus.warnings,
	};
}

function reorderWorkbenchScreenOrganisms(screen: AppScreen, organismCodes: string[]): AppScreen {
	const organismByCode = new Map(
		screen.organisms.map((organism) => [organism.organismCode, organism]),
	);
	const nextOrganisms = organismCodes.map((organismCode, index) => {
		const organism = organismByCode.get(organismCode);
		return {
			...organism,
			order: index + 1,
			organismCode,
		};
	});
	const schema = cloneSchema(screen.schema);
	const screenNode = getScreenNode({ ...screen, schema });
	const contentsNode = screenNode?.children.find((node) => node.type === "Screen.Contents");

	if (contentsNode?.children) {
		contentsNode.children = reorderOrganismContainers(contentsNode.children, organismCodes);
	}

	return {
		...screen,
		organisms: nextOrganisms,
		schema,
	};
}

function reorderOrganismContainers(nodes: WireframeNode[], organismCodes: string[]) {
	const organismContainerByCode = new Map(
		nodes
			.map((node) => {
				const organismCode = getContainedOrganismCode(node);
				return organismCode ? ([organismCode, node] as const) : undefined;
			})
			.filter(isOrganismContainerEntry),
	);
	const nextOrganismContainers = organismCodes
		.map((organismCode) => organismContainerByCode.get(organismCode))
		.filter(isWireframeNode);
	let nextOrganismIndex = 0;

	return nodes.map((node) => {
		if (!getContainedOrganismCode(node)) return node;
		const nextNode = nextOrganismContainers[nextOrganismIndex];
		nextOrganismIndex += 1;
		return nextNode ?? node;
	});
}

function getContainedOrganismCode(node: WireframeNode): string | undefined {
	if (node.type === "Organism") return getOrganismCode(node);
	const childOrganism = node.children?.find((child) => child.type === "Organism");
	return childOrganism ? getOrganismCode(childOrganism) : undefined;
}

function cloneSchema<T>(schema: T): T {
	return JSON.parse(JSON.stringify(schema)) as T;
}

function isOrganismContainerEntry(
	entry: readonly [string, WireframeNode] | undefined,
): entry is readonly [string, WireframeNode] {
	return Boolean(entry);
}

function isWireframeNode(node: WireframeNode | undefined): node is WireframeNode {
	return Boolean(node);
}

function getCompositeCatalog(screens: AppScreen[]): AppComposite[] {
	const byCode = new Map<string, AppComposite>();

	for (const screen of screens) {
		forEachCompositeNode(screen.schema.children, undefined, (node, parentOrganismCode) => {
			const code = node.metadata.id;
			if (byCode.has(code)) return;

			byCode.set(code, {
				code,
				name: node.metadata.title,
				parentOrganismCode,
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

		let variant = route.screenVariants.find(
			(candidate) => candidate.id === screen.screenVariantId,
		);
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

function getSelectedOrganismContext(
	screens: AppScreen[],
	selectedOrganismCode: string,
): SelectedOrganismContext | undefined {
	for (const screen of screens) {
		const node = findOrganismNode(screen.schema.children, selectedOrganismCode);
		if (node) {
			return {
				code: selectedOrganismCode,
				node,
				screen,
			};
		}
	}
	return undefined;
}

function getSelectedCompositeContext(
	screens: AppScreen[],
	selectedCompositeCode: string,
): SelectedCompositeContext | undefined {
	for (const screen of screens) {
		const found = findCompositeNode(screen.schema.children, selectedCompositeCode);
		if (found) {
			return {
				code: selectedCompositeCode,
				node: found.node,
				organism: found.parentOrganismCode
					? getSelectedOrganismContext([screen], found.parentOrganismCode)
					: undefined,
				screen,
			};
		}
	}
	return undefined;
}

function findOrganismNode(nodes: WireframeNode[], organismCode: string): WireframeNode | undefined {
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
	nodes: WireframeNode[],
	compositeCode: string,
	parentOrganismCode?: string,
): { node: WireframeNode; parentOrganismCode?: string } | undefined {
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
	nodes: WireframeNode[],
	parentOrganismCode: string | undefined,
	callback: (node: WireframeNode, parentOrganismCode?: string) => void,
) {
	for (const node of nodes) {
		const nextParentOrganismCode = getOrganismCode(node) ?? parentOrganismCode;
		if (isCompositeNode(node)) {
			callback(node, parentOrganismCode);
		}
		if (node.children) {
			forEachCompositeNode(node.children, nextParentOrganismCode, callback);
		}
	}
}

function getOrganismCode(node: WireframeNode) {
	if (node.type !== "Organism") return undefined;
	return String(node.props?.organismCode ?? node.metadata.id);
}

function isCompositeNode(node: WireframeNode) {
	return ![
		"Screen",
		"Screen.Header",
		"Screen.Contents",
		"Screen.Bottom",
		"Organism",
		"PageStack",
	].includes(node.type);
}
