import styles from "./CardContentsFilled.module.css";

interface CardContentsFilledProps {
	title?: string;
	description?: string;
	children?: React.ReactNode;
}

export function CardContentsFilled({ title, description, children }: CardContentsFilledProps) {
	return (
		<section className={styles.cardContentsFilled} data-cx-component="CardContentsFilled">
			{title ? <strong className={styles.title}>{title}</strong> : null}
			{description ? <p className={styles.description}>{description}</p> : null}
			{children}
		</section>
	);
}
