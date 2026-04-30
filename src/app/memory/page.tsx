"use client";

import React, { useState } from 'react';
import { Camera, ArrowLeft, Loader2, Sparkles, Download } from "lucide-react";
import Link from 'next/link';

export default function MemoryPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateMemory = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setImageUrl(null); // 新しい生成のために一度クリア
    try {
      // Google AI (Gemini/Imagen) を通じて画像を生成する自作APIを叩きます
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setImageUrl(data.imageUrl);
      } else {
        alert(`Google AIエラー: ${data.error}`);
      }
    } catch (e) {
      alert("通信に失敗しました。Vercelの環境変数を確認してくださいね。");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `memory-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center text-slate-400 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> メニューへ戻る
        </Link>

        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black flex items-center justify-center md:justify-start gap-3 italic tracking-tighter">
            <Camera className="text-indigo-600 w-10 h-10" /> MEMORY RECALL
          </h1>
          <p className="text-slate-500 font-medium mt-2">Gemini APIで、あの日見た景色を呼び覚ます。</p>
        </header>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100/50 border border-slate-100">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            記憶の断片を入力（日本語で大丈夫です）
          </label>
          <textarea 
            placeholder="例：夕暮れの放課後、机に並んだ二つの影。窓の外からは蝉の声が聞こえてくるような、どこか懐かしい風景。"
            className="w-full h-40 p-6 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-lg bg-slate-50 font-medium"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <button 
            onClick={generateMemory}
            disabled={isLoading || !prompt}
            className="w-full mt-6 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-xl hover:bg-indigo-700 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-6 h-6" />}
            思い出を召喚する
          </button>
        </div>

        {imageUrl && (
          <div className="mt-12 animate-in fade-in zoom-in-95 duration-1000 relative group">
            <div className="rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-200">
              <img src={imageUrl} alt="Generated Memory" className="w-full h-auto object-cover" />
            </div>
            <button 
              onClick={downloadImage}
              className="absolute bottom-8 right-8 bg-white/90 backdrop-blur text-black px-6 py-3 rounded-full font-black text-xs flex items-center gap-2 hover:bg-black hover:text-white transition-all shadow-xl opacity-0 group-hover:opacity-100"
            >
              <Download className="w-4 h-4" /> SAVE IMAGE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}