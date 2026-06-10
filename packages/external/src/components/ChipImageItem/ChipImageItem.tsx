import type { ReactNode } from 'react';
import styles from './ChipImageItem.module.css';

// Figma: ico_terminal (16×16) — device + bar chart icon
function TerminalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 5.6C2 4.107 2 3.36 2.291 2.79C2.547 2.288 2.955 1.88 3.457 1.625C4.027 1.334 4.774 1.334 6.267 1.334H9.734C11.227 1.334 11.974 1.334 12.545 1.625C13.046 1.88 13.454 2.288 13.71 2.79C14 3.36 14 4.107 14 5.6V10.4C14 11.894 14 12.641 13.71 13.211C13.454 13.713 13.046 14.121 12.545 14.377C11.974 14.667 11.227 14.667 9.734 14.667H6.267C4.774 14.667 4.027 14.667 3.457 14.377C2.955 14.121 2.547 13.713 2.291 13.211C2 12.641 2 11.894 2 10.4V5.6Z"
        fill="#E2E6F1"
      />
      <path
        d="M8 7.926C8.332 7.926 8.6 8.174 8.6 8.481V11.445C8.6 11.752 8.332 12 8 12C7.669 12 7.4 11.752 7.4 11.445V8.481C7.4 8.174 7.669 7.926 8 7.926ZM10.4 7C10.732 7 11 7.248 11 7.555V11.445C11 11.752 10.732 12 10.4 12C10.069 12 9.8 11.752 9.8 11.445V7.555C9.8 7.248 10.069 7 10.4 7ZM5.6 9.037C5.932 9.037 6.2 9.285 6.2 9.592V11.444C6.2 11.751 5.932 11.999 5.6 11.999C5.269 11.999 5 11.751 5 11.444V9.592C5 9.285 5.269 9.037 5.6 9.037Z"
        fill="#3617CE"
      />
    </svg>
  );
}

interface ChipImageItemProps {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

export function ChipImageItem({
  label,
  icon = <TerminalIcon />,
  selected = false,
  onClick,
}: ChipImageItemProps) {
  return (
    <button
      className={[styles.chip, selected ? styles.selected : styles.default].join(' ')}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export { TerminalIcon };
