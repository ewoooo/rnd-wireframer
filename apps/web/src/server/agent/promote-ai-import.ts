import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promoteDatabaseTablesCandidate } from "@cx/agent/promote-database-tables";
import { errorsOf, warningsOf } from "@cx/types/validation";
import { loadPatternStoreForWorkbench } from "@/data/pattern-store-loader";
import { getDatabaseDir } from "@/server/database-paths";

const DATABASE_DIR = getDatabaseDir();
const AI_IMPORTS_DIR = path.join(DATABASE_DIR, "ai-imports");
const TABLES_DIR = path.join(DATABASE_DIR, "tables");

export interface PromoteAiImportOptions {
	candidateFile: string;
	dryRun?: boolean;
}

export async function promoteAiImportCandidate({
	candidateFile,
	dryRun = false,
}: PromoteAiImportOptions) {
	assertValidCandidateFile(candidateFile);

	const candidatePath = path.join(AI_IMPORTS_DIR, candidateFile);
	const candidate = JSON.parse(await readFile(candidatePath, "utf8")) as unknown;
	const result = promoteDatabaseTablesCandidate(candidate, {
		patternStore: loadPatternStoreForWorkbench(),
	});

	const errors = errorsOf(result).map((issue) => issue.message);
	const warnings = warningsOf(result).map((issue) => issue.message);

	if (!result.ok || !result.data) {
		return {
			candidateFile,
			dryRun,
			errors,
			promoted: false,
			warnings,
			writtenFiles: [],
		};
	}

	const writtenFiles = Object.keys(result.data).sort();
	if (!dryRun) {
		await mkdir(TABLES_DIR, { recursive: true });
		for (const [fileName, payload] of Object.entries(result.data)) {
			await writeFile(
				path.join(TABLES_DIR, fileName),
				`${JSON.stringify(payload, null, "\t")}\n`,
				"utf8",
			);
		}
	}

	return {
		candidateFile,
		dryRun,
		errors: [],
		promoted: !dryRun,
		warnings,
		writtenFiles,
	};
}

function assertValidCandidateFile(candidateFile: string) {
	if (!/^[a-z0-9][a-z0-9._-]*\.materialized\.json$/i.test(candidateFile)) {
		throw new PromoteAiImportError("candidateFile must be a *.materialized.json file name.", 400);
	}
	if (candidateFile.includes("/") || candidateFile.includes("\\")) {
		throw new PromoteAiImportError("candidateFile must not include path separators.", 400);
	}
}

export class PromoteAiImportError extends Error {
	constructor(
		message: string,
		readonly status = 500,
	) {
		super(message);
	}
}
