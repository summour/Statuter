import React, { useState, useMemo } from 'react';
import { 
  LawDeck, 
  LawCard, 
  NumeralSystem 
} from '../types';
import { 
  ArrowLeft, 
  Play, 
  Layers, 
  List, 
  Plus, 
  Settings, 
  Download, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  X,
  FileText,
  Upload
} from 'lucide-react';
import { exportDeckToJson } from '../utils/storage';
import { formatNumeralText, parseRawSectionNumber } from '../utils/thaiLawParser';
import { 
  buildLawHierarchyTree, 
  LawTreeNode 
} from '../utils/lawHierarchy';

interface DeckOverviewProps {
  deck: LawDeck | 'all';
  cards: LawCard[];
  onBackToLibrary: () => void;
  onStartReading: (structureFilter?: string, startCardId?: string, initialMode?: 'card' | 'list') => void;
  onOpenAddSectionToDeck?: (deckId?: string) => void;
  onOpenImportModal?: (deckId?: string) => void;
  onOpenEditDeck?: (deck: LawDeck) => void;
  numeralSystem: NumeralSystem;
}

export const DeckOverview: React.FC<DeckOverviewProps> = ({
  deck,
  cards,
  onBackToLibrary,
  onStartReading,
  onOpenAddSectionToDeck,
  onOpenImportModal,
  onOpenEditDeck,
  numeralSystem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Filter and sort deck cards in Thai statutory sequence
  const deckCards = useMemo(() => {
    const list = deck === 'all' ? [...cards] : cards.filter(c => c.deckId === deck.id);
    return list.sort((a, b) => {
      const numA = typeof a.sectionRawNum === 'number' && !isNaN(a.sectionRawNum) ? a.sectionRawNum : parseRawSectionNumber(a.sectionNumber);
      const numB = typeof b.sectionRawNum === 'number' && !isNaN(b.sectionRawNum) ? b.sectionRawNum : parseRawSectionNumber(b.sectionNumber);
      if (numA !== numB) return numA - numB;
      return a.sectionNumber.localeCompare(b.sectionNumber, 'th');
    });
  }, [cards, deck]);

  // Build hierarchy tree
  const treeResult = useMemo(() => {
    return buildLawHierarchyTree(deckCards);
  }, [deckCards]);

  const deckTitle = deck === 'all' ? 'รวมทุกสำรับกฎหมาย' : deck.name;
  const deckShort = deck === 'all' ? 'ทุกฉบับ' : deck.shortName;
  const deckDesc = deck === 'all' 
    ? 'รวบรวมตัวบทกฎหมายทุกมาตราจากทุกสำรับที่มีในระบบ' 
    : deck.description;

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered search results inside this deck
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase().trim();

    // Matching cards
    const matchingCards = deckCards.filter(c => 
      c.sectionNumber.toLowerCase().includes(term) ||
      (c.title && c.title.toLowerCase().includes(term)) ||
      (c.fullText && c.fullText.toLowerCase().includes(term))
    );

    // Matching structure nodes
    const matchingNodes = treeResult.flatList.filter(n =>
      n.label.toLowerCase().includes(term) ||
      (n.book && n.book.toLowerCase().includes(term)) ||
      (n.titleStructure && n.titleStructure.toLowerCase().includes(term))
    );

    return {
      cards: matchingCards,
      nodes: matchingNodes,
    };
  }, [searchTerm, deckCards, treeResult.flatList]);

  // Recursive tree node renderer
  const renderTreeNode = (node: LawTreeNode) => {
    const isCollapsed = collapsedIds.has(node.id);
    const hasChildren = node.children.length > 0;

    const displayLabel = formatNumeralText(node.label, numeralSystem);
    const displayCount = formatNumeralText(node.count.toString(), numeralSystem);

    const cleanStart = node.startSection.replace(/^มาตรา\s*/, '');
    const cleanEnd = node.endSection.replace(/^มาตรา\s*/, '');
    const displayRange = node.startSection === '-' 
      ? '' 
      : cleanStart === cleanEnd 
      ? `ม. ${formatNumeralText(cleanStart, numeralSystem)}` 
      : `ม. ${formatNumeralText(cleanStart, numeralSystem)}–${formatNumeralText(cleanEnd, numeralSystem)}`;

    const isBook = node.level === 'book';
    const isTitle = node.level === 'title';
    const isChapter = node.level === 'chapter';
    const paddingLeftPx = node.depth === 0 ? 12 : node.depth === 1 ? 28 : node.depth === 2 ? 44 : 60;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => onStartReading(node.id)}
          style={{ paddingLeft: `${paddingLeftPx}px` }}
          className={`flex items-center justify-between py-2.5 pr-3 rounded-xl text-left cursor-pointer transition-colors group ${
            isBook
              ? 'bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-bold border-t border-zinc-100 first:border-t-0 mt-1.5'
              : isTitle
              ? 'hover:bg-zinc-100 text-zinc-900 font-semibold'
              : isChapter
              ? 'hover:bg-zinc-100 text-zinc-800 font-medium'
              : 'hover:bg-zinc-100 text-zinc-700'
          }`}
        >
          {/* Title & Chevron */}
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-1 -ml-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 transition-colors shrink-0"
                title={isCollapsed ? 'ขยาย' : 'ย่อ'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-4 shrink-0" />
            )}

            <span className={`truncate text-sm ${
              isBook ? 'font-bold text-zinc-900 text-sm' : isTitle ? 'font-semibold text-zinc-900 text-sm' : 'text-zinc-800 text-xs sm:text-sm'
            }`}>
              {displayLabel}
            </span>
          </div>

          {/* Range, Count & Action */}
          <div className="flex items-center gap-2.5 shrink-0 text-xs">
            {displayRange && (
              <span className="text-zinc-400 font-normal hidden sm:inline">
                {displayRange}
              </span>
            )}
            <span className="text-zinc-500 font-medium text-xs bg-zinc-100 px-2 py-0.5 rounded-full">
              {displayCount} มาตรา
            </span>
            <span className="text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all text-xs font-semibold flex items-center">
              อ่าน <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Children nodes if expanded */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {node.children.map(renderTreeNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Top Bar: Back & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>คลังตัวบท</span>
        </button>

        {/* Deck Action Buttons */}
        <div className="flex items-center gap-1.5">
          {deck !== 'all' && onOpenAddSectionToDeck && (
            <button
              onClick={() => onOpenAddSectionToDeck(deck.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              title="เพิ่มมาตราใหม่"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เพิ่มมาตรา</span>
            </button>
          )}

          {deck !== 'all' && onOpenImportModal && (
            <button
              onClick={() => onOpenImportModal(deck.id)}
              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
              title="นำเข้าตัวบท"
            >
              <Upload className="w-4 h-4" />
            </button>
          )}

          {deck !== 'all' && onOpenEditDeck && (
            <button
              onClick={() => onOpenEditDeck(deck)}
              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
              title="ตั้งค่าสำรับ"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {deck !== 'all' && (
            <button
              onClick={() => exportDeckToJson(deck, cards)}
              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
              title="ส่งออก JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Deck Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-zinc-900 text-white rounded-md text-xs font-bold shrink-0">
                {deckShort}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-zinc-900 truncate">
                {deckTitle}
              </h1>
            </div>
            {deckDesc && (
              <p className="text-xs text-zinc-500 line-clamp-2">
                {deckDesc}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              {formatNumeralText(deckCards.length.toString(), numeralSystem)}
            </span>
            <span className="text-xs text-zinc-500 ml-1.5 font-medium">มาตรา</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={() => onStartReading('all', undefined, 'card')}
            disabled={deckCards.length === 0}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white rounded-2xl text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>เริ่มอ่านแบบการ์ด (ทั้งหมด)</span>
          </button>

          <button
            onClick={() => onStartReading('all', undefined, 'list')}
            disabled={deckCards.length === 0}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <List className="w-4 h-4" />
            <span>ดูรายการมาตราทั้งหมด (List)</span>
          </button>
        </div>
      </div>

      {/* Structure Table of Contents Section */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-zinc-200 shadow-xs space-y-4">
        {/* Section Header with Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm sm:text-base font-bold text-zinc-900">
              สารบัญและโครงสร้างตัวบท
            </h2>
            <span className="text-xs text-zinc-400 font-medium">
              (เลือกเพื่ออ่านเฉพาะหมวดหมู่)
            </span>
          </div>

          {/* In-deck Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหามาตรา / ลักษณะ / หมวด..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        {searchResults ? (
          /* Search Results */
          <div className="space-y-4 py-2">
            <div className="text-xs font-semibold text-zinc-500">
              ผลการค้นหา "{searchTerm}"
            </div>

            {/* Matching Structure Nodes */}
            {searchResults.nodes.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  หมวดหมู่ / โครงสร้าง
                </div>
                {searchResults.nodes.map(node => (
                  <div
                    key={node.id}
                    onClick={() => onStartReading(node.id)}
                    className="flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-900 truncate">
                      {formatNumeralText(node.breadcrumb || node.label, numeralSystem)}
                    </span>
                    <span className="text-xs text-zinc-500 shrink-0 ml-2 font-medium">
                      {formatNumeralText(node.count.toString(), numeralSystem)} มาตรา ›
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Matching Cards */}
            {searchResults.cards.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  มาตรา ({searchResults.cards.length})
                </div>
                {searchResults.cards.slice(0, 30).map(card => (
                  <div
                    key={card.id}
                    onClick={() => onStartReading('all', card.id)}
                    className="flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 mr-2">
                      <span className="text-xs font-bold text-zinc-900 shrink-0">
                        {formatNumeralText(card.sectionNumber, numeralSystem)}
                      </span>
                      {card.title && (
                        <span className="text-xs text-zinc-600 truncate">
                          {formatNumeralText(card.title, numeralSystem)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 font-medium shrink-0">
                      เปิดอ่าน ›
                    </span>
                  </div>
                ))}
              </div>
            )}

            {searchResults.nodes.length === 0 && searchResults.cards.length === 0 && (
              <div className="py-8 text-center text-zinc-400 text-xs">
                ไม่พบมาตราหรือหมวดหมู่ที่ตรงกับ "{searchTerm}"
              </div>
            )}
          </div>
        ) : treeResult.hasMultipleStructures ? (
          /* Tree View */
          <div className="space-y-0.5 py-1 divide-y divide-zinc-100/60">
            {treeResult.rootNodes.map(renderTreeNode)}
          </div>
        ) : (
          /* Plain Section List if deck has no deep hierarchy */
          <div className="space-y-1 py-1 divide-y divide-zinc-100/60">
            {deckCards.map(card => (
              <div
                key={card.id}
                onClick={() => onStartReading('all', card.id)}
                className="flex items-center justify-between py-2.5 px-3 hover:bg-zinc-50 rounded-xl cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0 mr-3">
                  <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 shrink-0">
                    {formatNumeralText(card.sectionNumber, numeralSystem)}
                  </span>
                  {card.title && (
                    <span className="text-xs sm:text-sm text-zinc-600 truncate">
                      {formatNumeralText(card.title, numeralSystem)}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-800 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
