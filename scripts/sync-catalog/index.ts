import { execFileSync } from "node:child_process";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { catalogSource } from "../../packages/external/src/catalog.source";
import { buildCatalogModule, buildRegistryModule, deriveCatalog, findCatalogDrift } from "./lib";

const ROOT = resolve(import.meta.dirname, "..", "..");
const EXTERNAL_SRC = join(ROOT, "packages", "external", "src");
const COMPONENTS_DIR = join(EXTERNAL_SRC, "components");
const CATALOG_OUT = join(EXTERNAL_SRC, "catalog.generated.ts");
const REGISTRY_OUT = join(EXTERNAL_SRC, "registry.generated.ts");

function main() {
	const componentDirNames = readdirSync(COMPONENTS_DIR).filter((name) =>
		statSync(join(COMPONENTS_DIR, name)).isDirectory(),
	);

	const drift = findCatalogDrift(catalogSource, componentDirNames);
	if (drift.length > 0) {
		console.error("sync-catalog: drift between catalog.source.ts and components/:");
		for (const problem of drift) console.error(`  - ${problem}`);
		process.exit(1);
	}

	writeFileSync(CATALOG_OUT, buildCatalogModule(deriveCatalog(catalogSource)));
	writeFileSync(REGISTRY_OUT, buildRegistryModule(componentDirNames));
	execFileSync("pnpm", ["exec", "biome", "check", "--write", CATALOG_OUT, REGISTRY_OUT], {
		cwd: ROOT,
		stdio: "inherit",
	});

	const entries = Object.values(catalogSource);
	const stable = entries.filter((entry) => entry.source === "kiki-barrel").length;
	console.log(
		`sync-catalog: ${entries.length} entries (${stable} stable, ${entries.length - stable} candidate), ${componentDirNames.length} components`,
	);
}

main();
