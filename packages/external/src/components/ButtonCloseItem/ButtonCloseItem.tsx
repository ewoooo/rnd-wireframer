import styles from './ButtonCloseItem.module.css';

// Figma node 9861:71867 — X icon (10×10, fill="currentColor")
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.6204 5.78805C11.7831 5.62534 12.0469 5.62534 12.2096 5.78805C12.3723 5.95078 12.3723 6.21454 12.2096 6.37725L9.58713 8.99972L12.2104 11.623C12.3731 11.7857 12.3731 12.0495 12.2104 12.2122C12.0477 12.3749 11.7839 12.3749 11.6212 12.2122L8.99793 9.58892L6.37871 12.2081C6.216 12.3708 5.95224 12.3708 5.78952 12.2081C5.6268 12.0454 5.6268 11.7817 5.78952 11.6189L8.40874 8.99972L5.79033 6.38132C5.62761 6.2186 5.62761 5.95484 5.79033 5.79212C5.95305 5.62941 6.21681 5.6294 6.37953 5.79212L8.99793 8.41053L11.6204 5.78805Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface ButtonCloseItemProps {
  onClick?: () => void;
  'aria-label'?: string;
}

export function ButtonCloseItem({ onClick, 'aria-label': ariaLabel = '닫기' }: ButtonCloseItemProps) {
  return (
    <button className={styles.btn} onClick={onClick} aria-label={ariaLabel}>
      <CloseIcon />
    </button>
  );
}
