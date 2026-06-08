import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

/** Figma: .Button — Size=XSmall|Small|Medium|Large × Type=Primary|Secondary|Solid */
type Variant = 'primary' | 'secondary' | 'solid';
type Size    = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  rightIcon,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
      {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
    </button>
  );
}
