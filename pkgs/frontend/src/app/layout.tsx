import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "JPYC AI Agent - Learning App",
	description: "JPYC操作をAIで簡単に（Sepolia Testnet）",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja" className="bg-gray-50">
			<body className={`${inter.className} bg-gray-50`}>{children}</body>
		</html>
	);
}
