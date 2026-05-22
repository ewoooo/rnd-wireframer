import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProviderTicket, TicketSink } from "./types";

export interface FileTicketSinkOptions {
	filePath: string;
}

interface TicketFile {
	tickets: ProviderTicket[];
}

export function createFileTicketSink({ filePath }: FileTicketSinkOptions): TicketSink {
	return {
		async append(ticket: ProviderTicket): Promise<void> {
			await mkdir(path.dirname(filePath), { recursive: true });
			const current = await readExisting(filePath);
			current.tickets.push(ticket);
			await writeFile(filePath, `${JSON.stringify(current, null, "\t")}\n`, "utf8");
		},
	};
}

async function readExisting(filePath: string): Promise<TicketFile> {
	try {
		const raw = await readFile(filePath, "utf8");
		const parsed = JSON.parse(raw) as Partial<TicketFile>;
		if (Array.isArray(parsed.tickets)) return { tickets: parsed.tickets };
		return { tickets: [] };
	} catch {
		return { tickets: [] };
	}
}
