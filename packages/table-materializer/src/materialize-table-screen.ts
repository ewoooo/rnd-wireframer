import type {
	MaterializedRenderTreeNode,
	MaterializedRenderTreeScreenBottomNode,
	MaterializedRenderTreeScreenContentsNode,
	MaterializedRenderTreeScreenHeaderNode,
	MaterializedRenderTreeScreenNode,
	TableAreaRecord,
	TableChildRef,
	TableComponentRecord,
	TableScreenData,
	TableScreenRecord,
	TableScreenRegionRecord,
} from "./types";

export type MaterializeTableScreenInput =
	| {
			screen: TableScreenRecord;
			tables: Pick<TableScreenData, "areas" | "components">;
	  }
	| {
			screenId: string;
			tables: TableScreenData;
	  };

export function materializeTableScreen(
	input: MaterializeTableScreenInput,
): MaterializedRenderTreeScreenNode | undefined {
	const screen = "screen" in input ? input.screen : findTableScreen(input.tables, input.screenId);
	if (!screen) return undefined;

	const areas = indexById(input.tables.areas.areas);
	const components = indexById(input.tables.components.components);
	return materializeScreenRecord(screen, areas, components);
}

export function materializeTableScreens(
	tables: TableScreenData,
): MaterializedRenderTreeScreenNode[] {
	const areas = indexById(tables.areas.areas);
	const components = indexById(tables.components.components);
	return tables.screens.screens.map((screen) => materializeScreenRecord(screen, areas, components));
}

function materializeScreenRecord(
	screen: TableScreenRecord,
	areas: Map<string, TableAreaRecord>,
	components: Map<string, TableComponentRecord>,
): MaterializedRenderTreeScreenNode {
	const regions = screen.screen?.regions ?? {};
	const header = materializeHeaderRegion(screen.id, regions.header, areas, components);
	const contents = materializeContentsRegion(screen.id, regions.contents, areas, components);
	const bottom = materializeBottomRegion(screen.id, regions.bottom, areas, components);

	return {
		type: "Screen",
		componentVersion: screen.version ?? "1.0.0",
		layout: screen.layout,
		metadata: {
			id: screen.id,
			title: screen.metadata?.title ?? screen.id,
			description: screen.metadata?.description,
		},
		children: [header, contents, bottom],
	};
}

function materializeHeaderRegion(
	screenId: string,
	region: TableScreenRegionRecord | undefined,
	areas: Map<string, TableAreaRecord>,
	components: Map<string, TableComponentRecord>,
): MaterializedRenderTreeScreenHeaderNode {
	return {
		type: "Screen.Header",
		componentVersion: "0.1.0",
		layout: region?.layout,
		metadata: {
			id: `${screenId}.header`,
			title: region?.metadata?.title ?? "Screen.Header",
		},
		children: materializeChildren(region?.children ?? [], areas, components),
	};
}

function materializeContentsRegion(
	screenId: string,
	region: TableScreenRegionRecord | undefined,
	areas: Map<string, TableAreaRecord>,
	components: Map<string, TableComponentRecord>,
): MaterializedRenderTreeScreenContentsNode {
	return {
		type: "Screen.Contents",
		componentVersion: "0.1.0",
		layout: region?.layout,
		metadata: {
			id: `${screenId}.contents`,
			title: region?.metadata?.title ?? "Screen.Contents",
		},
		children: materializeChildren(region?.children ?? [], areas, components),
	};
}

function materializeBottomRegion(
	screenId: string,
	region: TableScreenRegionRecord | undefined,
	areas: Map<string, TableAreaRecord>,
	components: Map<string, TableComponentRecord>,
): MaterializedRenderTreeScreenBottomNode {
	return {
		type: "Screen.Bottom",
		componentVersion: "0.1.0",
		layout: region?.layout,
		metadata: {
			id: `${screenId}.bottom`,
			title: region?.metadata?.title ?? "Screen.Bottom",
		},
		children: materializeChildren(region?.children ?? [], areas, components),
	};
}

function materializeChildren(
	children: TableChildRef[],
	areas: Map<string, TableAreaRecord>,
	components: Map<string, TableComponentRecord>,
): MaterializedRenderTreeNode[] {
	return children.flatMap((child) => {
		if (child.kind === "area") {
			const area = areas.get(child.id);
			return area ? [materializeArea(area, areas, components)] : [];
		}

		const component = components.get(child.id);
		return component ? [materializeComponent(component)] : [];
	});
}

function materializeArea(
	area: TableAreaRecord,
	areas: Map<string, TableAreaRecord>,
	components: Map<string, TableComponentRecord>,
): MaterializedRenderTreeNode {
	return {
		type: area.type,
		componentVersion: area.version ?? "1.0.0",
		layout: area.layout,
		metadata: {
			id: area.id,
			title: area.metadata?.title ?? area.id,
			description: area.metadata?.description,
		},
		props: area.props,
		children: materializeChildren(area.children ?? [], areas, components),
	};
}

function materializeComponent(component: TableComponentRecord): MaterializedRenderTreeNode {
	const child = component.children?.[0];
	return {
		type: component.type,
		componentVersion: component.version ?? "1.0.0",
		layout: component.layout,
		metadata: {
			id: component.id,
			title: component.metadata?.title ?? component.id,
			description: component.metadata?.description,
		},
		props: child?.props,
	};
}

function findTableScreen(tables: TableScreenData, screenId: string): TableScreenRecord | undefined {
	return tables.screens.screens.find((screen) => screen.id === screenId);
}

function indexById<RecordType extends { id: string }>(
	records: RecordType[],
): Map<string, RecordType> {
	return new Map(records.map((record) => [record.id, record]));
}
