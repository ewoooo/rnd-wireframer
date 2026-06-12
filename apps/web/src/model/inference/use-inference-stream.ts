"use client";

import { useEffect, useState } from "react";
import { subscribeInferenceEvents } from "@/lib/inference-client";
import {
	initialInferenceStreamState,
	type InferenceStreamState,
	reduceInferenceEvent,
} from "@/lib/inference-events-reducer";

export function useInferenceStream(jobId: string | null): InferenceStreamState {
	const [state, setState] = useState<InferenceStreamState>(initialInferenceStreamState);
	useEffect(() => {
		if (!jobId) return;
		setState(initialInferenceStreamState);
		return subscribeInferenceEvents(jobId, {
			onEvent: (event) => setState((current) => reduceInferenceEvent(current, event)),
		});
	}, [jobId]);
	return state;
}
