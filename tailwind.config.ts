import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				// ダークブルーベースのカラーパレット
				primary: {
					50: "#e6f1ff",
					100: "#b3d9ff",
					200: "#80c1ff",
					300: "#4da9ff",
					400: "#1a91ff",
					500: "#0066cc", // メインカラー
					600: "#0052a3",
					700: "#003d7a",
					800: "#002952",
					900: "#001429",
					950: "#000a14",
				},
				dark: {
					50: "#f8fafc",
					100: "#f1f5f9",
					200: "#e2e8f0",
					300: "#cbd5e1",
					400: "#94a3b8",
					500: "#64748b",
					600: "#475569",
					700: "#334155",
					800: "#1e293b", // ベース背景
					900: "#0f172a", // 濃い背景
					950: "#020617", // 最も濃い背景
				},
				accent: {
					cyan: "#06b6d4",
					purple: "#a855f7",
					pink: "#ec4899",
					green: "#10b981",
					yellow: "#f59e0b",
				},
			},
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-conic":
					"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
				"gradient-dark-blue":
					"linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
				"gradient-primary": "linear-gradient(135deg, #0066cc 0%, #0052a3 100%)",
				"gradient-mesh":
					"radial-gradient(at 40% 20%, rgba(0, 102, 204, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6, 182, 212, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(168, 85, 247, 0.2) 0px, transparent 50%)",
			},
			boxShadow: {
				glow: "0 0 20px rgba(0, 102, 204, 0.4)",
				"glow-sm": "0 0 10px rgba(0, 102, 204, 0.3)",
				"glow-lg": "0 0 30px rgba(0, 102, 204, 0.5)",
				"inner-glow": "inset 0 0 20px rgba(0, 102, 204, 0.2)",
			},
			animation: {
				"pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				float: "float 6s ease-in-out infinite",
				shimmer: "shimmer 2s linear infinite",
			},
			keyframes: {
				float: {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-20px)" },
				},
				shimmer: {
					"0%": { backgroundPosition: "-1000px 0" },
					"100%": { backgroundPosition: "1000px 0" },
				},
			},
		},
	},
	plugins: [],
};
export default config;
