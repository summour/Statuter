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
import { LawDeck } from '../types';

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
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-zinc-900 leading-none tracking-tight">Statutler</h1>
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">
                Deck Reader
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">
              {selectedDeck ? `กำลังอ่าน: ${selectedDeck.shortName}` : `${totalDecksCount} สำรับ • ${totalCardsCount} มาตรา`}
            </p>
          </div>
        </div>

        {/* Middle: Search input */}
        <div className="flex-1 max-w-md mx-1 sm:mx-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            id="law-search-input"
            type="text"
            placeholder="ค้นหามาตรา, ชื่อหัวข้อ, คีย์เวิร์ด..."
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
          {/* Deck Manager Button */}
          <button
            id="header-deck-manager-btn"
            onClick={onOpenDeckManagerModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors cursor-pointer"
            title="จัดการและสำรองข้อมูลสำรับกฎหมาย"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-600" />
            <span className="hidden md:inline">จัดการสำรับ</span>
          </button>

          {/* New Deck Button */}
          <button
            id="header-create-deck-btn"
            onClick={onOpenCreateDeckModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors cursor-pointer"
            title="สร้างสำรับกฎหมายใหม่"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">สร้าง Deck</span>
          </button>

          {/* Import Law */}
          <button
            id="import-law-header-btn"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
            title="นำเข้าตัวบทกฎหมายจากข้อความ/ไฟล์"
          >
            <UploadCloud className="w-3.5 h-3.5 text-zinc-700" />
            <span className="hidden lg:inline">นำเข้า</span>
          </button>

          {/* Add Section */}
          <button
            id="add-section-header-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors cursor-pointer shadow-2xs"
            title="เพิ่มมาตราใหม่"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เพิ่มมาตรา</span>
          </button>
        </div>
      </div>
    </header>
  );
};
