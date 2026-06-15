import styles from "./ListText.module.css";

function ChevronIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<path
				d="M6 4L10 8L6 12"
				stroke="#05001A"
				strokeWidth="1.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/* Figma variants:
   off         — title (flex-1, truncate) + chevron(showRightItem)
   on          — title (85px) + subText (gray-alpha-600, right) — subText는 항상 노출
   dot         — bullet body + chevron(showRightItem)
   firstTitle  — large bold title (16px) + value(price, 없으면 subText) — 값은 항상 노출
   secondTitle — bold title (14px) + chevron(showRightItem)

   showRightItem은 셰브론(이동 affordance) 노출에만 쓰며 기본 false다.
   'on'의 subText와 'firstTitle'의 값은 행의 본문이므로 showRightItem과 무관하게 노출한다.
*/
export type ListTextTable = "off" | "on" | "dot" | "firstTitle" | "secondTitle";

interface ListTextProps {
	table?: ListTextTable;
	title?: string;
	subText?: string;
	price?: string;
	showRightItem?: boolean;
	onClick?: () => void;
}

export function ListText({
	table,
	title = "타이틀 레이블",
	subText,
	price,
	showRightItem = false,
	onClick,
}: ListTextProps) {
	// table 미지정 시 subText 유무로 변형을 추론한다. subText가 있으면 좌제목·우보조값
	// key-value 행('on'), 없으면 내비게이션 행('off'). 이 폴백 덕에 variant가 누락된
	// render-tree도 subText를 셰브론으로 갈아끼우지 않고 그대로 노출한다.
	const variant: ListTextTable = table ?? (subText ? "on" : "off");

	const containerClass = [
		styles.row,
		styles[variant] ?? "",
		["firstTitle", "secondTitle"].includes(variant) ? styles.alignStart : styles.alignCenter,
	]
		.filter(Boolean)
		.join(" ");

	if (variant === "off") {
		return (
			<div className={containerClass} onClick={onClick} role={onClick ? "button" : undefined}>
				<div className={styles.leftItem}>
					<span className={styles.titleEllipsis}>{title}</span>
				</div>
				{showRightItem && (
					<div className={styles.rightItem}>
						<ChevronIcon />
					</div>
				)}
			</div>
		);
	}

	if (variant === "on") {
		return (
			<div className={containerClass}>
				<span className={styles.titleFixed}>{title}</span>
				{subText && <span className={styles.subTextRight}>{subText}</span>}
			</div>
		);
	}

	if (variant === "dot") {
		return (
			<div className={containerClass} onClick={onClick} role={onClick ? "button" : undefined}>
				<div className={styles.leftItem}>
					<ul className={styles.dotList}>
						<li>{subText}</li>
					</ul>
				</div>
				{showRightItem && (
					<div className={styles.rightItem}>
						<ChevronIcon />
					</div>
				)}
			</div>
		);
	}

	if (variant === "firstTitle") {
		// firstTitle은 큰 제목 + 우측 값이다. 값은 price를 우선하되, render-tree가 값을
		// subText로 실어 보낸 경우(예: 청구금액)를 위해 subText로 폴백한다.
		const rightValue = price ?? subText;
		return (
			<div className={containerClass}>
				<span className={styles.titleLarge}>{title}</span>
				{rightValue && (
					<div className={styles.rightItem}>
						<span className={styles.priceText}>{rightValue}</span>
					</div>
				)}
			</div>
		);
	}

	// secondTitle
	return (
		<div className={containerClass} onClick={onClick} role={onClick ? "button" : undefined}>
			<span className={styles.titleMedium}>{title}</span>
			{showRightItem && (
				<div className={styles.rightItem}>
					<ChevronIcon />
				</div>
			)}
		</div>
	);
}
