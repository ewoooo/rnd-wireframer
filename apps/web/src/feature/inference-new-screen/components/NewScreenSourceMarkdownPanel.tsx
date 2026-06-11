"use client";

import { useEffect, useState } from "react";
import { parseSourceMarkdown, type SourceMarkdownBlock } from "@/lib/source-markdown";

/**
 * Run(agent) 탭 우측 패널: 선택한 화면(run)의 입력 md 원문을 그대로 보여준다.
 * runId(=jobId)가 있으면 artifact API에서 `context/source.raw.md`를 읽어 표시.
 * 아직 실행 전(runId 없음) 항목은 읽을 artifact가 없으므로 안내만 노출한다.
 */
export function NewScreenSourceMarkdownPanel({ runId }: { runId?: string }) {
	const [text, setText] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!runId) {
			setText(null);
			setError(null);
			return;
		}
		let cancelled = false;
		setText(null);
		setError(null);
		fetch(`/api/inference/${encodeURIComponent(runId)}/artifacts/context/source.raw.md`)
			.then(async (response) => {
				if (!response.ok) throw new Error("입력 md를 불러오지 못했습니다.");
				return response.text();
			})
			.then((value) => {
				if (!cancelled) setText(value);
			})
			.catch((cause: unknown) => {
				if (!cancelled) setError(cause instanceof Error ? cause.message : "불러오기 실패");
			});
		return () => {
			cancelled = true;
		};
	}, [runId]);

	if (!runId) {
		return (
			<div className="px-3 py-3 text-sm text-muted-foreground">
				실행된 화면을 선택하면 입력 md가 표시됩니다.
			</div>
		);
	}
	if (error) {
		return <div className="px-3 py-3 text-xs text-destructive">{error}</div>;
	}
	if (text === null) {
		return <div className="px-3 py-3 text-sm text-muted-foreground">불러오는 중…</div>;
	}
	return (
		<div className="flex flex-col gap-3 px-3 py-3">
			{parseSourceMarkdown(text).map((block, index) => (
				<SourceMarkdownBlockView block={block} key={index} />
			))}
		</div>
	);
}

function SourceMarkdownBlockView({ block }: { block: SourceMarkdownBlock }) {
	if (block.kind === "heading") {
		return (
			<p className="mt-1 text-xs font-semibold text-sidebar-foreground">{block.text}</p>
		);
	}
	if (block.kind === "paragraph") {
		return <p className="text-[11px] leading-5 text-muted-foreground">{block.text}</p>;
	}
	if (block.kind === "frontmatter") {
		return (
			<table className="w-full border-collapse text-[11px] leading-4">
				<tbody>
					{block.rows.map((row) => (
						<tr key={row.key}>
							<th className="whitespace-nowrap border border-divider bg-sidebar-accent px-2 py-1 text-left align-top font-semibold text-sidebar-foreground">
								{row.key}
							</th>
							<td className="border border-divider px-2 py-1 align-top text-sidebar-foreground">
								{row.value}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}
	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse text-[11px] leading-4">
				<thead>
					<tr>
						{block.headers.map((header, index) => (
							<th
								className="whitespace-nowrap border border-divider bg-sidebar-accent px-2 py-1 text-left font-semibold text-sidebar-foreground"
								key={index}
							>
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{block.rows.map((row, rowIndex) => (
						<tr key={rowIndex}>
							{row.map((cell, cellIndex) => (
								<td
									className="whitespace-pre-line border border-divider px-2 py-1 align-top text-sidebar-foreground"
									key={cellIndex}
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
