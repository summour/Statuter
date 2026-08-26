import React, { useState, useMemo } from 'react';
import { LawDeck, LawCard } from '../types';
import { renderDeckIcon } from './DeckIconHelper';
import { 
  ArrowRight,
  Bookmark,
  Layers,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Download,
  FolderPlus,
  Settings
} from 'lucide-react';
import { exportDeckToJson } from '../utils/storage';

interface DeckGridProps {
  decks: LawDeck[];
  cards: LawCard[];
  onSelectDeck: (deck: LawDeck | 'all') => void;
  searchQuery: string;
  onSelectCardDirectly?: (card: LawCard) => void;
  onOpenCreateDeck: () => void;
  onOpenEditDeck: (deck: LawDeck) => void;
  onOpenDeleteDeck: (deck: LawDeck) => void;
  onOpenAddSectionToDeck: (deckId: string) => void;
  onOpenDeckManager: () => void;
}

export const DeckGrid: React.FC<DeckGridProps> = ({
  decks,
  cards,
  onSelectDeck,
  searchQuery,
  onSelectCardDirectly,
  onOpenCreateDeck,
  onOpenEditDeck,
  onOpenDeleteDeck,
  onOpenAddSectionToDeck,
  onOpenDeckManager,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Card count by deck
  const deckCardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of cards) {
      counts[card.deckId] = (counts[card.deckId] || 0) + 1;
    }
    return counts;
  }, [cards]);

  // Search filtered cards
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    return cards.filter(card => 
      card.sectionNumber.toLowerCase().includes(query) ||
      (card.title && card.title.toLowerCase().includes(query)) ||
      card.deckName.toLowerCase().includes(query) ||
      card.deckShortName.toLowerCase().includes(query) ||
      card.fullText.toLowerCase().includes(query) ||
      (card.book && card.book.toLowerCase().includes(query)) ||
      (card.titleStructure && card.titleStructure.toLowerCase().includes(query)) ||
      (card.chapter && card.chapter.toLowerCase().includes(query))
    );
  }, [cards, searchQuery]);

  // Filtered decks based on category
  const filteredDecks = useMemo(() => {
    if (selectedCategory === 'all') return decks;
    return decks.filter(d => d.category === selectedCategory);
  }, [decks, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* If searching, show direct search results */}
      {searchResults !== null ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                ผลการค้นหา: &ldquo;{searchQuery}&rdquo;
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                พบ {searchResults.length} มาตราที่ตรงกับคำค้นหา
              </p>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200 shadow-sm">
              <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-600 font-medium">ไม่พบมาตราที่ตรงกับคำค้นหา</p>
              <p className="text-xs text-zinc-400 mt-1">ลองค้นหาด้วยเลขมาตรา เช่น &ldquo;๕๙&rdquo; หรือคำสำคัญ เช่น &ldquo;เจตนา&rdquo;, &ldquo;ละเมิด&rdquo;</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {searchResults.map(card => (
                <div
                  key={card.id}
                  id={`search-card-${card.id}`}
                  onClick={() => onSelectCardDirectly ? onSelectCardDirectly(card) : onSelectDeck(decks.find(d => d.id === card.deckId) || 'all')}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {card.deckShortName}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200">
                        {card.sectionNumber}
                      </span>
                    </div>

                    {card.title && (
                      <h3 className="font-bold text-sm text-zinc-900 group-hover:text-black transition-colors line-clamp-1">
                        {card.title}
                      </h3>
                    )}

                    {/* Legal Hierarchy snippet */}
                    {(card.book || card.chapter) && (
                      <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                        {[card.book, card.titleStructure, card.chapter].filter(Boolean).join(' › ')}
                      </p>
                    )}

                    <p className="text-xs text-zinc-600 mt-2 line-clamp-3 leading-relaxed font-serif">
                      {card.fullText}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                    <span>{card.deckName}</span>
                    <span className="flex items-center gap-1 font-medium text-zinc-900 group-hover:translate-x-0.5 transition-transform">
                      เปิดอ่านมาตรา <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Regular Library Shelf View */
        <div>
          {/* Hero Banner / Introduction */}
          <div className="bg-zinc-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xs border border-zinc-800 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700 mb-3">
                <Bookmark className="w-3.5 h-3.5 text-zinc-300" /> ระบบห้องสมุดกฎหมายฉบับ Deck Reader (Anki Style)
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                จัดการและเลือก Deck กฎหมายที่ต้องการ
              </h2>
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                สร้างสำรับใหม่ แก้ไขชื่อ หมวดหมู่ เพิ่ม/ลบมาตรา และนำเข้าตัวบทตามระบบโครงสร้าง บรรพ ลักษณะ หมวด มาตรา วรรค และ อนุ
              </p>
            </div>

            {/* Quick Combined Deck trigger & Management buttons */}
            <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4 text-xs text-zinc-300">
                <span>ทั้งหมด <strong>{cards.length}</strong> มาตรา</span>
                <span>•</span>
                <span><strong>{decks.length}</strong> สำรับกฎหมาย</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="manage-decks-hero-btn"
                  onClick={onOpenDeckManager}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors border border-zinc-700 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-300" />
                  <span>จัดการสำรับทั้งหมด</span>
                </button>

                <button
                  id="create-new-deck-hero-btn"
                  onClick={onOpenCreateDeck}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors border border-zinc-700 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ สร้าง Deck ใหม่</span>
                </button>

                <button
                  id="open-all-deck-btn"
                  onClick={() => onSelectDeck('all')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-900 font-semibold text-xs hover:bg-zinc-100 transition-colors shadow-sm cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>อ่านรวมทุก Deck ({cards.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              ทุกหมวด ({decks.length})
            </button>

            <button
              onClick={() => setSelectedCategory('code')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'code'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              ประมวลกฎหมาย ({decks.filter(d => d.category === 'code').length})
            </button>

            <button
              onClick={() => setSelectedCategory('proc')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'proc'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              วิธีพิจารณาความ ({decks.filter(d => d.category === 'proc').length})
            </button>

            <button
              onClick={() => setSelectedCategory('constitution')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'constitution'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              รัฐธรรมนูญ ({decks.filter(d => d.category === 'constitution').length})
            </button>

            <button
              onClick={() => setSelectedCategory('act')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'act'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              พระราชบัญญัติ ({decks.filter(d => d.category === 'act').length})
            </button>

            {decks.some(d => d.category === 'custom') && (
              <button
                onClick={() => setSelectedCategory('custom')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'custom'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                สำรับส่วนตัว ({decks.filter(d => d.category === 'custom').length})
              </button>
            )}
          </div>

          {/* Decks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Create New Deck Prominent Action Card */}
            <div
              onClick={onOpenCreateDeck}
              className="bg-white hover:bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-zinc-900 rounded-3xl p-6 transition-all cursor-pointer group flex flex-col justify-center items-center text-center min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-700 flex items-center justify-center mb-3 transition-colors shadow-2xs">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 group-hover:text-black">
                + สร้าง Deck ใหม่
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                เพิ่มสำรับกฎหมายใหม่ เช่น พ.ร.บ., กฎหมายพิเศษ, หรือสรุปสอบ
              </p>
            </div>

            {/* Render Each Deck Card */}
            {filteredDecks.map((deck) => {
              const cardCount = deckCardCounts[deck.id] || 0;
              return (
                <div
                  key={deck.id}
                  id={`deck-card-${deck.id}`}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 hover:border-zinc-400 hover:shadow-md transition-all group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    {/* Top row: Icon, Short Name, & Quick Deck Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div 
                        onClick={() => onSelectDeck(deck)}
                        className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:scale-105 group-hover:bg-zinc-900 group-hover:text-white transition-all cursor-pointer shadow-2xs"
                      >
                        {renderDeckIcon(deck.iconName)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {deck.shortName}
                        </span>

                        {/* Deck Card Action Menu */}
                        <div className="flex items-center gap-0.5 bg-zinc-50 rounded-xl p-0.5 border border-zinc-200 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Quick Add Section to this Deck */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddSectionToDeck(deck.id);
                            }}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title={`เพิ่มมาตราใหม่ลงใน "${deck.name}"`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit Deck */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditDeck(deck);
                            }}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขชื่อและรายละเอียด Deck"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Export Deck */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportDeckToJson(deck, cards);
                            }}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="ส่งออก Deck เป็น JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Deck */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDeleteDeck(deck);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบสำรับนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Deck Title */}
                    <div 
                      onClick={() => onSelectDeck(deck)}
                      className="cursor-pointer"
                    >
                      <h3 className="text-base font-bold text-zinc-900 group-hover:text-black transition-colors leading-tight">
                        {deck.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed line-clamp-2">
                        {deck.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom row: Card count and CTA */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500">
                      {cardCount} มาตราในการ์ด
                    </span>
                    <button
                      onClick={() => onSelectDeck(deck)}
                      className="flex items-center gap-1 text-xs font-bold text-zinc-900 group-hover:text-black group-hover:translate-x-1 transition-all cursor-pointer"
                    >
                      <span>เปิดอ่าน Deck</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
