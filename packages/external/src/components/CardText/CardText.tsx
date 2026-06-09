import styles from './CardText.module.css';

/* Figma: .CardText — 93×65, VERTICAL gap 8 */
interface CardTextProps {
  category?: string;
  name?: string;
  badges?: string[];
}

export function CardText({
  category = '편의점',
  name = '세븐일레븐',
  badges = ['할인', '적립', '사용'],
}: CardTextProps) {
  return (
    <div className={styles.container}>
      <span className={styles.category}>{category}</span>
      <span className={styles.name}>{name}</span>
      <div className={styles.badgeList}>
        {badges.map((badge) => (
          <span key={badge} className={styles.badge}>
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
