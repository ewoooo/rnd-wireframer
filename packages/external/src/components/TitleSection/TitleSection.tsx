import chevronRight from "./assets/chevron-right.svg";
import styles from "./TitleSection.module.css";

/* Figma: TitleSection — node 10095:64950, 353px */
interface TitleSectionProps {
	subtitle?: string;
	title?: string;
	count?: number;
	showSubtitle?: boolean;
	showCount?: boolean;
	showChevron?: boolean;
	onChevronClick?: () => void;
}

export function TitleSection({
	subtitle,
	title = "타이틀",
	count = 2,
	showSubtitle,
	showCount = false,
	showChevron = false,
	onChevronClick,
}: TitleSectionProps) {
	const shouldShowSubtitle = showSubtitle ?? Boolean(subtitle);

	return (
		<div className={styles.wrap}>
			{shouldShowSubtitle && <p className={styles.subtitle}>{subtitle}</p>}
			<div className={styles.titleRow}>
				<div className={styles.titleLeft}>
					<span className={styles.title}>{title}</span>
					{showCount && <span className={styles.count}>{count}</span>}
				</div>
				{showChevron && (
					<button
						type="button"
						className={styles.chevronBtn}
						onClick={onChevronClick}
						aria-label="더보기"
					>
						<img src={chevronRight} alt="" width={16} height={16} />
					</button>
				)}
			</div>
		</div>
	);
}
