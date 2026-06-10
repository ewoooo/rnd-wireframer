import styles from './ButtonItem.module.css';

/* Figma: ButtonItem — node 9861:46125 */
interface ButtonItemProps {
  label?: string;
  onClick?: () => void;
}

export function ButtonItem({ label = 'MY 편집', onClick }: ButtonItemProps) {
  return (
    <button className={styles.btn} onClick={onClick}>
      {label}
    </button>
  );
}
