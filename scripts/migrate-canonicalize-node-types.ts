import { readFile } from "node:fs/promises";
import path from "node:path";
import { canonicalizeNodeType } from "@cx/external/canonicalize";

/**
 * 기존 DB에 남아 있는 alias node.type을 canonical(kiki.X)로 일괄 치환한다.
 *
 * 대상: render_component_children.catalog_component_type 한 컬럼.
 *   - render_screens.type / render_areas.type / render_screen_regions.type 은
 *     enum(page|bottomsheet|popup, area_static|area_dynamic, header|contents|bottom)으로
 *     컴포넌트 카탈로그 타입이 아니다. alias 치환 대상이 아니므로 건드리지 않는다.
 *
 * 기본은 DRY-RUN: 변경될 행을 출력만 하고 쓰지 않는다.
 * --apply 플래그를 줘야 실제 UPDATE를 수행한다.
 *
 * push-render-db.ts 와 동일한 PostgREST 접근 패턴(NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY)을 사용한다. 자격 증명이 없으면 dry-run 로직 직전에
 * 명확한 메시지를 출력하고 종료한다.
 */

const TABLE = "render_component_children";
const TYPE_COLUMN = "catalog_component_type";
const DEFAULT_ENV_FILE = "env.shared";

type ComponentChildRow = {
	id: string;
	catalog_component_type: string;
};

type CliOptions = {
	apply: boolean;
	envFile: string;
};

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	await loadEnvFile(path.resolve(process.cwd(), options.envFile));

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceRoleKey) {
		console.log(
			"[skip] Supabase 자격 증명이 없어 DB에 접근할 수 없습니다. " +
				"NEXT_PUBLIC_SUPABASE_URL 와 SUPABASE_SERVICE_ROLE_KEY 를 env.shared 또는 환경변수로 제공하세요.",
		);
		return;
	}

	const rows = await readRows({ serviceRoleKey, supabaseUrl });
	const changes = rows
		.map((row) => ({ id: row.id, current: row[TYPE_COLUMN], next: canonicalizeNodeType(row[TYPE_COLUMN]) }))
		.filter((change) => change.current !== change.next);

	for (const change of changes) {
		console.log(`${change.id}: ${change.current} → ${change.next}`);
	}
	console.log(
		`\n${TABLE}.${TYPE_COLUMN}: ${changes.length} / ${rows.length} 행이 canonical로 치환됩니다.`,
	);

	if (!options.apply) {
		console.log("[dry-run] --apply 없이 실행되어 아무것도 쓰지 않았습니다.");
		return;
	}

	let committed = 0;
	for (const change of changes) {
		await updateRow({
			id: change.id,
			next: change.next,
			serviceRoleKey,
			supabaseUrl,
		});
		committed += 1;
		// 중간 실패 시 어디까지 커밋됐는지 복구 가능하도록 진행 상황을 남긴다.
		if (committed % 100 === 0 || committed === changes.length) {
			console.log(`[apply] ${committed}/${changes.length}`);
		}
	}
	console.log(`[apply] ${committed} 행을 업데이트했습니다.`);
}

const PAGE_SIZE = 1000;

async function readRows(input: {
	serviceRoleKey: string;
	supabaseUrl: string;
}): Promise<ComponentChildRow[]> {
	// PostgREST/Supabase는 응답을 db-max-rows(기본 1000)로 캡한다. 단일 GET은
	// 큰 테이블에서 일부만 읽어 마이그레이션을 조용히 누락시킨다. Range 헤더로
	// 페이지를 끝까지 순회하며 누적한다.
	const rows: ComponentChildRow[] = [];
	for (let start = 0; ; start += PAGE_SIZE) {
		const end = start + PAGE_SIZE - 1;
		const url = new URL(`/rest/v1/${TABLE}`, input.supabaseUrl);
		url.searchParams.set("select", `id,${TYPE_COLUMN}`);
		const response = await fetch(url, {
			cache: "no-store",
			headers: {
				...restHeaders(input.serviceRoleKey),
				"Range-Unit": "items",
				Range: `${start}-${end}`,
			},
		});
		if (!response.ok) {
			const message = await response.text();
			throw new Error(`Read ${TABLE} failed: ${response.status} ${message}`);
		}
		const page = (await response.json()) as ComponentChildRow[];
		rows.push(...page);

		// Content-Range: "start-end/total" 또는 "start-end/*" (total 미상).
		const total = parseContentRangeTotal(response.headers.get("Content-Range"));
		const reachedEnd = total !== null && start + page.length >= total;
		// 짧은/빈 페이지면 더 읽을 게 없다. total을 알 경우 그것으로도 종료.
		if (page.length < PAGE_SIZE || reachedEnd) break;
	}
	return rows;
}

/** "0-999/12345" → 12345, "0-999/*" 또는 파싱 불가 → null. */
function parseContentRangeTotal(header: string | null): number | null {
	if (!header) return null;
	const slashIndex = header.lastIndexOf("/");
	if (slashIndex < 0) return null;
	const totalPart = header.slice(slashIndex + 1).trim();
	if (totalPart === "*") return null;
	const total = Number.parseInt(totalPart, 10);
	return Number.isFinite(total) ? total : null;
}

async function updateRow(input: {
	id: string;
	next: string;
	serviceRoleKey: string;
	supabaseUrl: string;
}): Promise<void> {
	const url = new URL(`/rest/v1/${TABLE}`, input.supabaseUrl);
	url.searchParams.set("id", `eq.${input.id}`);
	const response = await fetch(url, {
		body: JSON.stringify({ [TYPE_COLUMN]: input.next }),
		headers: restHeaders(input.serviceRoleKey),
		method: "PATCH",
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Update ${TABLE} id=${input.id} failed: ${response.status} ${message}`);
	}
}

function restHeaders(serviceRoleKey: string): HeadersInit {
	return {
		apikey: serviceRoleKey,
		Authorization: `Bearer ${serviceRoleKey}`,
		"Content-Type": "application/json",
		Prefer: "return=minimal",
	};
}

async function loadEnvFile(filePath: string): Promise<void> {
	let content: string;
	try {
		content = await readFile(filePath, "utf8");
	} catch {
		return;
	}
	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const separatorIndex = trimmed.indexOf("=");
		if (separatorIndex < 0) continue;
		const key = trimmed.slice(0, separatorIndex).trim();
		const value = trimmed.slice(separatorIndex + 1).trim();
		process.env[key] ??= value;
	}
}

function parseArgs(args: string[]): CliOptions {
	const options: Partial<CliOptions> = {};
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (!arg || arg === "--") continue;
		if (arg === "--apply") {
			options.apply = true;
			continue;
		}
		if (arg === "--env-file") {
			const value = args[index + 1];
			if (!value || value.startsWith("--")) throw new Error("Missing value for --env-file");
			options.envFile = value;
			index += 1;
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			printUsage();
			process.exit(0);
		}
		throw new Error(`Unknown option: ${arg}`);
	}
	return {
		apply: options.apply ?? false,
		envFile: options.envFile ?? DEFAULT_ENV_FILE,
	};
}

function printUsage(): void {
	console.log(`Usage:
  tsx scripts/migrate-canonicalize-node-types.ts            # dry-run, 변경 사항만 출력
  tsx scripts/migrate-canonicalize-node-types.ts --apply    # 실제 UPDATE 수행

Options:
  --env-file <path>  Supabase URL/service role key가 든 env 파일. Default: env.shared.
  --apply            차이 나는 행을 실제로 업데이트한다(기본은 dry-run).
`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
