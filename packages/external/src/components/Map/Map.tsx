import styles from './Map.module.css';
import mapImage from './assets/map-image.png';
import pinShape from './assets/pin-shape.svg';

/* Figma: Map — node 10040:51445, 369×180px map with numbered pins */
interface MapPin {
  number: number;
  left: number;
  top: number;
}

interface MapProps {
  pins?: MapPin[];
}

const DEFAULT_PINS: MapPin[] = [
  { number: 1, left: 180, top: 76 },
  { number: 2, left: 202, top: 91 },
  { number: 3, left: 138, top: 95 },
  { number: 4, left: 224, top: 127 },
];

export function Map({ pins = DEFAULT_PINS }: MapProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.imageWrap}>
        <img src={mapImage} alt="지도" className={styles.mapImage} />
        {pins.map((pin) => (
          <div
            key={pin.number}
            className={styles.pin}
            style={{ left: pin.left, top: pin.top }}
          >
            <img src={pinShape} alt="" className={styles.pinShape} />
            <span className={styles.pinNumber}>{pin.number}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
