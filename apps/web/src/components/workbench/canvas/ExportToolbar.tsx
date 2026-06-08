"use client";

import { Braces, Check, Copy, FileJson2, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { renderTreeToBuildCode, renderTreeToJson } from "@/lib/figma-export/build-code";
import type { ScreenSummary } from "@/lib/screen-sources";

// Symmetric counterpart to CanvasToolbar. Each action opens a modal showing the code and
// copies it to the clipboard within the click gesture (so it works inside the preview iframe).
//  - RenderTree JSON   (현재 화면의 RenderTree)
//  - Figma 빌드코드     (RenderTree → 플러그인 빌드코드)
type ExportKind = "json" | "code";

type ExportToolbarProps = {
	canExport: boolean;
	disabledReason: string;
	screen?: ScreenSummary;
};

const TITLE: Record<ExportKind, string> = {
	json: "RenderTree JSON",
	code: "Figma 빌드코드",
};

// Copy that survives the preview iframe. IMPORTANT: run the synchronous execCommand path
// FIRST (no await before it) so the user-gesture activation isn't consumed. Only fall back
// to the async Clipboard API if execCommand is unavailable/failed. Call inside a user gesture.
async function copyText(text: string): Promise<boolean> {
	// 1) synchronous execCommand on a hidden textarea (works in iframes, preserves gesture)
	try {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.style.position = "fixed";
		ta.style.top = "0";
		ta.style.left = "0";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.focus();
		ta.select();
		const ok = document.execCommand("copy");
		ta.remove();
		if (ok) return true;
	} catch {
		/* fall through */
	}
	// 2) async Clipboard API fallback (secure top-level contexts)
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		/* give up */
	}
	return false;
}

export function ExportToolbar({ canExport, disabledReason, screen }: ExportToolbarProps) {
	const [open, setOpen] = useState<ExportKind | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	function showToast(message: string) {
		setToast(message);
		if (toastTimer.current) clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToast(null), 1000);
	}

	useEffect(
		() => () => {
			if (toastTimer.current) clearTimeout(toastTimer.current);
		},
		[],
	);

	function buildContent(kind: ExportKind): string {
		if (!screen?.renderTree) return "";
		return kind === "json"
			? renderTreeToJson(screen.renderTree)
			: renderTreeToBuildCode(screen.renderTree);
	}

	async function handleOpen(kind: ExportKind) {
		if (!screen?.renderTree) return;
		const content = buildContent(kind);
		setOpen(kind);
		const ok = await copyText(content);
		showToast(ok ? "클립보드에 복사되었습니다" : "복사 실패 — 수동으로 복사해주세요");
	}

	async function handleCopyAgain() {
		if (!open) return;
		const ok = await copyText(buildContent(open));
		showToast(ok ? "클립보드에 복사되었습니다" : "복사 실패 — 직접 선택해 복사해주세요");
	}

	return (
		<>
			<div className="flex items-center gap-0.5 rounded-full border bg-background/95 p-1 shadow-sm backdrop-blur">
				<ExportIconButton
					disabled={!canExport}
					icon={<FileJson2 className="size-4" />}
					label={canExport ? "RenderTree JSON 보기 + 복사" : disabledReason}
					onClick={() => handleOpen("json")}
				/>
				<ExportIconButton
					disabled={!canExport}
					icon={<Braces className="size-4" />}
					label={canExport ? "Figma 빌드코드 생성 + 복사" : disabledReason}
					onClick={() => handleOpen("code")}
				/>
			</div>
			{open && screen?.renderTree ? (
				<CodeModal
					title={`${TITLE[open]} · ${screen.id}`}
					code={buildContent(open)}
					onCopy={handleCopyAgain}
					onClose={() => setOpen(null)}
				/>
			) : null}
			{toast ? <Toast message={toast} /> : null}
		</>
	);
}

function Toast({ message }: { message: string }) {
	return (
		<div className="-translate-x-1/2 fixed bottom-8 left-1/2 z-[60] flex items-center gap-2 rounded-full border bg-foreground px-4 py-2 text-background text-sm shadow-lg">
			<Check className="size-4" />
			{message}
		</div>
	);
}

function CodeModal({
	title,
	code,
	onCopy,
	onClose,
}: {
	title: string;
	code: string;
	onCopy: () => void;
	onClose: () => void;
}) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	return (
		<div
			role="presentation"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
		>
			<div className="flex max-h-[80vh] w-[min(880px,92vw)] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
				<div className="flex items-center gap-2 border-b px-4 py-3">
					<span className="flex-1 truncate font-semibold text-sm">{title}</span>
					<Button
						type="button"
						size="sm"
						variant="default"
						className="h-8 cursor-pointer gap-1.5 px-3 font-medium shadow-sm transition-colors hover:opacity-90 active:scale-95"
						onClick={onCopy}
					>
						<Copy className="size-3.5" />
						복사하기
					</Button>
					<Button type="button" size="icon" variant="ghost" className="size-7" onClick={onClose}>
						<X className="size-4" />
					</Button>
				</div>
				<pre className="m-0 flex-1 overflow-auto bg-muted/40 p-4 text-xs leading-relaxed">
					<code>{code}</code>
				</pre>
			</div>
		</div>
	);
}

function ExportIconButton({
	disabled,
	icon,
	label,
	onClick,
}: {
	disabled?: boolean;
	icon: ReactNode;
	label: string;
	onClick?: () => void;
}) {
	return (
		<span title={label}>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-8 rounded-full"
				disabled={disabled}
				onClick={onClick}
			>
				{icon}
			</Button>
		</span>
	);
}
