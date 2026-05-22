import type {
	ComponentAssetInput,
	OrganismAssetInput,
	RegisterAssetsInput,
	ScreenAssetInput,
} from "@cx/agent";

interface ClientImportMarkdownFile {
	name: string;
	content: string;
}

export interface GenerateRegisterFromClientImportInput {
	importId: string;
	organismFiles: ClientImportMarkdownFile[];
	screenFiles: ClientImportMarkdownFile[];
}

export function generateRegisterFromClientImport({
	importId,
	organismFiles,
	screenFiles,
}: GenerateRegisterFromClientImportInput): RegisterAssetsInput {
	const organisms = organismFiles.map((file, index) => parseOrganismFile(file, index));
	const componentById = new Map<string, ComponentAssetInput>();

	for (const organism of organisms) {
		for (const componentRef of organism.components ?? []) {
			if (componentById.has(componentRef.componentId)) continue;
			componentById.set(componentRef.componentId, {
				id: componentRef.componentId,
				name: componentRef.componentId,
				order: componentById.size + 1,
				type: "Unknown",
			});
		}
	}

	for (const file of organismFiles) {
		for (const component of parseComponents(file.content)) {
			componentById.set(component.id, {
				...componentById.get(component.id),
				...component,
			});
		}
	}

	const screens = screenFiles.map((file, index) => parseScreenFile(file, index));
	const routeName = getRouteName(screens, importId);

	return {
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
		organisms,
		components: Array.from(componentById.values()).sort((left, right) => {
			return (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id);
		}),
	};
}

function parseScreenFile(file: ClientImportMarkdownFile, index: number): ScreenAssetInput {
	const frontmatter = parseFrontmatter(file.content);
	const rows = parseMarkdownTableAfterHeading(file.content, "화면 구성");
	const organisms = rows
		.map((row, rowIndex) => ({
			organismId: row["오가니즘 ID"] ?? "",
			order: parseOrder(row.no) ?? rowIndex + 1,
		}))
		.filter((row) => row.organismId);

	return {
		id: frontmatter["화면 ID"] ?? file.name.replace(/\.md$/i, ""),
		name: frontmatter["화면 명"] ?? frontmatter["화면 ID"] ?? file.name.replace(/\.md$/i, ""),
		order: index + 1,
		description: frontmatter["화면 설명"],
		surface: "page",
		organisms,
	};
}

function parseOrganismFile(file: ClientImportMarkdownFile, index: number): OrganismAssetInput {
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
		components: detailRows
			.map((row, rowIndex) => ({
				componentId: row["컴포넌트 명"] ?? "",
				order: parseOrder(row.no) ?? rowIndex + 1,
			}))
			.filter((row) => row.componentId),
	};
}

function parseComponents(content: string): ComponentAssetInput[] {
	const components: ComponentAssetInput[] = [];

	parseMarkdownTableAfterHeading(content, "컴포넌트 상세").forEach((row, index) => {
		const id = row["컴포넌트 명"];
		if (!id) return;

		components.push({
			id,
			name: row["컴포넌트 설명"] ?? id,
			order: parseOrder(row.no) ?? index + 1,
			type: row["컴포넌트 ID"] ?? "Unknown",
			...(row.variant && row.variant !== "-" ? { props: { variant: row.variant } } : {}),
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

function getRouteName(screens: ScreenAssetInput[], fallback: string) {
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

function isEntry(entry: readonly [string, string] | undefined): entry is readonly [string, string] {
	return Boolean(entry);
}
