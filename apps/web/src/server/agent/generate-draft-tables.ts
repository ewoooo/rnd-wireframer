import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runDraftTablesPipeline } from "@cx/agent/pipeline/draft-tables";
import {
	createPrddDraftTables,
	draftTablesToMaterializedNodeTree,
} from "@cx/agent/pipeline/prdd-draft-tables";
import { promoteDatabaseTablesCandidate } from "@cx/agent/promote-database-tables";
import { createQualityReport } from "@cx/agent/validate/quality-report";
import type { DraftTablesArtifact } from "@cx/types/draft-tables";
import type { QualityReport } from "@cx/types/quality-report";
import { loadPatternStoreForWorkbench } from "@/data/pattern-store-loader";
import { assertValidImportId, readClientImportMarkdownFiles } from "@/server/agent/client-imports";
import { getDatabaseDir } from "@/server/database-paths";

const DATABASE_DIR = getDatabaseDir();
const DRAFT_TABLES_DIR = path.join(DATABASE_DIR, "ai-imports", "draft-tables");

export interface GenerateDraftTablesOptions {
	importId: string;
}

export interface GenerateDraftTablesResult {
	importId: string;
	screenCount: number;
	results: DraftTablesScreenResult[];
	writtenDir: string;
}

export interface DraftTablesScreenResult {
	screenFile: string;
	ok: boolean;
	stage: string;
	writtenPaths: {
		artifact: string;
		qualityReport: string;
		materialized: string;
	};
	qualityReport?: QualityReport;
}

export async function generateDraftTablesForImport({
	importId,
}: GenerateDraftTablesOptions): Promise<GenerateDraftTablesResult> {
	assertValidImportId(importId);

	const { screenFiles } = await readClientImportMarkdownFiles(importId);
	if (screenFiles.length === 0) {
		throw new DraftTablesGenerateError(
			"No screen markdown files found in the selected client import.",
			400,
		);
	}

	const importOutputDir = path.join(DRAFT_TABLES_DIR, importId);
	await mkdir(importOutputDir, { recursive: true });

	const results: DraftTablesScreenResult[] = [];
	for (const screenFile of screenFiles) {
		const stem = screenFile.name.replace(/\.md$/, "");
		const importJobId = `draft-tables-${importId}-${stem}`;
		const generatedAt = new Date().toISOString();
		const pipelineResult = await runDraftTablesPipeline({
			prddSource: screenFile.content,
			importJobId,
			sourceId: screenFile.name,
			generateDraftTables: ({ register }) => createPrddDraftTables(register),
			validateDraftTables: (artifact) => validateDraftTablesArtifact(artifact, generatedAt),
			now: () => new Date(generatedAt),
		});

		const artifactPath = path.join(importOutputDir, `${stem}.draft-tables.json`);
		const qualityReportPath = path.join(importOutputDir, `${stem}.quality-report.json`);
		const materializedPath = path.join(importOutputDir, `${stem}.materialized.json`);

		await writeJson(artifactPath, pipelineResult.artifact ?? null);
		await writeJson(qualityReportPath, pipelineResult.qualityReport ?? null);
		await writeJson(
			materializedPath,
			pipelineResult.artifact
				? draftTablesToMaterializedNodeTree(pipelineResult.artifact.tables)
				: null,
		);

		results.push({
			screenFile: screenFile.name,
			ok: pipelineResult.ok,
			stage: pipelineResult.stage,
			writtenPaths: {
				artifact: toDatabaseRelativePath(artifactPath),
				qualityReport: toDatabaseRelativePath(qualityReportPath),
				materialized: toDatabaseRelativePath(materializedPath),
			},
			qualityReport: pipelineResult.qualityReport,
		});
	}

	return {
		importId,
		screenCount: screenFiles.length,
		results,
		writtenDir: toDatabaseRelativePath(importOutputDir),
	};
}

export class DraftTablesGenerateError extends Error {
	constructor(
		message: string,
		readonly status = 500,
	) {
		super(message);
	}
}

function validateDraftTablesArtifact(
	artifact: DraftTablesArtifact,
	generatedAt: string,
): QualityReport {
	const result = promoteDatabaseTablesCandidate(
		draftTablesToMaterializedNodeTree(artifact.tables),
		{
			patternStore: loadPatternStoreForWorkbench(),
		},
	);

	return createQualityReport({
		issues: result.issues,
		generatedAt,
		sourceId: artifact.source.sourceId,
	});
}

async function writeJson(filePath: string, payload: unknown) {
	await writeFile(filePath, `${JSON.stringify(payload, null, "\t")}\n`, "utf8");
}

function toDatabaseRelativePath(filePath: string) {
	return path.relative(DATABASE_DIR, filePath);
}
