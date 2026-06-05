import { applyApprovedArtifact } from "../executors/apply-approved-artifact";
import { readSourceArtifact } from "../executors/read-source-artifact";
import { writeRunLog } from "../executors/write-run-log";
import { writeVersionedArtifact } from "../executors/write-versioned-artifact";
import type { SideEffectCommand, SideEffectExecutor } from "../public/types";

export const sideEffectExecutors = {
	"approved-catalog-apply": applyApprovedArtifact as SideEffectExecutor<SideEffectCommand>,
	"run-log-write": writeRunLog as SideEffectExecutor<SideEffectCommand>,
	"source-artifact-read": readSourceArtifact as SideEffectExecutor<SideEffectCommand>,
	"versioned-artifact-write": writeVersionedArtifact as SideEffectExecutor<SideEffectCommand>,
} satisfies Record<SideEffectCommand["operation"], SideEffectExecutor<SideEffectCommand>>;
