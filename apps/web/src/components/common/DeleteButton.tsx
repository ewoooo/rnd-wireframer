"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";

interface DeleteButtonProps {
	description: string;
	disabled?: boolean;
	onConfirm: () => void | Promise<void>;
	size?: "sm" | "xs";
}

export function DeleteButton({
	description,
	disabled,
	onConfirm,
	size = "sm",
}: DeleteButtonProps) {
	const [confirming, setConfirming] = useState(false);
	const [pending, setPending] = useState(false);

	async function handleConfirm() {
		setPending(true);
		await onConfirm();
		setPending(false);
		setConfirming(false);
	}

	if (confirming) {
		return (
			<div className="flex flex-col gap-1.5">
				<p className={cn("text-destructive", size === "xs" ? "text-xs" : "text-sm")}>
					{description}
				</p>
				<div className="flex gap-1">
					<Button
						type="button"
						size="sm"
						variant="destructive"
						disabled={pending}
						onClick={handleConfirm}
					>
						{pending ? "삭제 중…" : "삭제 확인"}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						disabled={pending}
						onClick={() => setConfirming(false)}
					>
						취소
					</Button>
				</div>
			</div>
		);
	}

	return (
		<Button
			type="button"
			size="sm"
			variant="ghost"
			className="text-destructive hover:text-destructive"
			disabled={disabled}
			onClick={() => setConfirming(true)}
		>
			<Trash2 className="size-3.5" />
			삭제
		</Button>
	);
}
