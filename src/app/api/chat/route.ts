import { NextRequest, NextResponse } from 'next/server';
import { jpycAgent } from '@/lib/mastra/agent';

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Mastraのバージョンによって、chat()メソッドのAPIが異なる可能性があります
    // 最新のMastraではgenerate()メソッドを使う場合もあります
    const response = await jpycAgent.generate(message, {
      // conversationIdがある場合は渡す
      ...(conversationId && { conversationId }),
    });

    return NextResponse.json({
      success: true,
      response: response.text || JSON.stringify(response),
      conversationId: conversationId || 'default',
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}
