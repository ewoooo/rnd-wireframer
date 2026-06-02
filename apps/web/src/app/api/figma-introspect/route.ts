import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

// Dev-only sink: the Figma introspection probe POSTs its result here so we can
// read it from disk instead of copy-pasting from the Figma console.
const DEST = join(process.cwd(), "../../scripts/figma-introspect-result.json");

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function POST(request: Request) {
	const body = await request.text();
	await writeFile(DEST, body, "utf8");
	return NextResponse.json({ ok: true, bytes: body.length, dest: DEST }, { headers: CORS });
}

// CORS preflight (Figma plugin iframe is a null/foreign origin)
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
