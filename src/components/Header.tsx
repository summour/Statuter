import React from 'react';
import { BookOpen, Plus, Search, RotateCcw, Scale, UploadCloud } from 'lucide-react';
import { LawDeck } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDeck: LawDeck | null;
  onSelectDeck: (deck: LawDeck | null) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onResetData: () => void;
  totalCardsCount: number;
  totalDecksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedDeck,
  onSelectDeck,
  onOpenAddModal,
  onOpenImportModal,
  onResetData,
  totalCardsCount,
  totalDecksCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand / Title */}
        <div 
          onClick={() => onSelectDeck(null)}
          className="flex items-center gap-3 cursor-pointer select-none group"
          id="brand-logo-button"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-zinc-900 leading-none tracking-tight">ห้องสมุดกฎหมาย</h1>
              <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">
                Deck Reader
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">
              {selectedDeck ? `กำลังอ่าน: ${selectedDeck.name}` : `รวบรวม ${totalDecksCount} หมวด • ${totalCardsCount} มาตรา`}
            </p>
          </div>
        </div>

        {/* Middle: Search input */}
        <div className="flex-1 max-w-md mx-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            id="law-search-input"
            type="text"
            placeholder="ค้นหามาตรา, ชื่อหัวข้อ, หรือเนื้อหากฎหมาย..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-zinc-900 placeholder-zinc-400 rounded-xl border border-transparent focus:border-zinc-300 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700 bg-zinc-200/60 hover:bg-zinc-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            id="import-law-header-btn"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 transition-colors cursor-pointer shadow-xs"
            title="นำเข้าตัวบทกฎหมายจากไฟล์"
          >
            <UploadCloud className="w-3.5 h-3.5 text-zinc-700" />
            <span className="hidden sm:inline">นำเข้ากฎหมาย</span>
          </button>

          <button
            id="add-section-header-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors cursor-pointer shadow-sm"
            title="เพิ่มมาตราใหม่"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เพิ่มมาตรา</span>
          </button>

          <button
            id="reset-data-header-btn"
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตตัวบทกฎหมายกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
                onResetData();
              }
            }}
            className="p-2 text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            title="รีเซ็ตตัวบทกลับเป็นค่าเริ่มต้น"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
