import type { CatalogDeck, DesignDeck, LayoutPatternStoreDeck } from "@cx/types/ai-deck";
import type { CompositionOutput } from "@cx/types/composition-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
import type { ValidationIssue } from "@cx/types/validation";
import {
	type RunClaudeQueryOptions,
	type RunClaudeQueryResult,
	runClaudeQuery,
} from "../llm/claude-session";
import type { RetryHint, ValidatorContext, ValidatorResult } from "../validate/types";
import { validateComposition } from "../validate/validate-composition";

import { buildInitialPrompt, buildRetryPrompt, COMPOSE_SYSTEM_PROMPT } from "./build-prompt";
import { parseCompositionOutput } from "./parse-output";
import { type ArchetypeScaffold, buildArchetypeScaffold } from "./scaffold";
import { compositionOutputJsonSchema } from "./schema";

/**
 * Compose LLM #1 오케스트레이터. SPEC §9 #4.
 *
 * 1. PrddScreenRecord + 3 decks 로 초기 프롬프트 작성
 * 2. runClaudeQuery (Opus 4.7, structured output)
 * 3. parse + Validator #1
 * 4. 실패 시 RetryHints 기반 좁힌 재시도 (최대 maxRetries회)
 * 5. 성공/포기 시 ComposeScreenResult 반환
 *
 * LLM 호출은 의존성 주입 형태로도 받을 수 있어 단위 테스트에서 mock 가능.
 */

export interface ComposeScreenInput {
	prddScreenRecord: PrddScreenRecord;
	catalogDeck: CatalogDeck;
	designDeck: DesignDeck;
	layoutPatternStoreDeck: LayoutPatternStoreDeck;
	/** Validator 기준. 미지정 시 SSOT에서 직접 조회한다. */
	validationContext?: ValidatorContext;
	archetypeScaffold?: ArchetypeScaffold;
}

export type LlmQueryFn = (input: {
	prompt: string;
	jsonSchema: Record<string, unknown>;
}) => Promise<RunClaudeQueryResult>;

export interface ComposeScreenOptions {
	/** Validator #1 실패 시 좁은 재시도 최대 횟수. SPEC §8 ⑧ 기본 2. */
	maxRetries?: number;
	/** runClaudeQuery 옵션 (model, debug 등). queryFn 직접 주입 시 무시. */
	claudeOptions?: RunClaudeQueryOptions;
	/** LLM 호출 함수 주입. 미지정 시 runClaudeQuery 사용. */
	queryFn?: LlmQueryFn;
}

export interface ComposeAttempt {
	attempt: number;
	prompt: string;
	rawResult: string;
	parseIssues: ValidationIssue[];
	validatorResult?: ValidatorResult<CompositionOutput>;
	retryHints?: RetryHint[];
}

export interface ComposeScreenResult {
	ok: boolean;
	output?: CompositionOutput;
	issues: ValidationIssue[];
	attempts: ComposeAttempt[];
}

const DEFAULT_MAX_RETRIES = 2;

export async function composeScreen(
	input: ComposeScreenInput,
	options: ComposeScreenOptions = {},
): Promise<ComposeScreenResult> {
	const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
	const queryFn: LlmQueryFn =
		options.queryFn ?? ((args) => runClaudeQuery(args, options.claudeOptions));

	const jsonSchema = compositionOutputJsonSchema();
	const attempts: ComposeAttempt[] = [];
	const archetypeScaffold =
		input.archetypeScaffold ?? buildArchetypeScaffold(input.prddScreenRecord);
	const promptInput = { ...input, archetypeScaffold };

	let prompt = wrapSystemPrompt(buildInitialPrompt(promptInput));
	let lastOutput: CompositionOutput | undefined;
	let lastIssues: ValidationIssue[] = [];

	for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
		const queryResult = await queryFn({ prompt, jsonSchema });
		const parsed = parseCompositionOutput(queryResult.structured);

		const attemptRecord: ComposeAttempt = {
			attempt,
			prompt,
			rawResult: queryResult.rawResult,
			parseIssues: parsed.issues,
		};

		if (!parsed.ok || !parsed.output) {
			attempts.push(attemptRecord);
			lastIssues = parsed.issues;
			// 파싱 실패는 노드 단위 재시도가 불가능. 전체 프롬프트로 다시 시도하려면 마지막 시도까지 같은 프롬프트.
			continue;
		}

		const validatorResult = validateComposition(parsed.output, {
			catalogDeck: input.catalogDeck,
			designDeck: input.designDeck,
			layoutPatternStoreDeck: input.layoutPatternStoreDeck,
			validationContext: input.validationContext,
			prddScreenRecord: input.prddScreenRecord,
			archetypeScaffold,
		});
		attemptRecord.validatorResult = validatorResult;
		attemptRecord.retryHints = validatorResult.retryHints;
		attempts.push(attemptRecord);

		if (validatorResult.ok) {
			return {
				ok: true,
				output: parsed.output,
				issues: validatorResult.issues,
				attempts,
			};
		}

		lastOutput = parsed.output;
		lastIssues = validatorResult.issues;

		if (attempt > maxRetries) break;

		prompt = wrapSystemPrompt(
			buildRetryPrompt({
				previousOutput: parsed.output,
				retryHints: validatorResult.retryHints ?? [],
			}),
		);
	}

	return {
		ok: false,
		output: lastOutput,
		issues: lastIssues,
		attempts,
	};
}

function wrapSystemPrompt(userPart: string): string {
	return `${COMPOSE_SYSTEM_PROMPT}\n\n---\n\n${userPart}`;
}
