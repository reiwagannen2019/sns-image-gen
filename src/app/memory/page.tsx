"use client";

import React, { useState } from 'react';
import { Camera, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from 'next/link';

// これが「export default」！これがないとエラーになるんだ
export default function MemoryPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateMemory = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setImageUrl(data.imageUrl);
      } else {
        // APIからの具体的なエラーを表示
        alert(`AIエラー: ${data.error}`);
      }
    } catch (e) {
      alert("通信に失敗しました。サーバーが動いているか確認してね！");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center text-slate-400 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> メニューへ戻る
        </Link>

        <header className="mb-10">
          <h1 className="text-4xl font-black flex items-center gap-3 italic tracking-tighter">
            <Camera className="text-blue-600 w-10 h-10" /> MEMORY RECALL
          </h1>
          <p className="text-slate-500 font-medium">撮り忘れたあの日を、AIで召喚する。</p>
        </header>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-100/50 border border-slate-100">
          <textarea 
            placeholder="例：1990年代の夏の午後、誰もいないプールの水面に反射する光..."
            className="w-full h-40 p-5 rounded-3xl border-2 border-slate-50 focus:border-blue-500 outline-none transition-all resize-none text-lg bg-slate-50/50"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <button 
            onClick={generateMemory}
            disabled={isLoading || !prompt}
            className="w-full mt-6 h-16 rounded-2xl bg-blue-600 text-white font-bold text-xl hover:bg-blue-700 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-6 h-6" />}
            思い出を生成
          </button>
        </div>

        {imageUrl && (
          <div className="mt-12 animate-in zoom-in-95 duration-700">
            <div className="rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-200">
              <img src={imageUrl} alt="Generated" className="w-full h-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}