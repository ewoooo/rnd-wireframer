import type { LayoutPatternCard, LayoutPatternNodeKind, LayoutPatternStoreDeck } from "@cx/types";

import { readJsonDirSafe } from "./fs-utils";

export interface BuildLayoutPatternStoreDeckOptions {
	/** database/pattern-store 디렉터리 */
	patternStoreRoot: string;
	version: string;
	builtAt?: string;
	/** pattern-index.json 같은 메타 파일은 제외. 기본 ["pattern-index"]. */
	excludeFileBasenames?: string[];
}

interface RawLayoutPattern {
	id: string;
	target: string;
	name?: string;
	description?: string;
	variants?: Array<{ name?: string; id?: string } | string>;
}

interface RawPatternFile {
	patterns?: RawLayoutPattern[];
}

const KNOWN_TARGETS: ReadonlySet<LayoutPatternNodeKind> = new Set([
	"screen",
	"area",
	"group",
	"region",
	"composite",
]);

export async function buildLayoutPatternStoreDeck(
	options: BuildLayoutPatternStoreDeckOptions,
): Promise<LayoutPatternStoreDeck> {
	const exclude = new Set(options.excludeFileBasenames ?? ["pattern-index"]);
	const files = await readJsonDirSafe<RawPatternFile & { __filename?: string }>(options.patternStoreRoot);

	// readJsonDirSafe 가 파일명을 안 넘기므로 디렉터리를 다시 훑어 파일별로 패턴을 모은다
	const dirContents = await loadDirByName(options.patternStoreRoot, exclude);

	const cards: LayoutPatternCard[] = [];
	const seen = new Set<string>();
	for (const { basename, file } of dirContents) {
		if (!file.patterns) continue;
		for (const raw of file.patterns) {
			const card = toCard(raw, basename);
			if (!card) continue;
			if (seen.has(card.id)) continue;
			seen.add(card.id);
			cards.push(card);
		}
	}
	// files 변수는 type-check 차원에서 사용
	void files;

	return {
		builtAt: options.builtAt ?? new Date().toISOString(),
		version: options.version,
		patterns: cards,
	};
}

async function loadDirByName(
	dir: string,
	excludeBasenames: ReadonlySet<string>,
): Promise<Array<{ basename: string; file: RawPatternFile }>> {
	const { readdir, readFile } = await import("node:fs/promises");
	const { join } = await import("node:path");
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch (err) {
		const code = (err as NodeJS.ErrnoException).code;
		if (code === "ENOENT") return [];
		throw err;
	}
	const out: Array<{ basename: string; file: RawPatternFile }> = [];
	for (const name of entries) {
		if (!name.endsWith(".json")) continue;
		const basename = name.replace(/\.json$/, "");
		if (excludeBasenames.has(basename)) continue;
		const raw = await readFile(join(dir, name), "utf8");
		out.push({ basename, file: JSON.parse(raw) as RawPatternFile });
	}
	return out;
}

function toCard(raw: RawLayoutPattern, sourceBasename: string): LayoutPatternCard | undefined {
	if (!raw.id || !raw.target) return undefined;
	const appliesTo = mapTarget(raw.target);
	if (appliesTo.length === 0) return undefined; // 미지의 target은 누락
	const variants = normalizeVariants(raw.variants);
	return {
		id: raw.id,
		name: raw.name ?? raw.id,
		description: raw.description ?? `(source: ${sourceBasename})`,
		variants: variants.length > 0 ? variants : ["default"],
		appliesTo,
	};
}

function mapTarget(target: string): LayoutPatternNodeKind[] {
	return KNOWN_TARGETS.has(target as LayoutPatternNodeKind) ? [target as LayoutPatternNodeKind] : [];
}

function normalizeVariants(variants: RawLayoutPattern["variants"]): string[] {
	if (!variants) return [];
	return variants
		.map((v) => (typeof v === "string" ? v : v.name ?? v.id))
		.filter((name): name is string => typeof name === "string");
}
