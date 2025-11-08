import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// Claude 3.5 Sonnetモデルを使用
const claude = anthropic("claude-sonnet-4-0");

// Mastra用のOpenAIプロバイダーを作成
const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// gpt-4o-miniモデルを使用（安価で高速、推論トークンなし）
const gpt4oMiniModel = openai("gpt-4o-mini");
const gemini = google("gemini-2.5-pro");

export { claude, gemini, gpt4oMiniModel };
