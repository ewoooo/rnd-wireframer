import type {
	CatalogDeck,
	CompositionOutput,
	DecoratedOutput,
	DesignDeck,
	LayoutPatternStoreDeck,
	PrddScreenRecord,
	ValidationIssue,
} from "@cx/types";

import {
	type RunClaudeQueryOptions,
	type RunClaudeQueryResult,
	runClaudeQuery,
} from "../llm/claude-session";
import type { RetryHint, ValidatorResult } from "../validate/types";
import { validateDecorated } from "../validate/validate-decorated";

import {
	buildDecorateRetryPrompt,
	buildInitialDecoratePrompt,
	DECORATE_SYSTEM_PROMPT,
} from "./build-prompt";
import { parseDecoratedOutput } from "./parse-output";
import { decoratedOutputJsonSchema } from "./schema";

/**
 * Decorate LLM #2 오케스트레이터. SPEC §9 #5.
 *
 * compose-screen 과 같은 구조:
 * 1. composition + decks 로 초기 프롬프트
 * 2. runClaudeQuery (Opus 4.7)
 * 3. parse + Validator #2
 * 4. 실패 시 RetryHints 기반 좁힌 재시도 (최대 maxRetries회)
 *
 * Decorate 는 layoutPattern verification 만 다루므로 트리 불변은 Schema E 모양 자체로 강제.
 */

export interface DecorateScreenInput {
	composition: CompositionOutput;
	catalogDeck: CatalogDeck;
	designDeck: DesignDeck;
	layoutPatternStoreDeck: LayoutPatternStoreDeck;
	prddScreenRecord: PrddScreenRecord;
}

export type LlmQueryFn = (input: {
	prompt: string;
	jsonSchema: Record<string, unknown>;
}) => Promise<RunClaudeQueryResult>;

export interface DecorateScreenOptions {
	maxRetries?: number;
	claudeOptions?: RunClaudeQueryOptions;
	queryFn?: LlmQueryFn;
	/** verification.source.decorateModel 에 들어갈 식별자. */
	decorateModel?: string;
}

export interface DecorateAttempt {
	attempt: number;
	prompt: string;
	rawResult: string;
	parseIssues: ValidationIssue[];
	validatorResult?: ValidatorResult<DecoratedOutput>;
	retryHints?: RetryHint[];
}

export interface DecorateScreenResult {
	ok: boolean;
	output?: DecoratedOutput;
	issues: ValidationIssue[];
	attempts: DecorateAttempt[];
}

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_MODEL = "claude-opus-4-7";

export async function decorateScreen(
	input: DecorateScreenInput,
	options: DecorateScreenOptions = {},
): Promise<DecorateScreenResult> {
	const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
	const decorateModel = options.decorateModel ?? options.claudeOptions?.model ?? DEFAULT_MODEL;
	const queryFn: LlmQueryFn =
		options.queryFn ?? ((args) => runClaudeQuery(args, options.claudeOptions));

	const jsonSchema = decoratedOutputJsonSchema();
	const attempts: DecorateAttempt[] = [];

	let prompt = wrapSystemPrompt(
		buildInitialDecoratePrompt({
			composition: input.composition,
			layoutPatternStoreDeck: input.layoutPatternStoreDeck,
			designDeck: input.designDeck,
			decorateModel,
		}),
	);

	let lastOutput: DecoratedOutput | undefined;
	let lastIssues: ValidationIssue[] = [];

	for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
		const queryResult = await queryFn({ prompt, jsonSchema });
		const parsed = parseDecoratedOutput(queryResult.structured);

		const record: DecorateAttempt = {
			attempt,
			prompt,
			rawResult: queryResult.rawResult,
			parseIssues: parsed.issues,
		};

		if (!parsed.ok || !parsed.output) {
			attempts.push(record);
			lastIssues = parsed.issues;
			continue;
		}

		const validatorResult = validateDecorated(parsed.output, {
			catalogDeck: input.catalogDeck,
			designDeck: input.designDeck,
			layoutPatternStoreDeck: input.layoutPatternStoreDeck,
			prddScreenRecord: input.prddScreenRecord,
			composition: input.composition,
		});
		record.validatorResult = validatorResult;
		record.retryHints = validatorResult.retryHints;
		attempts.push(record);

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
			buildDecorateRetryPrompt({
				previousOutput: parsed.output,
				composition: input.composition,
				layoutPatternStoreDeck: input.layoutPatternStoreDeck,
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
	return `${DECORATE_SYSTEM_PROMPT}\n\n---\n\n${userPart}`;
}
