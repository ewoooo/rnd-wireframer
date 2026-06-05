import styles from "./BottomNavigation.module.css";

export interface BottomNavItem {
	key: string;
	label: string;
	icon: React.ReactNode;
	activeIcon?: React.ReactNode;
}

interface BottomNavigationProps {
	items: BottomNavItem[];
	activeKey: string;
	onChange: (key: string) => void;
}

export function BottomNavigation({ items, activeKey, onChange }: BottomNavigationProps) {
	return (
		<nav className={styles.bottomNav}>
			{items.map((item) => {
				const isActive = item.key === activeKey;
				return (
					<button
						type="button"
						key={item.key}
						className={[styles.navItem, isActive ? styles.active : styles.inactive].join(" ")}
						onClick={() => onChange(item.key)}
						aria-label={item.label}
					>
						<span className={styles.icon}>
							{isActive && item.activeIcon ? item.activeIcon : item.icon}
						</span>
						<span className={styles.label}>{item.label}</span>
					</button>
				);
			})}
		</nav>
	);
}
