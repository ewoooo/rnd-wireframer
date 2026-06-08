import type { ArtifactStore } from "../contracts";

export class MemoryArtifactStore implements ArtifactStore {
	readonly files = new Map<string, string>();

	private key(jobId: string, rel: string): string {
		if (rel.includes("..") || rel.startsWith("/")) throw new Error(`Invalid artifact path: ${rel}`);
		return `${jobId}/${rel}`;
	}

	async writeText(jobId: string, rel: string, content: string): Promise<void> {
		this.files.set(this.key(jobId, rel), content);
	}

	async writeJson(jobId: string, rel: string, value: unknown): Promise<void> {
		this.files.set(this.key(jobId, rel), JSON.stringify(value, null, 2));
	}

	async appendLine(jobId: string, rel: string, content: string): Promise<void> {
		const k = this.key(jobId, rel);
		this.files.set(k, `${this.files.get(k) ?? ""}${content}\n`);
	}

	async readText(jobId: string, rel: string): Promise<string> {
		const v = this.files.get(this.key(jobId, rel));
		if (v === undefined) throw new Error(`Missing artifact: ${jobId}/${rel}`);
		return v;
	}

	async readJson<T>(jobId: string, rel: string): Promise<T> {
		return JSON.parse(await this.readText(jobId, rel)) as T;
	}

	async exists(jobId: string, rel: string): Promise<boolean> {
		return this.files.has(this.key(jobId, rel));
	}
}
