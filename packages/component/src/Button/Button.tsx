import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

/** Figma: .Button — Size=XSmall|Small|Medium|Large × Type=Primary|Secondary|Solid */
export type ButtonVariant = "primary" | "secondary" | "solid";
export type ButtonSize = "xsmall" | "small" | "medium" | "large" | "xlarge";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	rightIcon?: ReactNode;
	/** Catalog 정렬: `label` prop이 children fallback으로 동작. catalog spec과 일치. */
	label?: string;
	children?: ReactNode;
}

export function Button({
	variant = "primary",
	size = "medium",
	fullWidth = false,
	rightIcon,
	type = "button",
	label,
	children,
	className,
	...rest
}: ButtonProps) {
	return (
		<button
			type={type}
			className={[
				styles.button,
				styles[variant],
				styles[size],
				fullWidth ? styles.fullWidth : "",
				className ?? "",
			]
				.filter(Boolean)
				.join(" ")}
			{...rest}
		>
			{children ?? label}
			{rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
		</button>
	);
}
