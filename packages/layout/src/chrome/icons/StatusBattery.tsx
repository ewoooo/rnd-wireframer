import { forwardRef, type SVGProps } from "react";

export const StatusBattery = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
	function StatusBattery(props, ref) {
		return (
			<svg
				ref={ref}
				width={29}
				height={13}
				viewBox="0 0 29 13"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				{...props}
			>
				<title>Battery level</title>
				<path
					opacity="0.4"
					d="M26.9141 4.20312V8.79037C27.8557 8.40186 28.468 7.49807 28.468 6.49675C28.468 5.49543 27.8557 4.59164 26.9141 4.20312Z"
					fill="currentColor"
				/>
				<path
					d="M2.34375 3.6224C2.34375 2.88602 2.9407 2.28906 3.67708 2.28906H22.0724C22.8088 2.28906 23.4057 2.88602 23.4057 3.6224V9.36568C23.4057 10.1021 22.8088 10.699 22.0724 10.699H3.67708C2.9407 10.699 2.34375 10.1021 2.34375 9.36568Z"
					fill="currentColor"
				/>
			</svg>
		);
	},
);
