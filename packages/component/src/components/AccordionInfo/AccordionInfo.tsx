import { useState } from "react";

import styles from "./AccordionInfo.module.css";

interface AccordionInfoProps {
	title?: string;
	description?: string;
	priceText?: string;
	defaultOpen?: boolean;
	expanded?: boolean;
	variant?: "notice" | "price";
}

export function AccordionInfo({
	title = "상세 정보",
	description,
	priceText,
	defaultOpen = false,
	expanded,
	variant = "notice",
}: AccordionInfoProps) {
	const [open, setOpen] = useState(expanded ?? defaultOpen);
	const body = description || priceText;

	return (
		<section
			className={`${styles.accordionInfo} ${styles[variant]}`}
			data-cx-component="AccordionInfo"
		>
			<button
				className={styles.header}
				type="button"
				aria-expanded={open}
				onClick={() => setOpen(!open)}
			>
				<span className={styles.title}>{title}</span>
				{priceText && !open ? <span className={styles.priceText}>{priceText}</span> : null}
				<span className={`${styles.chevron} ${open ? styles.open : ""}`} aria-hidden="true" />
			</button>
			{open && body ? <p className={styles.body}>{body}</p> : null}
		</section>
	);
}

export function AccordionNoticeInfo(props: Omit<AccordionInfoProps, "variant">) {
	return <AccordionInfo {...props} variant="notice" />;
}

export function AccordionPriceInfo(props: Omit<AccordionInfoProps, "variant">) {
	return <AccordionInfo {...props} variant="price" />;
}
