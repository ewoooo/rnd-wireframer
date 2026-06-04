import { Badge } from "../Badge";
import styles from "./ListProductRow.module.css";

interface ListProductRowProps {
	title?: string;
	brand?: string;
	description?: string;
	price?: string;
	originalPrice?: string;
	discountRate?: string;
	imageUrl?: string;
	imageAlt?: string;
	badges?: readonly string[];
	specs?: readonly string[];
	benefitText?: string;
	ctaLabel?: string;
}

export function ListProductRow({
	title = "상품명",
	brand,
	description,
	price,
	originalPrice,
	discountRate,
	imageUrl,
	imageAlt,
	badges = [],
	specs = [],
	benefitText,
	ctaLabel,
}: ListProductRowProps) {
	return (
		<article className={styles.card} data-cx-component="ListProductRow">
			<div className={styles.media} aria-hidden={!imageUrl}>
				{imageUrl ? (
					<img src={imageUrl} alt={imageAlt ?? title} />
				) : (
					<span>{brand?.[0] ?? "T"}</span>
				)}
			</div>
			<div className={styles.content}>
				<div className={styles.heading}>
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
				{specs.length > 0 ? (
					<ul className={styles.specs}>
						{specs.map((spec) => (
							<li key={spec}>{spec}</li>
						))}
					</ul>
				) : null}
				<div className={styles.priceRow}>
					<div className={styles.priceBlock}>
						{discountRate ? <span className={styles.discount}>{discountRate}</span> : null}
						{price ? <span className={styles.price}>{price}</span> : null}
						{originalPrice ? <span className={styles.originalPrice}>{originalPrice}</span> : null}
					</div>
					{ctaLabel ? <span className={styles.cta}>{ctaLabel}</span> : null}
				</div>
				{benefitText ? <div className={styles.benefit}>{benefitText}</div> : null}
			</div>
		</article>
	);
}
