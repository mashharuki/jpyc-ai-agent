import { jpycAgent } from "@/lib/mastra/agent";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { message, conversationId, profile, friends } = await req.json();

		if (!message) {
			return new Response(
				JSON.stringify({ success: false, error: "Message is required" }),
				{ 
					status: 400,
					headers: { "Content-Type": "application/json" }
				},
			);
		}

		// プロフィールと友達リストをコンテキストとして追加
		let contextMessage = message;
		if (profile || (friends && friends.length > 0)) {
			let context = "\n\n[ユーザー情報]\n";

			if (profile) {
				context += `- 自分の名前: ${profile.name}\n`;
				context += `- 自分のアドレス: ${profile.address}\n`;
			}

			if (friends && friends.length > 0) {
				context += "\n[友達リスト]\n";
				for (const friend of friends) {
					context += `- ${friend.name}: ${friend.address}\n`;
				}
			}

			contextMessage = message + context;
		}

		// ストリーミングレスポンスを使用
		const streamResponse = await jpycAgent.stream(contextMessage, {
			// conversationIdがある場合は渡す
			...(conversationId && { conversationId }),
		});

		// テキストストリームをReadableStreamに変換
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of streamResponse.textStream) {
						// チャンクをエンコードして送信
						controller.enqueue(encoder.encode(chunk));
					}
					controller.close();
				} catch (error) {
					console.error("Stream error:", error);
					controller.error(error);
				}
			},
		});

		// ストリームを返す
		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-cache",
				"Connection": "keep-alive",
			},
		});
	} catch (error) {
		console.error("Chat API Error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error:
					error instanceof Error ? error.message : "An error occurred while processing your request",
			}),
			{ 
				status: 500,
				headers: { "Content-Type": "application/json" }
			},
		);
	}
}
