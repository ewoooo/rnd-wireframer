import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const activeRoots = [
	"packages/agent/src/index.ts",
	"packages/agent/src/pipeline/index.ts",
	"packages/agent/src/pipeline/draft-tables-pipeline.ts",
	"packages/agent/src/pipeline/prdd-draft-tables.ts",
	"packages/agent/src/validate/index.ts",
	"packages/agent/src/validate/quality-backlog.ts",
	"packages/agent/src/validate/quality-report.ts",
	"packages/agent/src/register/prdd-parser.ts",
	"packages/agent/src/register/prdd-record-builder.ts",
	"packages/agent/src/register/register-prdd-screen.ts",
	"packages/agent/src/database/promote-database-tables.ts",
];

const forbidden = [
	"@cx/types/composition-output",
	"@cx/types/decorated-output",
	"../compose-screen",
	"../decorate-screen",
	"../design-review",
	"./run-pipeline",
	"./validate-composition",
	"./validate-decorated",
];

const violations = [];

for (const root of activeRoots) {
	await scanPath(root);
}

for (const violation of violations) {
	console.log(
		`${violation.file}:${violation.line}: active agent path must not import ${violation.match}`,
	);
}

if (violations.length > 0) {
	process.exitCode = 1;
} else {
	console.log("active agent boundary check passed.");
}

async function scanPath(path) {
	if (path.endsWith(".ts") || path.endsWith(".tsx")) {
		await checkFile(path);
		return;
	}

	let entries;
	try {
		entries = await readdir(path, { withFileTypes: true });
	} catch {
		return;
	}

	for (const entry of entries) {
		if (entry.name === "experimental.ts" || entry.name === "run-pipeline.ts") continue;
		const nextPath = join(path, entry.name);
		if (entry.isDirectory()) {
			await scanPath(nextPath);
		} else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
			await checkFile(nextPath);
		}
	}
}

async function checkFile(file) {
	const source = await readFile(file, "utf8");
	const lines = source.split(/\r?\n/);
	for (const [index, line] of lines.entries()) {
		if (!/\b(import|export)\b/.test(line)) continue;
		for (const match of forbidden) {
			if (line.includes(match)) {
				violations.push({ file, line: index + 1, match });
			}
		}
	}
}
