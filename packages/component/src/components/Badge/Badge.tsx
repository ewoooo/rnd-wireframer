import styles from "./Badge.module.css";

/** Figma: .Badge — Type=Gray|Black|Blue, h=17, radius=4, fontSize=10 */
type BadgeVariant = "gray" | "black" | "blue";

interface BadgeProps {
	variant?: BadgeVariant;
	children: React.ReactNode;
}

export function Badge({ variant = "gray", children }: BadgeProps) {
	return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}
