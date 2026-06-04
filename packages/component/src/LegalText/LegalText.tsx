import styles from "./LegalText.module.css";

interface LegalTextProps {
	title?: string;
	items?: readonly string[];
}

export function LegalText({ title, items = [] }: LegalTextProps) {
	return (
		<section className={styles.legalText} data-cx-component="LegalText">
			{title ? <strong className={styles.title}>{title}</strong> : null}
			<ul className={styles.list}>
				{items.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
		</section>
	);
}
