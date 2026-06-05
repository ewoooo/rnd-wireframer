import { useId } from "react";

import styles from "./TextField.module.css";

type TextFieldState = "default" | "focused" | "typing" | "typed" | "disabled";

interface TextFieldProps {
	label?: string;
	placeholder?: string;
	helperText?: string;
	value?: string;
	type?: string;
	state?: TextFieldState;
	error?: boolean;
	button?: boolean;
	buttonLabel?: string;
	onButtonClick?: () => void;
	rightElement?: React.ReactNode;
	onChange?: (value: string) => void;
}

export function TextField({
	label,
	placeholder = "입력해주세요",
	helperText,
	value = "",
	type = "text",
	state = "default",
	error = false,
	button = false,
	buttonLabel = "모두 사용",
	onButtonClick,
	rightElement,
	onChange,
}: TextFieldProps) {
	const inputId = useId();
	const inputClass = [styles.input, styles[state], error ? styles.error : ""]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={styles.container}>
			{label && (
				<label
					htmlFor={inputId}
					className={[styles.label, error ? styles.labelError : ""].filter(Boolean).join(" ")}
				>
					{label}
				</label>
			)}
			<div className={styles.inputRow}>
				<div className={inputClass}>
					<input
						id={inputId}
						className={styles.inputField}
						type={type}
						placeholder={placeholder}
						value={value}
						disabled={state === "disabled"}
						onChange={(e) => onChange?.(e.target.value)}
					/>
				</div>
				{button ? (
					<button type="button" className={styles.fieldButton} onClick={onButtonClick}>
						{buttonLabel}
					</button>
				) : (
					rightElement && <div className={styles.rightElement}>{rightElement}</div>
				)}
			</div>
			{helperText && (
				<p
					className={[styles.helperText, error ? styles.helperError : ""].filter(Boolean).join(" ")}
				>
					{helperText}
				</p>
			)}
		</div>
	);
}
