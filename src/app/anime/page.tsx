"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, ImageIcon, ArrowLeft, Sparkles, Type, X, Image as LucideImage } from "lucide-react";
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

  // VercelにデプロイしたURLを指定（ご自身のURLに書き換えてください）
  const VERCEL_URL = "https://sns-image-genapp.vercel.app";

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
    img.crossOrigin = "anonymous";
    img.src = resultImage;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (overlayText) {
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 20;
        ctx.font = "900 80px sans-serif";
        ctx.textAlign = "center";
        // 下部中央に配置
        ctx.fillText(overlayText, canvas.width / 2, canvas.height - 100);
      }
    };
  };

  useEffect(() => { drawCanvas(); }, [resultImage, overlayText]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const now = new Date();
    const timestamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL("image/png");
    link.download = `anime_${timestamp}.png`;
    link.click();
  };

  const convertToAnime = async () => {
    if (!sourceImage) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${VERCEL_URL}/api/anime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: sourceImage, 
          stylePrompt: selectedStyle.prompt 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultImage(data.imageUrl);
        setIsEditMode(true);
      } else {
        alert(data.error || "生成に失敗しました");
      }
    } catch (e) {
      alert("接続エラーが発生しました。Vercelの起動を確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 p-4 md:p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <Link href="/" className="flex items-center text-slate-500 hover:text-black font-bold transition-all">
          <ArrowLeft className="w-5 h-5 mr-2" /> BACK
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Live</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: INPUT AREA */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <LucideImage className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-tighter text-slate-400">Source Photo</h2>
          </div>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`group relative aspect-[3/4] rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden bg-white ${isDragging ? "border-indigo-500 bg-indigo-50 scale-[0.98]" : "border-slate-200 hover:border-indigo-300 hover:shadow-xl"}`}
          >
            {sourceImage ? (
              <img src={sourceImage} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Source" />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-50 transition-colors">
                  <Upload className="text-slate-300 w-6 h-6 group-hover:text-indigo-400" />
                </div>
                <p className="text-[10px] font-black text-slate-400 tracking-widest">DRAG & DROP OR CLICK</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        </div>

        {/* CENTER: CONTROLS */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:pt-12">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black mb-6 text-center text-slate-300 uppercase tracking-[0.2em]">Select Style</h3>
            <div className="grid grid-cols-1 gap-3">
              {ANIME_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`py-4 px-6 rounded-2xl text-xs font-bold transition-all text-left flex justify-between items-center ${selectedStyle.id === style.id ? "bg-indigo-600 text-white shadow-lg scale-[1.02]" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                >
                  {style.label}
                  {selectedStyle.id === style.id && <Sparkles className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {!isEditMode ? (
            <button
              onClick={convertToAnime}
              disabled={isLoading || !sourceImage}
              className="group w-full h-24 bg-slate-900 text-white rounded-[3rem] font-black text-sm shadow-2xl hover:bg-indigo-600 disabled:opacity-10 transition-all flex flex-col items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="group-hover:animate-bounce" />}
              <span>GENERATE ANIME</span>
            </button>
          ) : (
            <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-[10px] font-black mb-4 text-indigo-100 uppercase flex items-center gap-2">
                <Type className="w-3 h-3" /> Add Title
              </h3>
              <input 
                type="text" 
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="君の名は..."
                className="w-full p-5 rounded-2xl border-none bg-white/10 text-white placeholder:text-white/40 text-sm font-bold focus:ring-2 focus:ring-white/50 outline-none transition-all"
              />
              <button onClick={() => { setOverlayText(""); setIsEditMode(false); }} className="w-full mt-4 text-[10px] font-black text-indigo-200 uppercase hover:text-white transition-colors">
                Clear & Reset
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: RESULT */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-black uppercase tracking-tighter text-slate-400">Result</h2>
            </div>
            {resultImage && (
              <button onClick={downloadImage} className="bg-white text-slate-900 px-6 py-2 rounded-full text-[10px] font-black flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100">
                <Download className="w-3 h-3" /> DOWNLOAD
              </button>
            )}
          </div>
          
          <div className="aspect-[3/4] rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center overflow-hidden relative shadow-inner">
            <canvas ref={canvasRef} width={1024} height={1024} className={`w-full h-full object-cover ${!resultImage ? 'hidden' : 'block'}`} />
            {!resultImage && !isLoading && <ImageIcon className="w-12 h-12 text-slate-100" />}
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                  <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-indigo-400 animate-pulse" />
                </div>
                <p className="mt-4 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">Processing</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
