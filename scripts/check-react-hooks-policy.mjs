import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = process.argv.slice(2);
const scanRoots = roots.length > 0 ? roots : ["apps", "packages"];
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const ignoredDirectories = new Set([
	".git",
	".next",
	"build",
	"coverage",
	"dist",
	"node_modules",
	"out",
]);

const checks = [
	{
		pattern: /import\s*\{[^}]*\buseCallback\b[^}]*\}\s*from\s*["']react["']/,
		message:
			"useCallback import from react is banned. Prefer simpler data flow or component boundaries.",
	},
	{
		pattern: /import\s*\{[^}]*\buseMemo\b[^}]*\}\s*from\s*["']react["']/,
		message:
			"useMemo import from react is banned. Prefer simpler data flow or moving work out of render.",
	},
	{
		pattern: /\bReact\s*\.\s*useCallback\s*\(/,
		message: "React.useCallback is banned. Prefer simpler data flow or component boundaries.",
	},
	{
		pattern: /\bReact\s*\.\s*useMemo\s*\(/,
		message: "React.useMemo is banned. Prefer simpler data flow or moving work out of render.",
	},
	{
		pattern: /\b(?:const|let|var)\s*\{[^}]*\buseCallback\b[^}]*\}\s*=\s*React\b/,
		message: "Destructuring React.useCallback is banned.",
	},
	{
		pattern: /\b(?:const|let|var)\s*\{[^}]*\buseMemo\b[^}]*\}\s*=\s*React\b/,
		message: "Destructuring React.useMemo is banned.",
	},
];

const violations = [];

for (const root of scanRoots) {
	await scanPath(root);
}

for (const violation of violations) {
	console.log(`${violation.file}:${violation.line}: ${violation.message}`);
}

if (violations.length > 0) {
	process.exitCode = 1;
} else {
	console.log("react hooks policy check passed.");
}

async function scanPath(path) {
	let entries;
	try {
		entries = await readdir(path, { withFileTypes: true });
	} catch {
		return;
	}

	for (const entry of entries) {
		const nextPath = join(path, entry.name);
		if (entry.isDirectory()) {
			if (!ignoredDirectories.has(entry.name)) {
				await scanPath(nextPath);
			}
			continue;
		}
		if (!sourceExtensions.has(getExtension(entry.name))) continue;
		await checkFile(nextPath);
	}
}

async function checkFile(file) {
	const source = await readFile(file, "utf8");
	const lines = source.split(/\r?\n/);
	for (const [index, line] of lines.entries()) {
		for (const check of checks) {
			if (check.pattern.test(line)) {
				violations.push({
					file,
					line: index + 1,
					message: check.message,
				});
			}
		}
	}
}

function getExtension(fileName) {
	const match = fileName.match(/\.[^.]+$/);
	return match?.[0] ?? "";
}
