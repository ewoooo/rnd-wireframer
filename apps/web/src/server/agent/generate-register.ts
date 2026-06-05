import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { aiSelectPatterns } from "@cx/agent/ai-pattern-selector";
import { generateAssetsWithLocalClaude } from "@cx/agent/claude-asset-generator";
import { composeAssetContents } from "@cx/agent/compose-assets";
import { composeAssetContentsWithAI } from "@cx/agent/compose-assets-ai";
import { composeSynthesizeWithAI } from "@cx/agent/compose-synthesize-ai";
import { decorateRegisteredAssets } from "@cx/agent/decorate-assets";
import { aiReviewDesignTree, applyDesignReview, reviewDesignTree } from "@cx/agent/design-review";
import { registerAssets } from "@cx/agent/register-assets";
import { materializeDecoratedAssetsToNodeTree } from "@cx/agent/register-assets-to-database-tables";
import { createPatternResolver } from "@cx/agent/resolvers/pattern-resolver";
import { loadPatternStoreForWorkbench } from "@/data/pattern-store-loader";
import { assertValidImportId, readClientImportMarkdownFiles } from "@/server/agent/client-imports";
import { getDatabaseDir } from "@/server/database-paths";

const DATABASE_DIR = getDatabaseDir();
const PROJECT_DIR = path.dirname(DATABASE_DIR);
const AI_IMPORTS_DIR = path.join(DATABASE_DIR, "ai-imports");

/**
 * 모델 정렬:
 * - Extract: Opus — Sonnet은 organism 컴포넌트 표 walk를 누락하는 사례가 반복됐다.
 *   instruction-following 안정성을 위해 Opus로 승격.
 * - Compose / Pattern Selector / DesignReview AI: Opus.
 */
const MODEL_EXTRACT = "claude-opus-4-7";
const MODEL_COMPOSE = "claude-opus-4-7";
const MODEL_REVIEWER = "claude-opus-4-7";
const AGENT_ASSETS_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.json");
const AGENT_ASSETS_COMPOSED_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.composed.json");
const AGENT_ASSETS_REGISTERED_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.registered.json");
const AGENT_ASSETS_DECORATED_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.decorated.json");
const AGENT_ASSETS_DESIGN_REVIEW_PATH = path.join(
	AI_IMPORTS_DIR,
	"agent-assets.design-review.json",
);
const AGENT_ASSETS_REVIEWED_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.reviewed.json");
const AGENT_ASSETS_MATERIALIZED_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.materialized.json");

export interface GenerateAgentRegisterOptions {
	composeWithAI?: boolean;
	reviewWithAI?: boolean;
	importId: string;
}

export async function generateAgentRegister({
	composeWithAI = true,
	reviewWithAI = true,
	importId,
}: GenerateAgentRegisterOptions) {
	assertValidImportId(importId);

	console.info("[agent-generate] start", { importId, composeWithAI });
	const patternStore = loadPatternStoreForWorkbench();
	const resolvePattern = createPatternResolver({ patterns: patternStore.patterns });

	const { screenFiles } = await readClientImportMarkdownFiles(importId);

	console.info("[agent-generate] loaded markdown files", {
		importId,
		screenFiles: screenFiles.map((file) => ({
			name: file.name,
			characters: file.content.length,
		})),
	});

	if (screenFiles.length === 0) {
		throw new AgentGenerateError("No screen markdown files found in the selected client import.", 400);
	}

	const claudeResult = await generateAssetsWithLocalClaude(
		{
			importId,
			screenFiles,
		},
		{
			cwd: PROJECT_DIR,
			continueSession: false,
			debug: true,
			model: MODEL_EXTRACT,
		},
	);
	const generated = claudeResult.generated;
	const registry = registerAssets(generated);
	console.info("[agent-generate] registered assets", {
		componentCount: registry.components.length,
		areaCount: registry.areas.length,
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
			model: MODEL_COMPOSE,
		});
		console.info("[agent-generate] composed asset contents (AI)", {
			gapCount: composeAIResult.gaps.length,
			mergedComponentCount: composeAIResult.mergedComponentIds.length,
			skippedProposalCount: composeAIResult.skippedProposals.length,
			warnings: composeAIResult.warnings,
			sessionId: composeAIResult.sessionId,
		});
		composed = composeAIResult.composed;

		// Composer-AI synthesis pass: chrome/CTA 등 누락 component를 추론·합성.
		// Decorator가 다음 단계에서 region/area에 배치한다.
		const synthResult = await composeSynthesizeWithAI(composed, {
			cwd: PROJECT_DIR,
			continueSession: false,
			debug: true,
			model: MODEL_COMPOSE,
		});
		console.info("[agent-generate] composed synthesis (AI)", {
			proposalCount: synthResult.proposals.length,
			skippedCount: synthResult.skipped.length,
			warnings: synthResult.warnings,
			sessionId: synthResult.sessionId,
		});
		composed = synthResult.composed;
	}

	// AI Pattern Selector: deterministic 매칭 위에 AI 선택을 override로 얹는다.
	const patternSelection = await aiSelectPatterns(composed, {
		cwd: PROJECT_DIR,
		continueSession: false,
		debug: true,
		model: MODEL_COMPOSE,
	});
	console.info("[agent-generate] ai pattern selector", {
		selectionCount: patternSelection.selections.size,
		skippedCount: patternSelection.skipped.length,
		warnings: patternSelection.warnings,
		sessionId: patternSelection.sessionId,
	});
	const decorated = decorateRegisteredAssets(composed, {
		resolvePattern,
		aiPatternSelections: patternSelection.selections,
	});
	const deterministicDesignReview = reviewDesignTree(decorated);
	let designReview = deterministicDesignReview;
	if (reviewWithAI) {
		const aiReview = await aiReviewDesignTree(decorated, {
			cwd: PROJECT_DIR,
			continueSession: false,
			debug: true,
			model: MODEL_REVIEWER,
		});
		designReview = {
			...deterministicDesignReview,
			operations: [...deterministicDesignReview.operations, ...aiReview.designReview.operations],
			findings: [...deterministicDesignReview.findings, ...aiReview.designReview.findings],
			warnings: [
				...deterministicDesignReview.warnings,
				...aiReview.designReview.warnings,
				...aiReview.warnings,
				...aiReview.skippedOperations.map(
					(skipped) => `ai-reviewer: skipped op #${skipped.index} — ${skipped.reason}`,
				),
			],
		};
		console.info("[agent-generate] design review (AI)", {
			aiOperationCount: aiReview.designReview.operations.length,
			aiSkippedOperationCount: aiReview.skippedOperations.length,
			aiWarnings: aiReview.warnings,
			sessionId: aiReview.sessionId,
		});
	}
	const designReviewResult = applyDesignReview(decorated, designReview);
	const reviewed = designReviewResult.reviewed;
	const materialized = materializeDecoratedAssetsToNodeTree(reviewed);
	const screenShellCounts = countScreenShellIds(materialized);

	console.info("[agent-generate] materialized node tree", {
		componentCount: materialized.components.length,
		areaCount: materialized.areas.length,
		screenCount: materialized.screens.length,
		screenRouteCount: materialized.screenRoutes.length,
		screenVariantCount: materialized.screenVariants.length,
		designReviewOperationCount: designReview.operations.length,
		designReviewAppliedCount: designReviewResult.appliedOperationIds.length,
		screenShellCounts,
	});

	await writeAgentImportArtifacts({
		composed,
		decorated,
		designReview,
		generated,
		materialized,
		registry,
		reviewed,
	});

	return {
		materialized,
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
			designReview: "database/ai-imports/agent-assets.design-review.json",
			materialized: "database/ai-imports/agent-assets.materialized.json",
			reviewed: "database/ai-imports/agent-assets.reviewed.json",
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
	designReview: unknown;
	materialized: {
		screenRoutes: unknown[];
		screenVariants: unknown[];
		screens: unknown[];
		areas: unknown[];
		components: unknown[];
	};
	generated: unknown;
	registry: unknown;
	reviewed: unknown;
}) {
	await mkdir(AI_IMPORTS_DIR, { recursive: true });
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
	await writeFile(
		AGENT_ASSETS_DESIGN_REVIEW_PATH,
		`${JSON.stringify(payload.designReview, null, "\t")}\n`,
		"utf8",
	);
	await writeFile(
		AGENT_ASSETS_REVIEWED_PATH,
		`${JSON.stringify(payload.reviewed, null, "\t")}\n`,
		"utf8",
	);
	await writeFile(
		AGENT_ASSETS_MATERIALIZED_PATH,
		`${JSON.stringify(payload.materialized, null, "\t")}\n`,
		"utf8",
	);
	console.info("[agent-generate] wrote agent assets", {
		assetsPath: AGENT_ASSETS_PATH,
		composedPath: AGENT_ASSETS_COMPOSED_PATH,
		registeredPath: AGENT_ASSETS_REGISTERED_PATH,
		decoratedPath: AGENT_ASSETS_DECORATED_PATH,
		designReviewPath: AGENT_ASSETS_DESIGN_REVIEW_PATH,
		reviewedPath: AGENT_ASSETS_REVIEWED_PATH,
		materializedPath: AGENT_ASSETS_MATERIALIZED_PATH,
	});
}

function countScreenShellIds(materialized: { screens: Array<{ pattern?: { id: string } }> }) {
	const counts: Record<string, number> = {};
	for (const screen of materialized.screens) {
		const id = screen.pattern?.id ?? "(none)";
		counts[id] = (counts[id] ?? 0) + 1;
	}
	return counts;
}
