import React from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  UploadCloud,
  ChevronLeft
} from 'lucide-react';
import { LawDeck, NumeralSystem } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDeck: LawDeck | null;
  onSelectDeck: (deck: LawDeck | null) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  totalCardsCount: number;
  totalDecksCount: number;
  numeralSystem: NumeralSystem;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedDeck,
  onSelectDeck,
  onOpenAddModal,
  onOpenImportModal,
  totalCardsCount,
  totalDecksCount,
  numeralSystem,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200/70 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
        {/* Left: Brand or Back */}
        <div className="flex items-center gap-2.5 shrink-0">
          {selectedDeck ? (
            <button
              id="header-back-btn"
              onClick={() => onSelectDeck(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>กลับคลัง</span>
            </button>
          ) : (
            <div 
              onClick={() => onSelectDeck(null)}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              id="brand-logo-button"
            >
              <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Scale className="w-4.5 h-4.5 text-zinc-100" />
              </div>
              <div>
                <h1 className="font-bold text-base text-zinc-900 leading-none tracking-tight">Statutler</h1>
                <p className="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">
                  {numeralSystem === 'thai' 
                    ? `${totalDecksCount.toString().replace(/\d/g, d => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d)])} สำรับ • ${totalCardsCount.toString().replace(/\d/g, d => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d)])} มาตรา` 
                    : `${totalDecksCount} สำรับ • ${totalCardsCount} มาตรา`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Middle: Minimal Search input */}
        <div className="flex-1 max-w-sm mx-1 sm:mx-4 relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            id="law-search-input"
            type="text"
            placeholder="ค้นหามาตรา, คำสำคัญ..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-100/90 hover:bg-zinc-100 focus:bg-white text-zinc-900 placeholder-zinc-400 rounded-full border border-transparent focus:border-zinc-300 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700 bg-zinc-200/70 hover:bg-zinc-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            id="import-law-header-btn"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 transition-colors cursor-pointer"
            title="นำเข้าตัวบทกฎหมาย"
          >
            <UploadCloud className="w-3.5 h-3.5 text-zinc-600" />
            <span className="hidden sm:inline">นำเข้า</span>
          </button>

          <button
            id="add-section-header-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-colors cursor-pointer shadow-xs"
            title="เพิ่มมาตรา"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เพิ่มมาตรา</span>
          </button>
        </div>
      </div>
    </header>
  );
};

