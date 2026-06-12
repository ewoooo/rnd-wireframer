import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createClaudeAgentSdkRunner } from "../claude-agent-sdk-runner";

function makeFakeBin(mode: "structured" | "reject"): {
	bin: string;
	argvOut: string;
} {
	const dir = mkdtempSync(join(tmpdir(), "fakeclaude-"));
	const bin = join(dir, "claude");
	const argvOut = join(dir, "argv.log");
	writeFileSync(
		bin,
		`#!/usr/bin/env node
const argv = process.argv.slice(2);
require("node:fs").appendFileSync(process.env.ARGV_OUT, JSON.stringify(argv) + "\\n");
const hasSchema = argv.includes("--json-schema");
if (process.env.MODE === "reject" && hasSchema) { process.stdout.write("NOT JSON ERROR"); process.exit(0); }
if (process.env.MODE === "reject") { process.stdout.write(JSON.stringify({ result: '{"ok":true}' })); process.exit(0); }
process.stdout.write(JSON.stringify({ result: "ignored", structured_output: { ok: true } }));
`,
	);
	chmodSync(bin, 0o755);
	process.env.ARGV_OUT = argvOut;
	process.env.MODE = mode;
	return { bin, argvOut };
}

function readArgvCalls(argvOut: string): string[][] {
	return readFileSync(argvOut, "utf8")
		.trim()
		.split("\n")
		.filter((line) => line.length > 0)
		.map((line) => JSON.parse(line) as string[]);
}

describe("createClaudeAgentSdkRunner structured output", () => {
	it("passes a meta-stripped --json-schema and returns structured_output as payload", async () => {
		const { bin, argvOut } = makeFakeBin("structured");
		const run = createClaudeAgentSdkRunner({ claudeBin: bin });

		const res = await run({
			taskKind: "screen-generation",
			input: {
				query: "q",
				context: {
					jsonSchema: { $schema: "x", $id: "y", title: "z", type: "object" },
				},
			},
			prompt: { system: "s", user: "u", metadata: {} },
		} as never);

		expect(res.payload).toEqual({ ok: true });

		const calls = readArgvCalls(argvOut);
		expect(calls).toHaveLength(1);
		const argv = calls[0];
		expect(argv).toContain("--json-schema");
		const schemaArg = argv[argv.indexOf("--json-schema") + 1];
		const passedSchema = JSON.parse(schemaArg) as Record<string, unknown>;
		expect(passedSchema).toEqual({ type: "object" });
		expect(passedSchema).not.toHaveProperty("$schema");
		expect(passedSchema).not.toHaveProperty("$id");
		expect(passedSchema).not.toHaveProperty("title");
	});

	it("falls back without --json-schema when the schema is rejected (non-JSON stdout)", async () => {
		const { bin, argvOut } = makeFakeBin("reject");
		const run = createClaudeAgentSdkRunner({ claudeBin: bin });

		const res = await run({
			taskKind: "screen-generation",
			input: {
				query: "q",
				context: {
					jsonSchema: { $schema: "x", $id: "y", title: "z", type: "object" },
				},
			},
			prompt: { system: "s", user: "u", metadata: {} },
		} as never);

		expect(res.payload).toEqual({ ok: true });

		const calls = readArgvCalls(argvOut);
		expect(calls).toHaveLength(2);
		expect(calls[0]).toContain("--json-schema");
		expect(calls[1]).not.toContain("--json-schema");
	});

	it("passes no --json-schema arg when no schema is in context", async () => {
		const { bin, argvOut } = makeFakeBin("reject");
		const run = createClaudeAgentSdkRunner({ claudeBin: bin });

		const res = await run({
			taskKind: "screen-generation",
			input: { query: "q", context: {} },
			prompt: { system: "s", user: "u", metadata: {} },
		} as never);

		expect(res.payload).toEqual({ ok: true });

		const calls = readArgvCalls(argvOut);
		expect(calls).toHaveLength(1);
		expect(calls[0]).not.toContain("--json-schema");
	});
});
