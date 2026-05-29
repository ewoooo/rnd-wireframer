import type {
	SourceSpec,
	TableGenerationArea,
	TableGenerationComponent,
	TableGenerationResultContract,
	TableGenerationScreen,
} from "@cx/schema";

export type ScreenRouteRecord = {
	id: string;
	moduleId: string;
	name: string;
	order: number;
	processId: string | null;
};

export type ScreenVariantRecord = {
	followUp: unknown | null;
	id: string;
	name: string;
	order: number;
	screenRouteId: string;
	variantType: string;
};

export type GenerationTableData = {
	areas: {
		areas: TableGenerationArea[];
	};
	components: {
		components: TableGenerationComponent[];
	};
	screenRoutes?: {
		screenRoutes: ScreenRouteRecord[];
	};
	screenVariants?: {
		screenVariants: ScreenVariantRecord[];
	};
	screens: {
		screens: TableGenerationScreen[];
	};
};

export type MergeGeneratedTablesOptions = {
	moduleId?: string;
	sourceSpec?: SourceSpec;
};

export type MergeGeneratedTablesResult = {
	changed: {
		areas: number;
		components: number;
		screenRoutes: number;
		screenVariants: number;
		screens: number;
	};
	tables: GenerationTableData;
};

export function mergeTableGenerationResultIntoTables(
	tables: GenerationTableData,
	tableGenerationResult: TableGenerationResultContract,
	options: MergeGeneratedTablesOptions = {},
): MergeGeneratedTablesResult {
	const previousScreen = tables.screens.screens.find(
		(screen) => screen.id === tableGenerationResult.screen.id,
	);
	const previousAreaIds = previousScreen ? collectScreenAreaIds(previousScreen) : new Set<string>();
	const previousComponentIds = collectAreaComponentIds(tables.areas.areas, previousAreaIds);
	const nextAreaIds = new Set(tableGenerationResult.areas.map((area) => area.id));
	const nextComponentIds = new Set(
		tableGenerationResult.components.map((component) => component.id),
	);

	const nextTables: GenerationTableData = {
		areas: {
			areas: upsertRecords(
				tables.areas.areas.filter(
					(area) => !previousAreaIds.has(area.id) && !nextAreaIds.has(area.id),
				),
				tableGenerationResult.areas,
			),
		},
		components: {
			components: upsertRecords(
				tables.components.components.filter(
					(component) =>
						!previousComponentIds.has(component.id) && !nextComponentIds.has(component.id),
				),
				tableGenerationResult.components,
			),
		},
		screens: {
			screens: upsertRecords(
				tables.screens.screens.filter((screen) => screen.id !== tableGenerationResult.screen.id),
				[tableGenerationResult.screen],
			),
		},
	};

	if (tables.screenRoutes) {
		const route = createScreenRouteRecord(tableGenerationResult.screen, options);
		nextTables.screenRoutes = {
			screenRoutes: upsertRecords(tables.screenRoutes.screenRoutes, [route]),
		};
	}

	if (tables.screenVariants) {
		const variant = createScreenVariantRecord(tableGenerationResult.screen, options);
		nextTables.screenVariants = {
			screenVariants: upsertRecords(tables.screenVariants.screenVariants, [variant]),
		};
	}

	return {
		changed: {
			areas: tableGenerationResult.areas.length,
			components: tableGenerationResult.components.length,
			screenRoutes: tables.screenRoutes ? 1 : 0,
			screenVariants: tables.screenVariants ? 1 : 0,
			screens: 1,
		},
		tables: nextTables,
	};
}

export function extractTableGenerationResultFromAgentPayload(
	input: unknown,
): TableGenerationResultContract | undefined {
	if (!isRecord(input)) return undefined;
	const payload = isRecord(input.payload) ? input.payload : input;
	const tableGenerationResult = payload.tableGenerationResult;
	if (!isRecord(tableGenerationResult)) return undefined;
	return tableGenerationResult as TableGenerationResultContract;
}

function collectScreenAreaIds(screen: TableGenerationScreen): Set<string> {
	return new Set(
		Object.values(screen.screen.regions).flatMap((region) =>
			region.children.filter((child) => child.kind === "area").map((child) => child.id),
		),
	);
}

function collectAreaComponentIds(areas: TableGenerationArea[], areaIds: Set<string>): Set<string> {
	return new Set(
		areas
			.filter((area) => areaIds.has(area.id))
			.flatMap((area) =>
				area.children.filter((child) => child.kind === "component").map((child) => child.id),
			),
	);
}

function createScreenRouteRecord(
	screen: TableGenerationScreen,
	options: MergeGeneratedTablesOptions,
): ScreenRouteRecord {
	const screenCode = options.sourceSpec?.sourceShape.screen.screenCode ?? screen.id;

	return {
		id: `${screenCode}-route`,
		moduleId: options.moduleId ?? "preview",
		name: screen.metadata.title || screenCode,
		order: 1,
		processId: null,
	};
}

function createScreenVariantRecord(
	screen: TableGenerationScreen,
	options: MergeGeneratedTablesOptions,
): ScreenVariantRecord {
	const screenCode = options.sourceSpec?.sourceShape.screen.screenCode ?? screen.id;

	return {
		followUp: null,
		id: screen.screenVariantId,
		name: screen.metadata.title || screen.screenVariantId,
		order: 1,
		screenRouteId: `${screenCode}-route`,
		variantType: "base",
	};
}

function upsertRecords<RecordType extends { id: string }>(
	records: RecordType[],
	upserts: RecordType[],
): RecordType[] {
	const upsertIds = new Set(upserts.map((record) => record.id));
	return [...records.filter((record) => !upsertIds.has(record.id)), ...upserts];
}

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === "object" && input !== null && !Array.isArray(input);
}
