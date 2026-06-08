import type { AgentTaskDefinition } from "../../contract";
import { createCompositionPlanningPrompt } from "./prompt";

export const compositionPlanningTask = {
	createPrompt: createCompositionPlanningPrompt,
	defaultSessionMode: "new",
	description: "ScreenIntent와 SourceSpec를 받아 화면 구성 계획을 만든다.",
	kind: "composition-planning",
} satisfies AgentTaskDefinition;

export { createCompositionPlanningPrompt } from "./prompt";
