import type { ValidationIssue, ValidationResult } from "@cx/types";
import type {
	GeneratedAreaNode,
	GeneratedComponentNode,
	GeneratedNodeTree,
	GeneratedScreenNode,
} from "../types";

export interface ClientImportMarkdownFile {
	name: string;
	content: string;
}

export interface ParseClientImportMarkdownBundleInput {
	importId: string;
	areaFiles: ClientImportMarkdownFile[];
	screenFiles: ClientImportMarkdownFile[];
}

export type ClientImportValidationReport = ValidationResult<GeneratedNodeTree>;

export interface ParsedClientImportBundle {
	generated: GeneratedNodeTree;
	validation: ClientImportValidationReport;
}

function schemaIssue(
	severity: "error" | "warning",
	message: string,
	data?: Record<string, unknown>,
): ValidationIssue {
	return { code: "schema.invalid", severity, layer: "schema", message, data };
}

function referenceIssue(message: string, data?: Record<string, unknown>): ValidationIssue {
	return { code: "reference.missing-area", severity: "error", layer: "reference", message, data };
}

export function parseClientImportMarkdownBundle({
	importId,
	areaFiles,
	screenFiles,
}: ParseClientImportMarkdownBundleInput): ParsedClientImportBundle {
	const areas = areaFiles.map((file, index) => parseAreaFile(file, index));
	const componentById = new Map<string, GeneratedComponentNode>();

	for (const area of areas) {
		for (const componentRef of area.children ?? []) {
			if (componentById.has(componentRef.componentId)) continue;
			componentById.set(componentRef.componentId, {
				id: componentRef.componentId,
				name: componentRef.componentId,
				order: componentById.size + 1,
				type: "Unknown",
			});
		}
	}

	for (const file of areaFiles) {
		for (const component of parseComponents(file.content)) {
			componentById.set(component.id, {
				...componentById.get(component.id),
				...component,
			});
		}
	}

	const screens = screenFiles.map((file, index) => parseScreenFile(file, index));
	const routeName = getRouteName(screens, importId);
	const generated: GeneratedNodeTree = {
		routes: [
			{
				id: slugify(importId),
				name: routeName,
				order: 1,
				variants: [
					{
						id: `${slugify(importId)}-base`,
						name: `${routeName} 기본 흐름`,
						order: 1,
						screens,
					},
				],
			},
		],
		areas,
		components: Array.from(componentById.values()).sort((left, right) => {
			return (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id);
		}),
	};

	return {
		generated,
		validation: validateClientImportGeneratedTree(generated),
	};
}

export function validateClientImportGeneratedTree(
	generated: GeneratedNodeTree,
): ClientImportValidationReport {
	const issues: ValidationIssue[] = [];
	const areaIds = new Set((generated.areas ?? []).map((area) => area.id));
	const componentIds = new Set((generated.components ?? []).map((component) => component.id));

	if (generated.routes.length === 0) issues.push(schemaIssue("error", "route is required"));
	if ((generated.areas ?? []).length === 0)
		issues.push(schemaIssue("warning", "area files were not parsed"));
	if ((generated.components ?? []).length === 0)
		issues.push(schemaIssue("warning", "component rows were not parsed"));

	for (const route of generated.routes) {
		if (!route.id) issues.push(schemaIssue("error", "route.id is required"));
		if (route.variants.length === 0)
			issues.push(schemaIssue("error", `${route.id}: variant is required`));
		for (const variant of route.variants) {
			if (!variant.id) issues.push(schemaIssue("error", `${route.id}: variant.id is required`));
			if (variant.screens.length === 0)
				issues.push(schemaIssue("error", `${variant.id}: screen is required`));
			for (const screen of variant.screens) {
				if (!screen.id) issues.push(schemaIssue("error", `${variant.id}: screen.id is required`));
				if ((screen.areas ?? []).length === 0)
					issues.push(schemaIssue("warning", `${screen.id}: area refs are empty`));
				for (const areaRef of screen.areas ?? []) {
					if (!areaIds.has(areaRef.areaId)) {
						issues.push(referenceIssue(`${screen.id}: missing area ${areaRef.areaId}`));
					}
				}
			}
		}
	}

	for (const area of generated.areas ?? []) {
		if (!area.id) issues.push(schemaIssue("error", "area.id is required"));
		if ((area.children ?? []).length === 0)
			issues.push(schemaIssue("warning", `${area.id}: component refs are empty`));
		for (const componentRef of area.children ?? []) {
			if (!componentIds.has(componentRef.componentId)) {
				issues.push(referenceIssue(`${area.id}: missing component ${componentRef.componentId}`));
			}
		}
	}

	for (const component of generated.components ?? []) {
		if (!component.id) issues.push(schemaIssue("error", "component.id is required"));
		if (!component.type || component.type === "Unknown") {
			issues.push(schemaIssue("warning", `${component.id}: component.type is unknown`));
		}
	}

	issues.push(...findDuplicateIdIssues("area", [...areaIds]));
	issues.push(...findDuplicateIdIssues("component", [...componentIds]));

	return {
		ok: !issues.some((issue) => issue.severity === "error"),
		issues,
		data: generated,
	};
}

function parseScreenFile(file: ClientImportMarkdownFile, index: number): GeneratedScreenNode {
	const frontmatter = parseFrontmatter(file.content);
	const rows = parseMarkdownTableAfterHeading(file.content, "화면 구성");
	const areas = rows
		.map((row, rowIndex) => ({
			areaId: row["오가니즘 ID"] ?? "",
			order: parseOrder(row.no) ?? rowIndex + 1,
		}))
		.filter((row) => row.areaId);

	return {
		id: frontmatter["화면 ID"] ?? file.name.replace(/\.md$/i, ""),
		name: frontmatter["화면 명"] ?? frontmatter["화면 ID"] ?? file.name.replace(/\.md$/i, ""),
		order: index + 1,
		description: frontmatter["화면 설명"],
		surface: "page",
		areas,
	};
}

function parseAreaFile(file: ClientImportMarkdownFile, index: number): GeneratedAreaNode {
	const frontmatter = parseFrontmatter(file.content);
	const infoRows = parseMarkdownTableAfterHeading(file.content, "오가니즘 정보");
	const detailRows = parseMarkdownTableAfterHeading(file.content, "컴포넌트 상세");
	const firstInfo = infoRows[0];

	return {
		id: frontmatter["오가니즘 ID"] ?? file.name.replace(/\.md$/i, ""),
		name:
			frontmatter["오가니즘 명"] ?? frontmatter["오가니즘 ID"] ?? file.name.replace(/\.md$/i, ""),
		order: index + 1,
		description: frontmatter["오가니즘 설명"],
		layout: firstInfo?.["오가니즘 레이아웃"],
		children: detailRows
			.map((row, rowIndex) => ({
				componentId: row["컴포넌트 명"] ?? "",
				order: parseOrder(row.no) ?? rowIndex + 1,
			}))
			.filter((row) => row.componentId),
	};
}

function parseComponents(content: string): GeneratedComponentNode[] {
	const components: GeneratedComponentNode[] = [];

	parseMarkdownTableAfterHeading(content, "컴포넌트 상세").forEach((row, index) => {
		const id = row["컴포넌트 명"];
		if (!id) return;

		components.push({
			id,
			name: row["컴포넌트 설명"] ?? id,
			order: parseOrder(row.no) ?? index + 1,
			type: row["컴포넌트 ID"] ?? "Unknown",
			...(row.variant && row.variant !== "-" ? { props: { variant: row.variant } } : {}),
			raw: {
				description: row["컴포넌트 설명"],
				variant: row.variant,
				note: row.비고,
			},
		});
	});

	return components;
}

function parseFrontmatter(content: string) {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	const body = match?.[1] ?? "";
	const entries = body
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const separatorIndex = line.indexOf(":");
			if (separatorIndex < 0) return undefined;
			return [line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()] as const;
		})
		.filter(isEntry);

	return Object.fromEntries(entries);
}

function parseMarkdownTableAfterHeading(content: string, heading: string) {
	const headingIndex = content.indexOf(`## ${heading}`);
	if (headingIndex < 0) return [];

	const afterHeading = content.slice(headingIndex);
	const nextHeadingIndex = afterHeading.slice(1).search(/\n##\s+/);
	const section =
		nextHeadingIndex >= 0 ? afterHeading.slice(0, nextHeadingIndex + 1) : afterHeading;
	const lines = section
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.startsWith("|"));
	const headerLine = lines[0];
	if (!headerLine) return [];

	const headers = splitTableRow(headerLine);
	return lines.slice(2).map((line) => {
		const cells = splitTableRow(line);
		const row: Record<string, string> = {};
		headers.forEach((header, index) => {
			row[header] = normalizeCell(cells[index] ?? "");
		});
		return row;
	});
}

function splitTableRow(line: string) {
	return line
		.replace(/^\|/, "")
		.replace(/\|$/, "")
		.split("|")
		.map((cell) => cell.trim());
}

function normalizeCell(value: string) {
	return value.replace(/<br\s*\/?>/gi, "\n").trim();
}

function parseOrder(value: string | undefined) {
	const number = Number(value?.match(/\d+/)?.[0]);
	return Number.isFinite(number) ? number : undefined;
}

function getRouteName(screens: GeneratedScreenNode[], fallback: string) {
	const firstScreenName = screens[0]?.name;
	if (!firstScreenName) return fallback;
	return firstScreenName.includes("회원") ? "회원 가입" : fallback;
}

function slugify(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9가-힣]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function findDuplicateIdIssues(label: string, ids: string[]): ValidationIssue[] {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const id of ids) {
		if (seen.has(id)) duplicates.add(id);
		seen.add(id);
	}
	return Array.from(duplicates)
		.sort()
		.map<ValidationIssue>((id) => ({
			code: "reference.duplicate-id",
			severity: "error",
			layer: "reference",
			message: `${label} id is duplicated: ${id}`,
			data: { label, id },
		}));
}

function isEntry(entry: readonly [string, string] | undefined): entry is readonly [string, string] {
	return Boolean(entry);
}
