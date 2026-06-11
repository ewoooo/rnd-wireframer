import { describe, expect, it } from "vitest";
import { collect } from "../../../../../scripts/sync-skillset-catalog/index";
import { readAgentMarkdownDocument } from "../../docs/package-markdown";
import { AGENT_SKILLSET_CATALOG } from "../catalog.generated";

const SKILL_FAMILIES = new Set(["compose", "design", "generate", "review", "revision", "task"]);
const SKILL_STAGES = new Set(["understand", "compose", "generate", "review", "revise"]);
const SKILL_TASKS = new Set([
	"composition-planning",
	"quality-review",
	"screen-generation",
	"screen-intent",
	"screen-revision",
]);
const SKILL_PRIORITIES = new Set(["optional", "recommended", "required"]);

describe("skillset catalog.generated 무결성", () => {
	it("카탈로그가 비어 있지 않고 모든 task가 documents를 가진다", () => {
		const tasks = Object.keys(AGENT_SKILLSET_CATALOG);
		expect(tasks.length).toBeGreaterThan(0);
		for (const task of tasks) {
			expect(
				AGENT_SKILLSET_CATALOG[task as keyof typeof AGENT_SKILLSET_CATALOG].documents.length,
			).toBeGreaterThan(0);
		}
	});

	it("모든 document가 ../docs/ 상대경로 sourceRef를 가진다", () => {
		for (const entry of Object.values(AGENT_SKILLSET_CATALOG)) {
			expect(entry.documents.every((d) => d.sourceRef.startsWith("../docs/"))).toBe(true);
		}
	});

	it("모든 skillset의 첫 document는 task prompt다", () => {
		for (const [task, entry] of Object.entries(AGENT_SKILLSET_CATALOG)) {
			expect(entry.documents[0]).toEqual({
				kind: "prompt",
				sourceRef: `../docs/prompts/${task}.md`,
			});
		}
	});

	it("커밋된 생성물이 소스 매니페스트 재수집 결과와 일치한다 (drift 가드)", () => {
		// 텍스트가 아니라 파싱된 데이터를 비교 — biome 포맷 차이에 영향받지 않는다.
		expect(AGENT_SKILLSET_CATALOG).toEqual(collect());
	});

	it("skill 문서는 표준 frontmatter를 가진다", () => {
		const seen = new Set<string>();
		for (const entry of Object.values(AGENT_SKILLSET_CATALOG)) {
			for (const document of entry.documents) {
				if (document.kind !== "skill" || seen.has(document.sourceRef)) continue;
				seen.add(document.sourceRef);

				const { frontmatter } = readAgentMarkdownDocument(document.sourceRef);

				expect(frontmatter).toMatchObject({
					id: expect.any(String),
					kind: "skill",
					role: expect.any(String),
					whenToUse: expect.any(String),
				});
				expect(SKILL_FAMILIES.has(String(frontmatter.family))).toBe(true);
				expect(SKILL_PRIORITIES.has(String(frontmatter.priority))).toBe(true);
				expect(frontmatter.stage).toBeUndefined();
				expect(frontmatter.task).toBeUndefined();
				expect(Array.isArray(frontmatter.stages)).toBe(true);
				expect(Array.isArray(frontmatter.tasks)).toBe(true);
				expect(Array.isArray(frontmatter.tags)).toBe(true);
				expect((frontmatter.stages as string[]).length).toBeGreaterThan(0);
				expect((frontmatter.tasks as string[]).length).toBeGreaterThan(0);
				expect((frontmatter.tags as string[]).length).toBeGreaterThan(0);
				expect((frontmatter.stages as string[]).every((stage) => SKILL_STAGES.has(stage))).toBe(
					true,
				);
				expect((frontmatter.tasks as string[]).every((task) => SKILL_TASKS.has(task))).toBe(true);
			}
		}

		expect(seen.size).toBeGreaterThan(0);
	});
});
