"use client";

import {
	validateWireframeSchemaFull,
	type WireframeSchema,
	type WireframeScreenNode,
} from "@cx/wireframe";
import { Layers3, Smartphone, Workflow } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { WireframeScreenRenderer } from "./wireframe-screen-renderer";

export interface WireframeWorkbenchScreen {
	code: string;
	description?: string;
	module: string;
	name: string;
	organisms: Array<{
		order: number;
		organismCode: string;
	}>;
	schema: WireframeSchema;
	screenVariantId: string;
	warnings: string[];
}

export interface WireframeWorkbenchOrganism {
	code: string;
	componentCount: number;
	name: string;
	stateCount: number;
	usage: string;
}

interface WireframeWorkbenchProps {
	organisms: WireframeWorkbenchOrganism[];
	screens: WireframeWorkbenchScreen[];
}

export function WireframeWorkbench({ organisms, screens }: WireframeWorkbenchProps) {
	const [selectedScreenCode, setSelectedScreenCode] = useState(screens[0]?.code ?? "");
	const selectedScreen = screens.find((screen) => screen.code === selectedScreenCode) ?? screens[0];
	const validation = selectedScreen
		? validateWireframeSchemaFull(selectedScreen.schema)
		: undefined;
	const screenNode = selectedScreen?.schema.children.find((node) => node.type === "Screen") as
		| WireframeScreenNode
		| undefined;

	return (
		<main className="min-h-screen bg-muted/40">
			<div className="grid min-h-screen grid-cols-[320px_minmax(420px,1fr)_360px] gap-4 p-4">
				<ScreenNavigator
					organisms={organisms}
					screens={screens}
					selectedScreenCode={selectedScreen?.code ?? ""}
					onSelectScreen={setSelectedScreenCode}
				/>
				<section className="flex min-h-0 flex-col gap-4">
					<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<Smartphone data-icon="inline-start" />
							</CardTitle>
							<CardDescription>{selectedScreen?.description}</CardDescription>
						</CardHeader>
						<CardContent className="flex min-h-0 flex-1 items-center justify-center bg-secondary/50 p-6">
							<div className="flex h-[844px] w-[390px] max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
								{screenNode ? <WireframeScreenRenderer node={screenNode} /> : <EmptyCanvas />}
							</div>
						</CardContent>
					</Card>
				</section>
				<RelatedInformation screen={selectedScreen} validationErrors={validation?.errors ?? []} />
			</div>
		</main>
	);
}

function ScreenNavigator({
	organisms,
	onSelectScreen,
	screens,
	selectedScreenCode,
}: {
	organisms: WireframeWorkbenchOrganism[];
	onSelectScreen: (screenCode: string) => void;
	screens: WireframeWorkbenchScreen[];
	selectedScreenCode: string;
}) {
	return (
		<Card className="flex min-h-0 flex-col">
			<CardHeader></CardHeader>
			<CardContent className="min-h-0 flex-1">
				<Tabs defaultValue="screens" className="h-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="screens">Screens</TabsTrigger>
						<TabsTrigger value="organisms">OGN</TabsTrigger>
					</TabsList>
					<TabsContent value="screens" className="min-h-0 flex-1">
						<ScrollArea className="h-[calc(100vh-180px)]">
							<div className="flex flex-col gap-2 pr-3">
								{screens.map((screen) => (
									<button
										type="button"
										key={screen.code}
										className={cn(
											"flex flex-col gap-1 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
											screen.code === selectedScreenCode && "border-primary bg-primary/5",
										)}
										onClick={() => onSelectScreen(screen.code)}
									>
										<span className="text-sm font-medium">{screen.name}</span>
										<span className="text-xs text-muted-foreground">{screen.code}</span>
										<span className="text-xs text-muted-foreground">
											{screen.organisms.length} organisms
										</span>
									</button>
								))}
							</div>
						</ScrollArea>
					</TabsContent>
					<TabsContent value="organisms" className="min-h-0 flex-1">
						<ScrollArea className="h-[calc(100vh-180px)]">
							<div className="flex flex-col gap-2 pr-3">
								{organisms.map((organism) => (
									<div key={organism.code} className="rounded-lg border bg-background p-3">
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-medium">{organism.name}</p>
											<Badge variant="secondary">{organism.usage}</Badge>
										</div>
										<p className="mt-1 text-xs text-muted-foreground">{organism.code}</p>
										<div className="mt-3 flex gap-2 text-xs text-muted-foreground">
											<span>{organism.stateCount} states</span>
											<span>{organism.componentCount} components</span>
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

function RelatedInformation({
	screen,
	validationErrors,
}: {
	screen?: WireframeWorkbenchScreen;
	validationErrors: string[];
}) {
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
							<InfoRow label="Variant" value={screen.screenVariantId} />
							<InfoRow label="Module" value={screen.module} />
						</div>
						<Separator />
						<div className="flex flex-col gap-2">
							<h2 className="text-sm font-semibold">연결 OGN</h2>
							{screen.organisms.map((organism) => (
								<div
									key={organism.organismCode}
									className="flex items-center justify-between rounded-lg border bg-background p-3"
								>
									<div className="flex min-w-0 flex-col gap-1">
										<span className="truncate text-sm font-medium">{organism.organismCode}</span>
										<span className="text-xs text-muted-foreground">order {organism.order}</span>
									</div>
									<Badge variant="outline">section</Badge>
								</div>
							))}
						</div>
						<Separator />
						<div className="flex flex-col gap-2">
							<h2 className="text-sm font-semibold">검증 상태</h2>
							{validationErrors.length === 0 ? (
								<Badge>wireframe valid</Badge>
							) : (
								<div className="flex flex-col gap-2">
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

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="truncate text-sm font-medium">{value}</span>
		</div>
	);
}

function EmptyCanvas() {
	return (
		<div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
			<Layers3 data-icon="inline-start" />
			<p className="text-sm text-muted-foreground">렌더링할 Screen 노드가 없습니다.</p>
			<Button variant="outline" size="sm">
				검증 결과 보기
			</Button>
		</div>
	);
}
