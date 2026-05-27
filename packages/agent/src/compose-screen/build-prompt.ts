import type { CatalogDeck, DesignDeck, LayoutPatternStoreDeck } from "@cx/types/ai-deck";
import type { CompositionOutput } from "@cx/types/composition-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
import type { RetryHint } from "../validate/types";
import { type ArchetypeScaffold, listArchetypeCatalog } from "./scaffold";
import { compositionOutputJsonSchema } from "./schema";

/**
 * Compose LLM #1 프롬프트 빌더.
 *
 * 미니멀 원칙:
 * - 시스템 프롬프트: 책임·금지·출력 형식만
 * - 사용자 메시지: Schema A + deck 카드 + Schema B 출력 의무
 * - 예시는 넣지 않음 (Validator로 형식 학습)
 */

export interface PromptInputs {
	prddScreenRecord: PrddScreenRecord;
	catalogDeck: CatalogDeck;
	designDeck: DesignDeck;
	layoutPatternStoreDeck: LayoutPatternStoreDeck;
	/** archetype 카탈로그를 주입하면 그것을 prior로 쓰고, 미지정 시 SSOT의 전체 목록을 사용. */
	archetypeCatalog?: ArchetypeScaffold[];
}

export const COMPOSE_SYSTEM_PROMPT = `당신은 화면 컴포지션을 결정하는 AI Composer다.

책임:
- 주어진 PrddScreenRecord(Schema A)를 읽어 화면을 구성한다.
- Archetype Catalog에서 화면 의도에 가장 맞는 archetype을 **직접 선택**한다 (screen.archetypeChoice.source="catalog").
- 카탈로그의 어떤 archetype으로도 화면 의도를 표현할 수 없을 때만 새 archetype을 propose한다 (screen.archetypeChoice.source="proposed", proposedScaffold 동봉). 기존 catalog에 hit 가능하면 propose 금지.
- 카탈로그의 primitives 와 registered componentPatterns 를 **우선** 사용한다.
- 기존 컴포넌트 조합으로 의도를 표현 못 하면 새 componentPattern 을 propose 한다.
- 어떤 primitive 로도 표현할 수 없으면 gap-report 를 발행한다.
- 각 area / decision 의 layoutPattern 1차안(draft)도 함께 작성한다.
- 선택한 archetype scaffold의 requiredBlocks를 present/synthetic/missing/omitted 중 하나로 반드시 설명한다.

금지:
- primitives 를 발명하지 않는다 (없으면 gap-report).
- proposed componentPattern 이 다른 proposed 를 참조하지 않는다.
- Schema A 의 원문 필드를 덮어쓰지 않는다.
- 비즈니스 사실(가격, 조건, 혜택, 정책)을 근거 없이 창작하지 않는다. 구조적 section/header/divider 등 허용된 synthetic block만 합성한다.
- archetypeChoice.rationale은 **빈 문자열 금지**. PRDD 근거(intent, useCase, area role 등) 인용 필수.
- source="proposed"일 때 proposedScaffold.rationale도 **빈 문자열 금지**. 왜 기존 catalog로 부족한지 명시.

출력:
- 한 번에 화면 한 장 분량의 Schema B (CompositionOutput) JSON.
- 출력은 사용자 메시지에 첨부된 JSON Schema 를 **정확히** 만족해야 한다. 모르는 필드는 추가하지 말 것.
- 최상위 필드 고정: kind="composition-output", schemaVersion, source, screen, areas, decisions, proposedComponentPatterns, gapReports, warnings.
- **decisions 는 최상위 평탄 배열**이며 area 안에 중첩하지 않는다. 각 decision 의 target.areaId 로 area 와 연결.
- 모든 decision 은 Schema A 의 원천을 sourceRef / sourceRefs 로 추적한다.
- screen / area 에는 designRefs[] 가 반드시 있어야 한다 (decision-level 은 선택).
- 모든 area 와 screen 에 layoutPatternDraft 가 있어야 한다.
- screen.archetype 은 archetypeChoice.archetype 과 동일하다. screen.strategy 는 선택한 scaffold의 strategy를 따른다.
- 응답은 JSON 객체만 출력하고 markdown code fence 나 설명문을 추가하지 않는다.`;

export function buildInitialPrompt(inputs: PromptInputs): string {
	const sections: string[] = [];
	sections.push("## 출력 JSON Schema (정확히 만족해야 한다)");
	sections.push("```json");
	sections.push(JSON.stringify(compositionOutputJsonSchema(), null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## PrddScreenRecord (Schema A — PRDD 원문 보존)");
	sections.push("```json");
	sections.push(JSON.stringify(inputs.prddScreenRecord, null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## Archetype Catalog (이 중에서 하나를 선택하거나, 부족하면 propose)");
	sections.push("```json");
	sections.push(JSON.stringify(inputs.archetypeCatalog ?? listArchetypeCatalog(), null, 2));
	sections.push("```");
	sections.push(
		"화면 의도와 가장 맞는 archetype 하나를 골라 screen.archetypeChoice.source=\"catalog\"로 출력한다. 어떤 catalog 항목도 의도를 표현하지 못할 때만 source=\"proposed\"로 proposedScaffold를 동봉한다. archetypeChoice.rationale과 (propose 시) proposedScaffold.rationale은 PRDD 근거 인용이 들어가야 하고 빈 문자열은 거부된다.",
	);
	sections.push(
		"선택한 scaffold의 requiredBlocks 는 screen.completeness 에서 presentBlocks / syntheticBlocks / missingBlocks / omittedBlocks 중 하나로 반드시 설명한다. allowedSyntheticBlocks 밖의 block은 syntheticBlocks에 넣지 않는다.",
	);

	sections.push("");
	sections.push("## Catalog Deck — primitives");
	sections.push(summarizePrimitives(inputs.catalogDeck));

	sections.push("");
	sections.push("## Catalog Deck — registered componentPatterns");
	sections.push(summarizePatterns(inputs.catalogDeck.componentPatterns.registered, "registered"));

	sections.push("");
	sections.push(
		"## Catalog Deck — proposed componentPatterns (참고용, 재사용 시 가급적 selection)",
	);
	sections.push(summarizePatterns(inputs.catalogDeck.componentPatterns.proposed, "proposed"));

	sections.push("");
	sections.push("## Layout Pattern Store");
	sections.push(summarizeLayoutPatterns(inputs.layoutPatternStoreDeck));

	sections.push("");
	sections.push("## Design Docs (책임·근거 인용처)");
	sections.push(summarizeDesignDocs(inputs.designDeck));

	sections.push("");
	sections.push("## 작업");
	sections.push(
		`위 입력을 바탕으로 screenId="${inputs.prddScreenRecord.id}" 화면의 CompositionOutput(Schema B) 을 JSON으로 출력하라.`,
	);
	sections.push(
		`source.registeredSchemaVersion / catalogDeckVersion / designDeckVersion / layoutPatternStoreDeckVersion 은 각각 "${inputs.prddScreenRecord.importJobId}", "${inputs.catalogDeck.version}", "${inputs.designDeck.version}", "${inputs.layoutPatternStoreDeck.version}" 으로 채운다.`,
	);
	return sections.join("\n");
}

export function buildRetryPrompt(args: {
	previousOutput: CompositionOutput;
	retryHints: RetryHint[];
}): string {
	const sections: string[] = [];

	sections.push("## 출력 JSON Schema (정확히 만족해야 한다)");
	sections.push("```json");
	sections.push(JSON.stringify(compositionOutputJsonSchema(), null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## 이전 출력 (전체)");
	sections.push("```json");
	sections.push(JSON.stringify(args.previousOutput, null, 2));
	sections.push("```");

	sections.push("");
	sections.push("## Validator 가 잡은 위반");
	for (const hint of args.retryHints) {
		sections.push(`### scope=${hint.scope}, targets=${hint.targetIds.join(", ")}`);
		sections.push("```");
		sections.push(hint.promptFragment);
		sections.push("```");
	}

	sections.push("");
	sections.push("## 작업");
	sections.push(
		"이전 출력의 **위반 노드만** 고친 완전한 CompositionOutput 을 다시 출력하라. 위반 외 필드(source, screen, 다른 areas/decisions, top-level kind 등)는 이전 출력에서 그대로 가져온다. 모양은 JSON Schema 를 정확히 만족해야 한다.",
	);
	return sections.join("\n");
}

// ─────────────────────────────────────────────────────────────
// helpers

function summarizePrimitives(deck: CatalogDeck): string {
	if (deck.primitives.length === 0) return "(none)";
	return deck.primitives
		.map((p) => {
			const props = p.props
				.map((pr) => `${pr.name}${pr.contract.required ? "*" : ""}:${pr.contract.type}`)
				.join(", ");
			const variants = p.variants.length > 0 ? ` variants=[${p.variants.join(",")}]` : "";
			return `- ${p.id} :: {${props}}${variants}`;
		})
		.join("\n");
}

function summarizePatterns(
	patterns: CatalogDeck["componentPatterns"]["registered"],
	tier: "registered" | "proposed",
): string {
	if (patterns.length === 0) return `(no ${tier} componentPatterns yet)`;
	return patterns
		.map((p) => {
			const props = p.props.map((pr) => pr.name).join(", ");
			const slots = p.slots.map((s) => s.name).join(", ");
			const variants = p.variants.map((v) => v.name).join(", ");
			return `- ${p.id} :: intent="${p.intent}" props=[${props}] slots=[${slots}] variants=[${variants}]`;
		})
		.join("\n");
}

function summarizeLayoutPatterns(deck: LayoutPatternStoreDeck): string {
	return deck.patterns
		.map(
			(p) => `- ${p.id} :: applies=[${p.appliesTo.join(",")}] variants=[${p.variants.join(",")}]`,
		)
		.join("\n");
}

function summarizeDesignDocs(deck: DesignDeck): string {
	return deck.documents
		.map((d) => {
			const header = `- ${d.id} :: ${d.title}${d.responsibility ? ` — ${d.responsibility.slice(0, 120)}` : ""}`;
			const rules = d.rules
				.slice(0, 10)
				.map(
					(rule) =>
						`  - ${rule.id}${rule.section ? ` (${rule.section})` : ""} applies=[${rule.appliesTo.join(",")}] :: ${rule.summary}`,
				);
			return [header, ...rules].join("\n");
		})
		.join("\n");
}
