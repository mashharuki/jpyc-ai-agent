import { google } from "@ai-sdk/google";
import { createOpenAI } from '@ai-sdk/openai';

// Mastra用のOpenAIプロバイダーを作成
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// gpt-4o-miniモデルを使用（安価で高速、推論トークンなし）
const gpt4oMiniModel = openai('gpt-4o-mini');
const gemini = google("gemini-2.5-pro");


export { gemini, gpt4oMiniModel };
