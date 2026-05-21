import styles from "./AppBar.module.css";

export interface AppBarProps {
	title?: string;
	showBack?: boolean;
	showLogo?: boolean;
	rightItem?: React.ReactNode;
	onBack?: () => void;
}

export function BackIcon() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M13.2934 3.29289C13.6839 2.90237 14.317 2.90237 14.7075 3.29289C15.0979 3.68342 15.098 4.31646 14.7075 4.70696L7.41448 11.9999L14.7075 19.2929C15.0979 19.6835 15.098 20.3165 14.7075 20.707C14.317 21.0975 13.6839 21.0974 13.2934 20.707L5.29338 12.707C4.90286 12.3165 4.90286 11.6834 5.29338 11.2929L13.2934 3.29289Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function CloseIcon() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M18.29 4.29094C18.6805 3.90042 19.3135 3.90042 19.704 4.29094C20.0945 4.68147 20.0945 5.3145 19.704 5.705L13.4101 11.9989L19.706 18.2948C20.0965 18.6854 20.0965 19.3184 19.706 19.7089C19.3155 20.0994 18.6824 20.0994 18.2919 19.7089L11.996 13.413L5.70989 19.6991C5.31939 20.0896 4.68635 20.0896 4.29582 19.6991C3.9053 19.3086 3.9053 18.6756 4.29582 18.2851L10.582 11.9989L4.29778 5.71477C3.90725 5.32424 3.90725 4.69123 4.29778 4.30071C4.6883 3.91018 5.32131 3.91018 5.71184 4.30071L11.996 10.5849L18.29 4.29094Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function BellIcon() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M11.9996 3C14.2086 3.00023 15.9996 4.791 15.9996 7H17.4137C18.9853 7.00022 20.2911 8.21375 20.4059 9.78125L20.9918 17.7812C21.1149 19.4652 19.8269 20.9075 18.1617 20.9961L17.9996 21H6.0006C4.3121 20.9999 2.96835 19.6106 3.00158 17.9434L3.00842 17.7812L3.59435 9.78125C3.70917 8.21365 5.01475 7.00005 6.58654 7H7.99963C7.99963 4.79086 9.79049 3 11.9996 3ZM6.58654 9C6.06272 9.00005 5.62786 9.40436 5.58947 9.92676L5.00353 17.9268C4.9611 18.5062 5.41964 18.9999 6.0006 19H17.9996C18.5804 18.9997 19.0391 18.5061 18.9967 17.9268L18.4108 9.92676C18.3724 9.40446 17.9374 9.00022 17.4137 9H6.58654ZM11.9996 5C10.8951 5 9.99963 5.89543 9.99963 7H13.9996C13.9996 5.89557 13.104 5.00023 11.9996 5Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function MenuIcon() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M19 17.5C19.5523 17.5 20 17.9477 20 18.5C20 19.0523 19.5523 19.5 19 19.5H5C4.44772 19.5 4 19.0523 4 18.5C4 17.9477 4.44772 17.5 5 17.5H19ZM19 11C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13H5C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11H19ZM19 4.5C19.5523 4.5 20 4.94772 20 5.5C20 6.05228 19.5523 6.5 19 6.5H5C4.44772 6.5 4 6.05228 4 5.5C4 4.94772 4.44772 4.5 5 4.5H19Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function SktLogo() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M14.3057 11.0977V20.4445H9.70657V8.80736L14.3057 11.0977ZM20 3.55664V7.55567H4.00098V3.55664H20Z"
				fill="#3617CE"
			/>
		</svg>
	);
}

export function AppBar({
	title,
	showBack = false,
	showLogo = false,
	rightItem,
	onBack,
}: AppBarProps) {
	return (
		<header className={styles.appBar}>
			<div className={styles.titleSection}>
				{showBack && (
					<button
						type="button"
						className={styles.iconButton}
						onClick={onBack}
						aria-label="뒤로가기"
					>
						<BackIcon />
					</button>
				)}
				{showLogo && !showBack && <SktLogo />}
				{title && <h1 className={styles.title}>{title}</h1>}
			</div>
			{rightItem && <div className={styles.right}>{rightItem}</div>}
		</header>
	);
}
