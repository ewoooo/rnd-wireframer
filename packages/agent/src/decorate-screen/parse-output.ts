import type { DecoratedOutput, ValidationIssue } from "@cx/types";

import { makeIssue } from "../validate/rules/shared/issue";
import { DecoratedOutputSchema } from "./schema";

export interface ParseDecoratedResult {
	ok: boolean;
	output?: DecoratedOutput;
	issues: ValidationIssue[];
}

export function parseDecoratedOutput(raw: unknown): ParseDecoratedResult {
	const candidate = coerceCandidate(raw);
	if (!candidate.ok) {
		return {
			ok: false,
			issues: [
				makeIssue(
					"schema.invalid",
					"schema",
					`LLM 응답을 JSON 객체로 파싱하지 못함: ${candidate.error}`,
				),
			],
		};
	}

	const parsed = DecoratedOutputSchema.safeParse(candidate.value);
	if (!parsed.success) {
		const issues: ValidationIssue[] = parsed.error.issues.map((zi) =>
			makeIssue("schema.invalid", "schema", zi.message, {
				path: zi.path as ReadonlyArray<string | number>,
				data: { code: zi.code },
			}),
		);
		return { ok: false, issues };
	}

	return {
		ok: true,
		output: parsed.data as DecoratedOutput,
		issues: [],
	};
}

function coerceCandidate(raw: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
	if (raw && typeof raw === "object") return { ok: true, value: raw };
	if (typeof raw === "string") {
		const stripped = stripCodeFence(raw);
		try {
			return { ok: true, value: JSON.parse(stripped) };
		} catch (err) {
			return { ok: false, error: (err as Error).message };
		}
	}
	return { ok: false, error: `unexpected raw type: ${typeof raw}` };
}

function stripCodeFence(text: string): string {
	const trimmed = text.trim();
	if (!trimmed.startsWith("```")) return trimmed;
	const firstNewline = trimmed.indexOf("\n");
	if (firstNewline < 0) return trimmed;
	const body = trimmed.slice(firstNewline + 1);
	const lastFence = body.lastIndexOf("```");
	return lastFence >= 0 ? body.slice(0, lastFence).trim() : body.trim();
}
