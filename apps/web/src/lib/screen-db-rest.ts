import { readRequiredEnv } from "./server-env";

/**
 * Screen DB(Supabase render_* 테이블)에 대한 REST 접근의 단일 진입점이다.
 * loader/save/inference-apply가 테이블명과 REST 쿼리 빌딩을 각자 복제하지 않도록,
 * 테이블 카탈로그와 fetch 래퍼를 이 모듈 한곳에 모은다.
 */
export const SCREEN_DB_TABLES = {
	areaChildren: "render_area_children",
	areas: "render_areas",
	componentChildren: "render_component_children",
	components: "render_components",
	screenRegionChildren: "render_screen_region_children",
	screenRegions: "render_screen_regions",
	screenRoutes: "render_screen_routes",
	screenVariants: "render_screen_variants",
	screens: "render_screens",
} as const;

export type ScreenDbQuery = Record<string, string | undefined>;

function readSupabaseUrl(): string {
	return readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function readSupabaseServiceRoleKey(): string {
	return readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function buildScreenDbRestUrl(tableName: string, query: ScreenDbQuery): URL {
	const url = new URL(`/rest/v1/${tableName}`, readSupabaseUrl());
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined) url.searchParams.set(key, value);
	}
	return url;
}

function screenDbRestHeaders(extra?: Record<string, string>): HeadersInit {
	const serviceRoleKey = readSupabaseServiceRoleKey();
	return {
		apikey: serviceRoleKey,
		Authorization: `Bearer ${serviceRoleKey}`,
		"Content-Type": "application/json",
		Prefer: "return=minimal",
		...extra,
	};
}

export function inFilter(values: string[]): string {
	return `in.(${values.map(encodePostgrestInValue).join(",")})`;
}

function encodePostgrestInValue(value: string): string {
	return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

export function uniqueIds(values: string[]): string[] {
	return Array.from(new Set(values));
}

export async function readScreenDbRows<Row>(
	tableName: string,
	query: ScreenDbQuery,
): Promise<Row[]> {
	const response = await fetch(buildScreenDbRestUrl(tableName, query), {
		cache: "no-store",
		headers: screenDbRestHeaders(),
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Screen DB request failed for ${tableName}: ${response.status} ${message}`);
	}
	return (await response.json()) as Row[];
}

export async function deleteScreenDbRows(tableName: string, query: ScreenDbQuery): Promise<void> {
	const response = await fetch(buildScreenDbRestUrl(tableName, query), {
		headers: screenDbRestHeaders(),
		method: "DELETE",
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Screen DB delete failed for ${tableName}: ${response.status} ${message}`);
	}
}

/**
 * 행을 삽입한다. `upsert`가 true이면 id 충돌 시 merge한다.
 */
export async function writeScreenDbRows(
	tableName: string,
	rows: unknown[],
	options?: { upsert?: boolean },
): Promise<void> {
	if (rows.length === 0) return;

	const upsert = options?.upsert ?? false;
	const response = await fetch(
		buildScreenDbRestUrl(tableName, upsert ? { on_conflict: "id" } : {}),
		{
			body: JSON.stringify(rows),
			headers: screenDbRestHeaders(
				upsert ? { Prefer: "resolution=merge-duplicates,return=minimal" } : undefined,
			),
			method: "POST",
		},
	);
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Screen DB write failed for ${tableName}: ${response.status} ${message}`);
	}
}
