import type * as React from "react";

import { cn } from "@/lib/utils";

export function Separator({
	className,
	orientation = "horizontal",
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	orientation?: "horizontal" | "vertical";
}) {
	if (orientation === "horizontal") {
		return <hr className={cn("h-px w-full shrink-0 border-0 bg-border", className)} />;
	}

	return (
		<div
			aria-hidden="true"
			className={cn("h-full w-px shrink-0 bg-border", className)}
			{...props}
		/>
	);
}
