import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createScreenSourceTarget, isMarkdownSourceFileName } from "@/lib/screen-inference-source";

export const runtime = "nodejs";

const CLIENT_IMPORT_ROOT = path.join(process.cwd(), "data/client-imports");
const MAX_SOURCE_BYTES = 1024 * 1024;

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file");

		if (!(file instanceof File)) {
			return NextResponse.json({ error: "Missing file." }, { status: 400 });
		}
		if (!isMarkdownSourceFileName(file.name)) {
			return NextResponse.json(
				{ error: "MVP only accepts Markdown source files." },
				{ status: 400 },
			);
		}
		if (file.size > MAX_SOURCE_BYTES) {
			return NextResponse.json({ error: "Markdown source file is too large." }, { status: 413 });
		}

		const target = createScreenSourceTarget({
			batchId: readOptionalFormValue(formData, "batchId"),
			clientImportRoot: CLIENT_IMPORT_ROOT,
			fileName: file.name,
			importId: readOptionalFormValue(formData, "importId"),
			repoRoot: process.cwd(),
		});

		await mkdir(target.directoryPath, { recursive: true });
		await writeFile(target.absolutePath, await file.text(), "utf8");

		return NextResponse.json({
			source: {
				batchId: target.batchId,
				importId: target.importId,
				path: target.path,
				screenId: target.screenId,
				type: target.type,
			},
		});
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}

function readOptionalFormValue(formData: FormData, key: string): string | undefined {
	const value = formData.get(key);
	return typeof value === "string" && value ? value : undefined;
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to upload screen source.";
}
