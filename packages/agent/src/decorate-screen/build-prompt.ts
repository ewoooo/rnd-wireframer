import type { DesignDeck, LayoutPatternStoreDeck } from "@cx/types/ai-deck";
import type { CompositionOutput } from "@cx/types/composition-output";
import type { DecoratedOutput } from "@cx/types/decorated-output";
import type { RetryHint } from "../validate/types";
import { decoratedOutputJsonSchema } from "./schema";

/**
 * Decorate LLM #2 프롬프트 빌더.
 *
 * Compose 출력(트리)을 받아 각 노드의 layoutPattern verification 만 생성.
 * 트리 구조·props·bindings 는 절대 손대지 않는다 — Schema E 에 그 필드 자체가 없다.
 */

export interface DecoratePromptInputs {
	composition: CompositionOutput;
	layoutPatternStoreDeck: LayoutPatternStoreDeck;
	designDeck: DesignDeck;
	decorateModel: string;
}

export const DECORATE_SYSTEM_PROMPT = `당신은 layoutPattern 검증·보정 AI Decorator 다.

책임:
- Compose 가 작성한 layoutPatternDraft 를 (a) 그대로 승인(accepted), (b) variant 만 조정(variant-adjusted), (c) 다른 패턴으로 보정(overridden) 중 하나로 처리한다.
- screen / 모든 area / decision-level draft 가 있는 모든 decision 에 verification 을 생성한다.
- layoutPatternStore 에 등록된 ID 만 사용한다 — 새 ID 를 발명하지 않는다.

금지:
- 트리 구조·props·bindings 변경 (Schema E 에 그 필드 자체가 없다).
- 새 화면·새 componentPattern·새 binding/hook 생성.
- layoutPatternStore 에 없는 layoutPatternId 사용.

출력:
- DecoratedOutput JSON 객체만. 사용자 메시지 첨부 JSON Schema 를 정확히 만족.
- verdict 별 필수:
  - "accepted": finalLayoutPattern 이 원 draft 와 동일해야 한다.
  - "variant-adjusted": layoutPatternId 는 그대로, variant 만 다름.
  - "overridden": originalDraft + reasons + designRefs(\`docs/design/\` 근거) 3종 세트 모두 필수.
- 모든 verification 의 reasons[] 가 비어있지 않아야 한다.
- areas 와 decisions 는 Object<id, Verification> 형태. composed.areas 의 모든 areaId 에 대응 verification 필수.
- 응답은 JSON 객체만. markdown code fence 나 설명문을 추가하지 않는다.`;

export function buildInitialDecoratePrompt(inputs: DecoratePromptInputs): string {
	const sections: string[] = [];

	sections.push("## 출력 JSON Schema (정확히 만족)");
	sections.push("```json");
	sections.push(JSON.stringify(decoratedOutputJsonSchema(), null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## Composed 출력 (Schema B — 검증 대상)");
	sections.push("```json");
	sections.push(JSON.stringify(inputs.composition, null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## Layout Pattern Store (이 ID/variant 만 사용 가능)");
	sections.push(summarizeLayoutPatterns(inputs.layoutPatternStoreDeck));

	sections.push("");
	sections.push("## Design Docs (overridden/variant-adjusted 시 designRefs 인용)");
	sections.push(summarizeDesignDocs(inputs.designDeck));

	sections.push("");
	sections.push("## 작업");
	sections.push(
		`screenId="${inputs.composition.screen.screenId}" 의 DecoratedOutput(Schema E) 을 JSON 으로 출력하라.`,
	);
	sections.push(
		`source.composedScreenId="${inputs.composition.screen.screenId}", source.composedSchemaVersion="${inputs.composition.schemaVersion}", source.decorateModel="${inputs.decorateModel}" 으로 채운다.`,
	);
	sections.push(
		`areas 키는 ${inputs.composition.areas.map((a) => `"${a.areaId}"`).join(", ") || "(none)"} 와 1:1 일치해야 한다.`,
	);
	const decisionDraftIds = inputs.composition.decisions
		.filter((d) => d.layoutPatternDraft)
		.map((d) => `"${d.id}"`);
	if (decisionDraftIds.length > 0) {
		sections.push(
			`decisions 키에는 ${decisionDraftIds.join(", ")} 만 포함한다 (decision-level draft 가 있는 decision 만).`,
		);
	} else {
		sections.push(`decisions 객체는 비어있다 ({}).`);
	}
	return sections.join("\n");
}

export function buildDecorateRetryPrompt(args: {
	previousOutput: DecoratedOutput;
	composition: CompositionOutput;
	layoutPatternStoreDeck: LayoutPatternStoreDeck;
	retryHints: RetryHint[];
}): string {
	const sections: string[] = [];

	sections.push("## 출력 JSON Schema (정확히 만족)");
	sections.push("```json");
	sections.push(JSON.stringify(decoratedOutputJsonSchema(), null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## Composed 출력 (변경 금지 — 참조용)");
	sections.push("```json");
	sections.push(JSON.stringify(args.composition, null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## Compose 원본 layoutPatternDraft (originalDraft 는 이 값을 그대로 복사)");
	sections.push("```json");
	sections.push(JSON.stringify(summarizeOriginalDrafts(args.composition), null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## Layout Pattern Store (이 ID/variant 만 사용 가능)");
	sections.push(summarizeLayoutPatterns(args.layoutPatternStoreDeck));

	sections.push("");
	sections.push("## 이전 Decorated 출력 (전체)");
	sections.push("```json");
	sections.push(JSON.stringify(args.previousOutput, null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## Validator #2 가 잡은 위반");
	for (const hint of args.retryHints) {
		sections.push(`### scope=${hint.scope}, targets=${hint.targetIds.join(", ")}`);
		sections.push("```");
		sections.push(hint.promptFragment);
		sections.push("```");
	}

	sections.push("");
	sections.push("## 작업");
	sections.push(
		"이전 출력의 **위반 노드만** 고친 완전한 DecoratedOutput 을 다시 출력하라. 위반 외 verification 은 이전 출력 그대로 유지한다.",
	);
	sections.push(
		"unknown 또는 incompatible layoutPatternId 를 고칠 때는 Validator data.suggestions[] 의 id 중 현재 node kind에 맞는 후보를 우선 사용한다.",
	);
	sections.push(
		"overridden/variant-adjusted 에서 originalDraft 를 넣어야 하면 위 Compose 원본 layoutPatternDraft 객체를 문구까지 그대로 복사한다.",
	);
	return sections.join("\n");
}

function summarizeLayoutPatterns(deck: LayoutPatternStoreDeck): string {
	return deck.patterns
		.map(
			(p) =>
				`- ${p.id} :: applies=[${p.appliesTo.join(",")}] variants=[${p.variants.join(",")}] :: ${p.description}`,
		)
		.join("\n");
}

function summarizeDesignDocs(deck: DesignDeck): string {
	return deck.documents.map((d) => `- ${d.id} :: ${d.title}`).join("\n");
}

function summarizeOriginalDrafts(composition: CompositionOutput): Record<string, unknown> {
	const decisions = Object.fromEntries(
		composition.decisions
			.filter((decision) => decision.layoutPatternDraft)
			.map((decision) => [decision.id, decision.layoutPatternDraft]),
	);
	return {
		screen: composition.screen.layoutPatternDraft,
		areas: Object.fromEntries(
			composition.areas.map((area) => [area.areaId, area.layoutPatternDraft]),
		),
		decisions,
	};
}
