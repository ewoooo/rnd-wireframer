import type { AgentTaskDefinition } from "../../contract";
import { createScreenGenerationPrompt } from "./prompt";

export const screenGenerationTask = {
	kind: "screen-generation",
	description: "사용자 쿼리와 생성 컨텍스트를 받아 신규 화면 후보를 생성한다.",
	defaultSessionMode: "new",
	createPrompt: createScreenGenerationPrompt,
} satisfies AgentTaskDefinition;

export { createScreenGenerationPrompt } from "./prompt";
