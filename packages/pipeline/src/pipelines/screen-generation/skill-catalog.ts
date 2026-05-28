import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export type GenerationSkillStage =
	| "pattern-selection"
	| "quality-inspection"
	| "render-tree-generation"
	| "revision";

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

type SkillFrontmatter = {
	description?: string;
	id?: string;
	inputContract?: string;
	outputContract?: string;
	sideFiles?: string[];
	stage?: GenerationSkillStage;
};

const DEFAULT_GENERATION_SKILLS_DIR = "docs/development/generation-skills";
const FRONTMATTER_FIELD_ASSIGNERS = {
	description: (data: SkillFrontmatter, value: string) => {
		data.description = value;
	},
	id: (data: SkillFrontmatter, value: string) => {
		data.id = value;
	},
	inputContract: (data: SkillFrontmatter, value: string) => {
		data.inputContract = value;
	},
	outputContract: (data: SkillFrontmatter, value: string) => {
		data.outputContract = value;
	},
	stage: (data: SkillFrontmatter, value: string) => {
		if (isGenerationSkillStage(value)) data.stage = value;
	},
} as const satisfies Record<
	Exclude<keyof SkillFrontmatter, "sideFiles">,
	(data: SkillFrontmatter, value: string) => void
>;

export async function loadGenerationSkillCatalog(
	rootDir = DEFAULT_GENERATION_SKILLS_DIR,
): Promise<GenerationSkill[]> {
	const entries = await readdir(rootDir, { withFileTypes: true });
	const skills: GenerationSkill[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;

		const dir = path.join(rootDir, entry.name);
		const skillPath = path.join(dir, "SKILL.md");
		if (!(await isFile(skillPath))) continue;

		const raw = await readFile(skillPath, "utf8");
		const parsed = parseSkillMarkdown(raw);
		if (!parsed.frontmatter.id || !parsed.frontmatter.stage) continue;

		skills.push({
			body: parsed.body,
			description: parsed.frontmatter.description,
			dir,
			id: parsed.frontmatter.id,
			inputContract: parsed.frontmatter.inputContract,
			outputContract: parsed.frontmatter.outputContract,
			sideFiles: await readSideFiles(dir, parsed.frontmatter.sideFiles ?? []),
			stage: parsed.frontmatter.stage,
		});
	}

	return skills.sort((left, right) => left.id.localeCompare(right.id));
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

function parseSkillMarkdown(raw: string): {
	body: string;
	frontmatter: SkillFrontmatter;
} {
	if (!raw.startsWith("---\n")) {
		return {
			body: raw.trim(),
			frontmatter: {},
		};
	}

	const end = raw.indexOf("\n---", 4);
	if (end < 0) {
		return {
			body: raw.trim(),
			frontmatter: {},
		};
	}

	const frontmatterText = raw.slice(4, end).trim();
	const body = raw.slice(end + "\n---".length).trim();

	return {
		body,
		frontmatter: parseFrontmatter(frontmatterText),
	};
}

function parseFrontmatter(frontmatterText: string): SkillFrontmatter {
	const data: SkillFrontmatter = {};
	const lines = frontmatterText.split("\n");

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line || line.trim().length === 0) continue;

		const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
		if (!keyMatch) continue;

		const [, key, rawValue] = keyMatch;
		if (!key) continue;

		if (key === "sideFiles") {
			const values: string[] = [];
			for (let listIndex = index + 1; listIndex < lines.length; listIndex += 1) {
				const listLine = lines[listIndex];
				const listMatch = listLine?.match(/^\s*-\s+(.+)$/);
				if (!listMatch) break;
				const value = listMatch[1]?.trim();
				if (value) values.push(stripQuotes(value));
				index = listIndex;
			}
			data.sideFiles = values;
			continue;
		}

		const value = stripQuotes(rawValue.trim());
		if (!value) continue;

		assignFrontmatterField(data, key, value);
	}

	return data;
}

function assignFrontmatterField(data: SkillFrontmatter, key: string, value: string): void {
	const assign = FRONTMATTER_FIELD_ASSIGNERS[key as keyof typeof FRONTMATTER_FIELD_ASSIGNERS];
	assign?.(data, value);
}

function isGenerationSkillStage(value: string): value is GenerationSkillStage {
	return (
		value === "pattern-selection" ||
		value === "quality-inspection" ||
		value === "render-tree-generation" ||
		value === "revision"
	);
}

function normalizeSideFilePath(value: string): string | undefined {
	const normalized = path.normalize(value);
	if (normalized.startsWith("..") || path.isAbsolute(normalized)) return undefined;
	return normalized;
}

function stripQuotes(value: string): string {
	return value.replace(/^["']|["']$/g, "");
}

async function isFile(filePath: string): Promise<boolean> {
	try {
		return (await stat(filePath)).isFile();
	} catch {
		return false;
	}
}
