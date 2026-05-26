import styles from "./ThumbnailLarge.module.css";

interface ThumbnailLargeProps {
	src?: string;
	alt?: string;
	title?: string;
	eyebrow?: string;
	backgroundColor?: string;
}

export function ThumbnailLarge({
	src,
	alt = "",
	title,
	eyebrow,
	backgroundColor,
}: ThumbnailLargeProps) {
	return (
		<div
			className={styles.thumbnail}
			style={{ backgroundColor }}
			data-cx-component="ThumbnailLarge"
		>
			{src ? (
				<img className={styles.image} src={src} alt={alt || title || ""} />
			) : (
				<div className={styles.placeholder} aria-hidden={title ? undefined : true}>
					{eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
					{title ? <span className={styles.title}>{title}</span> : null}
				</div>
			)}
		</div>
	);
}
