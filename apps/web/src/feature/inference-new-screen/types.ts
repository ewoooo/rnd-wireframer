export type NewScreenSourceItem = {
	batchId: string;
	importId: string;
	latestRunId?: string;
	path: string;
	screenId: string;
};

export type NewScreenRunItem = {
	id: string;
	runId?: string;
	screenId: string;
	sourcePath?: string;
	status?: string;
	title?: string;
};
