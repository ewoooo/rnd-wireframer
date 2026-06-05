import type { ApplyApprovedArtifactCommand, SideEffectExecutor } from "../public/types";
import { getParentPath } from "./executor-utils";

export const applyApprovedArtifact: SideEffectExecutor<ApplyApprovedArtifactCommand> = async ({
	adapters,
	command,
	mode,
}) => {
	const artifact = {
		kind: "file" as const,
		uri: command.input.toPath,
	};

	if (mode === "dry-run") {
		return {
			artifact,
			issues: [],
			operation: command.operation,
			status: "skipped",
		};
	}

	const sourceExists = await adapters.fs.exists(command.input.fromPath);
	if (!sourceExists) {
		return {
			artifact,
			issues: [
				{
					code: "pipeline.approved_artifact_missing",
					message: `Approved artifact does not exist: ${command.input.fromPath}`,
					severity: "error",
				},
			],
			operation: command.operation,
			status: "failed",
		};
	}

	await adapters.fs.ensureDir(getParentPath(command.input.toPath));
	await adapters.fs.copyFile(command.input.fromPath, command.input.toPath);

	return {
		artifact,
		issues: [],
		operation: command.operation,
		status: "succeeded",
	};
};
