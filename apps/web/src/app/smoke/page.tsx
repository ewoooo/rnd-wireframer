import { SmokeRunExplorer } from "@/components/smoke/SmokeRunExplorer";
import { listSmokeRunSummaries } from "@/lib/smoke-runs";

export default async function SmokePage() {
	const runs = await listSmokeRunSummaries();

	return <SmokeRunExplorer runs={runs} />;
}
