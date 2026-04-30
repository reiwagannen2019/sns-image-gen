"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, ImageIcon, ArrowLeft, Sparkles, Type, X } from "lucide-react";
import Link from 'next/link';

const ANIME_STYLES = [
  { id: 'shinkai', label: '新海誠風', filename: 'shinkai', prompt: 'Makoto Shinkai style, cinematic lighting, vibrant clouds, lens flare, vivid colors' },
  { id: 'ghibli', label: 'ジブリ風', filename: 'ghibli', prompt: 'Studio Ghibli style, hand-drawn texture, lush nature, soft painted look' },
  { id: 'newest', label: '最新アニメ風', filename: 'newest', prompt: 'Modern high-quality Japanese anime style, sharp lines, cel-shaded' },
];

export default function AnimePage() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(ANIME_STYLES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // APIエンドポイントの決定（Vercelデプロイ後のURLを環境変数に設定してください）
  const getApiEndpoint = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    return baseUrl ? `${baseUrl}/api/anime` : '/api/anime';
  };

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setSourceImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setResultImage(null);
    setOverlayText("");
    setIsEditMode(false);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !resultImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // CORS対応
    img.src = resultImage;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (overlayText) {
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 15;
        ctx.font = "900 72px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(overlayText, canvas.width / 2, canvas.height - 120);
      }
    };
  };

  useEffect(() => { drawCanvas(); }, [resultImage, overlayText]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const now = new Date();
    const timestamp = now.getFullYear() + 
                      String(now.getMonth() + 1).padStart(2, '0') + 
                      String(now.getDate()).padStart(2, '0') + 
                      String(now.getHours()).padStart(2, '0') + 
                      String(now.getMinutes()).padStart(2, '0') + 
                      String(now.getSeconds()).padStart(2, '0');
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL("image/png");
    link.download = `anime${timestamp}_${selectedStyle.filename}.png`;
    link.click();
  };

  const convertToAnime = async () => {
    if (!sourceImage) return;
    setIsLoading(true);
    try {
      const img = new Image();
      img.src = sourceImage;
      await new Promise((resolve) => (img.onload = resolve));
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 1024);
      const scale = Math.min(1024 / img.width, 1024 / img.height);
      const x = (1024 - img.width * scale) / 2;
      const y = (1024 - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      const res = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: canvas.toDataURL('image/jpeg', 0.95), 
          stylePrompt: selectedStyle.prompt 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "エラーが発生しました");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setResultImage(data.imageUrl);
        setIsEditMode(true);
      }
    } catch (e) {
      console.error(e);
      alert("通信エラーが発生しました。VercelのURL設定を確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <header className="max-w-[1600px] mx-auto flex justify-between items-center mb-10 border-b pb-4">
        <Link href="/" className="flex items-center text-slate-400 hover:text-black font-bold transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> BACK
        </Link>
        <h1 className="text-xl font-black italic tracking-tighter text-indigo-600">SNS IMAGE GEN</h1>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_280px_1fr] gap-10 items-start">
        
        {/* 左：元画像 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-black text-indigo-600 uppercase italic">Source</h2>
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`relative aspect-[3/4] rounded-3xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden bg-slate-50 ${isDragging ? "border-indigo-500 bg-indigo-50 shadow-inner" : "border-slate-200 hover:border-indigo-300"}`}
          >
            {sourceImage ? (
              <img src={sourceImage} className="w-full h-full object-contain" alt="Source" />
            ) : (
              <div className="text-center">
                <Upload className="text-slate-300 w-12 h-12 mx-auto mb-2" />
                <p className="text-[10px] font-black text-slate-400">CLICK OR DRAG & DROP</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
            />
          </div>
        </div>

        {/* 中央：操作パネル */}
        <div className="flex flex-col gap-8 pt-10">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black mb-6 text-center text-slate-400 uppercase tracking-widest">STYLE SELECT</h3>
            <div className="flex flex-col gap-3">
              {ANIME_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`py-4 rounded-2xl font-black text-sm transition-all ${selectedStyle.id === style.id ? "bg-white border-2 border-indigo-600 text-indigo-600 shadow-md" : "bg-white border-2 border-transparent text-slate-400"}`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {!isEditMode ? (
            <button
              onClick={convertToAnime}
              disabled={isLoading || !sourceImage}
              className="w-full h-24 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-indigo-700 disabled:opacity-20 transition-all flex flex-col items-center justify-center gap-1"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span>アニメ化開始</span>
            </button>
          ) : (
            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-[10px] font-black mb-4 text-indigo-600 uppercase flex items-center gap-2">
                <Type className="w-3 h-3" /> TITLE INPUT
              </h3>
              <input 
                type="text" 
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="タイトルを入力..."
                className="w-full p-4 rounded-xl border-2 border-white bg-white text-sm font-bold focus:border-indigo-600 outline-none transition-all shadow-sm"
              />
              <button onClick={() => { setOverlayText(""); setIsEditMode(false); }} className="w-full mt-4 text-[10px] font-bold text-indigo-400 flex items-center justify-center gap-1 hover:text-indigo-600">
                <X className="w-3 h-3" /> 消去して戻る
              </button>
            </div>
          )}
        </div>

        {/* 右：完成画像 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-indigo-600 uppercase italic">Result</h2>
            {resultImage && (
              <button onClick={downloadImage} className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
                <Download className="w-3 h-3" /> DOWNLOAD
              </button>
            )}
          </div>
          <div className="aspect-[3/4] rounded-3xl bg-slate-50 border-2 border-indigo-100 flex items-center justify-center overflow-hidden relative shadow-sm">
            <canvas ref={canvasRef} width={1024} height={1024} className={`w-full h-full object-contain ${!resultImage ? 'hidden' : 'block'}`} />
            {!resultImage && <ImageIcon className="w-16 h-16 text-slate-200" />}
            {isLoading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-2" />
                <p className="text-indigo-600 text-[10px] font-black animate-pulse uppercase tracking-widest">Generating</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}