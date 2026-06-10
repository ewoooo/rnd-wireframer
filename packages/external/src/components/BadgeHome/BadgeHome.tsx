import styles from './BadgeHome.module.css';

interface BadgeHomeProps {
  label: string;
}

export function BadgeHome({ label }: BadgeHomeProps) {
  return <span className={styles.badge}>{label}</span>;
}
