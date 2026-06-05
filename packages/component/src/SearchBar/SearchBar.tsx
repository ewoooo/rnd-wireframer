import styles from "./SearchBar.module.css";

type SearchBarVariant = "llm" | "search";

interface SearchBarProps {
	placeholder?: string;
	value?: string;
	variant?: SearchBarVariant;
	onChange?: (value: string) => void;
	onSubmit?: () => void;
}

export function SearchBar({
	placeholder = "검색",
	value = "",
	variant = "search",
	onChange,
	onSubmit,
}: SearchBarProps) {
	return (
		<div className={`${styles.container} ${styles[variant]}`}>
			<input
				className={styles.input}
				type="search"
				placeholder={placeholder}
				value={value}
				onChange={(event) => onChange?.(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") onSubmit?.();
				}}
			/>
			<button
				type="button"
				className={variant === "llm" ? styles.llmButton : styles.searchIcon}
				aria-label={variant === "llm" ? "AI 검색" : "검색"}
				onClick={onSubmit}
			>
				{variant === "llm" ? (
					<span className={styles.llmGlyph}>
						<span />
						<span />
						<span />
					</span>
				) : (
					<span className={styles.searchGlyph} />
				)}
			</button>
		</div>
	);
}
