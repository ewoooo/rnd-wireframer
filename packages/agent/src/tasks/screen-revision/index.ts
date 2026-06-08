import type { AgentTaskDefinition } from "../../contract";
import { createScreenRevisionPrompt } from "./prompt";

export const screenRevisionTask = {
	kind: "screen-revision",
	description: "기존 후보와 피드백을 받아 수정 후보를 생성한다.",
	defaultSessionMode: "resume",
	createPrompt: createScreenRevisionPrompt,
} satisfies AgentTaskDefinition;

export { createScreenRevisionPrompt } from "./prompt";
