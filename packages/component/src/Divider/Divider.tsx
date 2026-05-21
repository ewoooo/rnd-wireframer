import styles from "./Divider.module.css";

/** Figma: Divider — Type=Contents (1px) | Type=Section (4px) */
interface DividerProps {
	type?: "contents" | "section";
}

export function Divider({ type = "contents" }: DividerProps) {
	return <hr className={`${styles.divider} ${styles[type]}`} />;
}
