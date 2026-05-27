import type { ComponentCatalog } from "@cx/components/types";
import {
	validateAgentResult,
	validateComponentUsage,
	validateLayoutProps,
	validateRenderTree,
	validateSchemaArtifact,
} from "@cx/validation";
import { describe, expect, it } from "vitest";

const testCatalog = {
	ActionButton: {
		type: "ActionButton",
		source: "react-component",
		version: "1.0.0",
		kind: "action",
		props: {
			label: { type: "string", required: true },
			variant: { type: "enum", values: ["primary", "secondary"] },
			disabled: { type: "boolean" },
			rightIcon: { type: "node", aiWritable: false },
		},
	},
} satisfies ComponentCatalog;

describe("@cx/validation validators", () => {
	it("reports unknown component types as errors", () => {
		const report = validateComponentUsage(
			{ type: "MissingCard", props: {} },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues[0]).toMatchObject({
			code: "unknown-component-type",
			severity: "error",
		});
	});

	it("reports missing required props as errors", () => {
		const report = validateComponentUsage(
			{ type: "ActionButton", props: { variant: "primary" } },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "required-field-missing",
				path: ["props", "label"],
				severity: "error",
			}),
		);
	});

	it("reports invalid enum values as errors", () => {
		const report = validateComponentUsage(
			{ type: "ActionButton", props: { label: "가입하기", variant: "ghost" } },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-enum-value",
				path: ["props", "variant"],
				severity: "error",
			}),
		);
	});

	it("reports unknown props as warnings", () => {
		const report = validateComponentUsage(
			{ type: "ActionButton", props: { label: "가입하기", trackingId: "cta-1" } },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(true);
		expect(report.summary.warningCount).toBe(1);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "unknown-prop",
				path: ["props", "trackingId"],
				severity: "warning",
			}),
		);
	});

	it("reports aiWritable false props as errors", () => {
		const report = validateComponentUsage(
			{ type: "ActionButton", props: { label: "가입하기", rightIcon: null } },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "readonly-prop-written",
				path: ["props", "rightIcon"],
				severity: "error",
			}),
		);
	});

	it("reports invalid Screen region structure as errors", () => {
		const report = validateRenderTree(
			{
				version: "render-tree.v0.1",
				metadata: { id: "tree" },
				children: [
					{
						type: "Screen",
						componentVersion: "0.1.0",
						metadata: { id: "screen", title: "Screen" },
						children: [
							screenRegion("Screen.Contents", "contents"),
							screenRegion("Screen.Header", "header"),
							screenRegion("Screen.Bottom", "bottom"),
						],
					},
				],
			},
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-render-node",
				path: ["children", 0, "children", 0, "type"],
			}),
		);
	});

	it("accepts a valid RenderTree", () => {
		const report = validateRenderTree(validRenderTree(), { componentCatalog: testCatalog });

		expect(report).toMatchObject({
			ok: true,
			summary: {
				errorCount: 0,
				warningCount: 0,
			},
			target: "render-tree",
		});
	});

	it("validates RenderTree JSON Schema before semantic validation", () => {
		const report = validateSchemaArtifact("render-tree", {
			version: "render-tree.v0.1",
			metadata: { id: "tree", title: "Top-level title is not allowed" },
			children: [],
		});

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "schema-invalid",
				path: ["metadata"],
			}),
		);
	});

	it("validates layout prop enums and number props", () => {
		const report = validateLayoutProps({
			type: "Layout.Flex",
			props: {
				direction: "diagonal",
				gap: "wide",
			},
		});

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-enum-value",
				path: ["props", "direction"],
			}),
		);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-layout-prop",
				path: ["props", "gap"],
			}),
		);
	});

	it("rejects agent results that contain free React or HTML code", () => {
		const report = validateAgentResult({
			renderTree: validRenderTree(),
			code: "export function Screen() { return (<div />); }",
		});

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-render-node",
				path: ["code"],
			}),
		);
	});
});

function validRenderTree() {
	return {
		version: "render-tree.v0.1",
		metadata: { id: "tree" },
		children: [
			{
				type: "Screen",
				componentVersion: "0.1.0",
				metadata: { id: "screen", title: "Screen" },
				children: [
					screenRegion("Screen.Header", "header"),
					{
						type: "Screen.Contents",
						metadata: { id: "contents", title: "Contents" },
						props: {
							layout: { direction: "column", gap: 12 },
							scroll: true,
						},
						children: [
							{
								type: "ActionButton",
								componentVersion: "1.0.0",
								metadata: { id: "cta", title: "CTA" },
								props: {
									label: "가입하기",
									variant: "primary",
								},
							},
						],
					},
					screenRegion("Screen.Bottom", "bottom"),
				],
			},
		],
	};
}

function screenRegion(type: "Screen.Header" | "Screen.Contents" | "Screen.Bottom", id: string) {
	const base = {
		type,
		componentVersion: "0.1.0",
		metadata: { id, title: id },
		props: {
			layout: { direction: "column" },
			position: "static",
		},
		children: [],
	};

	if (type === "Screen.Contents") {
		return {
			...base,
			props: {
				layout: { direction: "column" },
				scroll: true,
			},
		};
	}

	return base;
}
