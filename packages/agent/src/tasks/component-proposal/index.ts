import type { AgentTaskDefinition } from "../../contract";
import { createComponentProposalPrompt } from "./prompt";

export const componentProposalTask = {
	kind: "component-proposal",
	description: "카탈로그 밖 component/변형 후보를 비파괴 제안 아티팩트로 산출한다.",
	defaultSessionMode: "new",
	createPrompt: createComponentProposalPrompt,
} satisfies AgentTaskDefinition;

export { createComponentProposalPrompt } from "./prompt";
