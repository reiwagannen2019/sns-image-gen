import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ success: false, error: "Vercelの環境変数が設定されていません" }, { status: 500 });
    }

    // 1. Gemini 2.0 Flashでプロンプトを拡張
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const expansionPrompt = `
      以下の日本語の思い出を、Imagen 3で生成するための詳細な英文プロンプトに変換してください。
      思い出：${prompt}
      条件：日本のアニメ映画スタイル、エモーショナルな光の表現、8k。
      出力：英文プロンプトのみを出力。
    `;

    const result = await model.generateContent(expansionPrompt);
    const expandedPrompt = result.response.text().trim();

    // 2. Imagen 3 APIを叩く
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

    // エラーチェックを厳密にします
    if (data.error) {
      return NextResponse.json({ success: false, error: `Google APIエラー: ${data.error.message}` });
    }

    // データの存在確認を安全に行います
    const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;

    if (base64Image) {
      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${base64Image}`,
      });
    } else {
      // レスポンスの構造が違う場合に備えて、中身をログに出力（VercelのLogsで確認可能）
      console.error("Unexpected API Response:", JSON.stringify(data));
      return NextResponse.json({ 
        success: false, 
        error: "画像の生成に成功しましたが、データの取得に失敗しました。APIの制限を確認してください。" 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}