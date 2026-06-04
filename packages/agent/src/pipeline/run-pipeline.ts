import type { CatalogDeck, DesignDeck, LayoutPatternStoreDeck } from "@cx/types/ai-deck";
import type { CompositionOutput } from "@cx/types/composition-output";
import type { MaterializedNodeTree } from "@cx/types/database-tables";
import type { DecoratedOutput } from "@cx/types/decorated-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
import type { ValidationIssue } from "@cx/types/validation";
import {
	type LlmQueryFn as ComposeQueryFn,
	type ComposeScreenResult,
	composeScreen,
} from "../compose-screen";
import { materializeComposition } from "../database/materialize-composition";
import {
	type LlmQueryFn as DecorateQueryFn,
	type DecorateScreenResult,
	decorateScreen,
} from "../decorate-screen";
import {
	type CrossTableViolation,
	type RegisterPrddScreenResult,
	registerPrddScreen,
} from "../register/register-prdd-screen";

/**
 * 단일 PRDD → DB row 까지 한 흐름.
 * Register → Compose(LLM #1 + Validator) → Decorate(LLM #2 + Validator) → Materialize.
 * 단계 실패 시 그 시점에서 중단하고 부분 결과 반환.
 */

export interface RunPipelineInput {
	prddSource: string;
	catalogDeck: CatalogDeck;
	designDeck: DesignDeck;
	layoutPatternStoreDeck: LayoutPatternStoreDeck;
	importJobId?: string;
}

export interface RunPipelineOptions {
	composeQueryFn?: ComposeQueryFn;
	decorateQueryFn?: DecorateQueryFn;
	composeMaxRetries?: number;
	decorateMaxRetries?: number;
}

export interface RunPipelineResult {
	ok: boolean;
	stage: "register" | "compose" | "decorate" | "materialize" | "done";
	register?: RegisterPrddScreenResult;
	compose?: ComposeScreenResult;
	decorate?: DecorateScreenResult;
	materialized?: MaterializedNodeTree;
	prddScreenRecord?: PrddScreenRecord;
	composition?: CompositionOutput;
	decorated?: DecoratedOutput;
	issues: ValidationIssue[];
	invariantViolations: CrossTableViolation[];
}

export async function runPipeline(
	input: RunPipelineInput,
	options: RunPipelineOptions = {},
): Promise<RunPipelineResult> {
	const register = registerPrddScreen(input.prddSource, { importJobId: input.importJobId });
	if (register.invariantViolations.length > 0) {
		return {
			ok: false,
			stage: "register",
			register,
			prddScreenRecord: register.prddScreenRecord,
			issues: [],
			invariantViolations: register.invariantViolations,
		};
	}

	const compose = await composeScreen(
		{
			prddScreenRecord: register.prddScreenRecord,
			catalogDeck: input.catalogDeck,
			designDeck: input.designDeck,
			layoutPatternStoreDeck: input.layoutPatternStoreDeck,
		},
		{ queryFn: options.composeQueryFn, maxRetries: options.composeMaxRetries },
	);
	if (!compose.ok || !compose.output) {
		return {
			ok: false,
			stage: "compose",
			register,
			compose,
			prddScreenRecord: register.prddScreenRecord,
			composition: compose.output,
			issues: compose.issues,
			invariantViolations: [],
		};
	}

	const decorate = await decorateScreen(
		{
			composition: compose.output,
			catalogDeck: input.catalogDeck,
			designDeck: input.designDeck,
			layoutPatternStoreDeck: input.layoutPatternStoreDeck,
			prddScreenRecord: register.prddScreenRecord,
		},
		{ queryFn: options.decorateQueryFn, maxRetries: options.decorateMaxRetries },
	);
	if (!decorate.ok || !decorate.output) {
		return {
			ok: false,
			stage: "decorate",
			register,
			compose,
			decorate,
			prddScreenRecord: register.prddScreenRecord,
			composition: compose.output,
			decorated: decorate.output,
			issues: decorate.issues,
			invariantViolations: [],
		};
	}

	const materialized = materializeComposition({
		prddScreenRecord: register.prddScreenRecord,
		composition: compose.output,
		decorated: decorate.output,
	});

	return {
		ok: true,
		stage: "done",
		register,
		compose,
		decorate,
		materialized,
		prddScreenRecord: register.prddScreenRecord,
		composition: compose.output,
		decorated: decorate.output,
		issues: [],
		invariantViolations: [],
	};
}
