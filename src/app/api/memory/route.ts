import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ success: false, error: "APIキーが設定されていません。" }, { status: 500 });
    }

    // 1. プロンプト拡張 (ここは無料枠でも動くはずです)
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    const result = await model.generateContent(`Create a detailed English prompt for Imagen 3: ${prompt}. Anime style.`);
    const expandedPrompt = result.response.text().trim();

    // 2. 画像生成リクエスト
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3:predict?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: expandedPrompt }],
          parameters: { sampleCount: 1 }
        }),
      }
    );

    const data = await response.json();

    // 3. 【重要】ここを徹底ガード
    if (data.error) {
      // Googleからの本当のエラーメッセージを画面に出します
      const msg = data.error.message;
      if (msg.includes("billing") || msg.includes("permission")) {
        return NextResponse.json({ 
          success: false, 
          error: `【Google AI制限】${msg}。画像生成にはGoogle Cloudでの課金設定が必要なようです。` 
        });
      }
      return NextResponse.json({ success: false, error: `Google APIエラー: ${msg}` });
    }

    // predictions がない場合に備えてオプショナルチェイニングを使用
    const base64 = data?.predictions?.[0]?.bytesBase64Encoded;

    if (base64) {
      return NextResponse.json({ success: true, imageUrl: `data:image/png;base64,${base64}` });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "画像データが空でした。無課金枠の制限、またはセーフティフィルターの影響です。別のAPI（Stability AI等）を検討しましょう。" 
      });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: `通信エラー: ${error.message}` }, { status: 500 });
  }
}