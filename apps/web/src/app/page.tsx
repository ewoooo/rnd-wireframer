import { App } from "@/components/App";
import { loadDbWorkbenchData } from "@/data/db-workbench-data-loader";

export default async function Home() {
	const initialData = await loadDbWorkbenchData();
	return <App initialData={initialData} />;
}
