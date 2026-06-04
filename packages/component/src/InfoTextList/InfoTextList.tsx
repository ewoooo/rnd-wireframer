import styles from "./InfoTextList.module.css";

/* Figma: InfoTextList — badge variant shows "NEW" badge, rightText variant shows "+500P" */
interface InfoTextListProps {
	title?: string;
	category?: string;
	date?: string;
	badge?: string;
	rightText?: string;
}

export function InfoTextList({
	title = "일이삼사오육칠팔구십일이삼사오육칠팔구십",
	category = "{텍스트}",
	date = "2026.01.30",
	badge,
	rightText,
}: InfoTextListProps) {
	return (
		<div className={styles.container}>
			<div className={styles.titleRow}>
				<span className={styles.title}>{title}</span>
				{badge && <span className={styles.badge}>{badge}</span>}
				{rightText && !badge && <span className={styles.rightText}>{rightText}</span>}
			</div>
			<div className={styles.subRow}>
				<span className={styles.subText}>{category}</span>
				<div className={styles.divider} />
				<span className={styles.subText}>{date}</span>
			</div>
		</div>
	);
}
