import type { DraftTablesBundle } from "@cx/types/draft-tables";
import areasTable from "../../../../database/tables/areas.json";
import componentsTable from "../../../../database/tables/components.json";
import screenRoutesTable from "../../../../database/tables/screen_routes.json";
import screenVariantsTable from "../../../../database/tables/screen_variants.json";
import screensTable from "../../../../database/tables/screens.json";
import { createWorkbenchDataFromTables } from "./workbench-data-builder";

const localTables = {
	...(screenRoutesTable as Pick<DraftTablesBundle, "screenRoutes">),
	...(screenVariantsTable as Pick<DraftTablesBundle, "screenVariants">),
	...(screensTable as Pick<DraftTablesBundle, "screens">),
	...(areasTable as Pick<DraftTablesBundle, "areas">),
	...(componentsTable as Pick<DraftTablesBundle, "components">),
	warnings: [],
} satisfies DraftTablesBundle;

export function loadLocalWorkbenchData() {
	return createWorkbenchDataFromTables(localTables);
}
