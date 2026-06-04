/**
 * Screen module display metadata.
 *
 * `moduleId` itself is a dynamic value coming from the DB
 * (`render_screen_routes.module_id`); this table only holds the
 * presentation concerns (display name and sort order) that the workbench
 * layers on top. Unknown module ids fall back to the raw id / lowest sort
 * priority so newly introduced modules degrade gracefully.
 */
type ScreenModuleMeta = {
	name: string;
	sortOrder: number;
};

const SCREEN_MODULE_METADATA: Record<string, ScreenModuleMeta> = {
	mbr: { name: "MBR", sortOrder: 1 },
	preview: { name: "Preview", sortOrder: 0 },
};

export function getScreenModuleName(moduleId: string): string {
	return SCREEN_MODULE_METADATA[moduleId]?.name ?? moduleId;
}

export function getScreenModuleSortOrder(moduleId?: string): number {
	return SCREEN_MODULE_METADATA[moduleId ?? ""]?.sortOrder ?? Number.MAX_SAFE_INTEGER;
}
