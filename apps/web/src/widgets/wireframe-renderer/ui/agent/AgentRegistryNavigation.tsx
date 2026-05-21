import type { AssetRegistry } from "@cx/agent";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";
import type { AgentNodeSelection } from "@/features/agent-asset-pipeline/agent-registry-view";
import { useWorkbenchStore } from "../../model/workbench-store";

interface AgentRegistryNavigationProps {
	registry?: AssetRegistry;
	selectedNode: AgentNodeSelection;
	onSelectNode: (node: AgentNodeSelection) => void;
}

export function AgentRegistryNavigation({
	registry,
	selectedNode,
	onSelectNode,
}: AgentRegistryNavigationProps) {
	const imports = useWorkbenchStore((state) => state.agentImports);
	const status = useWorkbenchStore((state) => state.agentGenerationStatus);
	const message = useWorkbenchStore((state) => state.agentGenerationMessage);
	const setAgentGenerationMessage = useWorkbenchStore((state) => state.setAgentGenerationMessage);
	const setAgentGenerationStatus = useWorkbenchStore((state) => state.setAgentGenerationStatus);
	const setAgentImports = useWorkbenchStore((state) => state.setAgentImports);
	const setAgentRegistry = useWorkbenchStore((state) => state.setAgentRegistry);
	const [selectedImportId, setSelectedImportId] = useState("");

	useEffect(() => {
		let ignore = false;

		async function loadImports() {
			const response = await fetch("/api/agent/client-imports");
			const payload = (await response.json()) as {
				imports?: Array<{ id: string; organismFiles: number; screenFiles: number }>;
			};
			if (ignore) return;
			const nextImports = payload.imports ?? [];
			setAgentImports(nextImports);
			setSelectedImportId((current) => current || nextImports[0]?.id || "");
		}

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

	async function handleGenerate() {
		if (!selectedImportId || status === "loading") return;
		setAgentGenerationStatus("loading");
		setAgentGenerationMessage("");

		try {
			const response = await fetch("/api/agent/generate-register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ importId: selectedImportId }),
			});
			const payload = (await response.json()) as {
				error?: string;
				registry?: AssetRegistry;
				writtenPath?: string;
			};

			if (!response.ok || !payload.registry) {
				throw new Error(payload.error ?? "Failed to generate register JSON.");
			}

			setAgentRegistry(payload.registry);
			setAgentGenerationMessage(
				`Generated ${payload.writtenPath ?? "agent-assets.generated.json"}`,
			);
		} catch (error) {
			setAgentGenerationStatus("error");
			setAgentGenerationMessage(
				error instanceof Error ? error.message : "Failed to generate register JSON.",
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
					<Badge variant="outline">{imports.length} folders</Badge>
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
								<p className="text-xs text-muted-foreground">
									{item.screenFiles} screens · {item.organismFiles} organisms
								</p>
							</button>
						))}
						<Button type="button" onClick={handleGenerate} disabled={status === "loading"}>
							{status === "loading" ? "Generating..." : "Generate Register JSON"}
						</Button>
					</div>
				) : (
					<p className="mt-3 rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
						Drop an import folder into database/client-imports to begin.
					</p>
				)}
				{message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
			</div>
			<div className="flex items-center justify-between gap-2">
				<div>
					<p className="text-sm font-semibold">Agent Registry</p>
					<p className="text-xs text-muted-foreground">
						database/ai-imports/agent-assets.generated.json
					</p>
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
					Generate register JSON to inspect the Phase 1 registry.
				</div>
			)}
			<div className="grid grid-cols-2 gap-2">
				<Badge variant="secondary">{registry?.organisms.length ?? 0} organisms</Badge>
				<Badge variant="secondary">{registry?.components.length ?? 0} components</Badge>
			</div>
		</div>
	);
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
