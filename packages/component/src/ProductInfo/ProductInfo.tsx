import { Badge } from "../Badge";
import styles from "./ProductInfo.module.css";

interface ProductInfoProps {
	brand?: string;
	title?: string;
	description?: string;
	price?: string;
	originalPrice?: string;
	discountRate?: string;
	badges?: readonly string[];
}

export function ProductInfo({
	brand,
	title = "상품명",
	description,
	price,
	originalPrice,
	discountRate,
	badges = [],
}: ProductInfoProps) {
	return (
		<section className={styles.productInfo} data-cx-component="ProductInfo">
			{badges.length > 0 ? (
				<div className={styles.badges}>
					{badges.map((badge) => (
						<Badge key={badge} variant="gray">
							{badge}
						</Badge>
					))}
				</div>
			) : null}
			{brand ? <p className={styles.brand}>{brand}</p> : null}
			<h2 className={styles.title}>{title}</h2>
			{description ? <p className={styles.description}>{description}</p> : null}
			{price || originalPrice || discountRate ? (
				<div className={styles.priceRow}>
					{discountRate ? <span className={styles.discountRate}>{discountRate}</span> : null}
					{price ? <span className={styles.price}>{price}</span> : null}
					{originalPrice ? <span className={styles.originalPrice}>{originalPrice}</span> : null}
				</div>
			) : null}
		</section>
	);
}
