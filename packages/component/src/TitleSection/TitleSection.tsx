import { Badge } from "../Badge";
import styles from "./TitleSection.module.css";

interface TitleSectionProps {
	title?: string;
	subtitle?: string;
	rightText?: string;
	badge?: string;
}

export function TitleSection({ title = "타이틀", subtitle, rightText, badge }: TitleSectionProps) {
	return (
		<section className={styles.titleSection} data-cx-component="TitleSection">
			<div className={styles.copy}>
				{subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
				<div className={styles.titleRow}>
					<h2 className={styles.title}>{title}</h2>
					{badge ? <Badge variant="gray">{badge}</Badge> : null}
				</div>
			</div>
			{rightText ? (
				<button className={styles.rightText} type="button">
					{rightText}
				</button>
			) : null}
		</section>
	);
}
