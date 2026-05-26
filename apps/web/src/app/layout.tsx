import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "Render Tree Generator",
	description: "Render Tree Renderer",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="ko">
			<body>{children}</body>
		</html>
	);
}
