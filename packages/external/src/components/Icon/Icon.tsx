import { ICON_PATHS, type SystemIconName, type IconSize } from './icons';
import styles from './Icon.module.css';

interface IconProps {
  name: SystemIconName;
  size?: IconSize;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

export function Icon({
  name,
  size = 24,
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
}: IconProps) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </svg>
  );
}

export type { SystemIconName, IconSize };
export { ICON_PATHS };
