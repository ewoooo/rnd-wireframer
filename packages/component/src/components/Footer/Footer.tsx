import styles from "./Footer.module.css";

interface FooterProps {
	title?: string;
	description?: string;
	links?: readonly string[];
}

export function Footer({ title = "안내", description, links = [] }: FooterProps) {
	return (
		<footer className={styles.footer} data-cx-component="Footer">
			<strong className={styles.title}>{title}</strong>
			{description ? <p className={styles.description}>{description}</p> : null}
			{links.length > 0 ? (
				<nav className={styles.links} aria-label={title}>
					{links.map((link) => (
						<button key={link} className={styles.link} type="button">
							{link}
						</button>
					))}
				</nav>
			) : null}
		</footer>
	);
}
