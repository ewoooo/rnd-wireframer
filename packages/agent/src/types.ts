export type AssetLevel = "route" | "variant" | "screen" | "organism" | "component";

export interface OrderedAsset {
	id: string;
	name?: string;
	order?: number;
	description?: string;
}

export interface ComponentRawInput {
	description?: string;
	variant?: string;
	note?: string;
	events?: string;
}

export interface ComponentAssetInput extends OrderedAsset {
	type?: string;
	props?: Record<string, unknown>;
	raw?: ComponentRawInput;
}

export interface OrganismComponentRefInput {
	componentId: string;
	order?: number;
}

export interface OrganismAssetInput extends OrderedAsset {
	layout?: string;
	components?: OrganismComponentRefInput[];
}

export interface ScreenOrganismRefInput {
	organismId: string;
	order?: number;
}

export interface ScreenRawTransitionInput {
	from?: string;
	to?: string;
	condition?: string;
	payload?: string;
}

export interface ScreenRawCaseInput {
	id?: string;
	name?: string;
	description?: string;
	followUp?: string;
}

export interface ScreenRawInput {
	description?: string;
	transitions?: ScreenRawTransitionInput[];
	cases?: ScreenRawCaseInput[];
}

export interface ScreenAssetInput extends OrderedAsset {
	surface?: string;
	organisms?: ScreenOrganismRefInput[];
	raw?: ScreenRawInput;
}

export interface ScreenVariantAssetInput extends OrderedAsset {
	screens: ScreenAssetInput[];
}

export interface ScreenRouteAssetInput extends OrderedAsset {
	variants: ScreenVariantAssetInput[];
}

export interface RegisterAssetsInput {
	routes: ScreenRouteAssetInput[];
	organisms?: OrganismAssetInput[];
	components?: ComponentAssetInput[];
}

export interface RegisteredComponentAsset extends Required<Pick<OrderedAsset, "id" | "order">> {
	level: "component";
	name: string;
	type: string;
	description?: string;
	props: Record<string, unknown>;
	raw?: ComponentRawInput;
}

export interface RegisteredOrganismComponentRef {
	componentId: string;
	order: number;
	component?: RegisteredComponentAsset;
}

export interface RegisteredOrganismAsset extends Required<Pick<OrderedAsset, "id" | "order">> {
	level: "organism";
	name: string;
	description?: string;
	layout?: string;
	components: RegisteredOrganismComponentRef[];
}

export interface RegisteredScreenOrganismRef {
	organismId: string;
	order: number;
	organism?: RegisteredOrganismAsset;
}

export interface RegisteredScreenAsset extends Required<Pick<OrderedAsset, "id" | "order">> {
	level: "screen";
	name: string;
	description?: string;
	surface?: string;
	organisms: RegisteredScreenOrganismRef[];
	raw?: ScreenRawInput;
}

export interface RegisteredScreenVariantAsset extends Required<Pick<OrderedAsset, "id" | "order">> {
	level: "variant";
	name: string;
	description?: string;
	screens: RegisteredScreenAsset[];
}

export interface RegisteredScreenRouteAsset extends Required<Pick<OrderedAsset, "id" | "order">> {
	level: "route";
	name: string;
	description?: string;
	variants: RegisteredScreenVariantAsset[];
}

export interface AssetRegistry {
	routes: RegisteredScreenRouteAsset[];
	organisms: RegisteredOrganismAsset[];
	components: RegisteredComponentAsset[];
	warnings: string[];
}

export interface AssetDecoration {
	patternId: string;
	reasons: string[];
}

export interface DecoratedAsset<TAsset> {
	asset: TAsset;
	decoration: AssetDecoration;
}

export interface DecoratedOrganismComponentRef
	extends Omit<RegisteredOrganismComponentRef, "component"> {
	component?: DecoratedAsset<RegisteredComponentAsset>;
}

export interface DecoratedOrganismAsset extends Omit<RegisteredOrganismAsset, "components"> {
	components: DecoratedOrganismComponentRef[];
}

export interface DecoratedScreenOrganismRef extends Omit<RegisteredScreenOrganismRef, "organism"> {
	organism?: DecoratedAsset<DecoratedOrganismAsset>;
}

export interface DecoratedScreenAsset extends Omit<RegisteredScreenAsset, "organisms"> {
	organisms: DecoratedScreenOrganismRef[];
}

export interface DecoratedScreenVariantAsset extends Omit<RegisteredScreenVariantAsset, "screens"> {
	screens: Array<DecoratedAsset<DecoratedScreenAsset>>;
}

export interface DecoratedScreenRouteAsset extends Omit<RegisteredScreenRouteAsset, "variants"> {
	variants: Array<DecoratedAsset<DecoratedScreenVariantAsset>>;
}

export interface DecoratedAssetRegistry {
	routes: Array<DecoratedAsset<DecoratedScreenRouteAsset>>;
	organisms: Array<DecoratedAsset<DecoratedOrganismAsset>>;
	components: Array<DecoratedAsset<RegisteredComponentAsset>>;
	warnings: string[];
}

export interface PatternResolverInput<TAsset> {
	level: AssetLevel;
	asset: TAsset;
}

export type PatternResolver = <TAsset>(
	input: PatternResolverInput<TAsset>,
) => AssetDecoration | undefined;

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

export interface RegisterAssetMockInput {
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
	components: Array<{
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

export interface RegisteredAssetTables {
	screenRoutes: ScreenRouteTableRow[];
	screenVariants: ScreenVariantTableRow[];
	screens: ScreenTableRow[];
	screenMockData: ScreenMockDataTableRow[];
	organisms: OrganismTableRow[];
	components: ComponentTableRow[];
	warnings: string[];
}
