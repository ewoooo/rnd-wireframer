import styles from "./Callout.module.css";

/** Figma: Callout — padding 12/16, radius=10, fill=gray-50, title+body */
interface CalloutProps {
	title?: string;
	children: React.ReactNode;
}

export function Callout({ title, children }: CalloutProps) {
	return (
		<div className={styles.callout}>
			{title && <p className={styles.title}>{title}</p>}
			<p className={styles.body}>{children}</p>
		</div>
	);
}
