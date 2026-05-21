import type {
	AssetRegistry,
	RegisteredComponentAsset,
	RegisteredOrganismAsset,
	RegisteredScreenAsset,
} from "@cx/agent";
import { Database } from "lucide-react";
import type { AgentNodeSelection, SelectedAgentAsset } from "@/agent/agent-registry-view";
import { Badge } from "@/components/ui/badge";

interface AgentRegistryPreviewProps {
	registry?: AssetRegistry;
	selectedAsset?: SelectedAgentAsset;
	selectedNode: AgentNodeSelection;
	onSelectNode: (node: AgentNodeSelection) => void;
}

export function AgentRegistryPreview({
	registry,
	selectedAsset,
	selectedNode,
	onSelectNode,
}: AgentRegistryPreviewProps) {
	const screen = getPreviewScreen(registry, selectedAsset, selectedNode);

	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="flex h-full w-full max-w-3xl flex-col gap-4 overflow-hidden rounded-lg border bg-background p-5 shadow-sm">
				<div className="flex items-start justify-between gap-4 border-b pb-4">
					<div className="min-w-0">
						<h2 className="flex items-center gap-2 text-base font-semibold">
							<Database className="size-4" data-icon="inline-start" />
							{screen?.name ?? "Agent Registry"}
						</h2>
						<p className="mt-1 truncate text-sm text-muted-foreground">
							{screen?.id ?? "No screen selected"}
						</p>
					</div>
					{screen ? <Badge>Phase 1</Badge> : null}
				</div>
				{screen ? (
					<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
						{screen.organisms.map((organismRef) => (
							<OrganismPreview
								key={organismRef.organismId}
								organism={organismRef.organism}
								order={organismRef.order}
								onSelectNode={onSelectNode}
							/>
						))}
					</div>
				) : (
					<div className="rounded-lg border bg-secondary/40 p-4 text-sm text-muted-foreground">
						Select an Agent Registry screen to inspect the registered hierarchy.
					</div>
				)}
			</div>
		</div>
	);
}

function OrganismPreview({
	organism,
	order,
	onSelectNode,
}: {
	organism?: RegisteredOrganismAsset;
	order: number;
	onSelectNode: (node: AgentNodeSelection) => void;
}) {
	if (!organism) {
		return (
			<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
				Missing organism
			</div>
		);
	}

	return (
		<div className="rounded-lg border bg-secondary/30 p-3">
			<button
				type="button"
				className="flex w-full items-start justify-between gap-3 text-left"
				onClick={() => onSelectNode({ level: "organism", id: organism.id })}
			>
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold">
						{order}. {organism.name}
					</p>
					<p className="truncate text-xs text-muted-foreground">{organism.id}</p>
				</div>
				<Badge variant="outline">{organism.layout ?? "section"}</Badge>
			</button>
			<div className="mt-3 flex flex-col gap-2">
				{organism.components.map((componentRef) => (
					<ComponentPreview
						key={componentRef.componentId}
						component={componentRef.component}
						order={componentRef.order}
						onSelectNode={onSelectNode}
					/>
				))}
			</div>
		</div>
	);
}

function ComponentPreview({
	component,
	order,
	onSelectNode,
}: {
	component?: RegisteredComponentAsset;
	order: number;
	onSelectNode: (node: AgentNodeSelection) => void;
}) {
	if (!component) {
		return (
			<div className="rounded-md border border-destructive/30 bg-background p-2 text-xs text-destructive">
				Missing component
			</div>
		);
	}

	return (
		<button
			type="button"
			className="flex items-center justify-between gap-3 rounded-md border bg-background p-2 text-left transition-colors hover:bg-accent"
			onClick={() => onSelectNode({ level: "component", id: component.id })}
		>
			<div className="min-w-0">
				<p className="truncate text-sm font-medium">
					{order}. {component.name}
				</p>
				<p className="truncate text-xs text-muted-foreground">{component.id}</p>
			</div>
			<Badge variant="secondary">{component.type}</Badge>
		</button>
	);
}

function getPreviewScreen(
	registry: AssetRegistry | undefined,
	selectedAsset: SelectedAgentAsset | undefined,
	selectedNode: AgentNodeSelection,
): RegisteredScreenAsset | undefined {
	if (selectedAsset?.level === "screen") return selectedAsset.item;
	if (selectedAsset?.level === "variant") return selectedAsset.item.screens[0];
	if (selectedAsset?.level === "route") return selectedAsset.item.variants[0]?.screens[0];

	for (const route of registry?.routes ?? []) {
		for (const variant of route.variants) {
			for (const screen of variant.screens) {
				if (selectedNode.level === "organism") {
					const hasOrganism = screen.organisms.some((ref) => ref.organismId === selectedNode.id);
					if (hasOrganism) return screen;
				}
				if (selectedNode.level === "component") {
					const hasComponent = screen.organisms.some((organismRef) => {
						return organismRef.organism?.components.some(
							(componentRef) => componentRef.componentId === selectedNode.id,
						);
					});
					if (hasComponent) return screen;
				}
			}
		}
	}

	return registry?.routes[0]?.variants[0]?.screens[0];
}
