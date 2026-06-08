import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export type GenerationSkillStage =
	| "pattern-selection"
	| "quality-inspection"
	| "render-tree-generation";

export type GenerationSkill = {
	body: string;
	description?: string;
	dir: string;
	id: string;
	inputContract?: string;
	outputContract?: string;
	sideFiles: Array<{
		content: string;
		path: string;
	}>;
	stage: GenerationSkillStage;
};

const DEFAULT_SCREEN_GENERATION_SKILL_DIR = "packages/agent/docs/skills/screen-generation";
const DEFAULT_SCREEN_GENERATION_PROMPT = "packages/agent/docs/prompts/screen-generation.md";
const SCREEN_GENERATION_REFERENCE = {
	checklist: "checklist.md",
	outputContract: "output-contract.md",
} as const;

export async function loadGenerationSkillCatalog(
	rootDir = DEFAULT_SCREEN_GENERATION_SKILL_DIR,
): Promise<GenerationSkill[]> {
	const promptPath = DEFAULT_SCREEN_GENERATION_PROMPT;
	if (!(await isFile(promptPath))) return [];

	return [
		{
			body: await readFile(promptPath, "utf8"),
			description: "Screen generation reference assets owned by @cx/agent.",
			dir: rootDir,
			id: "screen-generation.render-tree-output",
			inputContract: "screen-generation-agent-input.v0.1",
			outputContract: "render-tree-draft-candidate.v0.1",
			sideFiles: await readSideFiles(rootDir, [
				SCREEN_GENERATION_REFERENCE.outputContract,
				SCREEN_GENERATION_REFERENCE.checklist,
			]),
			stage: "render-tree-generation",
		},
	];
}

export function findGenerationSkill(
	catalog: GenerationSkill[],
	stage: GenerationSkillStage,
): GenerationSkill | undefined {
	return catalog.find((skill) => skill.stage === stage);
}

async function readSideFiles(
	skillDir: string,
	sideFiles: string[],
): Promise<GenerationSkill["sideFiles"]> {
	const files: GenerationSkill["sideFiles"] = [];

	for (const sideFile of sideFiles) {
		const safePath = normalizeSideFilePath(sideFile);
		if (!safePath) continue;

		const fullPath = path.join(skillDir, safePath);
		if (!(await isFile(fullPath))) continue;

		files.push({
			content: await readFile(fullPath, "utf8"),
			path: safePath,
		});
	}

	return files;
}

function normalizeSideFilePath(value: string): string | undefined {
	const normalized = path.normalize(value);
	if (normalized.startsWith("..") || path.isAbsolute(normalized)) return undefined;
	return normalized;
}

async function isFile(filePath: string): Promise<boolean> {
	try {
		return (await stat(filePath)).isFile();
	} catch {
		return false;
	}
}
