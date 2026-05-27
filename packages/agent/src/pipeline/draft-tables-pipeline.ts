import type { DraftTablesArtifact, DraftTablesBundle, QualityReport } from "@cx/types";
import {
	type CrossTableViolation,
	type RegisterPrddScreenResult,
	registerPrddScreen,
} from "../register/register-prdd-screen";

export interface RunDraftTablesPipelineInput {
	prddSource: string;
	importJobId?: string;
	sourceId?: string;
	generateDraftTables: (input: {
		register: RegisterPrddScreenResult;
	}) => Promise<DraftTablesBundle> | DraftTablesBundle;
	validateDraftTables?: (artifact: DraftTablesArtifact) => Promise<QualityReport> | QualityReport;
	now?: () => Date;
}

export interface RunDraftTablesPipelineResult {
	ok: boolean;
	stage: "register" | "draft" | "validate" | "done";
	register?: RegisterPrddScreenResult;
	artifact?: DraftTablesArtifact;
	qualityReport?: QualityReport;
	invariantViolations: CrossTableViolation[];
}

export async function runDraftTablesPipeline(
	input: RunDraftTablesPipelineInput,
): Promise<RunDraftTablesPipelineResult> {
	const register = registerPrddScreen(input.prddSource, { importJobId: input.importJobId });
	if (register.invariantViolations.length > 0) {
		return {
			ok: false,
			stage: "register",
			register,
			invariantViolations: register.invariantViolations,
		};
	}

	const generatedAt = (input.now ?? (() => new Date()))().toISOString();
	const tables = await input.generateDraftTables({ register });
	const artifact: DraftTablesArtifact = {
		schemaVersion: "draft-tables.v1",
		source: {
			importJobId: input.importJobId,
			sourceKind: "prdd",
			sourceId: input.sourceId ?? register.prddScreenRecord.id,
			generatedAt,
		},
		tables,
	};

	if (!input.validateDraftTables) {
		return {
			ok: true,
			stage: "done",
			register,
			artifact,
			invariantViolations: [],
		};
	}

	const qualityReport = await input.validateDraftTables(artifact);
	return {
		ok: qualityReport.ok,
		stage: qualityReport.ok ? "done" : "validate",
		register,
		artifact,
		qualityReport,
		invariantViolations: [],
	};
}
