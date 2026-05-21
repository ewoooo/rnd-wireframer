import { WireframeWorkbench } from "@/components/wireframe-renderer/wireframe-workbench";
import { organismCatalog, wireframeWorkbenchData } from "@/lib/mock-wireframe-data";

export default function Home() {
	return <WireframeWorkbench organisms={organismCatalog} screens={wireframeWorkbenchData} />;
}
