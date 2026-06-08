import type { AgentTaskDefinition } from "../../contract";
import { createQualityReviewPrompt } from "./prompt";

export const qualityReviewTask = {
	kind: "quality-review",
	description: "생성 후보를 기준 문서와 계약에 따라 Claude로 검수한다.",
	defaultSessionMode: "new",
	createPrompt: createQualityReviewPrompt,
} satisfies AgentTaskDefinition;

export { createQualityReviewPrompt } from "./prompt";
