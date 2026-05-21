import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SampleRenderEntry, SampleScreen, SampleScreenSet } from "./tables-to-render-tree";

const SAMPLE_SCREENS_PATH = getSampleScreensPath();

export async function readSampleScreenSet(): Promise<SampleScreenSet> {
	const file = await readFile(SAMPLE_SCREENS_PATH, "utf8");
	return JSON.parse(file) as SampleScreenSet;
}

export async function updateSampleScreenOrganismOrder({
	organismCodes,
	screenCode,
}: {
	organismCodes: string[];
	screenCode: string;
}) {
	const screenSet = await readSampleScreenSet();
	const screen = screenSet.screens.find((candidate) => candidate.id === screenCode);

	if (!screen) {
		return {
			ok: false as const,
			error: `Screen not found: ${screenCode}`,
			status: 404,
		};
	}

	const currentOrganismCodes = getScreenOrganismCodes(screen);
	const missingCodes = currentOrganismCodes.filter((code) => !organismCodes.includes(code));
	const unknownCodes = organismCodes.filter((code) => !currentOrganismCodes.includes(code));

	if (missingCodes.length > 0 || unknownCodes.length > 0) {
		return {
			ok: false as const,
			error: [
				missingCodes.length > 0 ? `Missing organism codes: ${missingCodes.join(", ")}` : "",
				unknownCodes.length > 0 ? `Unknown organism codes: ${unknownCodes.join(", ")}` : "",
			]
				.filter(Boolean)
				.join("; "),
			status: 400,
		};
	}

	if (currentOrganismCodes.join("\n") === organismCodes.join("\n")) {
		return {
			ok: true as const,
			screen,
		};
	}

	reorderScreenRegionOrganisms(screen, organismCodes);
	await writeFile(SAMPLE_SCREENS_PATH, `${JSON.stringify(screenSet, null, "\t")}\n`, "utf8");

	return {
		ok: true as const,
		screen,
	};
}

function getScreenOrganismCodes(screen: SampleScreen) {
	return getRegionChildren(screen)
		.filter((child) => child.kind === "organism")
		.map((child) => child.organismId);
}

function reorderScreenRegionOrganisms(screen: SampleScreen, organismCodes: string[]) {
	const organismByCode = new Map(
		getRegionChildren(screen)
			.filter((child) => child.kind === "organism")
			.map((child) => [child.organismId, child]),
	);
	const nextOrganisms = organismCodes.map((code) => organismByCode.get(code)).filter(isRenderEntry);
	let nextOrganismIndex = 0;

	screen.screen.regions.contents.children = getRegionChildren(screen).map((child) => {
		if (child.kind !== "organism") return child;
		const nextOrganism = nextOrganisms[nextOrganismIndex];
		nextOrganismIndex += 1;
		return nextOrganism ?? child;
	});
	screen.metadata.updatedAt = new Date().toISOString();
	screen.screen.metadata.updatedAt = screen.metadata.updatedAt;
}

function getRegionChildren(screen: SampleScreen) {
	return screen.screen.regions.contents.children ?? [];
}

function isRenderEntry(entry: SampleRenderEntry | undefined): entry is SampleRenderEntry {
	return Boolean(entry);
}

function getSampleScreensPath() {
	const cwd = process.cwd();
	const webRoot = cwd.endsWith(`${path.sep}apps${path.sep}web`)
		? cwd
		: path.join(cwd, "apps", "web");

	return path.join(webRoot, "src", "app", "data", "sample", "screens.json");
}
