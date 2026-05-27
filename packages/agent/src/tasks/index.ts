import { patternSelectionTask } from "./pattern-selection";
import { qualityReviewTask } from "./quality-review";
import { screenGenerationTask } from "./screen-generation";
import { screenRevisionTask } from "./screen-revision";

export const agentTaskCatalog = {
	"pattern-selection": patternSelectionTask,
	"screen-generation": screenGenerationTask,
	"screen-revision": screenRevisionTask,
	"quality-review": qualityReviewTask,
} as const;

export type AgentTaskCatalog = typeof agentTaskCatalog;

export { patternSelectionTask, qualityReviewTask, screenGenerationTask, screenRevisionTask };
