import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * 디렉터리가 부재하거나 비어있어도 빈 배열을 돌려주는 안전한 JSON loader.
 */
export async function readJsonDirSafe<T>(dir: string): Promise<T[]> {
	try {
		const entries = await readdir(dir);
		const jsons = entries.filter((name) => name.endsWith(".json"));
		const results: T[] = [];
		for (const name of jsons) {
			const raw = await readFile(join(dir, name), "utf8");
			results.push(JSON.parse(raw) as T);
		}
		return results;
	} catch (err) {
		const code = (err as NodeJS.ErrnoException).code;
		if (code === "ENOENT") return [];
		throw err;
	}
}

export async function readMarkdownDir(
	dir: string,
): Promise<Array<{ filename: string; content: string }>> {
	try {
		const entries = await readdir(dir);
		const mds = entries.filter((name) => name.endsWith(".md"));
		const results: Array<{ filename: string; content: string }> = [];
		for (const name of mds) {
			const content = await readFile(join(dir, name), "utf8");
			results.push({ filename: name, content });
		}
		return results;
	} catch (err) {
		const code = (err as NodeJS.ErrnoException).code;
		if (code === "ENOENT") return [];
		throw err;
	}
}

export async function writeJson(path: string, data: unknown): Promise<void> {
	const json = JSON.stringify(data, null, 2);
	const dir = path.slice(0, path.lastIndexOf("/"));
	if (dir) await mkdir(dir, { recursive: true });
	await writeFile(path, `${json}\n`, "utf8");
}
