import React from 'react';
import { BookOpen, Flame, Plus, Search, BarChart3, Settings, ShieldCheck } from 'lucide-react';
import { StudyMode } from '../types';

interface HeaderProps {
  currentMode: StudyMode | 'dashboard';
  onSelectMode: (mode: StudyMode | 'dashboard') => void;
  streak: number;
  dueCount: number;
  onOpenAddCard: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  streak,
  dueCount,
  onOpenAddCard,
  onOpenStats,
  onOpenSettings,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 border-b border-zinc-200/80 transition-all">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <button
          id="brand-logo-btn"
          onClick={() => onSelectMode('dashboard')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-zinc-950">Law Anki</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">iOS 26</span>
            </div>
            <p className="text-[11px] text-zinc-700 leading-none">ท่องตัวบทกฎหมาย</p>
          </div>
        </button>

        {/* Center Mode Switcher for Desktop */}
        <div className="hidden md:flex items-center bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80">
          <button
            id="nav-dashboard"
            onClick={() => onSelectMode('dashboard')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              currentMode === 'dashboard'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            ภาพรวม
          </button>
          <button
            id="nav-flashcard"
            onClick={() => onSelectMode('flashcard')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              currentMode === 'flashcard'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            <span>บัตรคำ (SRS)</span>
            {dueCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-black text-white rounded-full font-bold">
                {dueCount}
              </span>
            )}
          </button>
          <button
            id="nav-cloze"
            onClick={() => onSelectMode('cloze')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              currentMode === 'cloze'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            เติมคำ
          </button>
          <button
            id="nav-recite"
            onClick={() => onSelectMode('recite_test')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              currentMode === 'recite_test'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            ทดสอบพิมพ์
          </button>
          <button
            id="nav-browse"
            onClick={() => onSelectMode('browse')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              currentMode === 'browse'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            ค้นหาตัวบท
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Daily Streak */}
          <div
            id="streak-badge"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-900 text-xs font-semibold"
            title={`ต่อเนื่อง ${streak} วัน`}
          >
            <Flame className="w-4 h-4 text-black fill-black" />
            <span>{streak}</span>
          </div>

          {/* Add Card Button */}
          <button
            id="btn-add-statute"
            onClick={onOpenAddCard}
            className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 text-zinc-900 flex items-center justify-center transition-all cursor-pointer"
            title="เพิ่มตัวบทใหม่"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Stats Button */}
          <button
            id="btn-stats"
            onClick={onOpenStats}
            className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 text-zinc-900 flex items-center justify-center transition-all cursor-pointer"
            title="สถิติความจำ (SRS)"
          >
            <BarChart3 className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Settings Button */}
          <button
            id="btn-settings"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 text-zinc-900 flex items-center justify-center transition-all cursor-pointer"
            title="ตั้งค่า"
          >
            <Settings className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>
    </header>
  );
};
