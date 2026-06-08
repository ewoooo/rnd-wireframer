import type { AgentTaskDefinition } from "../../contract";
import { createScreenIntentPrompt } from "./prompt";

export const screenIntentTask = {
	createPrompt: createScreenIntentPrompt,
	defaultSessionMode: "new",
	description: "SourceSpec를 받아 화면 목적, 사용자 행동, 콘텐츠 우선순위를 정리한다.",
	kind: "screen-intent",
} satisfies AgentTaskDefinition;

export { createScreenIntentPrompt } from "./prompt";
