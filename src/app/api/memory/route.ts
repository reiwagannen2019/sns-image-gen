import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ success: false, error: "APIキーが設定されていません" }, { status: 500 });
    }

    // 1. Gemini 2.0 Flashの初期化
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 2. 日本語の思い出を、Imagen 3用のエモい英文プロンプトに変換
    const expansionPrompt = `
      Input: ${prompt}
      Task: Convert this Japanese memory into a high-quality English prompt for Imagen 3.
      Style: Nostalgic Japanese anime style, Makoto Shinkai-esque lighting, cinematic, 8k resolution.
      Output: Only the English prompt.
    `;

    const result = await model.generateContent(expansionPrompt);
    const expandedPrompt = result.response.text();

    // 3. 最新のImagen 3エンドポイントへリクエスト
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3:predict?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: expandedPrompt }],
          parameters: { 
            sampleCount: 1,
            aspectRatio: "1:1"
          }
        }),
      }
    );

    const data = await response.json();

    if (data.predictions && data.predictions[0].bytesBase64Encoded) {
      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`,
      });
    } else {
      throw new Error("Imagen 3での画像生成に失敗しました。モデルの利用制限を確認してください。");
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}