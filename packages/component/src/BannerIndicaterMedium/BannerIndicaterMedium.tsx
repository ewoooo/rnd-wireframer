import styles from "./BannerIndicaterMedium.module.css";

interface BannerIndicaterMediumProps {
	title?: string;
	description?: string;
	imageUrl?: string;
	current?: number;
	total?: number;
}

export function BannerIndicaterMedium({
	title = "배너",
	description,
	imageUrl,
	current = 1,
	total = 1,
}: BannerIndicaterMediumProps) {
	return (
		<section className={styles.banner} data-cx-component="BannerIndicaterMedium">
			<div className={styles.copy}>
				<strong className={styles.title}>{title}</strong>
				{description ? <span className={styles.description}>{description}</span> : null}
			</div>
			{imageUrl ? <img className={styles.image} src={imageUrl} alt="" /> : null}
			<span className={styles.indicator}>
				{current}/{total}
			</span>
		</section>
	);
}
