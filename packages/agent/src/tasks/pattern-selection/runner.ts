import type { AgentTaskDefinition } from "../../contract";
import { createPatternSelectionPrompt } from "./prompt";

export const patternSelectionTask = {
	kind: "pattern-selection",
	description: "SourceSpec와 레이어 후보를 기준으로 화면 생성에 적용할 패턴 레이어를 선택한다.",
	defaultSessionMode: "new",
	createPrompt: createPatternSelectionPrompt,
} satisfies AgentTaskDefinition;
