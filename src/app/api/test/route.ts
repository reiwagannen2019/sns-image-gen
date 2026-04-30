import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const GOOGLE_API_KEY = "AIzaSyDPB1fS6M19YLLPFye3rB2tWG2tzFtk4zw";

    // 2026年最新モデル: gemini-3.1-flash-lite-preview
    // APIバージョンは v1beta を使用（Preview版のため）
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GOOGLE_API_KEY}`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: "「Gemini 3.1 接続成功！爆速で翻訳するよ」とだけ返してください" }] 
        }]
      })
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ 
        status: "Error", 
        code: data.error.code,
        message: data.error.message,
        hint: "モデル名が最新かドキュメントを再確認したよ"
      }, { status: data.error.code });
    }

    const message = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ 
      status: "Success", 
      model: "Gemini 3.1 Flash Lite",
      response: message 
    });

  } catch (error: any) {
    return NextResponse.json({ status: "System Error", message: error.message });
  }
}