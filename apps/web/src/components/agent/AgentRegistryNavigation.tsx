import type { RegisteredNodeTree } from "@cx/agent/types";
import { useEffect, useRef, useState } from "react";
import type { AgentNodeSelection } from "@/agent/agent-registry-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";
import { createWorkbenchDataFromTables } from "@/data/workbench-data-builder";
import { type AgentDraftTablesResult, useWorkbenchStore } from "@/model/store";

interface AgentRegistryNavigationProps {
	registry?: RegisteredNodeTree;
	selectedNode: AgentNodeSelection;
	onSelectNode: (node: AgentNodeSelection) => void;
}

export function AgentRegistryNavigation({
	registry,
	selectedNode,
	onSelectNode,
}: AgentRegistryNavigationProps) {
	const imports = useWorkbenchStore((state) => state.agentImports);
	const draftTablesResult = useWorkbenchStore((state) => state.agentDraftTablesResult);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const status = useWorkbenchStore((state) => state.agentGenerationStatus);
	const message = useWorkbenchStore((state) => state.agentGenerationMessage);
	const setAgentDraftTablesResult = useWorkbenchStore((state) => state.setAgentDraftTablesResult);
	const setAgentGenerationMessage = useWorkbenchStore((state) => state.setAgentGenerationMessage);
	const setAgentGenerationStatus = useWorkbenchStore((state) => state.setAgentGenerationStatus);
	const setAgentImports = useWorkbenchStore((state) => state.setAgentImports);
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);
	const selectTab = useWorkbenchStore((state) => state.selectTab);
	const [selectedImportId, setSelectedImportId] = useState("");
	const [uploadStatus, setUploadStatus] = useState<"error" | "idle" | "loading" | "success">(
		"idle",
	);
	const folderInputRef = useRef<HTMLInputElement>(null);

	async function loadImports() {
		const response = await fetch("/api/agent/client-imports");
		const payload = await readJsonResponse<{
			imports?: Array<{ id: string; screenFiles: number }>;
		}>(response, "Failed to load client imports.");

		if (!response.ok) {
			throw new Error(payload.error ?? "Failed to load client imports.");
		}

		const nextImports = payload.imports ?? [];
		setAgentImports(nextImports);
		setSelectedImportId((current) => {
			if (nextImports.some((item) => item.id === current)) return current;
			return nextImports[0]?.id ?? "";
		});
	}

	useEffect(() => {
		let ignore = false;

		void loadImports().catch((error) => {
			if (ignore) return;
			setAgentGenerationStatus("error");
			setAgentGenerationMessage(
				error instanceof Error ? error.message : "Failed to load client imports.",
			);
		});

		return () => {
			ignore = true;
		};
	}, [setAgentGenerationMessage, setAgentGenerationStatus, setAgentImports]);

	async function handleRefreshImports() {
		setAgentGenerationMessage("");
		try {
			await loadImports();
		} catch (error) {
			setAgentGenerationStatus("error");
			setAgentGenerationMessage(
				error instanceof Error ? error.message : "Failed to load client imports.",
			);
		}
	}

	async function handleFolderUpload(files: FileList | null) {
		const fileList = Array.from(files ?? []);
		if (fileList.length === 0 || uploadStatus === "loading") return;

		setUploadStatus("loading");
		setAgentGenerationMessage("");

		try {
			const formData = new FormData();
			const paths = fileList.map((file) => getUploadPath(file));

			for (const [index, file] of fileList.entries()) {
				formData.append("files", file, paths[index] ?? file.name);
			}
			formData.append("paths", JSON.stringify(paths));

			const response = await fetch("/api/agent/client-imports/upload", {
				method: "POST",
				body: formData,
			});
			const payload = await readJsonResponse<{
				error?: string;
				import?: { id: string; screenFiles: number };
				writtenFiles?: number;
			}>(response, "Failed to upload client import.");

			if (!response.ok || !payload.import) {
				throw new Error(payload.error ?? "Failed to upload client import.");
			}

			await loadImports();
			setSelectedImportId(payload.import.id);
			setUploadStatus("success");
			setAgentGenerationMessage(
				`Uploaded ${payload.import.id} (${payload.writtenFiles ?? fileList.length} markdown files)`,
			);
		} catch (error) {
			setUploadStatus("error");
			setAgentGenerationStatus("error");
			setAgentGenerationMessage(
				error instanceof Error ? error.message : "Failed to upload client import.",
			);
		} finally {
			if (folderInputRef.current) {
				folderInputRef.current.value = "";
			}
		}
	}

	async function handleGenerateDraftTables() {
		if (!selectedImportId || status === "loading") return;
		setAgentGenerationStatus("loading");
		setAgentDraftTablesResult(undefined);
		setAgentGenerationMessage("");

		try {
			const response = await fetch("/api/agent/generate-draft-tables", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ importId: selectedImportId }),
			});
			const payload = await readJsonResponse<Partial<AgentDraftTablesResult>>(
				response,
				"Failed to generate draft tables.",
			);

			if (!response.ok) {
				throw new Error(payload.error ?? "Failed to generate draft tables.");
			}

			const result = normalizeDraftTablesResult(payload, selectedImportId);
			const failedCount = result.results.filter((screenResult) => !screenResult.ok).length;
			setAgentDraftTablesResult(result);
			if (result.previewTables && failedCount === 0) {
				initializeWorkbench({
					agentRegistry,
					...createWorkbenchDataFromTables(result.previewTables),
				});
				selectTab("scn");
			}
			setAgentGenerationStatus(failedCount > 0 ? "error" : "success");
			setAgentGenerationMessage(
				`Generated draft tables for ${result.screenCount} screens at ${result.writtenDir}`,
			);
		} catch (error) {
			setAgentGenerationStatus("error");
			setAgentGenerationMessage(
				error instanceof Error ? error.message : "Failed to generate draft tables.",
			);
		}
	}

	return (
		<div className="flex flex-col gap-3 pr-3">
			<div className="rounded-lg border bg-background p-3">
				<div className="flex items-center justify-between gap-2">
					<div>
						<p className="text-sm font-semibold">Client Imports</p>
						<p className="text-xs text-muted-foreground">database/client-imports</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="outline">{imports.length} folders</Badge>
						<Button type="button" variant="outline" size="sm" onClick={handleRefreshImports}>
							Refresh
						</Button>
					</div>
				</div>
				<div className="mt-3 flex flex-col gap-2">
					<input
						ref={folderInputRef}
						type="file"
						multiple
						className="hidden"
						onChange={(event) => void handleFolderUpload(event.currentTarget.files)}
						{...{ webkitdirectory: "" }}
					/>
					<Button
						type="button"
						variant="secondary"
						onClick={() => folderInputRef.current?.click()}
						disabled={uploadStatus === "loading"}
					>
						{uploadStatus === "loading" ? "Uploading..." : "Upload Client Import Folder"}
					</Button>
				</div>
				{imports.length > 0 ? (
					<div className="mt-3 flex flex-col gap-2">
						{imports.map((item) => (
							<button
								key={item.id}
								type="button"
								className={cn(
									"rounded-md border p-2 text-left transition-colors hover:bg-accent",
									selectedImportId === item.id && "border-primary bg-primary/5",
								)}
								onClick={() => setSelectedImportId(item.id)}
							>
								<p className="truncate text-sm font-medium">{item.id}</p>
								<p className="text-xs text-muted-foreground">{item.screenFiles} screens</p>
							</button>
						))}
						<Button
							type="button"
							onClick={handleGenerateDraftTables}
							disabled={status === "loading"}
						>
							{status === "loading" ? "Generating draft tables..." : "Generate Draft Tables"}
						</Button>
					</div>
				) : (
					<p className="mt-3 rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
						Upload a client import folder to begin.
					</p>
				)}
				{message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
			</div>
			{draftTablesResult ? <DraftTablesResultPanel result={draftTablesResult} /> : null}
			<div className="flex items-center justify-between gap-2">
				<div>
					<p className="text-sm font-semibold">Legacy Agent Registry</p>
					<p className="text-xs text-muted-foreground">read-only compatibility view</p>
				</div>
				<Badge variant="outline">{registry?.routes.length ?? 0} routes</Badge>
			</div>
			{registry ? (
				registry.routes.map((route) => (
					<div key={route.id} className="rounded-lg border bg-background p-2">
						<AgentNodeButton
							isSelected={selectedNode.level === "route" && selectedNode.id === route.id}
							label={route.name}
							meta={route.id}
							onClick={() => onSelectNode({ level: "route", id: route.id })}
						/>
						<div className="mt-2 flex flex-col gap-2 border-l pl-3">
							{route.variants.map((variant) => (
								<div key={variant.id} className="flex flex-col gap-2">
									<AgentNodeButton
										isSelected={selectedNode.level === "variant" && selectedNode.id === variant.id}
										label={variant.name}
										meta={variant.id}
										onClick={() => onSelectNode({ level: "variant", id: variant.id })}
									/>
									<div className="flex flex-col gap-1 border-l pl-3">
										{variant.screens.map((screen) => (
											<AgentNodeButton
												key={screen.id}
												isSelected={
													selectedNode.level === "screen" && selectedNode.id === screen.id
												}
												label={screen.name}
												meta={screen.id}
												onClick={() => onSelectNode({ level: "screen", id: screen.id })}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				))
			) : (
				<div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
					No legacy registry is loaded.
				</div>
			)}
			<div className="grid grid-cols-2 gap-2">
				<Badge variant="secondary">{registry?.areas.length ?? 0} areas</Badge>
				<Badge variant="secondary">{registry?.components.length ?? 0} components</Badge>
			</div>
		</div>
	);
}

function normalizeDraftTablesResult(
	payload: Partial<AgentDraftTablesResult>,
	fallbackImportId: string,
): AgentDraftTablesResult {
	const results = payload.results ?? [];
	return {
		importId: payload.importId ?? fallbackImportId,
		backlog: payload.backlog,
		backlogPath: payload.backlogPath,
		screenCount: payload.screenCount ?? results.length,
		writtenDir: payload.writtenDir ?? "ai-imports/draft-tables",
		results,
	};
}

function DraftTablesResultPanel({ result }: { result: AgentDraftTablesResult }) {
	const failedCount = result.results.filter((screenResult) => !screenResult.ok).length;
	const warningCount = result.results.reduce(
		(total, screenResult) => total + (screenResult.qualityReport?.summary.warningCount ?? 0),
		0,
	);
	const errorCount = result.results.reduce(
		(total, screenResult) => total + (screenResult.qualityReport?.summary.errorCount ?? 0),
		0,
	);

	return (
		<div className="rounded-lg border bg-background p-3">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-semibold">Draft Tables Result</p>
					<p className="text-xs text-muted-foreground">{result.writtenDir}</p>
				</div>
				<Badge
					variant={failedCount > 0 ? "outline" : "secondary"}
					className={failedCount > 0 ? "border-destructive text-destructive" : undefined}
				>
					{failedCount > 0 ? `${failedCount} failed` : "ready"}
				</Badge>
			</div>
			<div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
				<ResultMetric label="Screens" value={String(result.screenCount)} />
				<ResultMetric label="Errors" value={String(errorCount)} />
				<ResultMetric label="Warnings" value={String(warningCount)} />
			</div>
			{result.backlog ? (
				<div className="mt-3 rounded-md bg-secondary/40 p-2 text-xs">
					<div className="flex items-center justify-between gap-2">
						<span className="font-medium">Quality Backlog</span>
						<span className="text-muted-foreground">
							{result.backlog.summary.readyCount} ready / {result.backlog.summary.candidateCount}{" "}
							candidate
						</span>
					</div>
					{result.backlogPath ? (
						<p className="mt-1 truncate text-[11px] text-muted-foreground">{result.backlogPath}</p>
					) : null}
				</div>
			) : null}
			<div className="mt-3 flex flex-col gap-2">
				{result.results.map((screenResult) => (
					<div key={screenResult.screenFile} className="rounded-md border p-2">
						<div className="flex items-center justify-between gap-2">
							<p className="truncate text-xs font-medium">{screenResult.screenFile}</p>
							<Badge
								variant="outline"
								className={screenResult.ok ? undefined : "border-destructive text-destructive"}
							>
								{screenResult.stage}
							</Badge>
						</div>
						<div className="mt-2 flex flex-wrap gap-1">
							<ResultBadge
								label="error"
								value={screenResult.qualityReport?.summary.errorCount ?? 0}
							/>
							<ResultBadge
								label="warning"
								value={screenResult.qualityReport?.summary.warningCount ?? 0}
							/>
							<ResultBadge
								label="info"
								value={screenResult.qualityReport?.summary.infoCount ?? 0}
							/>
						</div>
						<p className="mt-2 truncate text-[11px] text-muted-foreground">
							{screenResult.writtenPaths.qualityReport}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

function ResultMetric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-md bg-secondary/50 px-2 py-1.5">
			<p className="font-semibold">{value}</p>
			<p className="text-muted-foreground">{label}</p>
		</div>
	);
}

function ResultBadge({ label, value }: { label: string; value: number }) {
	return (
		<span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
			{label} {value}
		</span>
	);
}

function getUploadPath(file: File) {
	return "webkitRelativePath" in file && typeof file.webkitRelativePath === "string"
		? file.webkitRelativePath
		: file.name;
}

async function readJsonResponse<TPayload>(
	response: Response,
	fallbackMessage: string,
): Promise<TPayload & { error?: string }> {
	const text = await response.text();
	if (!text.trim()) {
		return {
			error: `${fallbackMessage} Empty response from ${response.url || "API"}.`,
		} as TPayload & { error?: string };
	}

	try {
		return JSON.parse(text) as TPayload & { error?: string };
	} catch {
		return {
			error: `${fallbackMessage} Non-JSON response (${response.status} ${response.statusText}).`,
		} as TPayload & { error?: string };
	}
}

function AgentNodeButton({
	isSelected,
	label,
	meta,
	onClick,
}: {
	isSelected: boolean;
	label: string;
	meta: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full flex-col gap-1 rounded-md p-2 text-left transition-colors hover:bg-accent",
				isSelected && "bg-primary/5 text-primary ring-1 ring-primary/40",
			)}
			onClick={onClick}
		>
			<span className="truncate text-sm font-medium">{label}</span>
			<span className="truncate text-xs text-muted-foreground">{meta}</span>
		</button>
	);
}
