import { Button } from "../Button";
import styles from "./CardSummary.module.css";

interface SummaryItem {
	label: string;
	value?: string;
}

interface CardSummaryProps {
	title?: string;
	subText?: string;
	rightText?: string;
	items?: readonly SummaryItem[];
	buttonLabel?: string;
}

export function CardSummary({
	title = "요약",
	subText,
	rightText,
	items = [],
	buttonLabel,
}: CardSummaryProps) {
	return (
		<section className={styles.cardSummary} data-cx-component="CardSummary">
			<div className={styles.header}>
				<div className={styles.titleBlock}>
					<strong className={styles.title}>{title}</strong>
					{subText ? <span className={styles.subText}>{subText}</span> : null}
				</div>
				{rightText ? <span className={styles.rightText}>{rightText}</span> : null}
			</div>
			{items.length > 0 ? (
				<ul className={styles.items}>
					{items.map((item) => (
						<li key={`${item.label}:${item.value ?? ""}`} className={styles.item}>
							<span>{item.label}</span>
							{item.value ? <strong>{item.value}</strong> : null}
						</li>
					))}
				</ul>
			) : null}
			{buttonLabel ? (
				<Button size="small" variant="secondary">
					{buttonLabel}
				</Button>
			) : null}
		</section>
	);
}
