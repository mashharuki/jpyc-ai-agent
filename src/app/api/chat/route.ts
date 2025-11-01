import { NextRequest, NextResponse } from "next/server";
import { jpycAgent } from "@/lib/mastra/agent";

export async function POST(req: NextRequest) {
	try {
		const { message, conversationId, profile, friends } = await req.json();

		if (!message) {
			return NextResponse.json(
				{ success: false, error: "Message is required" },
				{ status: 400 },
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
				friends.forEach((friend: { name: string; address: string }) => {
					context += `- ${friend.name}: ${friend.address}\n`;
				});
			}

			contextMessage = message + context;
		}

		const response = await jpycAgent.generate(contextMessage, {
			// conversationIdがある場合は渡す
			...(conversationId && { conversationId }),
		});

		return NextResponse.json({
			success: true,
			response: response.text || JSON.stringify(response),
			conversationId: conversationId || "default",
		});
	} catch (error: any) {
		console.error("Chat API Error:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error.message || "An error occurred while processing your request",
			},
			{ status: 500 },
		);
	}
}
