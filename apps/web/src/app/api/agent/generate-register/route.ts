import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { registerAssets } from "@cx/agent/register-assets";
import { generateRegisterFromClientImport } from "@/features/agent-asset-pipeline/generate-register-from-client-import";

const DATABASE_DIR = path.join(process.cwd(), "..", "..", "database");
const CLIENT_IMPORTS_DIR = path.join(DATABASE_DIR, "client-imports");
const AI_IMPORTS_DIR = path.join(DATABASE_DIR, "ai-imports");
const GENERATED_REGISTER_PATH = path.join(AI_IMPORTS_DIR, "agent-assets.generated.json");

export async function POST(request: Request) {
	const body = (await request.json().catch(() => ({}))) as { importId?: unknown };
	const importId = typeof body.importId === "string" ? body.importId : "";

	if (!importId || importId.includes("..") || importId.includes("/") || importId.includes("\\")) {
		return NextResponse.json({ error: "importId is invalid" }, { status: 400 });
	}

	const importDir = path.join(CLIENT_IMPORTS_DIR, importId);
	const [screenFiles, organismFiles] = await Promise.all([
		readMarkdownFiles(path.join(importDir, "screen")),
		readMarkdownFiles(path.join(importDir, "organism")),
	]);

	if (screenFiles.length === 0 && organismFiles.length === 0) {
		return NextResponse.json(
			{ error: "No markdown files found in the selected client import." },
			{ status: 400 },
		);
	}

	const generated = generateRegisterFromClientImport({
		importId,
		organismFiles,
		screenFiles,
	});
	const registry = registerAssets(generated);

	await mkdir(AI_IMPORTS_DIR, { recursive: true });
	await writeFile(GENERATED_REGISTER_PATH, `${JSON.stringify(generated, null, "\t")}\n`, "utf8");

	return NextResponse.json({
		generated,
		registry,
		warnings: registry.warnings,
		writtenPath: "database/ai-imports/agent-assets.generated.json",
	});
}

async function readMarkdownFiles(directory: string) {
	const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
	const files = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
		.sort((left, right) => left.name.localeCompare(right.name));

	return Promise.all(
		files.map(async (file) => ({
			name: file.name,
			content: await readFile(path.join(directory, file.name), "utf8"),
		})),
	);
}
