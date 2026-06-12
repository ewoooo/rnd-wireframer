import { cn } from "@/components/utils";

/**
 * DoubleBorder — 영역을 일반 border보다 강하게 분리하는 구분선.
 *
 * border-style이 아니라, sidebar 배경으로 채운 6px 직사각형에
 * 한 축(좌우 또는 상하)만 border를 살려 "두 줄"처럼 보이게 한 것.
 * Rail/Aside/Canvas 등 레이아웃 칼럼·패널 사이에 둔다.
 */
export function DoubleBorder({
	orientation = "vertical",
	className,
}: {
	orientation?: "vertical" | "horizontal";
	className?: string;
}) {
	return (
		<div
			aria-hidden
			className={cn(
				"shrink-0 bg-sidebar",
				orientation === "vertical"
					? "h-full w-[6px] border-x border-divider"
					: "h-[6px] w-full border-y border-divider",
				className,
			)}
		/>
	);
}
