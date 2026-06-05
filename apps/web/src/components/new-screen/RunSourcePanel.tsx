"use client";

import { useEffect, useState } from "react";
import {
	NewScreenSourcePanel,
	type NewScreenSourceItem,
} from "@/components/new-screen/NewScreenSourcePanel";

/**
 * Run 탭 좌측 패널. 업로드된 마크다운 소스를 조회/업로드하고 선택 상태를 관리한다.
 * (Run/rerun 실제 파이프라인 실행 배선은 후속 단계 — 지금은 버튼 비활성.)
 */
export function RunSourcePanel() {
	const [sources, setSources] = useState<NewScreenSourceItem[]>([]);
	const [selectedSourcePath, setSelectedSourcePath] = useState<string>();
	const [isUploading, setIsUploading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>();

	async function loadSources() {
		try {
			const response = await fetch("/api/screen-inference/sources", { cache: "no-store" });
			if (!response.ok) throw new Error(`소스 목록 요청 실패 ${response.status}`);
			const data = (await response.json()) as { sources?: NewScreenSourceItem[] };
			setSources(data.sources ?? []);
			setErrorMessage(undefined);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "소스 목록을 불러오지 못했습니다.");
		}
	}

	useEffect(() => {
		void loadSources();
	}, []);

	async function handleUpload(file: File) {
		setIsUploading(true);
		setErrorMessage(undefined);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const response = await fetch("/api/screen-inference/sources", {
				body: formData,
				method: "POST",
			});
			if (!response.ok) throw new Error(`업로드 실패 ${response.status}`);
			await loadSources();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "업로드에 실패했습니다.");
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<div className="h-full min-h-0">
			<NewScreenSourcePanel
				errorMessage={errorMessage}
				isUploading={isUploading}
				onSelectSource={setSelectedSourcePath}
				onUploadSource={handleUpload}
				selectedSourcePath={selectedSourcePath}
				sources={sources}
			/>
		</div>
	);
}
