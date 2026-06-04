import styles from "./TextButton.module.css";

interface TextButtonProps {
	label?: string;
	underline?: boolean;
}

export function TextButton({ label = "더보기", underline = false }: TextButtonProps) {
	return (
		<button
			className={`${styles.textButton} ${underline ? styles.underline : ""}`}
			type="button"
			data-cx-component="TextButton"
		>
			{label}
		</button>
	);
}
