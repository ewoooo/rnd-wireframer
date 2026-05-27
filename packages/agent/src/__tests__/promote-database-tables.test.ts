import { errorsOf } from "@cx/types/validation";
import { describe, expect, it } from "vitest";
import { promoteDatabaseTablesCandidate } from "../database/promote-database-tables";
import type { MaterializedNodeTree } from "../database/register-assets-to-database-tables";

const timestamp = "2026-05-26T00:00:00.000Z";

const candidate: MaterializedNodeTree = {
	screenRoutes: [
		{
			id: "route-main",
			moduleId: "mbr",
			name: "회원",
			order: 1,
			processId: null,
		},
	],
	screenVariants: [
		{
			id: "variant-main",
			screenRouteId: "route-main",
			name: "기본",
			order: 1,
			variantType: "base",
			followUp: null,
		},
	],
	screens: [
		{
			id: "screen-main",
			screenVariantId: "variant-main",
			minRendererVersion: "0.1.0",
			version: "1.0.0",
			order: 1,
			pattern: { id: "screen-shell", variant: "default" },
			metadata: {
				title: "메인",
				author: "test",
				createdAt: timestamp,
				updatedAt: timestamp,
			},
			screen: {
				type: "screen.page",
				regions: {
					header: {
						type: "Screen.Header",
						metadata: { title: "상단" },
						children: [],
					},
					contents: {
						type: "Screen.Contents",
						metadata: { title: "본문" },
						children: [{ kind: "area", id: "area-main" }],
					},
					bottom: {
						type: "Screen.Bottom",
						metadata: { title: "하단" },
						children: [],
					},
				},
			},
		},
	],
	areas: [
		{
			id: "area-main",
			type: "area.static",
			version: "1.0.0",
			metadata: {
				title: "영역",
				author: "test",
				createdAt: timestamp,
				updatedAt: timestamp,
			},
			pattern: { id: "list-stack", variant: "default" },
			props: { name: "영역" },
			children: [{ kind: "component", id: "component-title" }],
		},
	],
	components: [
		{
			id: "component-title",
			type: "SectionHeader",
			version: "1.0.0",
			metadata: {
				title: "타이틀",
				author: "test",
				createdAt: timestamp,
				updatedAt: timestamp,
			},
			pattern: { id: "component-section-header", variant: "default" },
			children: [{ component: { type: "SectionHeader" }, props: { title: "안녕하세요" } }],
		},
	],
	warnings: [],
};

describe("promoteDatabaseTablesCandidate", () => {
	it("wraps a valid candidate into database/tables file payloads", () => {
		const result = promoteDatabaseTablesCandidate(candidate);

		expect(result.ok).toBe(true);
		expect(errorsOf(result)).toEqual([]);
		expect(result.data?.["screens.json"].screens).toHaveLength(1);
		expect(result.data?.["areas.json"].areas[0]?.id).toBe("area-main");
	});

	it("blocks candidates with missing references", () => {
		const area = candidate.areas[0];
		if (!area) throw new Error("test candidate requires one area");
		const broken: MaterializedNodeTree = {
			...candidate,
			areas: [
				{
					...area,
					children: [{ kind: "component", id: "missing-component" }],
				},
			],
		};

		const result = promoteDatabaseTablesCandidate(broken);

		expect(result.ok).toBe(false);
		expect(errorsOf(result).map((i) => i.message)).toContain(
			"area-main: missing component missing-component",
		);
		expect(result.data).toBeUndefined();
	});
});
