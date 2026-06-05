import { componentProposalTask } from "./component-proposal";
import { compositionPlanningTask } from "./composition-planning";
import { patternSelectionTask } from "./pattern-selection";
import { qualityReviewTask } from "./quality-review";
import { screenGenerationTask } from "./screen-generation";
import { screenIntentTask } from "./screen-intent";
import { screenRevisionTask } from "./screen-revision";

export const agentTaskCatalog = {
	"composition-planning": compositionPlanningTask,
	"pattern-selection": patternSelectionTask,
	"screen-generation": screenGenerationTask,
	"screen-intent": screenIntentTask,
	"screen-revision": screenRevisionTask,
	"quality-review": qualityReviewTask,
	"component-proposal": componentProposalTask,
} as const;

export type AgentTaskCatalog = typeof agentTaskCatalog;

export {
	componentProposalTask,
	compositionPlanningTask,
	patternSelectionTask,
	qualityReviewTask,
	screenGenerationTask,
	screenIntentTask,
	screenRevisionTask,
};
