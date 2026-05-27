export const DEFAULT_WIREFRAME_SCREEN_CODE = "NOVA-MBR-FP-002-0";

export interface AppScreen {
	code: string;
	description?: string;
	module: string;
	name: string;
	areas: Array<{
		order: number;
		areaCode: string;
	}>;
	screenOrder: number;
	screenRouteId: string;
	screenRouteName: string;
	screenVariantId: string;
	screenVariantName: string;
	screenVariantOrder: number;
	screenVariantType: "base" | "edge";
	sourceValidationErrors: string[];
	warnings: string[];
}

export interface AppArea {
	code: string;
	componentCount: number;
	name: string;
	stateCount: number;
	usage: string;
}

export interface AppComponent {
	code: string;
	name: string;
	parentAreaCode?: string;
	sourceScreenCode: string;
	type: string;
}

// 모든 Database* row 타입은 @cx/types의 소비 데이터 계약을 원천으로 사용한다.
export type {
	DatabaseAreaMetadata,
	DatabaseAreaRow,
	DatabaseComponentChildEntry,
	DatabaseComponentMetadata,
	DatabaseComponentRow,
	DatabaseRegionChild,
	DatabaseScreenRegion,
	DatabaseScreenRouteRow,
	DatabaseScreenRow,
	DatabaseScreenRowMetadata,
	DatabaseScreenVariantRow,
} from "@cx/types";

import type { DatabaseScreenRegion, DatabaseScreenRouteRow, DatabaseScreenRow, DatabaseScreenVariantRow } from "@cx/types/database-tables";

import { NODE_TYPES } from "@cx/types/node-types";

import type { AreaVariant, CompositeVariant, PatternStore, PatternStorePattern, PatternStoreTarget, RegionVariant } from "@cx/types/pattern-store";
// JSON 묶음 wrapper — 단순 plural 컨테이너라 inline 타입 alias.
export type DatabaseScreenRouteSet = { screenRoutes: DatabaseScreenRouteRow[] };
export type DatabaseScreenVariantSet = { screenVariants: DatabaseScreenVariantRow[] };

export type {
	AreaVariant,
	CompositeVariant,
	PatternStore,
	PatternStorePattern,
	PatternStoreTarget,
	RegionVariant,
};

export function getInitialScreenCode(screens: AppScreen[]) {
	return (
		screens.find((screen) => screen.code === DEFAULT_WIREFRAME_SCREEN_CODE)?.code ??
		screens[0]?.code ??
		""
	);
}

export function getSelectedScreen(screens: AppScreen[], selectedScreenCode: string) {
	return screens.find((screen) => screen.code === selectedScreenCode) ?? screens[0];
}

export function validateDatabaseScreenSource(screen: DatabaseScreenRow) {
	const errors: string[] = [];
	const label = screen.id ?? screen.metadata.title;

	if (!screen.id) {
		errors.push(`${label}: id is required`);
	}
	if (!screen.metadata.title) {
		errors.push(`${label}: metadata.title is required`);
	}
	if (!screen.screenVariantId) {
		errors.push(`${label}: screenVariantId is required`);
	}
	if (!screen.minRendererVersion) {
		errors.push(`${label}: minRendererVersion is required`);
	}
	if (screen.minComponentsVersion) {
		errors.push(`${label}: minComponentsVersion is deprecated in screen source`);
	}
	if (screen.patternId || screen.patternVariant) {
		errors.push(`${label}: use pattern.id / pattern.variant instead of patternId / patternVariant`);
	}

	validateScreenSourceRegion(screen, "header", NODE_TYPES.screenRegion[0], errors);
	validateScreenSourceRegion(screen, "contents", NODE_TYPES.screenRegion[1], errors);
	validateScreenSourceRegion(screen, "bottom", NODE_TYPES.screenRegion[2], errors);

	return errors;
}

function validateScreenSourceRegion(
	screen: DatabaseScreenRow,
	regionKey: "bottom" | "contents" | "header",
	expectedType: DatabaseScreenRegion["type"],
	errors: string[],
) {
	const region = screen.screen.regions[regionKey];
	if (!region) {
		errors.push(`${screen.id ?? screen.metadata.title}: screen.regions.${regionKey} is required`);
		return;
	}
	if (region.type !== expectedType) {
		errors.push(
			`${screen.id ?? screen.metadata.title}: screen.regions.${regionKey}.type must be ${expectedType}`,
		);
	}
	if (!region.metadata?.title) {
		errors.push(
			`${screen.id ?? screen.metadata.title}: screen.regions.${regionKey}.metadata.title is required`,
		);
	}
	for (const child of region.children ?? []) {
		if (!child.id) {
			errors.push(
				`${screen.id ?? screen.metadata.title}: ${regionKey} ${child.kind} child requires id`,
			);
		}
	}
}
