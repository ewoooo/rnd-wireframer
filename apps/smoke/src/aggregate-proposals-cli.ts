import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { aggregateProposals, type ProposalDocument } from "./proposal-aggregation/aggregate";

const DEFAULT_RUNS_DIR = "data/runs/screen-generation";

async function main() {
	const runsDir = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_RUNS_DIR);
	const docs = await readProposalDocuments(runsDir);
	const backlog = aggregateProposals(docs);

	if (backlog.length === 0) {
		console.log(`No component proposals found under ${runsDir}.`);
		return;
	}

	console.log(`Component proposal backlog (${docs.length} run(s)):`);
	for (const entry of backlog) {
		const near = entry.nearestCatalogMatches.join("/") || "-";
		console.log(`  ${String(entry.count).padStart(2)}x  ${entry.proposedComponentType}  (near ${near})`);
	}
}

async function readProposalDocuments(runsDir: string): Promise<ProposalDocument[]> {
	let runIds: string[];
	try {
		const entries = await readdir(runsDir, { withFileTypes: true });
		runIds = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
	} catch {
		return [];
	}

	const docs = await Promise.all(
		runIds.map(async (runId) => {
			const file = path.join(runsDir, runId, "artifacts", "component-proposal.json");
			try {
				return JSON.parse(await readFile(file, "utf8")) as ProposalDocument;
			} catch {
				return undefined;
			}
		}),
	);

	return docs.filter((doc): doc is ProposalDocument => doc !== undefined);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
