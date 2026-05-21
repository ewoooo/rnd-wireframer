import { StatusBattery, StatusSignal, StatusWifi } from "./icons";

export type SystemHeaderProps = {
	label?: string;
};

export function SystemHeader({ label = "9:41" }: SystemHeaderProps) {
	return (
		<div
			className="box-border flex h-[59px] w-full p-4 shrink-0 items-center justify-between bg-[var(--semantic-surface-page-normal,#ffffff)] text-[15px] font-semibold leading-none text-[#060c1f]"
			data-chrome="SystemHeader"
		>
			<span>{label}</span>
			<div className="flex items-center gap-2" aria-hidden="true">
				<StatusSignal height={12} />
				<StatusWifi height={12} />
				<StatusBattery height={12} />
			</div>
		</div>
	);
}
