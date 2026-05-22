import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateAssetsWithLocalClaude } from "@cx/agent/claude-asset-generator";
import { composeAssetContents } from "@cx/agent/compose-assets";
import { composeAssetContentsWithAI } from "@cx/agent/compose-assets-ai";
import { decorateRegisteredAssets } from "@cx/agent/decorate-assets";
import { registerAssets } from "@cx/agent/register-assets";
import {
	decoratedAssetsToDatabaseTables,
	registerAssetsToDatabaseTables,
} from "@cx/agent/register-assets-to-database-tables";
import { createPatternResolver } from "@cx/agent/resolvers/pattern-resolver";
import { NextResponse } from "next/server";
import { getDatabaseDir } from "@/data/database-paths";

const DATABASE_DIR = getDatabaseDir();
const PROJECT_DIR = path.dirname(DATABASE_DIR);
const CLIENT_IMPORTS_DIR = path.join(DATABASE_DIR, "client-imports");
const AI_IMPORTS_DIR = path.join(DATABASE_DIR, "ai-imports");
const GENERATED_REGISTER_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.generated.json");
const GENERATED_DB_TABLES_PATH = path.join(AI_IMPORTS_DIR, "agent-db-tables.generated.json");
const DECORATED_DB_TABLES_PATH = path.join(AI_IMPORTS_DIR, "decorated-tables.generated.json");

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = (await request.json().catch(() => ({}))) as {
			importId?: unknown;
			composeWithAI?: unknown;
		};
		const importId = typeof body.importId === "string" ? body.importId : "";
		const composeWithAI = body.composeWithAI === true;

		if (!importId || importId.includes("..") || importId.includes("/") || importId.includes("\\")) {
			return NextResponse.json({ error: "importId is invalid" }, { status: 400 });
		}

		console.info("[agent-generate] start", { importId, composeWithAI });

		const importDir = path.join(CLIENT_IMPORTS_DIR, importId);
		const [screenFiles, organismFiles] = await Promise.all([
			readMarkdownFiles(path.join(importDir, "screen")),
			readMarkdownFiles(path.join(importDir, "organism")),
		]);

		console.info("[agent-generate] loaded markdown files", {
			importId,
			organismFiles: organismFiles.map((file) => ({
				name: file.name,
				characters: file.content.length,
			})),
			screenFiles: screenFiles.map((file) => ({
				name: file.name,
				characters: file.content.length,
			})),
		});

		if (screenFiles.length === 0 && organismFiles.length === 0) {
			return NextResponse.json(
				{ error: "No markdown files found in the selected client import." },
				{ status: 400 },
			);
		}

		const claudeResult = await generateAssetsWithLocalClaude(
			{
				importId,
				organismFiles,
				screenFiles,
			},
			{
				cwd: PROJECT_DIR,
				continueSession: false,
				debug: true,
			},
		);
		const generated = claudeResult.generated;
		const composeResult = composeAssetContents(generated);
		console.info("[agent-generate] composed asset contents", {
			filledComponentCount: composeResult.filledComponentIds.length,
			skippedCount: composeResult.skipped.length,
			warnings: composeResult.warnings,
		});

		let composed = composeResult.composed;
		let composeAIResult: Awaited<ReturnType<typeof composeAssetContentsWithAI>> | undefined;
		if (composeWithAI) {
			composeAIResult = await composeAssetContentsWithAI(composed, {
				cwd: PROJECT_DIR,
				continueSession: false,
				debug: true,
			});
			console.info("[agent-generate] composed asset contents (AI)", {
				gapCount: composeAIResult.gaps.length,
				mergedComponentCount: composeAIResult.mergedComponentIds.length,
				skippedProposalCount: composeAIResult.skippedProposals.length,
				warnings: composeAIResult.warnings,
				sessionId: composeAIResult.sessionId,
			});
			composed = composeAIResult.composed;
		}

		const registry = registerAssets(composed);
		const dbTables = registerAssetsToDatabaseTables(composed);
		const decorated = decorateRegisteredAssets(registry, {
			resolvePattern: createPatternResolver(),
		});
		const decoratedTables = decoratedAssetsToDatabaseTables(decorated);

		const screenPatternCounts = countScreenPatternIds(decoratedTables);

		console.info("[agent-generate] registered assets", {
			componentCount: registry.components.length,
			organismCount: registry.organisms.length,
			routeCount: registry.routes.length,
			warnings: registry.warnings,
		});
		console.info("[agent-generate] built db tables", {
			componentCount: dbTables.components.length,
			organismCount: dbTables.organisms.length,
			screenCount: dbTables.screens.length,
			screenRouteCount: dbTables.screenRoutes.length,
			screenVariantCount: dbTables.screenVariants.length,
		});
		console.info("[agent-generate] decorated db tables", {
			screenPatternCounts,
		});

		await mkdir(AI_IMPORTS_DIR, { recursive: true });
		await writeFile(GENERATED_REGISTER_PATH, `${JSON.stringify(generated, null, "\t")}\n`, "utf8");
		await writeFile(GENERATED_DB_TABLES_PATH, `${JSON.stringify(dbTables, null, "\t")}\n`, "utf8");
		await writeFile(
			DECORATED_DB_TABLES_PATH,
			`${JSON.stringify(decoratedTables, null, "\t")}\n`,
			"utf8",
		);
		console.info("[agent-generate] wrote generated register", {
			dbTablesPath: GENERATED_DB_TABLES_PATH,
			decoratedTablesPath: DECORATED_DB_TABLES_PATH,
			path: GENERATED_REGISTER_PATH,
		});

		return NextResponse.json({
			dbTables,
			decoratedTables,
			generated,
			registry,
			runtime: {
				provider: "claude",
				sessionId: claudeResult.sessionId,
			},
			warnings: registry.warnings,
			writtenPath: "database/ai-imports/agent-assets.generated.json",
			writtenPaths: {
				dbTables: "database/ai-imports/agent-db-tables.generated.json",
				decoratedTables: "database/ai-imports/decorated-tables.generated.json",
				generated: "database/ai-imports/agent-assets.generated.json",
			},
		});
	} catch (error) {
		console.error("[agent-generate] failed", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate register JSON.",
			},
			{ status: 500 },
		);
	}
}

function countScreenPatternIds(tables: { screens: Array<{ pattern: { id: string } }> }) {
	const counts: Record<string, number> = {};
	for (const screen of tables.screens) {
		const id = screen.pattern.id;
		counts[id] = (counts[id] ?? 0) + 1;
	}
	return counts;
}

async function readMarkdownFiles(directory: string) {
	const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
	const files = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
		.sort((left, right) => left.name.localeCompare(right.name));

	return Promise.all(
		files.map(async (file) => ({
			name: file.name,
			content: await readFile(path.join(directory, file.name), "utf8"),
		})),
	);
}
