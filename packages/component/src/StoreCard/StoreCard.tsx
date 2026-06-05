import styles from "./StoreCard.module.css";

interface StoreCardProps {
	title?: string;
	address?: string;
	distance?: string;
	status?: string;
}

export function StoreCard({ title = "매장명", address, distance, status }: StoreCardProps) {
	return (
		<section className={styles.storeCard} data-cx-component="StoreCard">
			<div className={styles.copy}>
				<strong className={styles.title}>{title}</strong>
				{address ? <span className={styles.address}>{address}</span> : null}
				{status ? <span className={styles.status}>{status}</span> : null}
			</div>
			{distance ? <span className={styles.distance}>{distance}</span> : null}
		</section>
	);
}
