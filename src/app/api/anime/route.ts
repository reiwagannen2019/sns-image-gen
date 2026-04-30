import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { image, stylePrompt } = await req.json();

    const formData = new FormData();
    // Base64からバイナリに変換
    const base64Data = image.split(',')[1];
    const blob = await (await fetch(`data:image/jpeg;base64,${base64Data}`)).blob();
    
    formData.append('init_image', blob);
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', '0.35');
    formData.append('text_prompts[0][text]', stylePrompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append('cfg_scale', '7');
    formData.append('samples', '1');

    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: 'application/json',
        },
        body: formData,
      }
    );

    if (response.status === 402) {
      return NextResponse.json(
        { success: false, error: "Stability AIの残高が足りないようです。" },
        { status: 402, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.message },
        { status: response.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const result = await response.json();
    const base64Image = result.artifacts[0].base64;

    const res = NextResponse.json({ 
      success: true, 
      imageUrl: `data:image/png;base64,${base64Image}` 
    });

    // どこからでもアクセスできるように許可を出します
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "サーバーで問題が起きました" },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}