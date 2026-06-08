import { access, appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArtifactStore } from "../contracts";

const SAFE_JOB_ID = /^[A-Za-z0-9._-]+$/;

export class FileArtifactStore implements ArtifactStore {
	constructor(private readonly dataRoot: string = ".data") {}

	private resolve(jobId: string, rel: string): string {
		if (!SAFE_JOB_ID.test(jobId)) throw new Error(`Invalid jobId: ${jobId}`);
		if (rel.includes("..") || path.isAbsolute(rel)) throw new Error(`Invalid artifact path: ${rel}`);
		const root = path.resolve(this.dataRoot, "inference-jobs", jobId);
		const full = path.resolve(root, rel);
		if (full !== root && !full.startsWith(root + path.sep)) {
			throw new Error(`Artifact path escapes job root: ${rel}`);
		}
		return full;
	}

	async writeText(jobId: string, rel: string, content: string): Promise<void> {
		const full = this.resolve(jobId, rel);
		await mkdir(path.dirname(full), { recursive: true });
		await writeFile(full, content, "utf8");
	}

	async writeJson(jobId: string, rel: string, value: unknown): Promise<void> {
		await this.writeText(jobId, rel, JSON.stringify(value, null, 2));
	}

	async appendLine(jobId: string, rel: string, content: string): Promise<void> {
		const full = this.resolve(jobId, rel);
		await mkdir(path.dirname(full), { recursive: true });
		await appendFile(full, `${content}\n`, "utf8");
	}

	async readText(jobId: string, rel: string): Promise<string> {
		return readFile(this.resolve(jobId, rel), "utf8");
	}

	async readJson<T>(jobId: string, rel: string): Promise<T> {
		return JSON.parse(await this.readText(jobId, rel)) as T;
	}

	async exists(jobId: string, rel: string): Promise<boolean> {
		try {
			await access(this.resolve(jobId, rel));
			return true;
		} catch {
			return false;
		}
	}
}
