import { Badge } from "../Badge";
import styles from "./ListProductHorizontal.module.css";

interface ListProductHorizontalProps {
	title?: string;
	brand?: string;
	description?: string;
	price?: string;
	originalPrice?: string;
	discountRate?: string;
	imageUrl?: string;
	imageAlt?: string;
	badges?: readonly string[];
	meta?: string;
	benefitText?: string;
	ctaLabel?: string;
}

export function ListProductHorizontal({
	title = "상품명",
	brand,
	description,
	price,
	originalPrice,
	discountRate,
	imageUrl,
	imageAlt,
	badges = [],
	meta,
	benefitText,
	ctaLabel,
}: ListProductHorizontalProps) {
	return (
		<article className={styles.card} data-cx-component="ListProductHorizontal">
			<div className={styles.thumbnail} aria-hidden={!imageUrl}>
				{imageUrl ? (
					<img src={imageUrl} alt={imageAlt ?? title} />
				) : (
					<span>{brand?.[0] ?? "T"}</span>
				)}
			</div>
			<div className={styles.body}>
				<div className={styles.titleBlock}>
					{badges.length > 0 ? (
						<div className={styles.badges}>
							{badges.map((badge) => (
								<Badge key={badge} variant="gray">
									{badge}
								</Badge>
							))}
						</div>
					) : null}
					{brand ? <span className={styles.brand}>{brand}</span> : null}
					<strong className={styles.title}>{title}</strong>
					{description ? <span className={styles.description}>{description}</span> : null}
				</div>
				<div className={styles.detailRow}>
					<div className={styles.priceBlock}>
						{discountRate ? <span className={styles.discount}>{discountRate}</span> : null}
						{price ? <span className={styles.price}>{price}</span> : null}
						{originalPrice ? <span className={styles.originalPrice}>{originalPrice}</span> : null}
					</div>
					{meta ? <span className={styles.meta}>{meta}</span> : null}
				</div>
				{benefitText || ctaLabel ? (
					<div className={styles.bottomRow}>
						{benefitText ? <span className={styles.benefit}>{benefitText}</span> : null}
						{ctaLabel ? <span className={styles.cta}>{ctaLabel}</span> : null}
					</div>
				) : null}
			</div>
		</article>
	);
}
