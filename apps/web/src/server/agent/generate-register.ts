import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateAssetsWithLocalClaude } from "@cx/agent/claude-asset-generator";
import { composeAssetContents } from "@cx/agent/compose-assets";
import { composeAssetContentsWithAI } from "@cx/agent/compose-assets-ai";
import { decorateRegisteredAssets } from "@cx/agent/decorate-assets";
import { registerAssets } from "@cx/agent/register-assets";
import { materializeDecoratedAssetsToDatabaseTables } from "@cx/agent/register-assets-to-database-tables";
import { createPatternResolver } from "@cx/agent/resolvers/pattern-resolver";
import { assertValidImportId, readClientImportMarkdownFiles } from "@/server/agent/client-imports";
import { getDatabaseDir } from "@/server/database-paths";

const DATABASE_DIR = getDatabaseDir();
const PROJECT_DIR = path.dirname(DATABASE_DIR);
const AI_IMPORTS_DIR = path.join(DATABASE_DIR, "ai-imports");
const AGENT_ASSETS_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.json");
const AGENT_ASSETS_COMPOSED_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.composed.json");
const AGENT_ASSETS_REGISTERED_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.registered.json");
const AGENT_ASSETS_DECORATED_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.decorated.json");
const DB_TABLES_DIR = path.join(DATABASE_DIR, "tables");
const DB_TABLE_PATHS = {
	screenRoutes: path.join(DB_TABLES_DIR, "screen_routes.json"),
	screenVariants: path.join(DB_TABLES_DIR, "screen_variants.json"),
	screens: path.join(DB_TABLES_DIR, "screens.json"),
	organisms: path.join(DB_TABLES_DIR, "organisms.json"),
	components: path.join(DB_TABLES_DIR, "components.json"),
} as const;

export interface GenerateAgentRegisterOptions {
	composeWithAI?: boolean;
	importId: string;
}

export async function generateAgentRegister({
	composeWithAI = true,
	importId,
}: GenerateAgentRegisterOptions) {
	assertValidImportId(importId);

	console.info("[agent-generate] start", { importId, composeWithAI });

	const { organismFiles, screenFiles } = await readClientImportMarkdownFiles(importId);

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
		throw new AgentGenerateError("No markdown files found in the selected client import.", 400);
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
	const registry = registerAssets(generated);
	console.info("[agent-generate] registered assets", {
		componentCount: registry.components.length,
		organismCount: registry.organisms.length,
		routeCount: registry.routes.length,
		warnings: registry.warnings,
	});

	const composeResult = composeAssetContents(registry);
	console.info("[agent-generate] composed asset contents", {
		filledComponentCount: composeResult.filledComponentIds.length,
		strippedComponentRawCount: composeResult.strippedComponentRawIds.length,
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

	const decorated = decorateRegisteredAssets(composed, {
		resolvePattern: createPatternResolver(),
	});
	const decoratedTables = materializeDecoratedAssetsToDatabaseTables(decorated);
	const screenShellCounts = countScreenShellIds(decoratedTables);

	console.info("[agent-generate] decorated db tables", {
		componentCount: decoratedTables.components.length,
		organismCount: decoratedTables.organisms.length,
		screenCount: decoratedTables.screens.length,
		screenRouteCount: decoratedTables.screenRoutes.length,
		screenVariantCount: decoratedTables.screenVariants.length,
		screenShellCounts,
	});

	await writeAgentImportArtifacts({ composed, decorated, decoratedTables, generated, registry });

	return {
		decoratedTables,
		generated,
		registry,
		runtime: {
			provider: "claude",
			sessionId: claudeResult.sessionId,
		},
		warnings: registry.warnings,
		writtenPath: "database/ai-imports/agent-assets.json",
		writtenPaths: {
			assets: "database/ai-imports/agent-assets.json",
			composed: "database/ai-imports/agent-assets.composed.json",
			registered: "database/ai-imports/agent-assets.registered.json",
			decorated: "database/ai-imports/agent-assets.decorated.json",
			dbTables: "database/tables/{screen_routes,screen_variants,screens,organisms,components}.json",
		},
	};
}

export class AgentGenerateError extends Error {
	constructor(
		message: string,
		readonly status = 500,
	) {
		super(message);
	}
}

async function writeAgentImportArtifacts(payload: {
	composed: unknown;
	decorated: unknown;
	decoratedTables: {
		screenRoutes: unknown[];
		screenVariants: unknown[];
		screens: unknown[];
		organisms: unknown[];
		components: unknown[];
	};
	generated: unknown;
	registry: unknown;
}) {
	await mkdir(AI_IMPORTS_DIR, { recursive: true });
	await mkdir(DB_TABLES_DIR, { recursive: true });
	await writeFile(AGENT_ASSETS_PATH, `${JSON.stringify(payload.generated, null, "\t")}\n`, "utf8");
	await writeFile(
		AGENT_ASSETS_COMPOSED_PATH,
		`${JSON.stringify(payload.composed, null, "\t")}\n`,
		"utf8",
	);
	await writeFile(
		AGENT_ASSETS_REGISTERED_PATH,
		`${JSON.stringify(payload.registry, null, "\t")}\n`,
		"utf8",
	);
	await writeFile(
		AGENT_ASSETS_DECORATED_PATH,
		`${JSON.stringify(payload.decorated, null, "\t")}\n`,
		"utf8",
	);
	await writeDbTable(DB_TABLE_PATHS.screenRoutes, { screenRoutes: payload.decoratedTables.screenRoutes });
	await writeDbTable(DB_TABLE_PATHS.screenVariants, {
		screenVariants: payload.decoratedTables.screenVariants,
	});
	await writeDbTable(DB_TABLE_PATHS.screens, { screens: payload.decoratedTables.screens });
	await writeDbTable(DB_TABLE_PATHS.organisms, { organisms: payload.decoratedTables.organisms });
	await writeDbTable(DB_TABLE_PATHS.components, { components: payload.decoratedTables.components });
	console.info("[agent-generate] wrote agent assets", {
		assetsPath: AGENT_ASSETS_PATH,
		composedPath: AGENT_ASSETS_COMPOSED_PATH,
		registeredPath: AGENT_ASSETS_REGISTERED_PATH,
		decoratedPath: AGENT_ASSETS_DECORATED_PATH,
		dbTablesDir: DB_TABLES_DIR,
	});
}

async function writeDbTable(filePath: string, content: Record<string, unknown>) {
	await writeFile(filePath, `${JSON.stringify(content, null, "\t")}\n`, "utf8");
}

function countScreenShellIds(tables: { screens: Array<{ pattern: { id: string } }> }) {
	const counts: Record<string, number> = {};
	for (const screen of tables.screens) {
		const id = screen.pattern.id;
		counts[id] = (counts[id] ?? 0) + 1;
	}
	return counts;
}
