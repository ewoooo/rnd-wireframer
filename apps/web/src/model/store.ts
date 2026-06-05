import type { RegisteredNodeTree } from "@cx/agent";
import type { RenderTreeNode, RenderTreeScreenNode, ValidationStats } from "@cx/renderer";
import { isAreaType } from "@cx/types/node-types";
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

export type NavigatorTab = "agent" | "comp" | "ogn" | "run" | "scn";

export interface AppScreenModule {
	id: string;
	name: string;
	order: number;
}

export interface AppComponent {
	code: string;
	name: string;
	parentAreaCode?: string;
	sourceScreenCode: string;
	type: string;
}

export interface AppScreenRoute {
	code: string;
	moduleId: string;
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
	// 화면에 임베드된 area(컴포넌트 부모 탐색용)일 때만 존재.
	// area 페이지에서 카탈로그 노드를 직접 편집할 때는 screen 컨텍스트가 없다.
	screen?: AppScreen;
}

export interface SelectedComponentContext {
	code: string;
	node: RenderTreeNode;
	area?: SelectedAreaContext;
	screen: AppScreen;
}

export interface RawScreenRoute {
	id: string;
	moduleId: string;
	name: string;
	order: number;
}

interface InitializeWorkbenchInput {
	agentRegistry?: RegisteredNodeTree;
	areas: AppArea[];
	modules: AppScreenModule[];
	routes: RawScreenRoute[];
	screens: AppScreen[];
}

interface WorkbenchState {
	activeNavigatorTab: NavigatorTab;
	activeRouteId: string;
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
	screenModules: AppScreenModule[];
	screenNode?: RenderTreeScreenNode;
	screenRoutes: AppScreenRoute[];
	screens: AppScreen[];
	reorderScreenAreas: (screenCode: string, areaCodes: string[]) => void;
	reorderAreaChildren: (areaCode: string, childCodes: string[]) => void;
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
	darkMode: boolean;
	toggleDarkMode: () => void;
	showStatusBar: boolean;
	toggleStatusBar: () => void;
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
	activeRouteId: "",
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
	screenModules: [],
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
	darkMode: false,
	showStatusBar: true,
	validationErrors: [],
	validationLabel: "screen source + render tree valid",
	validationStats: undefined,
	validationSuccess: true,
	validationWarnings: [],
};

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
	...initialWorkbenchState,
	toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
	toggleStatusBar: () => set((state) => ({ showStatusBar: !state.showStatusBar })),
	initializeWorkbench: ({ agentRegistry, areas, modules = [], routes = [], screens }) => {
		const components = getComponentCatalog(screens);
		const screenRoutes = getScreenRouteCatalog(screens, routes);
		const state = get();
		const selectedAgentNode =
			agentRegistry && findSelectedAgentAsset(agentRegistry, state.selectedAgentNode)
				? state.selectedAgentNode
				: getDefaultAgentSelection(agentRegistry);
		const selectedScreenCode = screens.some((screen) => screen.code === state.selectedScreenCode)
			? state.selectedScreenCode
			: "";
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

		const activeRouteId = screenRoutes.some((route) => route.code === state.activeRouteId)
			? state.activeRouteId
			: "";

		const nextState = {
			activeNavigatorTab: state.activeNavigatorTab,
			activeRouteId,
			agentRegistry,
			agentWarnings: agentRegistry?.warnings ?? [],
			components,
			areas,
			screenModules: modules,
			screenRoutes,
			screens,
			selectedAgentNode,
			selectedComponentCode,
			selectedAreaCode,
			selectedScreenCode,
		};

		set({
			...nextState,
			activeRouteId,
			screenModules: modules,
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
	reorderAreaChildren: (areaCode, childCodes) => {
		const state = get();
		// 드로어에서 새로 끌어온 component(현재 area에 아직 없는 코드)도 materialize
		// 할 수 있도록 전체 component 카탈로그를 함께 넘긴다.
		const catalog = buildAreaComponentCatalog(state.areas);
		const nextAreas = state.areas.map((area) => {
			if (area.code !== areaCode) return area;
			const nextNode = reorderWorkbenchAreaChildren(area.node, childCodes, catalog);
			return {
				...area,
				node: nextNode,
				componentCount: nextNode.children?.length ?? 0,
			};
		});
		const nextState = {
			...state,
			areas: nextAreas,
		} satisfies WorkbenchState;

		set({
			areas: nextAreas,
			...getDerivedWorkbenchState(nextState),
		});
	},
	selectScreenRoute: (screenRouteId) => {
		const state = get();
		const route = state.screenRoutes.find((candidate) => candidate.code === screenRouteId);
		const screenCode = route?.screenVariants[0]?.options[0]?.screenCode ?? "";
		const nextState = {
			...state,
			activeNavigatorTab: "scn",
			activeRouteId: screenRouteId,
			selectedScreenCode: screenCode,
		} satisfies WorkbenchState;

		set({
			activeNavigatorTab: nextState.activeNavigatorTab,
			activeRouteId: screenRouteId,
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
		| "areas"
		| "screens"
		| "selectedAgentNode"
		| "selectedComponentCode"
		| "selectedAreaCode"
		| "selectedScreenCode"
	>,
) {
	const selectedScreen = getSelectedScreen(state.screens, state.selectedScreenCode);
	// area 페이지는 카탈로그 노드(organisms 기반)를 직접 편집한다.
	// 화면에 임베드된 인스턴스가 아니라 area 자체가 편집 대상이므로,
	// 어느 screen에도 안 쓰인 area도 편집할 수 있다.
	const areaCatalogEntry = state.areas.find((area) => area.code === state.selectedAreaCode);
	const selectedArea: SelectedAreaContext | undefined = areaCatalogEntry
		? { code: areaCatalogEntry.code, node: areaCatalogEntry.node }
		: undefined;
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
		contentsNode.children = rebuildAreaContainers(contentsNode.children, areaCodes);
	}

	return {
		...screen,
		areas: nextAreas,
		schema,
	};
}

// area 카탈로그 노드의 자식(component) 들을 Puck content 순서(childCodes)에 맞춰 재구성한다.
// reorderWorkbenchScreenAreas 의 area 레벨 버전: 재정렬·복제·삭제를 모두 반영한다.
function reorderWorkbenchAreaChildren(
	areaNode: RenderTreeNode,
	childCodes: string[],
	catalog: Map<string, RenderTreeNode>,
): RenderTreeNode {
	const node = cloneSchema(areaNode);
	const templateById = new Map<string, RenderTreeNode>();
	for (const child of node.children ?? []) {
		if (!templateById.has(child.metadata.id)) {
			templateById.set(child.metadata.id, child);
		}
	}
	// 현재 자식에서 먼저 찾고, 없으면(드로어에서 새로 끌어온 경우) 카탈로그에서 가져온다.
	node.children = childCodes
		.map((code) => templateById.get(code) ?? catalog.get(code))
		.filter(isRenderTreeNode)
		.map((child) => cloneSchema(child));
	return node;
}

// 모든 area의 자식 component 들을 모아 유니크한 component 카탈로그(id→노드)를 만든다.
// area 캔버스의 Puck config(드래그 가능한 전체 팔레트/드로어 소스)와
// 드로어 insert 시 노드 materialize 에 함께 쓰인다.
export function buildAreaComponentCatalog(areas: AppArea[]): Map<string, RenderTreeNode> {
	const byId = new Map<string, RenderTreeNode>();
	for (const area of areas) {
		for (const child of area.node.children ?? []) {
			if (!byId.has(child.metadata.id)) byId.set(child.metadata.id, child);
		}
	}
	return byId;
}

// contents region의 area 컨테이너를 Puck content 순서(areaCodes)에 맞춰 재구성한다.
// 재정렬·복제·삭제를 모두 반영: areaCodes에 나온 만큼(중복 포함) 컨테이너를 만들고,
// 빠진 area는 제거한다. contents에 없는 코드(header/bottom 영역의 area)는 무시한다.
// divider 같은 비-area 노드는 저장 시 어차피 제거되고 로드 시 패턴이 재생성하므로 버린다.
function rebuildAreaContainers(nodes: RenderTreeNode[], areaCodes: string[]) {
	const templateByCode = new Map<string, RenderTreeNode>();
	for (const node of nodes) {
		const areaCode = getContainedAreaCode(node);
		if (areaCode && !templateByCode.has(areaCode)) {
			templateByCode.set(areaCode, node);
		}
	}

	return areaCodes
		.map((areaCode) => templateByCode.get(areaCode))
		.filter(isRenderTreeNode)
		.map((node) => cloneSchema(node));
}

function getContainedAreaCode(node: RenderTreeNode): string | undefined {
	if (isAreaType(node.type)) return getAreaCode(node);
	const childArea = node.children?.find((child) => isAreaType(child.type));
	return childArea ? getAreaCode(childArea) : undefined;
}

function cloneSchema<T>(schema: T): T {
	return JSON.parse(JSON.stringify(schema)) as T;
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

function getScreenRouteCatalog(screens: AppScreen[], rawRoutes: RawScreenRoute[] = []): AppScreenRoute[] {
	const byCode = new Map<string, AppScreenRoute>();

	// screens에 없는 route도 빈 상태로 먼저 등록
	for (const raw of rawRoutes) {
		if (!byCode.has(raw.id)) {
			byCode.set(raw.id, {
				code: raw.id,
				moduleId: raw.moduleId,
				module: raw.moduleId,
				name: raw.name,
				screenCount: 0,
				screenVariants: [],
			});
		}
	}

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
				moduleId: screen.moduleId,
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
		const node = findAreaNode(screen.schema.children, selectedAreaCode);
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
				area: found.parentAreaCode
					? getSelectedAreaContext([screen], found.parentAreaCode)
					: undefined,
				screen,
			};
		}
	}
	return undefined;
}

function findAreaNode(nodes: RenderTreeNode[], areaCode: string): RenderTreeNode | undefined {
	for (const node of nodes) {
		if (
			isAreaType(node.type) &&
			String(node.props?.areaCode ?? node.metadata.id) === areaCode
		) {
			return node;
		}
		const childMatch = node.children ? findAreaNode(node.children, areaCode) : undefined;
		if (childMatch) return childMatch;
	}
	return undefined;
}

function findCompositeNode(
	nodes: RenderTreeNode[],
	compositeCode: string,
	parentAreaCode?: string,
): { node: RenderTreeNode; parentAreaCode?: string } | undefined {
	for (const node of nodes) {
		const nextParentAreaCode = getAreaCode(node) ?? parentAreaCode;
		if (isCompositeNode(node) && node.metadata.id === compositeCode) {
			return {
				node,
				parentAreaCode,
			};
		}
		const childMatch = node.children
			? findCompositeNode(node.children, compositeCode, nextParentAreaCode)
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
		const nextParentAreaCode = getAreaCode(node) ?? parentAreaCode;
		if (isCompositeNode(node)) {
			callback(node, parentAreaCode);
		}
		if (node.children) {
			forEachCompositeNode(node.children, nextParentAreaCode, callback);
		}
	}
}

function getAreaCode(node: RenderTreeNode) {
	if (!isAreaType(node.type)) return undefined;
	return String(node.props?.areaCode ?? node.metadata.id);
}

function isCompositeNode(node: RenderTreeNode) {
	if (isAreaType(node.type)) return false;
	return !["Screen", "Screen.Header", "Screen.Contents", "Screen.Bottom", "PageStack"].includes(
		node.type,
	);
}
