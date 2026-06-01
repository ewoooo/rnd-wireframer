import type { RenderTreeScreenNode } from "@cx/renderer";
import { RenderTreeScreenRenderer } from "@cx/renderer";
import { Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RenderedScreenProps {
	data?: Record<string, unknown>;
	emptyMessage?: string;
	node?: RenderTreeScreenNode;
}

export function RenderedScreen({ data, emptyMessage, node }: RenderedScreenProps) {
	return (
		<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-3xl border bg-background shadow-xl">
			{node ? <RenderTreeScreenRenderer data={data} node={node} /> : <EmptyRenderedScreen message={emptyMessage} />}
		</div>
	);
}

function EmptyRenderedScreen({ message }: { message?: string }) {
	return (
		<div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
			<Layers3 data-icon="inline-start" />
			<p className="text-sm text-muted-foreground">
				{message ?? "렌더링할 Screen 노드가 없습니다."}
			</p>
			{!message && (
				<Button variant="outline" size="sm">
					검증 결과 보기
				</Button>
			)}
		</div>
	);
}
