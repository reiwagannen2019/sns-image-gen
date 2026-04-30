import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ success: false, error: "APIキーが設定されていません。" }, { status: 500 });
    }

    // 1. Gemini 3 Flash によるプロンプトの最適化
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Gemini 3 Flash を指定
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    const expansionPrompt = `
      あなたはプロの画像生成エンジニアです。
      「${prompt}」という思い出を、1990年代の日本のアニメ映画（エモーショナルな光、ノスタルジックな風景）風に再現するための詳細な英文プロンプトを1つ作成してください。
      出力は英文プロンプトのみ。
    `;

    const result = await model.generateContent(expansionPrompt);
    const expandedPrompt = result.response.text().trim();

    // 2. Imagen 3 API へのリクエスト（最新のエンドポイント構造）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3:predict?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: expandedPrompt }],
          parameters: { 
            sampleCount: 1,
            aspectRatio: "1:1",
            safetySetting: "BLOCK_ONLY_HIGH" // 表現の自由度を少し広げる設定
          }
        }),
      }
    );

    const data = await response.json();

    // 3. 【重要】エラーの原因を徹底的に特定するロジック
    if (data.error) {
      return NextResponse.json({ 
        success: false, 
        error: `Google APIエラー: ${data.error.message} (${data.error.code})` 
      });
    }

    // 階層を一つずつ確認し、undefinedによるクラッシュを防ぐ
    const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;

    if (base64Image) {
      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${base64Image}`,
      });
    } else {
      // 成功レスポンスの中にデータがない場合
      console.error("Unexpected Data Structure:", data);
      return NextResponse.json({ 
        success: false, 
        error: "AIから画像が返されませんでした。プロンプトに制限対象の言葉が含まれている可能性があります。" 
      });
    }

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ success: false, error: `サーバーエラー: ${error.message}` }, { status: 500 });
  }
}