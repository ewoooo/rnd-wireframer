import type { CompositionOutput, ValidationIssue } from "@cx/types";

import { makeIssue } from "../validate/rules/shared/issue";
import { CompositionOutputSchema } from "./schema";

export interface ParseCompositionResult {
	ok: boolean;
	output?: CompositionOutput;
	issues: ValidationIssue[];
}

/**
 * LLM이 돌려준 raw 값을 Schema B 모양으로 파싱.
 * - structured_output 으로 받은 object 또는 result 문자열을 입력
 * - Zod 실패는 ValidationIssue로 변환해 Validator 파이프라인과 같은 신호로 만든다
 */
export function parseCompositionOutput(raw: unknown): ParseCompositionResult {
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

	const parsed = CompositionOutputSchema.safeParse(candidate.value);
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
		output: parsed.data as CompositionOutput,
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

/**
 * LLM이 종종 ```json ... ``` 로 감싸 반환. structured_output 미적용 fallback.
 * 첫 fence와 마지막 fence를 제거. fence가 없으면 원문 반환.
 */
function stripCodeFence(text: string): string {
	const trimmed = text.trim();
	if (!trimmed.startsWith("```")) return trimmed;
	const firstNewline = trimmed.indexOf("\n");
	if (firstNewline < 0) return trimmed;
	const body = trimmed.slice(firstNewline + 1);
	const lastFence = body.lastIndexOf("```");
	return lastFence >= 0 ? body.slice(0, lastFence).trim() : body.trim();
}
