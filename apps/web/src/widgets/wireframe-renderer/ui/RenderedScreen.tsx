import type { WireframeScreenNode } from "@cx/renderer";
import { WireframeScreenRenderer } from "@cx/renderer";
import { Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RenderedScreenProps {
	data?: Record<string, unknown>;
	node?: WireframeScreenNode;
}

export function RenderedScreen({ data, node }: RenderedScreenProps) {
	return (
		<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
			{node ? <WireframeScreenRenderer data={data} node={node} /> : <EmptyRenderedScreen />}
		</div>
	);
}

function EmptyRenderedScreen() {
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
