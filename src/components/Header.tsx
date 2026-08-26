import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  Search, 
  X,
  ChevronLeft
} from 'lucide-react';
import { LawDeck, NumeralSystem } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDeck: LawDeck | null;
  onSelectDeck: (deck: LawDeck | null) => void;
  onOpenAddModal?: () => void;
  onOpenImportModal?: () => void;
  totalCardsCount?: number;
  totalDecksCount?: number;
  numeralSystem?: NumeralSystem;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedDeck,
  onSelectDeck,
}) => {
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(searchQuery));
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <header className="sticky top-0 z-30 bg-[#F9FAFB]/70 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* If Search is Open in Full width mode */}
        {isSearchOpen ? (
          <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="header-search-input"
                type="text"
                placeholder="ค้นหามาตรา, ข้อความกฎหมาย..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white/80 backdrop-blur-md text-zinc-900 placeholder-zinc-400 rounded-full border border-zinc-200/60 focus:border-zinc-400 focus:outline-none shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setIsSearchOpen(false);
                onSearchChange('');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium px-2 py-1.5 cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <>
            {/* Left: Brand / Title */}
            <div className="flex items-center gap-2.5">
              {selectedDeck ? (
                <button
                  id="header-back-btn"
                  onClick={() => onSelectDeck(null)}
                  className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="truncate max-w-[150px] sm:max-w-none">{selectedDeck.name}</span>
                </button>
              ) : (
                <div 
                  onClick={() => onSelectDeck(null)}
                  className="flex items-center gap-2.5 select-none cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-2xs transition-transform group-active:scale-95">
                    <Scale className="w-3.5 h-3.5 text-zinc-100" />
                  </div>
                  <span className="font-bold text-lg text-zinc-900 tracking-tight">Statuter</span>
                </div>
              )}
            </div>

            {/* Right: Minimal Icon Actions */}
            <div className="flex items-center gap-1.5">
              <button
                id="header-search-toggle-btn"
                onClick={() => setIsSearchOpen(true)}
                title="ค้นหา"
                aria-label="ค้นหา"
                className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-black/5 active:bg-black/10 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>

              {user && user.photoURL && (
                <div className="ml-1">
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Profile'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-zinc-200 object-cover shadow-2xs"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
