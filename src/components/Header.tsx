import React from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  Layers, 
  UploadCloud, 
  FolderPlus,
  Settings
} from 'lucide-react';
import { LawDeck, NumeralSystem } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDeck: LawDeck | null;
  onSelectDeck: (deck: LawDeck | null) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenCreateDeckModal: () => void;
  onOpenDeckManagerModal: () => void;
  totalCardsCount: number;
  totalDecksCount: number;
  numeralSystem: NumeralSystem;
  onNumeralSystemChange: (system: NumeralSystem) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedDeck,
  onSelectDeck,
  onOpenAddModal,
  onOpenImportModal,
  onOpenCreateDeckModal,
  onOpenDeckManagerModal,
  totalCardsCount,
  totalDecksCount,
  numeralSystem,
  onNumeralSystemChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand / Title */}
        <div 
          onClick={() => onSelectDeck(null)}
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          id="brand-logo-button"
        >
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5 text-zinc-100" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-zinc-900 leading-none tracking-tight">Statutler</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">
              {selectedDeck ? selectedDeck.shortName : (numeralSystem === 'thai' ? `${totalDecksCount.toString().replace(/\d/g, d => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d)])} สำรับ • ${totalCardsCount.toString().replace(/\d/g, d => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d)])} มาตรา` : `${totalDecksCount} สำรับ • ${totalCardsCount} มาตรา`)}
            </p>
          </div>
        </div>

        {/* Middle: Search input */}
        <div className="flex-1 max-w-md mx-1 sm:mx-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            id="law-search-input"
            type="text"
            placeholder="ค้นหามาตรา (1 หรือ ๑), คำสำคัญ..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-zinc-900 placeholder-zinc-400 rounded-xl border border-transparent focus:border-zinc-300 focus:outline-none transition-all"
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Numeral System Toggle Switch */}
          <div 
            className="flex items-center bg-zinc-100 rounded-xl p-0.5 border border-zinc-200" 
            title={`ระบบตัวเลข: ${numeralSystem === 'arabic' ? 'เลขอารบิก (1, 2, 3)' : 'เลขไทย (๑, ๒, ๓)'}`}
          >
            <button
              id="numeral-system-arabic-btn"
              onClick={() => onNumeralSystemChange('arabic')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                numeralSystem === 'arabic'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              123
            </button>
            <button
              id="numeral-system-thai-btn"
              onClick={() => onNumeralSystemChange('thai')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                numeralSystem === 'thai'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              ๑๒๓
            </button>
          </div>

          {/* Deck Manager Button */}
          <button
            id="header-deck-manager-btn"
            onClick={onOpenDeckManagerModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors cursor-pointer"
            title="จัดการสำรับ"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-600" />
            <span className="hidden md:inline">สำรับ</span>
          </button>

          {/* Import Law */}
          <button
            id="import-law-header-btn"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
            title="นำเข้าตัวบทกฎหมาย"
          >
            <UploadCloud className="w-3.5 h-3.5 text-zinc-700" />
            <span className="hidden lg:inline">นำเข้า</span>
          </button>

          {/* Add Section */}
          <button
            id="add-section-header-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors cursor-pointer shadow-2xs"
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
