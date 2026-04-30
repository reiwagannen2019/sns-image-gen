import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!API_KEY) {
      console.error("DEBUG: API_KEY is missing in environment variables.");
      return NextResponse.json({ success: false, error: "Vercelの環境変数にAPIキーが見つかりません。" }, { status: 500 });
    }

    // 1. 最新の Gemini 3 Flash を使用して、Imagen用のプロンプトを最適化
    const genAI = new GoogleGenerativeAI(API_KEY);
    // 2026年5月時点の最新安定モデルを指定
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    const expansionPrompt = `
      以下の日本語の思い出を、Imagen 3で画像生成するための詳細な英文プロンプトに変換してください。
      思い出：${prompt}
      条件：1990年代の日本のアニメ映画風、エモい光、高解像度。
      出力：プロンプトの英文のみを1件。
    `;

    console.log("DEBUG: Sending request to Gemini 3 Flash...");
    const result = await model.generateContent(expansionPrompt);
    const expandedPrompt = result.response.text().trim();
    console.log("DEBUG: Expanded Prompt:", expandedPrompt);

    // 2. Imagen 3 API を呼び出す
    console.log("DEBUG: Sending request to Imagen 3...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/imagen-3:predict?key=${API_KEY}`,
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

    // レスポンスのJSONを一度取得
    const data = await response.json();
    console.log("DEBUG: Raw API Response:", JSON.stringify(data));

    // 3. エラーハンドリングとデータの抽出
    if (data.error) {
      return NextResponse.json({ 
        success: false, 
        error: `Google APIエラー: ${data.error.message} (コード: ${data.error.code})` 
      });
    }

    // データの階層を一つずつ安全に確認（ここで '0' のエラーを防ぎます）
    const predictions = data?.predictions;
    if (predictions && Array.isArray(predictions) && predictions.length > 0) {
      const base64Image = predictions[0].bytesBase64Encoded;
      if (base64Image) {
        return NextResponse.json({
          success: true,
          imageUrl: `data:image/png;base64,${base64Image}`,
        });
      }
    }

    // 画像データがどこにもない場合
    return NextResponse.json({ 
      success: false, 
      error: "APIは成功しましたが、画像データが含まれていませんでした。プロンプトの内容が制限（セーフティフィルター）に触れた可能性があります。" 
    });

  } catch (error: any) {
    console.error("DEBUG: Server Crash:", error);
    return NextResponse.json({ 
      success: false, 
      error: `サーバー内部エラー: ${error.message}` 
    }, { status: 500 });
  }
}