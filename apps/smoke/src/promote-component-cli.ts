import {
	getComponentCatalogStatus,
	listCandidateComponentEntries,
} from "@cx/components/catalog";

/**
 * Promotion helper (candidate -> stable). Candidate metadata lives in code
 * (`candidate-entries.ts`), so the actual move is a human-reviewed code edit.
 * This command validates the transition is legal and prints what to move.
 */
function main() {
	const type = process.argv[2];
	if (!type) {
		console.error("Usage: tsx apps/smoke/src/promote-component-cli.ts <ComponentType>");
		process.exitCode = 1;
		return;
	}

	const status = getComponentCatalogStatus(type);
	if (status === undefined) {
		console.error(`'${type}' is not in the catalog.`);
		process.exitCode = 1;
		return;
	}
	if (status !== "candidate") {
		console.error(`'${type}' is not a candidate (status: ${status}). Nothing to promote.`);
		process.exitCode = 1;
		return;
	}

	const entry = listCandidateComponentEntries().find((candidate) => candidate.type === type);

	console.log(`Promote '${type}' (candidate -> stable):`);
	console.log(`1. Move the component: src/candidates/${type}/ -> src/components/${type}/`);
	console.log(`2. Update its export path in packages/component/src/index.ts`);
	console.log("3. Move the catalog entry: candidate-entries.ts -> component-entries.ts (status becomes stable)");
	console.log("\nEntry to move:");
	console.log(JSON.stringify(entry, null, 2));
}

main();
