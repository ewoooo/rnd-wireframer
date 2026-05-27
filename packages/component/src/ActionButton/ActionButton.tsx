import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "../Button";
import styles from "./ActionButton.module.css";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	rightIcon?: ReactNode;
	/** Catalog 정렬: `label` prop이 children fallback. */
	label?: string;
	children?: ReactNode;
}

export function ActionButton({
	variant = "primary",
	size = "xlarge",
	fullWidth = true,
	rightIcon,
	label,
	children,
	className,
	...rest
}: ActionButtonProps) {
	return (
		<div className={styles.root}>
			<Button
				variant={variant}
				size={size}
				fullWidth={fullWidth}
				rightIcon={rightIcon}
				className={className}
				{...rest}
			>
				{children ?? label}
			</Button>
		</div>
	);
}
