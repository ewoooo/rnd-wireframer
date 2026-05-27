import styles from "./MapBlock.module.css";

interface MapBlockProps {
	title?: string;
	address?: string;
}

export function MapBlock({ title = "지도", address }: MapBlockProps) {
	return (
		<section className={styles.mapBlock} data-cx-component="MapBlock" aria-label={title}>
			<div className={styles.pin} aria-hidden="true" />
			<div className={styles.copy}>
				<strong className={styles.title}>{title}</strong>
				{address ? <span className={styles.address}>{address}</span> : null}
			</div>
		</section>
	);
}
