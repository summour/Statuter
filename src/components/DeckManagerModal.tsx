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
    if (!searchQuery.trim()) return decks;
    const q = searchQuery.toLowerCase().trim();
    return decks.filter(deck => {
      const inName = (deck.name || '').toLowerCase().includes(q);
      const inShort = (deck.shortName || '').toLowerCase().includes(q);
      const inDesc = (deck.description || '').toLowerCase().includes(q);
      return inName || inShort || inDesc;
    });
  }, [decks, searchQuery]);

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
                <h2 className="font-bold text-base sm:text-lg text-zinc-900">จัดการสำรับกฎหมาย</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                  {decks.length} สำรับ • {cards.length} มาตรา
                </span>
              </div>
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
        <div className="px-6 py-3.5 border-b border-zinc-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาสำรับ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-zinc-900 rounded-xl border border-transparent focus:border-zinc-300 focus:outline-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
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
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors cursor-pointer"
              title="นำเข้า JSON"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>นำเข้า</span>
            </button>

            {/* Export All Backup */}
            <button
              onClick={() => exportAllDataToJson(decks, cards)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors cursor-pointer"
              title="สำรองข้อมูลทั้งหมด"
            >
              <Download className="w-3.5 h-3.5" />
              <span>สำรอง</span>
            </button>

            {/* Create New Deck Button */}
            <button
              onClick={onOpenCreateDeck}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-xs cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ สำรับใหม่</span>
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

        {/* Deck List Table / Card View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-zinc-50/50">
          {filteredDecks.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-zinc-200/80 my-4">
              <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-zinc-700">ไม่พบสำรับกฎหมาย</h3>
              <p className="text-xs text-zinc-400 mt-1">กดปุ่ม &ldquo;+ สำรับใหม่&rdquo; หรือนำเข้าข้อมูลเพื่อเริ่มต้น</p>
            </div>
          ) : (
            filteredDecks.map((deck) => {
              const cardCount = deckCardCounts[deck.id] || 0;
              return (
                <div
                  key={deck.id}
                  className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs hover:border-zinc-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-900 flex items-center justify-center shrink-0 transition-colors">
                      {renderDeckIcon(deck.iconName, 'w-4 h-4')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {deck.shortName}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md">
                          {deck.categoryLabel}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-zinc-900 mt-1 truncate">
                        {deck.name}
                      </h4>
                    </div>
                  </div>

                  {/* Right: Card Count & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    <div className="text-left sm:text-right pr-2">
                      <span className="text-xs font-bold text-zinc-700">
                        {cardCount} มาตรา
                      </span>
                    </div>

                    {/* Open Deck Reader */}
                    <button
                      onClick={() => {
                        onSelectDeckToRead(deck);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl transition-colors cursor-pointer"
                      title="เปิดอ่าน"
                    >
                      <span>เปิดอ่าน</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Export Single Deck */}
                    <button
                      onClick={() => exportDeckToJson(deck, cards)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                      title="ส่งออก JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Edit Deck */}
                    <button
                      onClick={() => onOpenEditDeck(deck)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                      title="แก้ไข"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Deck */}
                    <button
                      onClick={() => onOpenDeleteDeck(deck)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="ลบ"
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
        <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('ต้องการรีเซ็ตสำรับและตัวบททั้งหมดกลับสู่ค่าเริ่มต้นใช่หรือไม่?')) {
                onResetData();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตค่าเริ่มต้น</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>

      </div>
    </div>
  );
};
