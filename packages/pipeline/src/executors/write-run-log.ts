import type { SideEffectExecutor, WriteRunLogCommand } from "../public/types";
import { getParentPath, stringifyArtifactContent } from "./executor-utils";

export const writeRunLog: SideEffectExecutor<WriteRunLogCommand> = async ({
	adapters,
	command,
	mode,
}) => {
	const artifact = {
		kind: "file" as const,
		uri: command.input.targetPath,
	};

	if (mode === "dry-run") {
		return {
			artifact,
			issues: [],
			operation: command.operation,
			status: "skipped",
		};
	}

	await adapters.fs.ensureDir(getParentPath(command.input.targetPath));
	await adapters.fs.writeText(
		command.input.targetPath,
		stringifyArtifactContent(command.input.content),
	);

	return {
		artifact,
		issues: [],
		operation: command.operation,
		status: "succeeded",
	};
};
