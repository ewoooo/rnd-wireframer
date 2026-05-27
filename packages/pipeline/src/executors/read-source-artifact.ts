import type { SideEffectExecutor, SourceArtifactReadCommand } from "../public/types";

export const readSourceArtifact: SideEffectExecutor<SourceArtifactReadCommand> = async ({
	adapters,
	command,
	mode,
}) => {
	const artifact = {
		kind: "file" as const,
		uri: command.input.path,
	};

	if (mode === "dry-run") {
		return {
			artifact,
			issues: [],
			operation: command.operation,
			status: "skipped",
		};
	}

	const exists = await adapters.fs.exists(command.input.path);
	if (!exists) {
		return {
			artifact,
			issues: [
				{
					code: "pipeline.source_artifact_missing",
					message: `Source artifact does not exist: ${command.input.path}`,
					severity: "error",
				},
			],
			operation: command.operation,
			status: "failed",
		};
	}

	const content = await adapters.fs.readText(command.input.path);

	return {
		artifact,
		issues: [],
		operation: command.operation,
		output: {
			content,
			kind: command.input.kind,
			path: command.input.path,
		},
		status: "succeeded",
	};
};
