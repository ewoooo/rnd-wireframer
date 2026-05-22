export type NodeLevel = "route" | "variant" | "screen" | "organism" | "component";

export interface OrderedNode {
	id: string;
	name?: string;
	order?: number;
	description?: string;
}

export interface ComponentRawInput {
	description?: string;
	variant?: string;
	note?: string;
	hooks?: NodeHook[];
}

export interface NodeHook {
	trigger: string;
	action: string;
	target?: string;
	params?: Record<string, unknown>;
}

export interface GeneratedComponentNode extends OrderedNode {
	type?: string;
	props?: Record<string, unknown>;
	raw?: ComponentRawInput;
}

export interface OrganismChildRefInput {
	componentId: string;
	order?: number;
}

export interface GeneratedOrganismNode extends OrderedNode {
	layout?: string;
	children?: OrganismChildRefInput[];
}

export interface ScreenOrganismRefInput {
	organismId: string;
	order?: number;
}

export interface GeneratedScreenNode extends OrderedNode {
	surface?: string;
	organisms?: ScreenOrganismRefInput[];
}

export interface GeneratedVariantNode extends OrderedNode {
	screens: GeneratedScreenNode[];
}

export interface GeneratedRouteNode extends OrderedNode {
	variants: GeneratedVariantNode[];
}

export interface GeneratedNodeTree {
	routes: GeneratedRouteNode[];
	organisms?: GeneratedOrganismNode[];
	components?: GeneratedComponentNode[];
}

export interface ComposedRouteChildRef {
	variantId: string;
	order?: number;
}

export interface ComposedVariantChildRef {
	screenId: string;
	order?: number;
}

export interface ComposedScreenRegionChildren {
	header?: ScreenOrganismRefInput[];
	contents?: ScreenOrganismRefInput[];
	bottom?: ScreenOrganismRefInput[];
}

export interface ComposedRouteNode extends OrderedNode {
	children: ComposedRouteChildRef[];
}

export interface ComposedVariantNode extends OrderedNode {
	routeId?: string;
	children: ComposedVariantChildRef[];
}

export interface ComposedScreenNode extends OrderedNode {
	variantId?: string;
	surface?: string;
	children: ComposedScreenRegionChildren;
}

export interface ComposedOrganismNode extends OrderedNode {
	layout?: string;
	children?: OrganismChildRefInput[];
}

export interface ComposedComponentNode extends OrderedNode {
	type?: string;
	policyID?: string[];
	props?: Record<string, unknown>;
	hooks?: NodeHook[];
}

export interface ComposedNodeTree {
	routes: ComposedRouteNode[];
	variants: ComposedVariantNode[];
	screens: ComposedScreenNode[];
	organisms?: ComposedOrganismNode[];
	components?: ComposedComponentNode[];
}

export interface RegisteredComponentNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "component";
	name: string;
	type: string;
	description?: string;
	policyID?: string[];
	props: Record<string, unknown>;
	raw?: ComponentRawInput;
}

export interface RegisteredOrganismChildRef {
	componentId: string;
	order: number;
	component?: RegisteredComponentNode;
}

export interface RegisteredOrganismNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "organism";
	name: string;
	description?: string;
	layout?: string;
	children: RegisteredOrganismChildRef[];
}

export interface RegisteredScreenOrganismRef {
	organismId: string;
	order: number;
	organism?: RegisteredOrganismNode;
}

export interface RegisteredScreenNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "screen";
	name: string;
	description?: string;
	surface?: string;
	organisms: RegisteredScreenOrganismRef[];
}

export interface RegisteredVariantNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "variant";
	name: string;
	description?: string;
	screens: RegisteredScreenNode[];
}

export interface RegisteredRouteNode extends Required<Pick<OrderedNode, "id" | "order">> {
	level: "route";
	name: string;
	description?: string;
	variants: RegisteredVariantNode[];
}

export interface RegisteredNodeTree {
	routes: RegisteredRouteNode[];
	organisms: RegisteredOrganismNode[];
	components: RegisteredComponentNode[];
	warnings: string[];
}

export interface PatternRef {
	id: string;
	variant: string;
	reasons?: string[];
}

export interface DecoratedRouteNode extends ComposedRouteNode {
	pattern: PatternRef;
}

export interface DecoratedVariantNode extends ComposedVariantNode {
	pattern: PatternRef;
}

export interface DecoratedScreenNode extends ComposedScreenNode {
	pattern: PatternRef;
}

export interface DecoratedOrganismNode extends ComposedOrganismNode {
	pattern: PatternRef;
}

export interface DecoratedComponentNode extends ComposedComponentNode {
	pattern: PatternRef;
}

export interface DecoratedNodeTree {
	routes: DecoratedRouteNode[];
	variants: DecoratedVariantNode[];
	screens: DecoratedScreenNode[];
	organisms: DecoratedOrganismNode[];
	components: DecoratedComponentNode[];
	warnings: string[];
}

export interface PatternResolverInput<TNode> {
	level: NodeLevel;
	node: TNode;
}

export type PatternResolver = <TNode>(input: PatternResolverInput<TNode>) => PatternRef | undefined;

export interface ScreenRouteTableRow {
	code: string;
	name: string;
	order: number;
	description?: string;
}

export interface ScreenVariantTableRow {
	code: string;
	screenRouteCode: string;
	name: string;
	order: number;
	description?: string;
}

export interface ScreenTableRow {
	id: string;
	screenVariantId: string;
	name: string;
	order: number;
	description?: string;
	surface?: string;
	organisms: Array<{
		organismId: string;
		order: number;
	}>;
}

export interface ScreenMockDataInput {
	screenId: string;
	data: Record<string, unknown>;
	scenario?: string;
	generatedBy?: string;
	source?: string;
	sourceRefs?: string[];
}

export interface GeneratedNodeMockInput {
	screenMockData?: ScreenMockDataInput[];
}

export interface ScreenMockDataTableRow {
	screenId: string;
	scenario: string;
	data: Record<string, unknown>;
	generatedBy?: string;
	source?: string;
	sourceRefs?: string[];
}

export interface OrganismTableRow {
	id: string;
	name: string;
	order: number;
	description?: string;
	layout?: string;
	children: Array<{
		componentId: string;
		order: number;
	}>;
}

export interface ComponentTableRow {
	id: string;
	name: string;
	order: number;
	type: string;
	description?: string;
	props: Record<string, unknown>;
}

export interface MaterializedNodeTables {
	screenRoutes: ScreenRouteTableRow[];
	screenVariants: ScreenVariantTableRow[];
	screens: ScreenTableRow[];
	screenMockData: ScreenMockDataTableRow[];
	organisms: OrganismTableRow[];
	components: ComponentTableRow[];
	warnings: string[];
}
