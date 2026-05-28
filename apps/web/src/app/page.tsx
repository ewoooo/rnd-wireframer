import { App } from "@/components/App";
import { listMbrScreenSummaries } from "@/lib/screen-sources";

export default async function Home() {
	const screens = await listMbrScreenSummaries();

	return <App screens={screens} />;
}
