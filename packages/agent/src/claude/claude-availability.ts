export type ClaudeAvailabilityProbe = {
	hasLocalClaude: () => boolean | Promise<boolean>;
	hasRemoteClaudeApi?: () => boolean | Promise<boolean>;
};

export type ClaudeAvailability = {
	local: boolean;
	remote: boolean;
	mode: "local" | "remote" | "unavailable";
};

export async function resolveClaudeAvailability(
	probe: ClaudeAvailabilityProbe,
): Promise<ClaudeAvailability> {
	const local = await probe.hasLocalClaude();
	const remote = probe.hasRemoteClaudeApi ? await probe.hasRemoteClaudeApi() : false;

	return {
		local,
		remote,
		mode: local ? "local" : remote ? "remote" : "unavailable",
	};
}
