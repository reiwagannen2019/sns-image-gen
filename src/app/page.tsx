import React from 'react';
import Link from 'next/link';
import { Camera, Sparkles, Image as ImageIcon, Type, ArrowRight } from "lucide-react";

const features = [
  {
    id: "memory",
    title: "思い出再現",
    desc: "撮り忘れたあの日を言葉でカタチに",
    icon: <Camera className="w-8 h-8 text-blue-500" />,
    bg: "from-blue-50 to-indigo-50",
    border: "hover:border-blue-200"
  },
  {
    id: "anime",
    title: "アニメ風変換",
    desc: "写真をジャパニーズアニメの世界へ",
    icon: <Sparkles className="w-8 h-8 text-purple-500" />,
    bg: "from-purple-50 to-pink-50",
    border: "hover:border-purple-200"
  },
  {
    id: "background",
    title: "統一背景生成",
    desc: "SNSの世界観を整える背景を作成",
    icon: <ImageIcon className="w-8 h-8 text-emerald-500" />,
    bg: "from-emerald-50 to-teal-50",
    border: "hover:border-emerald-200"
  },
  {
    id: "title",
    title: "タイトル画像",
    desc: "画像に文字を載せてバナー化",
    icon: <Type className="w-8 h-8 text-orange-500" />,
    bg: "from-orange-50 to-amber-50",
    border: "hover:border-orange-200"
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
            SNS Creative Studio
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            AIで、あなたの日常をクリエイティブに変換する。
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((item) => (
            <Link href={`/${item.id}`} key={item.id} className="group">
              <div className={`h-full p-8 rounded-3xl bg-gradient-to-br ${item.bg} border-2 border-transparent ${item.border} shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <ArrowRight className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{item.title}</h2>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}