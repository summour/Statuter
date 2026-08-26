import React, { useState, useMemo, useRef } from 'react';
import { LawDeck, LawCard } from '../types';
import { renderDeckIcon } from './DeckIconHelper';
import { 
  FolderPlus, 
  Edit3, 
  Trash2, 
  Download, 
  UploadCloud, 
  RotateCcw, 
  Search, 
  X, 
  Layers, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { exportDeckToJson, exportAllDataToJson } from '../utils/storage';

interface DeckManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: LawDeck[];
  cards: LawCard[];
  onOpenCreateDeck: () => void;
  onOpenEditDeck: (deck: LawDeck) => void;
  onOpenDeleteDeck: (deck: LawDeck) => void;
  onSelectDeckToRead: (deck: LawDeck) => void;
  onImportBackup: (importedDecks: LawDeck[], importedCards: LawCard[]) => void;
  onResetData: () => void;
}

export const DeckManagerModal: React.FC<DeckManagerModalProps> = ({
  isOpen,
  onClose,
  decks,
  cards,
  onOpenCreateDeck,
  onOpenEditDeck,
  onOpenDeleteDeck,
  onSelectDeckToRead,
  onImportBackup,
  onResetData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Card count by deck
  const deckCardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      counts[card.deckId] = (counts[card.deckId] || 0) + 1;
    }
    return counts;
  }, [cards]);

  // Filtered decks
  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      if (selectedCategory !== 'all' && deck.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = deck.name.toLowerCase().includes(q);
        const inShort = deck.shortName.toLowerCase().includes(q);
        const inDesc = deck.description.toLowerCase().includes(q);
        const inCat = deck.categoryLabel.toLowerCase().includes(q);
        return inName || inShort || inDesc || inCat;
      }
      return true;
    });
  }, [decks, selectedCategory, searchQuery]);

  // Handle JSON backup import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (data.type === 'law_deck_export' && data.deck && Array.isArray(data.cards)) {
          // Single deck import
          const importedDeck: LawDeck = data.deck;
          const importedCards: LawCard[] = data.cards;
          onImportBackup([importedDeck], importedCards);
          setImportStatus(`นำเข้าสำรับ "${importedDeck.name}" (${importedCards.length} มาตรา) สำเร็จ`);
        } else if (data.type === 'law_full_backup' && Array.isArray(data.decks) && Array.isArray(data.cards)) {
          // Full backup import
          onImportBackup(data.decks, data.cards);
          setImportStatus(`กู้คืนข้อมูลสำเร็จ: ${data.decks.length} สำรับ, ${data.cards.length} มาตรา`);
        } else if (Array.isArray(data)) {
          // Generic cards array
          setImportStatus('ไม่สามารถระบุรูปแบบไฟล์สำรองข้อมูลได้');
        } else {
          setImportStatus('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        console.error('Import error', err);
        setImportStatus('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }

      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] max-h-[820px] flex flex-col border border-zinc-200 shadow-2xl overflow-hidden text-zinc-900">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-zinc-900">ระบบจัดการสำรับกฎหมาย (Deck Manager)</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                  {decks.length} สำรับ • {cards.length} มาตรา
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                เพิ่ม ลบ แก้ไข ปรับแต่งโครงสร้าง และสำรองข้อมูลสำรับได้อิสระเหมือน Anki
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Actions & Search */}
        <div className="px-6 py-3 border-b border-zinc-200 bg-white flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาสำรับกฎหมาย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-zinc-900 rounded-xl border border-transparent focus:border-zinc-300 focus:outline-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden JSON file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Import JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 transition-colors cursor-pointer"
              title="นำเข้าไฟล์สำรองข้อมูล JSON หรือไฟล์ Deck"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>นำเข้า JSON</span>
            </button>

            {/* Export All Backup */}
            <button
              onClick={() => exportAllDataToJson(decks, cards)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 transition-colors cursor-pointer"
              title="สำรองข้อมูลทั้งหมดเป็นไฟล์ JSON (Decks + Cards)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>สำรองข้อมูลทั้งหมด</span>
            </button>

            {/* Create New Deck Button */}
            <button
              onClick={onOpenCreateDeck}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ สร้าง Deck ใหม่</span>
            </button>
          </div>
        </div>

        {/* Floating Notification */}
        {importStatus && (
          <div className="mx-6 mt-3 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-xs flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <span className="font-semibold">{importStatus}</span>
            <button onClick={() => setImportStatus(null)} className="text-zinc-400 hover:text-white ml-2">✕</button>
          </div>
        )}

        {/* Category Pills Filter */}
        <div className="px-6 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
            หมวด:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              selectedCategory === 'all' ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-white hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
            }`}
          >
            ทั้งหมด ({decks.length})
          </button>
          <button
            onClick={() => setSelectedCategory('code')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              selectedCategory === 'code' ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-white hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
            }`}
          >
            ประมวลกฎหมาย ({decks.filter(d => d.category === 'code').length})
          </button>
          <button
            onClick={() => setSelectedCategory('proc')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              selectedCategory === 'proc' ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-white hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
            }`}
          >
            วิธีพิจารณาความ ({decks.filter(d => d.category === 'proc').length})
          </button>
          <button
            onClick={() => setSelectedCategory('constitution')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              selectedCategory === 'constitution' ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-white hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
            }`}
          >
            รัฐธรรมนูญ ({decks.filter(d => d.category === 'constitution').length})
          </button>
          <button
            onClick={() => setSelectedCategory('act')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              selectedCategory === 'act' ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-white hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
            }`}
          >
            พระราชบัญญัติ ({decks.filter(d => d.category === 'act').length})
          </button>
          <button
            onClick={() => setSelectedCategory('custom')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              selectedCategory === 'custom' ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-white hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
            }`}
          >
            สำรับส่วนตัว ({decks.filter(d => d.category === 'custom').length})
          </button>
        </div>

        {/* Deck List Table / Card View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-zinc-50/50">
          {filteredDecks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200">
              <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-zinc-800">ไม่พบสำรับกฎหมายที่ค้นหา</h3>
              <p className="text-xs text-zinc-500 mt-1">ลองเปลี่ยนคำค้นหา หรือสร้าง Deck ใหม่</p>
              <button
                onClick={onOpenCreateDeck}
                className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                + สร้างสำรับใหม่ทันที
              </button>
            </div>
          ) : (
            filteredDecks.map((deck) => {
              const cardCount = deckCardCounts[deck.id] || 0;
              return (
                <div
                  key={deck.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-900 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                      {renderDeckIcon(deck.iconName, 'w-5 h-5')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {deck.shortName}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md">
                          {deck.categoryLabel}
                        </span>
                        {deck.isDefault ? (
                          <span className="text-[10px] text-zinc-400">ระบบเริ่มต้น</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            กำหนดเอง
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-zinc-900 mt-1 truncate">
                        {deck.name}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                        {deck.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Card Count & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    <div className="text-left sm:text-right pr-2">
                      <span className="text-sm font-extrabold text-zinc-900 block leading-tight">
                        {cardCount}
                      </span>
                      <span className="text-[11px] text-zinc-500">มาตรา</span>
                    </div>

                    {/* Open Deck Reader */}
                    <button
                      onClick={() => {
                        onSelectDeckToRead(deck);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl transition-colors cursor-pointer"
                      title="เปิดอ่านการ์ดใน Deck นี้"
                    >
                      <span>เปิดอ่าน</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Export Single Deck */}
                    <button
                      onClick={() => exportDeckToJson(deck, cards)}
                      className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                      title={`ส่งออกสำรับ "${deck.name}" เป็นไฟล์ JSON`}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Edit Deck */}
                    <button
                      onClick={() => onOpenEditDeck(deck)}
                      className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                      title="แก้ไขข้อมูลสำรับ"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Deck */}
                    <button
                      onClick={() => onOpenDeleteDeck(deck)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="ลบสำรับนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Bottom actions */}
        <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตสำรับและตัวบทกฎหมายทั้งหมดกลับเป็นค่าเริ่มต้นเริ่มต้นของระบบใช่หรือไม่?')) {
                onResetData();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตสำรับทั้งหมดกลับสู่ค่าเริ่มต้น</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>

      </div>
    </div>
  );
};
