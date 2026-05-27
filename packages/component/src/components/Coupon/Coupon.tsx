import styles from "./Coupon.module.css";

interface CouponProps {
	title?: string;
	description?: string;
	benefitText?: string;
	conditionText?: string;
	ctaLabel?: string;
	disabled?: boolean;
}

export function Coupon({
	title = "혜택 쿠폰",
	description,
	benefitText = "쿠폰 혜택 제공",
	conditionText,
	ctaLabel = "쿠폰 받기",
	disabled = false,
}: CouponProps) {
	return (
		<section className={styles.coupon} data-cx-component="Coupon" aria-label={title}>
			<div className={styles.content}>
				<span className={styles.eyebrow}>COUPON</span>
				<strong className={styles.title}>{title}</strong>
				{description ? <p className={styles.description}>{description}</p> : null}
				<span className={styles.benefit}>{benefitText}</span>
				{conditionText ? <span className={styles.condition}>{conditionText}</span> : null}
			</div>
			<button className={styles.action} type="button" disabled={disabled}>
				{ctaLabel}
			</button>
		</section>
	);
}
