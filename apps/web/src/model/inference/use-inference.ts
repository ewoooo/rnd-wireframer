"use client";

import { useState } from "react";
import { createInferenceJob } from "@/lib/inference-client";

export function useInference() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function run(input: unknown): Promise<string | null> {
		setCreating(true);
		setError(null);
		try {
			const id = await createInferenceJob(input);
			setJobId(id);
			return id;
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught));
			return null;
		} finally {
			setCreating(false);
		}
	}

	return { jobId, creating, error, run };
}
