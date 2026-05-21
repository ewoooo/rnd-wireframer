import type { WireframeNode, WireframeScreenNode } from "@cx/wireframe";
import { create } from "zustand";
import {
	getInitialScreenCode,
	getScreenNode,
	getSelectedScreen,
	getValidationStatus,
	type WireframeWorkbenchOrganism,
	type WireframeWorkbenchScreen,
} from "@/features/wireframe-renderer/generate-render-tree";

export type NavigatorTab = "comp" | "ogn" | "scn";

export interface WireframeWorkbenchComponent {
	code: string;
	name: string;
	parentOrganismCode?: string;
	sourceScreenCode: string;
	type: string;
}

export interface SelectedOrganismContext {
	code: string;
	node: WireframeNode;
	screen: WireframeWorkbenchScreen;
}

export interface SelectedComponentContext {
	code: string;
	node: WireframeNode;
	organism?: SelectedOrganismContext;
	screen: WireframeWorkbenchScreen;
}

interface InitializeWorkbenchInput {
	organisms: WireframeWorkbenchOrganism[];
	screens: WireframeWorkbenchScreen[];
}

interface WorkbenchState {
	activeNavigatorTab: NavigatorTab;
	activeScreen?: WireframeWorkbenchScreen;
	components: WireframeWorkbenchComponent[];
	initializeWorkbench: (input: InitializeWorkbenchInput) => void;
	isComponentView: boolean;
	isOrganismView: boolean;
	organisms: WireframeWorkbenchOrganism[];
	screenNode?: WireframeScreenNode;
	screens: WireframeWorkbenchScreen[];
	selectComponent: (componentCode: string) => void;
	selectOrganism: (organismCode: string) => void;
	selectScreen: (screenCode: string) => void;
	selectTab: (tab: NavigatorTab) => void;
	selectedComponent?: SelectedComponentContext;
	selectedComponentCode: string;
	selectedOrganism?: SelectedOrganismContext;
	selectedOrganismCode: string;
	selectedScreen?: WireframeWorkbenchScreen;
	selectedScreenCode: string;
	validationErrors: string[];
	validationLabel: string;
	validationSuccess: boolean;
}

const initialWorkbenchState = {
	activeNavigatorTab: "scn" as NavigatorTab,
	activeScreen: undefined,
	components: [],
	isComponentView: false,
	isOrganismView: false,
	organisms: [],
	screenNode: undefined,
	screens: [],
	selectedComponent: undefined,
	selectedComponentCode: "",
	selectedOrganism: undefined,
	selectedOrganismCode: "",
	selectedScreen: undefined,
	selectedScreenCode: "",
	validationErrors: [],
	validationLabel: "screen source + render tree valid",
	validationSuccess: true,
};

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
	...initialWorkbenchState,
	initializeWorkbench: ({ organisms, screens }) => {
		const components = getComponentCatalog(screens);
		const state = get();
		const selectedScreenCode = screens.some((screen) => screen.code === state.selectedScreenCode)
			? state.selectedScreenCode
			: getInitialScreenCode(screens);
		const selectedOrganismCode = organisms.some(
			(organism) => organism.code === state.selectedOrganismCode,
		)
			? state.selectedOrganismCode
			: (organisms[0]?.code ?? "");
		const selectedComponentCode = components.some(
			(component) => component.code === state.selectedComponentCode,
		)
			? state.selectedComponentCode
			: (components[0]?.code ?? "");

		const nextState = {
			activeNavigatorTab: state.activeNavigatorTab,
			components,
			organisms,
			screens,
			selectedComponentCode,
			selectedOrganismCode,
			selectedScreenCode,
		};

		set({
			...nextState,
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
}));

function getDerivedWorkbenchState(
	state: Pick<
		WorkbenchState,
		| "activeNavigatorTab"
		| "screens"
		| "selectedComponentCode"
		| "selectedOrganismCode"
		| "selectedScreenCode"
	>,
) {
	const selectedScreen = getSelectedScreen(state.screens, state.selectedScreenCode);
	const selectedOrganism = getSelectedOrganismContext(state.screens, state.selectedOrganismCode);
	const selectedComponent = getSelectedComponentContext(state.screens, state.selectedComponentCode);
	const isOrganismView = state.activeNavigatorTab === "ogn" && Boolean(selectedOrganism);
	const isComponentView = state.activeNavigatorTab === "comp" && Boolean(selectedComponent);
	const activeScreen = isComponentView
		? selectedComponent?.screen
		: isOrganismView
			? selectedOrganism?.screen
			: selectedScreen;
	const validationStatus = getValidationStatus(activeScreen);

	return {
		activeScreen,
		isComponentView,
		isOrganismView,
		screenNode: getScreenNode(selectedScreen),
		selectedComponent: isComponentView ? selectedComponent : undefined,
		selectedOrganism: isOrganismView ? selectedOrganism : undefined,
		selectedScreen,
		validationErrors: validationStatus.errors,
		validationLabel: validationStatus.label,
		validationSuccess: validationStatus.success,
	};
}

function getComponentCatalog(screens: WireframeWorkbenchScreen[]): WireframeWorkbenchComponent[] {
	const byCode = new Map<string, WireframeWorkbenchComponent>();

	for (const screen of screens) {
		forEachComponentNode(screen.schema.children, undefined, (node, parentOrganismCode) => {
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

function getSelectedOrganismContext(
	screens: WireframeWorkbenchScreen[],
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

function getSelectedComponentContext(
	screens: WireframeWorkbenchScreen[],
	selectedComponentCode: string,
): SelectedComponentContext | undefined {
	for (const screen of screens) {
		const found = findComponentNode(screen.schema.children, selectedComponentCode);
		if (found) {
			return {
				code: selectedComponentCode,
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
			(node.type === "OrganismSection" || node.type === "Organism.Section") &&
			String(node.props?.organismCode ?? node.metadata.id) === organismCode
		) {
			return node;
		}
		const childMatch = node.children ? findOrganismNode(node.children, organismCode) : undefined;
		if (childMatch) return childMatch;
	}
	return undefined;
}

function findComponentNode(
	nodes: WireframeNode[],
	componentCode: string,
	parentOrganismCode?: string,
): { node: WireframeNode; parentOrganismCode?: string } | undefined {
	for (const node of nodes) {
		const nextParentOrganismCode = getOrganismCode(node) ?? parentOrganismCode;
		if (isComponentNode(node) && node.metadata.id === componentCode) {
			return {
				node,
				parentOrganismCode,
			};
		}
		const childMatch = node.children
			? findComponentNode(node.children, componentCode, nextParentOrganismCode)
			: undefined;
		if (childMatch) return childMatch;
	}
	return undefined;
}

function forEachComponentNode(
	nodes: WireframeNode[],
	parentOrganismCode: string | undefined,
	callback: (node: WireframeNode, parentOrganismCode?: string) => void,
) {
	for (const node of nodes) {
		const nextParentOrganismCode = getOrganismCode(node) ?? parentOrganismCode;
		if (isComponentNode(node)) {
			callback(node, parentOrganismCode);
		}
		if (node.children) {
			forEachComponentNode(node.children, nextParentOrganismCode, callback);
		}
	}
}

function getOrganismCode(node: WireframeNode) {
	if (node.type !== "OrganismSection" && node.type !== "Organism.Section") return undefined;
	return String(node.props?.organismCode ?? node.metadata.id);
}

function isComponentNode(node: WireframeNode) {
	return ![
		"Screen",
		"Screen.Header",
		"Screen.Contents",
		"Screen.Bottom",
		"OrganismSection",
		"Organism.Section",
		"PageStack",
	].includes(node.type);
}
