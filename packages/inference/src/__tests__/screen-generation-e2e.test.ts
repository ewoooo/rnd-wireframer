import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AgentRunner } from "@cx/agent";
import { createInferenceRuntime, runInferenceJob } from "@cx/inference";
import { screenGenerationPipelineV1 } from "@cx/inference/pipelines/screen-generation-v1";
import { SCHEMA_VERSION } from "@cx/schema";
import { describe, expect, it } from "vitest";

const sourceSpec = {
	schemaVersion: SCHEMA_VERSION.sourceSpec,
	sourceImport: {
		files: [],
		importId: "test",
		receivedAt: "2026-06-08T00:00:00.000Z",
		sourceKind: "prdd-markdown-bundle",
	},
	sourceShape: {
		screen: {
			name: "Test Screen",
			regions: [],
			route: "/test",
			screenCode: "T",
		},
	},
};

const validRenderTree = {
	version: SCHEMA_VERSION.renderTree,
	metadata: { id: "x" },
	children: [
		{
			type: "Screen",
			componentVersion: "0.1.0",
			layout: "layout.screen.mobileScreen",
			metadata: { id: "T", title: "Screen" },
			children: [
				{
					type: "Screen.Header",
					componentVersion: "0.1.0",
					layout: "layout.region.header",
					metadata: { id: "header", title: "Header" },
					props: { position: "static" },
					children: [],
				},
				{
					type: "Screen.Contents",
					componentVersion: "0.1.0",
					layout: "layout.region.contents",
					metadata: { id: "contents", title: "Contents" },
					props: { scroll: true },
					children: [],
				},
				{
					type: "Screen.Bottom",
					componentVersion: "0.1.0",
					layout: "layout.region.bottom",
					metadata: { id: "bottom", title: "Bottom" },
					props: { position: "static", safeArea: true },
					children: [],
				},
			],
		},
	],
};

const invalidRenderTree = {
	version: SCHEMA_VERSION.renderTree,
	metadata: { id: "x" },
	children: [],
};

const payloadByTaskKind: Record<string, unknown> = {
	"screen-intent": {
		schemaVersion: SCHEMA_VERSION.screenIntent,
		coreJudgment: "x",
		firstUnderstanding: "x",
		ctaPromise: "x",
		contentPriority: [],
		sourceInterpretation: { defer: [], preserve: [], summarize: [] },
	},
	"composition-planning": {
		schemaVersion: SCHEMA_VERSION.compositionPlan,
		screenLayout: "layout.screen.Default",
		currentFitAssessment: { supportsJudgment: true, problems: [] },
		compositionProposal: { shouldChangeAreaComposite: false, recommendedAreas: [] },
		designTrace: { usedReferenceIds: ["area-radio-option-group"], usedSkillIds: [] },
		layoutStrategy: "x",
		sections: [
			{ targetRegion: "contents", role: "content", priority: 1, sourceRefs: ["T"], strategy: "x" },
		],
		visualHierarchy: "x",
		primaryUserAction: "x",
		sectionRhythm: "x",
		density: "medium",
		patternRationale: "x",
		rejectedPatterns: [],
	},
	"screen-generation": validRenderTree,
	"screen-revision": validRenderTree,
	"quality-review": {
		schemaVersion: SCHEMA_VERSION.qualityInspection,
		inspection: { compositionAligned: true, sourceFaithful: true, visualHierarchyClear: true },
		findings: [],
		summary: { errorCount: 0, warningCount: 0 },
	},
	"component-proposal": {
		schemaVersion: SCHEMA_VERSION.componentProposal,
		proposals: [
			{
				id: "p-1",
				proposedComponentType: "TextFieldAuthTimer",
				rationale: "Source requires a countdown next to the auth request field.",
				sourceEvidence: ["T"],
				nearestCatalogMatch: "kiki.TextField",
			},
		],
	},
};

const fakeRunner: AgentRunner = async (request) => {
	const payload = payloadByTaskKind[request.taskKind];
	if (request.taskKind !== "screen-intent" || !isRecord(payload)) {
		return {
			taskKind: request.taskKind,
			session: { mode: "new" },
			payload,
		};
	}
	const skillset = readSkillsetReference(request.input.context);
	return {
		taskKind: request.taskKind,
		session: { mode: "new" },
		payload: {
			...payload,
			usedSkills: skillset.data.documents.map((document) => ({
				id: document.id,
				role: document.role,
				sourceRef: document.sourceRef,
				task: document.task,
			})),
		},
	};
};

describe("screen-generation@v1 end-to-end", () => {
	it("runs validation and skips revision when the first RenderTree is valid", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-e2e-"));
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => sourceSpec },
			claudeRunner: fakeRunner,
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		await expect(runtime.jobStore.getJob(job.jobId)).resolves.toMatchObject({
			status: "succeeded",
		});
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/quality-inspection.json"),
		).resolves.toMatchObject({ summary: { errorCount: 0, warningCount: 0 } });
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/validation-report.json"),
		).resolves.toMatchObject({ summary: { errorCount: 0 } });
		await expect(
			runtime.artifactStore.exists(job.jobId, "steps/06-revision/step.json"),
		).resolves.toBe(false);
		const references = await runtime.artifactStore.readJson(
			job.jobId,
			"steps/02-screen-intent/references.json",
		);
		// The skillset reference is auto-injected from the step's task name.
		expect(references).toMatchObject({
			skillset: {
				kind: "skillset",
				id: "screen-intent",
			},
		});
		const skillset = readSkillsetFromReferences(references);
		expect(skillset.data.documents.map((document) => document.id)).toEqual([
			"screen-intent",
			"design-fundamentals",
			"source-fidelity-review",
			"state-coverage-review",
		]);
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/screen-intent.json"),
		).resolves.toMatchObject({
			usedSkills: [
				{
					id: "screen-intent",
					sourceRef: "../docs/prompts/screen-intent.md",
					task: "screen-intent",
				},
				{
					id: "design-fundamentals",
					sourceRef: "../docs/skills/design-skills/design-fundamentals/README.md",
					// 076b5517 frontmatter 정규화 이후 task는 family가 아니라
					// "이 문서가 투입된 현재 task"를 가리킨다 (catalog.ts readSkillTask).
					task: "screen-intent",
				},
				{
					id: "source-fidelity-review",
					sourceRef: "../docs/skills/review-skills/source-fidelity-review/README.md",
					task: "screen-intent",
				},
				{
					id: "state-coverage-review",
					sourceRef: "../docs/skills/review-skills/state-coverage-review/README.md",
					task: "screen-intent",
				},
			],
		});
	});

	it("emits a component-proposal side artifact and survives its failure", async () => {
		// 정상 산출 경로.
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-e2e-"));
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => sourceSpec },
			claudeRunner: fakeRunner,
		});
		const job = await runtime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);
		await expect(runtime.jobStore.getJob(job.jobId)).resolves.toMatchObject({
			status: "succeeded",
		});
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/component-proposal.json"),
		).resolves.toMatchObject({
			proposals: [{ proposedComponentType: "TextFieldAuthTimer" }],
		});

		// Optional step 실패 경로: proposal이 계약 위반이어도 잡은 성공한다.
		const failingRunner: AgentRunner = async (request) => ({
			taskKind: request.taskKind,
			session: { mode: "new" },
			payload:
				request.taskKind === "component-proposal"
					? { invalid: true }
					: payloadByTaskKind[request.taskKind],
		});
		const failingRuntime = createInferenceRuntime({
			dataRoot: mkdtempSync(path.join(tmpdir(), "cx-e2e-")),
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => sourceSpec },
			claudeRunner: failingRunner,
		});
		const failingJob = await failingRuntime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(failingRuntime, failingJob.jobId);
		await expect(failingRuntime.jobStore.getJob(failingJob.jobId)).resolves.toMatchObject({
			status: "succeeded",
		});
		await expect(
			failingRuntime.artifactStore.exists(failingJob.jobId, "context/component-proposal.json"),
		).resolves.toBe(false);
	});

	it("runs one design revision when quality review emits revision directives", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-e2e-"));
		const calls: string[] = [];
		const runner: AgentRunner = async (request) => {
			calls.push(request.taskKind);
			if (request.taskKind === "quality-review") {
				return {
					taskKind: request.taskKind,
					session: { mode: "new" },
					payload: {
						schemaVersion: SCHEMA_VERSION.qualityInspection,
						inspection: {
							compositionAligned: true,
							sourceFaithful: true,
							visualHierarchyClear: false,
						},
						findings: [
							{
								code: "visual-hierarchy-flat",
								severity: "error",
								message: "Primary judgment is buried under uniform rows.",
							},
						],
						revisionDirectives: [
							{
								findingCode: "visual-hierarchy-flat",
								action: "change-structure",
								path: ["children", 0, "children", 1],
								mustPreserveSourceRefs: ["T"],
								suggestedChange: "Lift the summary area above the option rows.",
							},
						],
						summary: { errorCount: 1, warningCount: 0 },
					},
				};
			}
			return {
				taskKind: request.taskKind,
				session: { mode: "new" },
				payload: payloadByTaskKind[request.taskKind],
			};
		};
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => sourceSpec },
			claudeRunner: runner,
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		await expect(runtime.jobStore.getJob(job.jobId)).resolves.toMatchObject({
			status: "succeeded",
		});
		// 05 통과 → 06 계약 revision은 건너뛰고, quality directive로 09만 실행된다.
		expect(calls.filter((task) => task === "screen-revision")).toHaveLength(1);
		await expect(
			runtime.artifactStore.exists(job.jobId, "steps/06-revision/step.json"),
		).resolves.toBe(false);
		await expect(
			runtime.artifactStore.exists(job.jobId, "steps/09-design-revision/step.json"),
		).resolves.toBe(true);
		await expect(
			runtime.artifactStore.exists(
				job.jobId,
				"steps/10-validation-after-design-revision/step.json",
			),
		).resolves.toBe(true);
		// design revision 결과도 deterministic 재검증을 통과해야 성공으로 남는다.
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/validation-report.json"),
		).resolves.toMatchObject({ summary: { errorCount: 0 } });
	});

	it("runs one revision and validates again when deterministic validation has errors", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-e2e-"));
		const calls: string[] = [];
		const runner: AgentRunner = async (request) => {
			calls.push(request.taskKind);
			return {
				taskKind: request.taskKind,
				session: { mode: "new" },
				payload:
					request.taskKind === "screen-generation"
						? invalidRenderTree
						: payloadByTaskKind[request.taskKind],
			};
		};
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => sourceSpec },
			claudeRunner: runner,
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		await expect(runtime.jobStore.getJob(job.jobId)).resolves.toMatchObject({
			status: "succeeded",
		});
		expect(calls).toContain("screen-revision");
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/validation-report.json"),
		).resolves.toMatchObject({ summary: { errorCount: 0 } });
		await expect(
			runtime.artifactStore.exists(job.jobId, "steps/07-validation-after-revision/step.json"),
		).resolves.toBe(true);
	});
});

function readSkillsetFromReferences(references: unknown) {
	if (!isRecord(references)) {
		throw new Error("expected references object");
	}
	return readSkillsetReference({ references });
}

function readSkillsetReference(context: unknown) {
	if (
		!isRecord(context) ||
		!isRecord(context.references) ||
		!isRecord(context.references.skillset)
	) {
		throw new Error("screen-intent runner expected a skillset reference");
	}
	const skillset = context.references.skillset;
	if (
		skillset.kind !== "skillset" ||
		!isRecord(skillset.data) ||
		!Array.isArray(skillset.data.documents)
	) {
		throw new Error("screen-intent runner received an invalid skillset reference");
	}
	return skillset as {
		data: {
			documents: Array<{
				id: string;
				role?: string;
				sourceRef: string;
				task: string;
			}>;
		};
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
