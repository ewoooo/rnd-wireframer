import type { RegisteredNodeTree } from "@cx/agent/types";
import type { SelectedAgentAsset } from "@/agent/agent-registry-view";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AgentRegistryInspectionProps {
	registry?: RegisteredNodeTree;
	selectedAsset?: SelectedAgentAsset;
	warnings: string[];
}

export function AgentRegistryInspection({
	registry,
	selectedAsset,
	warnings,
}: AgentRegistryInspectionProps) {
	return (
		<div className="flex flex-col gap-4 pr-3">
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">Agent Registry</h2>
				<InfoRow label="Source" value="database/ai-imports/agent-assets.json" />
				<InfoRow label="Routes" value={String(registry?.routes.length ?? 0)} />
				<InfoRow label="Areas" value={String(registry?.areas.length ?? 0)} />
				<InfoRow label="Components" value={String(registry?.components.length ?? 0)} />
			</div>
			{selectedAsset ? <SelectedAssetInspection selectedAsset={selectedAsset} /> : null}
			<Separator />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">Warnings</h2>
				{warnings.length > 0 ? (
					warnings.map((warning) => (
						<div key={warning} className="rounded-lg border bg-background p-3 text-sm">
							{warning}
						</div>
					))
				) : (
					<Badge>no warnings</Badge>
				)}
			</div>
		</div>
	);
}

function SelectedAssetInspection({ selectedAsset }: { selectedAsset: SelectedAgentAsset }) {
	const asset = selectedAsset.item;

	return (
		<>
			<Separator />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">Selected Asset</h2>
				<InfoRow label="Level" value={selectedAsset.level} />
				<InfoRow label="ID" value={asset.id} />
				<InfoRow label="Name" value={asset.name} />
				<InfoRow label="Order" value={String(asset.order)} />
			</div>
		</>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="truncate text-sm font-medium">{value}</span>
		</div>
	);
}
