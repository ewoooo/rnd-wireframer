#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "packages/inference/src/pipelines";
// Patterns anchor on the import specifier (`from "..."`) so comments and unrelated
// substrings don't false-positive. The trailing `["'/]` matches either the closing
// quote or a subpath separator, catching `@cx/pipeline/x` and `node:fs/promises`
// while excluding sibling packages like `@cx/pipeline-utils`.
const FORBIDDEN = [
	{
		pattern: /from\s+["']@cx\/pipeline["'/]/,
		why: "@cx/pipeline (deprecated screen-generation internals)",
	},
	{ pattern: /from\s+["']@cx\/inference-nodes["'/]/, why: "@cx/inference-nodes (deprecated)" },
	{ pattern: /from\s+["']apps\//, why: "apps/* (pipelines must not import app code)" },
	{ pattern: /from\s+["']node:fs["'/]/, why: "node:fs (pipelines must be pure declarations)" },
];

function walk(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else if (full.endsWith(".ts")) out.push(full);
	}
	return out;
}

let failed = false;
let files = [];
try {
	files = walk(ROOT);
} catch {
	// Directory may not exist yet; nothing to check.
	process.exit(0);
}

for (const file of files) {
	const lines = readFileSync(file, "utf8").split("\n");
	lines.forEach((line, index) => {
		for (const { pattern, why } of FORBIDDEN) {
			if (pattern.test(line)) {
				console.error(`[inference-boundaries] ${file}:${index + 1}: forbidden import — ${why}`);
				failed = true;
			}
		}
	});
}

if (failed) {
	console.error(
		"\nPipeline definitions under packages/inference/src/pipelines must be pure declarations.",
	);
	process.exit(1);
}
console.log(`[inference-boundaries] ok (${files.length} file(s) checked)`);
