import {
	deleteScreenDbRows,
	inFilter,
	SCREEN_DB_TABLES,
	writeScreenDbRows,
} from "./screen-db-rest";
import type { ScreenInferenceProjection } from "./screen-inference-projection";

export async function replaceGeneratedScreenRows(
	projection: ScreenInferenceProjection,
): Promise<void> {
	const screenRegionIds = projection.screenRegions.map((region) => region.id);
	const areaIds = projection.areas.map((area) => area.id);
	const componentIds = projection.components.map((component) => component.id);

	await Promise.all([
		screenRegionIds.length > 0
			? deleteScreenDbRows(SCREEN_DB_TABLES.screenRegionChildren, {
					screen_region_id: inFilter(screenRegionIds),
				})
			: Promise.resolve(),
		areaIds.length > 0
			? deleteScreenDbRows(SCREEN_DB_TABLES.areaChildren, { area_id: inFilter(areaIds) })
			: Promise.resolve(),
		componentIds.length > 0
			? deleteScreenDbRows(SCREEN_DB_TABLES.componentChildren, {
					component_id: inFilter(componentIds),
				})
			: Promise.resolve(),
	]);

	await writeScreenDbRows(SCREEN_DB_TABLES.screenRoutes, projection.screenRoutes, { upsert: true });
	await writeScreenDbRows(SCREEN_DB_TABLES.screenVariants, projection.screenVariants, {
		upsert: true,
	});
	await writeScreenDbRows(SCREEN_DB_TABLES.screens, projection.screens, { upsert: true });
	await writeScreenDbRows(SCREEN_DB_TABLES.screenRegions, projection.screenRegions, {
		upsert: true,
	});
	await writeScreenDbRows(SCREEN_DB_TABLES.areas, projection.areas, { upsert: true });
	await writeScreenDbRows(SCREEN_DB_TABLES.components, projection.components, { upsert: true });
	await writeScreenDbRows(SCREEN_DB_TABLES.screenRegionChildren, projection.screenRegionChildren, {
		upsert: true,
	});
	await writeScreenDbRows(SCREEN_DB_TABLES.areaChildren, projection.areaChildren, { upsert: true });
	await writeScreenDbRows(SCREEN_DB_TABLES.componentChildren, projection.componentChildren, {
		upsert: true,
	});
}
