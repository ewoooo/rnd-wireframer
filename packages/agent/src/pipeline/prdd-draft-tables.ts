import type { DraftTablesBundle, MaterializedNodeTree } from "@cx/types";
import { composePrddScreen } from "../compose/compose-prdd";
import { materializePrddScreenToTables } from "../database/prdd-to-database-tables";
import { decoratePrddScreen } from "../decorate/decorate-prdd";
import type { RegisterPrddScreenResult } from "../register/register-prdd-screen";

export function createPrddDraftTables(register: RegisterPrddScreenResult): DraftTablesBundle {
	const screenId = register.screenId;
	const routeId = `${screenId}-route`;
	const variantId = `${screenId}-base`;
	const composed = composePrddScreen({
		...register.runtime,
		warnings: register.warnings,
	});
	const decorated = decoratePrddScreen(composed);
	const materialized = materializePrddScreenToTables(decorated, { screenVariantId: variantId });

	return {
		screenRoutes: [
			{
				id: routeId,
				moduleId: "draft",
				name: decorated.screen.name ?? screenId,
				order: decorated.screen.order ?? 1,
				processId: null,
			},
		],
		screenVariants: [
			{
				id: variantId,
				screenRouteId: routeId,
				name: decorated.screen.name ?? screenId,
				order: 1,
				variantType: "base",
				followUp: null,
			},
		],
		screens: [materialized.screen],
		areas: materialized.areas,
		components: materialized.components,
		warnings: materialized.warnings,
	};
}

export function draftTablesToMaterializedNodeTree(tables: DraftTablesBundle): MaterializedNodeTree {
	return {
		screenRoutes: tables.screenRoutes,
		screenVariants: tables.screenVariants,
		screens: tables.screens,
		areas: tables.areas,
		components: tables.components,
		warnings: tables.warnings ?? [],
	};
}
