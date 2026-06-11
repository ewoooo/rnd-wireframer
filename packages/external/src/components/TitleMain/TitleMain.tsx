import { Indicator } from "../Indicator/Indicator";
import chipImage from "./assets/chip-image.png";
import styles from "./TitleMain.module.css";

const defaultChipSrc =
	typeof chipImage === "string" ? chipImage : (chipImage as { src: string }).src;

/* Figma: TitleMain — node 9740:49516
   type=Complete : 개통완료 타입 (chip + 기기명 + 24px 타이틀 + 설명)
   type=Search   : 검색결과 타입 (20px 타이틀 2줄 + indicator)
*/
interface TitleMainProps {
	type?: "Complete" | "Search";
	chipSrc?: string;
	deviceName?: string;
	title?: string;
	subText?: string;
	indicatorCount?: number;
	indicatorActiveIndex?: number;
}

export function TitleMain({
	type = "Complete",
	chipSrc = defaultChipSrc,
	deviceName,
	title = "Main Title",
	subText = "Sub Title",
	indicatorCount = 6,
	indicatorActiveIndex = 0,
}: TitleMainProps) {
	if (type === "Search") {
		return (
			<div className={styles.wrap}>
				<div className={styles.titleText}>
					<p className={styles.searchTitle}>{title}</p>
				</div>
				<Indicator count={indicatorCount} activeIndex={indicatorActiveIndex} />
			</div>
		);
	}

	return (
		<div className={styles.wrap}>
			<div className={styles.titleText}>
				{deviceName && (
					<div className={styles.subTextRow}>
						<div className={styles.chip}>
							<img src={chipSrc} alt="" className={styles.chipImg} />
						</div>
						<span className={styles.deviceName}>{deviceName}</span>
					</div>
				)}
				<p className={styles.completeTitle}>{title}</p>
			</div>
			{subText && <p className={styles.description}>{subText}</p>}
		</div>
	);
}
