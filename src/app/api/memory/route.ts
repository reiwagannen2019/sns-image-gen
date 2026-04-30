import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ success: false, error: "APIキーが設定されていません。" }, { status: 500 });
    }

    // 1. Gemini 2.0 Flashでエモい英文プロンプトを作成[cite: 1]
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const expansionPrompt = `
      Input: ${prompt}
      Task: Create a highly detailed English image generation prompt for Imagen 3.
      Style: Nostalgic Japanese anime style, soft cinematic lighting, emotional atmosphere.
      Output: Only the English prompt text.
    `;

    const result = await model.generateContent(expansionPrompt);
    const expandedPrompt = result.response.text().trim();

    // 2. Imagen 3 APIを呼び出し
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

    // 3. データの存在を一段ずつ慎重に確認（これで '0' のエラーを防ぎます）
    if (data && data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`,
      });
    } else {
      // 失敗した理由を詳しく画面に返す
      const errorMessage = data.error?.message || "画像データが返ってきませんでした。モデルの権限設定を確認してください。";
      return NextResponse.json({ success: false, error: errorMessage });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}