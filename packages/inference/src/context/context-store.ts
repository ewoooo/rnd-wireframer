import type { ArtifactStore, ContextStore } from "../contracts";

const SAFE_KEY = /^[a-z0-9-]+$/;

export function createContextStore(jobId: string, store: ArtifactStore): ContextStore {
	const pathFor = (key: string): string => {
		if (!SAFE_KEY.test(key)) throw new Error(`Invalid context key: ${key}`);
		return `context/${key}.json`;
	};

	return {
		writeJson: async (key, value) => store.writeJson(jobId, pathFor(key), value),
		readJson: async <T>(key: string) => store.readJson<T>(jobId, pathFor(key)),
		async tryReadJson<T>(key: string): Promise<T | null> {
			const rel = pathFor(key);
			return (await store.exists(jobId, rel)) ? store.readJson<T>(jobId, rel) : null;
		},
	};
}
