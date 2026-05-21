import {
	organismCatalog,
	wireframeWorkbenchData,
} from "@/features/wireframe-renderer/mock-wireframe-data";
import { WireframeWorkbench } from "@/widgets/wireframe-renderer/wireframe-workbench";

export default function Home() {
	return <WireframeWorkbench organisms={organismCatalog} screens={wireframeWorkbenchData} />;
}
