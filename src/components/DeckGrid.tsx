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
              <h2 className="text-base font-bold text-zinc-900">
                ผลการค้นหา &ldquo;{searchQuery}&rdquo; ({searchResults.length})
              </h2>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200 shadow-2xs">
              <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm font-medium">ไม่พบมาตราที่ตรงกับคำค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {searchResults.map(card => (
                <div
                  key={card.id}
                  id={`search-card-${card.id}`}
                  onClick={() => onSelectCardDirectly ? onSelectCardDirectly(card) : onSelectDeck(decks.find(d => d.id === card.deckId) || 'all')}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
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
                      <ArrowRight className="w-3.5 h-3.5" />
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
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              ทั้งหมด ({decks.length})
            </button>

            <button
              onClick={() => setSelectedCategory('code')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'code'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              ประมวล ({decks.filter(d => d.category === 'code').length})
            </button>

            <button
              onClick={() => setSelectedCategory('proc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'proc'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              วิธีพิจารณา ({decks.filter(d => d.category === 'proc').length})
            </button>

            <button
              onClick={() => setSelectedCategory('constitution')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'constitution'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              รัฐธรรมนูญ ({decks.filter(d => d.category === 'constitution').length})
            </button>

            <button
              onClick={() => setSelectedCategory('act')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'act'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              พ.ร.บ. ({decks.filter(d => d.category === 'act').length})
            </button>

            {decks.some(d => d.category === 'custom') && (
              <button
                onClick={() => setSelectedCategory('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'custom'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                ส่วนตัว ({decks.filter(d => d.category === 'custom').length})
              </button>
            )}
          </div>

          {/* Decks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Create New Deck Card */}
            <div
              onClick={onOpenCreateDeck}
              className="bg-white hover:bg-zinc-50 border border-dashed border-zinc-300 hover:border-zinc-900 rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-center items-center text-center min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-700 flex items-center justify-center mb-2.5 transition-colors">
                <FolderPlus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 group-hover:text-black">
                + สร้าง Deck ใหม่
              </h3>
            </div>

            {/* Render Each Deck Card */}
            {filteredDecks.map((deck) => {
              const cardCount = deckCardCounts[deck.id] || 0;
              return (
                <div
                  key={deck.id}
                  id={`deck-card-${deck.id}`}
                  onClick={() => onSelectDeck(deck)}
                  className="bg-white rounded-2xl p-5 border border-zinc-200 hover:border-zinc-400 hover:shadow-xs transition-all group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Top row: Icon, Short Name, & Quick Deck Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        {renderDeckIcon(deck.iconName, 'w-4 h-4')}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {deck.shortName}
                        </span>

                        {/* Deck Card Action Menu */}
                        <div className="flex items-center gap-0.5 bg-zinc-50 rounded-lg p-0.5 border border-zinc-200 opacity-60 group-hover:opacity-100 transition-opacity">
                          {/* Quick Add Section */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddSectionToDeck(deck.id);
                            }}
                            className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded transition-colors cursor-pointer"
                            title={`เพิ่มมาตราใน "${deck.name}"`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit Deck */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditDeck(deck);
                            }}
                            className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded transition-colors cursor-pointer"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Export Deck */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportDeckToJson(deck, cards);
                            }}
                            className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded transition-colors cursor-pointer"
                            title="ส่งออก JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Deck */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDeleteDeck(deck);
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Deck Title */}
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 group-hover:text-black transition-colors leading-snug">
                        {deck.name}
                      </h3>
                    </div>
                  </div>

                  {/* Bottom row: Card count and arrow */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-semibold">
                      {cardCount} มาตรา
                    </span>
                    <span className="font-medium text-zinc-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
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
