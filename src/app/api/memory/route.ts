import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // 【重要】直書きキー
    const GOOGLE_API_KEY = "AIzaSyDPB1fS6M19YLLPFye3rB2tWG2tzFtk4zw";
    const STABILITY_API_KEY = "sk-wSWyrogH8FMPTfOXDuLNzunQdNlz4x6TBmrsXYwZIxUj2VT8";

    // --- STEP 1: Gemini 3.1 Flash Lite で翻訳 ＆ プロンプト拡張 ---
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GOOGLE_API_KEY}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `以下の日本語の思い出を、Stable Diffusion XL用の非常に詳細でエモい英語プロンプトに変換してください。
            ノスタルジックでシネマティックな実写写真風にしてください。
            出力は英語のプロンプトのみを返してください。
            入力: ${prompt}`
          }]
        }]
      })
    });

    const geminiData = await geminiRes.json();
    const englishPrompt = geminiData.candidates[0].content.parts[0].text;

    // --- STEP 2: Stability AI (SDXL) で画像生成 ---
    const stabilityUrl = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";
    
    const stabilityRes = await fetch(stabilityUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [
          { 
            text: `${englishPrompt}, masterpiece, nostalgic film style, 8k photo, highly detailed, cinematic lighting`, 
            weight: 1 
          }
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1,
      }),
    });

    const stabilityData = await stabilityRes.json();
    if (!stabilityRes.ok) throw new Error(stabilityData.message);

    const base64Image = stabilityData.artifacts[0].base64;
    return NextResponse.json({ 
      success: true, 
      imageUrl: `data:image/png;base64,${base64Image}` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}