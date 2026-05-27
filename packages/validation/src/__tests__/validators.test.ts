import type { ComponentCatalog } from "@cx/components/types";
import {
	validateAgentResult,
	validateComponentUsage,
	validateLayoutProps,
	validateRenderTree,
	validateSchemaArtifact,
	validateTableGenerationResult,
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

it("requires table-shaped generation records to consume real pattern refs", () => {
	const result = validTableGenerationResult();
	const report = validateTableGenerationResult(result);

	expect(report.ok).toBe(true);
});

it("rejects table-shaped generation records with missing pattern refs", () => {
	const result = validTableGenerationResult();
	delete (result.areas[0] as Record<string, unknown>).pattern;
	const report = validateSchemaArtifact("table-generation-result", result);

	expect(report.ok).toBe(false);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "schema-invalid",
			path: ["areas", 0],
		}),
	);
});

it("rejects table-shaped generation records with unknown pattern ids", () => {
	const result = validTableGenerationResult();
	result.components[0].pattern.id = "missing-component-pattern";
	const report = validateTableGenerationResult(result);

	expect(report.ok).toBe(false);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "unknown-pattern-ref",
			path: ["components", 0, "pattern"],
		}),
	);
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
				pattern: screenPattern("screen"),
				children: [
					screenRegion("Screen.Header", "header"),
					{
						type: "Screen.Contents",
						metadata: { id: "contents", title: "Contents" },
						pattern: areaPattern("1"),
						props: {
							layout: { direction: "column", gap: 12 },
							scroll: true,
						},
						children: [
							{
								type: "ActionButton",
								componentVersion: "1.0.0",
								metadata: { id: "cta", title: "CTA" },
								pattern: areaPattern("1"),
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
		pattern: id === "header" ? areaPattern("0") : screenPattern(id),
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

function screenPattern(targetRef: string) {
	return {
		id: targetRef === "screen" ? "screen-shell" : "plain-stack",
		variant: "default",
	};
}

function areaPattern(targetRef: string) {
	return {
		id: targetRef === "1" ? "product-hero-summary" : "area-app-bar",
		variant: "default",
	};
}

function validTableGenerationResult() {
	return {
		schemaVersion: "table-generation-result.v0.1",
		screen: {
			id: "screen-1",
			version: "0.1.0",
			metadata: { title: "Screen 1" },
			screenVariantId: "screen-1",
			pattern: { id: "commerce-detail-screen", variant: "default" },
			screen: {
				type: "screen.page",
				regions: {
					header: tableRegion("Screen.Header", "plain-stack", [{ kind: "area", id: "area-1" }]),
					contents: tableRegion("Screen.Contents", "subscription-detail-rich-content", [
						{ kind: "area", id: "area-2" },
					]),
					bottom: tableRegion("Screen.Bottom", "commerce-detail-bottom-action", []),
				},
			},
		},
		areas: [
			{
				id: "area-1",
				version: "0.1.0",
				metadata: { title: "Header area" },
				pattern: { id: "area-app-bar", variant: "default" },
				type: "area.dynamic",
				children: [{ kind: "component", id: "appbar" }],
			},
		],
		components: [
			{
				id: "appbar",
				version: "0.1.0",
				metadata: { title: "App bar" },
				pattern: { id: "component-app-bar", variant: "default" },
				type: "AppBar",
				children: [{ component: { type: "AppBar" }, props: { title: "Screen 1" } }],
			},
		],
	};
}

function tableRegion(
	type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header",
	patternId: string,
	children: Array<{ kind: "area" | "component"; id: string }>,
) {
	return {
		type,
		metadata: { title: type },
		pattern: { id: patternId, variant: "default" },
		children,
	};
}
