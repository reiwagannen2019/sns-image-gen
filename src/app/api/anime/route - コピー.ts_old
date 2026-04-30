import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image, stylePrompt } = await req.json();
    
    // 直接注入（本番公開時は .env.local への移行を推奨！）
    const GOOGLE_API_KEY = "AIzaSyDPB1fS6M19YLLPFye3rB2tWG2tzFtk4zw";
    const STABILITY_API_KEY = "sk-wSWyrogH8FMPTfOXDuLNzunQdNlz4x6TBmrsXYwZIxUj2VT8";

    const base64Data = image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // --- STEP 1: Gemini 3.1 Flash Lite で写真のシチュエーションを解析 ---
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GOOGLE_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze this image and describe the scene in detail for an anime background. Focus on subjects, lighting, and colors. Output ONLY the English description." },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const geminiData = await geminiRes.json();
    const autoPrompt = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "beautiful scenery";

    // --- STEP 2: Stability AI (SDXL v1.0) でアニメ化 ---
    const STABILITY_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image";
    
    const formData = new FormData();
    formData.append("init_image", new Blob([buffer], { type: 'image/jpeg' }), "input.jpg");
    formData.append("init_image_mode", "IMAGE_STRENGTH");
    formData.append("image_strength", "0.35"); // 元絵の構造を残しつつアニメ化する黄金比
    
    // 解析結果 + 選択された画風 + クオリティ向上呪文を合体
    const finalPrompt = `${autoPrompt}, ${stylePrompt}, masterpiece, high quality, sharp focus, 8k resolution, highly detailed lines`;
    
    formData.append("text_prompts[0][text]", finalPrompt);
    formData.append("text_prompts[0][weight]", "1");
    formData.append("cfg_scale", "7");
    formData.append("samples", "1");
    formData.append("steps", "30");

    const stabilityRes = await fetch(STABILITY_URL, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: "application/json" 
      },
      body: formData,
    });

    const stabilityData = await stabilityRes.json();

    if (!stabilityRes.ok) {
      console.error("Stability Error:", stabilityData);
      throw new Error(stabilityData.message || "Stability AI 変換エラー");
    }

    return NextResponse.json({ 
      success: true, 
      imageUrl: `data:image/png;base64,${stabilityData.artifacts[0].base64}` 
    });

  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ success: false, error: error.message });
  }
}