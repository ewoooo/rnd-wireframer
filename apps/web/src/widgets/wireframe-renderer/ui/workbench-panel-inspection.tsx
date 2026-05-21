import type { WireframeNode } from "@cx/wireframe";
import { Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { SelectedComponentContext, SelectedOrganismContext } from "../model/workbench-store";
import { useWorkbenchStore } from "../model/workbench-store";

export function WorkbenchPanelInspection() {
	const component = useWorkbenchStore((state) => state.selectedComponent);
	const organism = useWorkbenchStore((state) => state.selectedOrganism);
	const screen = useWorkbenchStore((state) => state.activeScreen);
	const validationErrors = useWorkbenchStore((state) => state.validationErrors);
	const validationLabel = useWorkbenchStore((state) => state.validationLabel);
	const validationSuccess = useWorkbenchStore((state) => state.validationSuccess);

	if (!screen) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>관련 정보</CardTitle>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card className="flex min-h-0 flex-col">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Workflow data-icon="inline-start" />
					관련 screen / OGN 정보
				</CardTitle>
				<CardDescription>현재 렌더 화면과 연결된 생성 맥락입니다.</CardDescription>
			</CardHeader>
			<CardContent className="min-h-0 flex-1">
				<ScrollArea className="h-[calc(100vh-128px)]">
					<div className="flex flex-col gap-4 pr-3">
						<div className="flex flex-col gap-2">
							<InfoRow label="Screen code" value={screen.code} />
							<InfoRow
								label="Route"
								value={`${screen.screenRouteName} (${screen.screenRouteCode})`}
							/>
							<InfoRow
								label="Variant"
								value={`${screen.screenVariantName} (${screen.screenVariantId})`}
							/>
							<InfoRow label="Variant type" value={screen.screenVariantType} />
							<InfoRow label="Module" value={screen.module} />
						</div>
						{component ? <ComponentInspection component={component} /> : null}
						{organism ? <OrganismInspection organism={organism} /> : null}
						<Separator />
						<div className="flex flex-col gap-2">
							<h2 className="text-sm font-semibold">연결 OGN</h2>
							{screen.organisms.map((screenOrganism) => (
								<div
									key={screenOrganism.organismCode}
									className="flex items-center justify-between rounded-lg border bg-background p-3"
								>
									<div className="flex min-w-0 flex-col gap-1">
										<span className="truncate text-sm font-medium">
											{screenOrganism.organismCode}
										</span>
										<span className="text-xs text-muted-foreground">
											order {screenOrganism.order}
										</span>
									</div>
									<Badge variant="outline">section</Badge>
								</div>
							))}
						</div>
						<Separator />
						<div className="flex flex-col gap-2">
							<h2 className="text-sm font-semibold">검증 상태</h2>
							{validationSuccess ? (
								<Badge>{validationLabel}</Badge>
							) : (
								<div className="flex flex-col gap-2">
									<Badge variant="outline">{validationLabel}</Badge>
									{validationErrors.map((error) => (
										<div key={error} className="rounded-lg border bg-background p-3 text-sm">
											{error}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}

function ComponentInspection({ component }: { component: SelectedComponentContext }) {
	return (
		<>
			<Separator />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">선택 COMP</h2>
				<InfoRow label="Component id" value={component.code} />
				<InfoRow label="Type" value={component.node.type} />
				<InfoRow label="Source screen" value={component.screen.code} />
				<InfoRow label="Parent OGN" value={component.organism?.code ?? "screen"} />
			</div>
			<NodePropsPanel node={component.node} />
		</>
	);
}

function OrganismInspection({ organism }: { organism: SelectedOrganismContext }) {
	return (
		<>
			<Separator />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">선택 OGN</h2>
				<InfoRow label="OGN code" value={organism.code} />
				<InfoRow label="Source screen" value={organism.screen.code} />
				<InfoRow label="Components" value={String(organism.node.children?.length ?? 0)} />
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">컴포넌트</h2>
				{organism.node.children?.map((child, index) => (
					<div
						key={child.metadata.id}
						className="flex items-center justify-between rounded-lg border bg-background p-3"
					>
						<div className="flex min-w-0 flex-col gap-1">
							<span className="truncate text-sm font-medium">{child.metadata.title}</span>
							<span className="text-xs text-muted-foreground">{child.metadata.id}</span>
						</div>
						<Badge variant="outline">{index + 1}</Badge>
					</div>
				))}
			</div>
		</>
	);
}

function NodePropsPanel({ node }: { node: WireframeNode }) {
	const props = node.props ? JSON.stringify(node.props, null, 2) : "{}";

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-sm font-semibold">Props</h2>
			<pre className="max-h-64 overflow-auto rounded-lg border bg-background p-3 text-xs leading-5">
				{props}
			</pre>
		</div>
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
