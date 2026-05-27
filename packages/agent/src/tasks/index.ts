import { qualityReviewTask } from "./quality-review";
import { screenGenerationTask } from "./screen-generation";
import { screenRevisionTask } from "./screen-revision";

export const agentTaskCatalog = {
	"screen-generation": screenGenerationTask,
	"screen-revision": screenRevisionTask,
	"quality-review": qualityReviewTask,
} as const;

export type AgentTaskCatalog = typeof agentTaskCatalog;

export { qualityReviewTask, screenGenerationTask, screenRevisionTask };
