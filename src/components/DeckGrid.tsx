import React, { useState, useMemo } from 'react';
import { LawDeck, LawCard } from '../types';
import { 
  ShieldAlert, 
  Scale, 
  Gavel, 
  FileText, 
  Landmark, 
  Lock, 
  BookOpen, 
  Layers, 
  ArrowRight,
  Bookmark
} from 'lucide-react';

interface DeckGridProps {
  decks: LawDeck[];
  cards: LawCard[];
  onSelectDeck: (deck: LawDeck | 'all') => void;
  searchQuery: string;
  onSelectCardDirectly?: (card: LawCard) => void;
}

export const DeckGrid: React.FC<DeckGridProps> = ({
  decks,
  cards,
  onSelectDeck,
  searchQuery,
  onSelectCardDirectly,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Helper to render deck icon
  const renderIcon = (name: string) => {
    switch (name) {
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5" />;
      case 'Scale':
        return <Scale className="w-5 h-5" />;
      case 'Gavel':
        return <Gavel className="w-5 h-5" />;
      case 'FileText':
        return <FileText className="w-5 h-5" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5" />;
      case 'Lock':
        return <Lock className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

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
          <div className="bg-zinc-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-xs border border-zinc-800">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700 mb-3">
                <Bookmark className="w-3.5 h-3.5 text-zinc-300" /> ห้องสมุดกฎหมายไทยฉบับ Deck Reader
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                เลือก Deck กฎหมายที่ต้องการอ่าน
              </h2>
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                อ่านตัวบทกฎหมายทีละมาตรา จัดหมวดหมู่ตามระบบ บรรพ, ลักษณะ, หมวด, ส่วน, เลขมาตรา, วรรค และ อนุ
              </p>
            </div>

            {/* Quick Combined Deck trigger */}
            <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-zinc-300">
                <span>ทั้งหมด <strong>{cards.length}</strong> มาตรา</span>
                <span>•</span>
                <span><strong>{decks.length}</strong> หมวดกฎหมาย</span>
              </div>

              <button
                id="open-all-deck-btn"
                onClick={() => onSelectDeck('all')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-900 font-semibold text-xs hover:bg-zinc-100 transition-colors shadow-sm cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>อ่านทุกมาตราพร้อมกัน ({cards.length})</span>
              </button>
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
              ประมวลกฎหมาย (อาญา / แพ่ง)
            </button>

            <button
              onClick={() => setSelectedCategory('proc')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'proc'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              วิธีพิจารณาความ (ป.วิ.อ. / ป.วิ.พ.)
            </button>

            <button
              onClick={() => setSelectedCategory('constitution')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'constitution'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              รัฐธรรมนูญ
            </button>

            <button
              onClick={() => setSelectedCategory('act')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'act'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              พระราชบัญญัติ (PDPA)
            </button>
          </div>

          {/* Decks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredDecks.map((deck) => {
              const cardCount = deckCardCounts[deck.id] || 0;
              return (
                <div
                  key={deck.id}
                  id={`deck-card-${deck.id}`}
                  onClick={() => onSelectDeck(deck)}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200 hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    {/* Top row: Icon & Short Name */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:scale-105 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                        {renderIcon(deck.iconName)}
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {deck.shortName}
                      </span>
                    </div>

                    {/* Deck Title */}
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-black transition-colors leading-tight">
                      {deck.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed line-clamp-2">
                      {deck.description}
                    </p>
                  </div>

                  {/* Bottom row: Card count and CTA */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500">
                      {cardCount} มาตราในการ์ด
                    </span>
                    <button
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
