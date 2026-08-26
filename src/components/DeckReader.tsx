import React, { useState, useEffect, useMemo } from 'react';
import { LawDeck, LawCard, NumeralSystem } from '../types';
import { 
  ArrowLeft, 
  ArrowRight, 
  List, 
  Layers, 
  BookOpen, 
  ChevronDown,
  Copy,
  Check,
  Plus,
  Edit3,
  Trash2,
  Download,
  Settings,
  FileText
} from 'lucide-react';
import { exportDeckToJson } from '../utils/storage';
import { formatNumeralText, parseRawSectionNumber } from '../utils/thaiLawParser';
import { 
  buildLawHierarchyTree, 
  filterCardsByHierarchyNode, 
  formatTreeOptionLabel 
} from '../utils/lawHierarchy';
import { StructureTocModal } from './StructureTocModal';

interface DeckReaderProps {
  deck: LawDeck | 'all';
  cards: LawCard[];
  onBackToLibrary: () => void;
  initialCardId?: string;
  onOpenAddSectionToDeck?: (deckId?: string) => void;
  onOpenImportModal?: (deckId?: string) => void;
  onOpenEditDeck?: (deck: LawDeck) => void;
  onDeleteCard?: (cardId: string) => void;
  onOpenEditCard?: (card: LawCard) => void;
  numeralSystem?: NumeralSystem;
  onNumeralSystemChange?: (system: NumeralSystem) => void;
}

export const DeckReader: React.FC<DeckReaderProps> = ({
  deck,
  cards,
  onBackToLibrary,
  initialCardId,
  onOpenAddSectionToDeck,
  onOpenImportModal,
  onOpenEditDeck,
  onDeleteCard,
  onOpenEditCard,
  numeralSystem = 'arabic',
  onNumeralSystemChange,
}) => {
  // Filter and sort cards strictly in statutory section order
  const rawDeckCards = useMemo(() => {
    const list = deck === 'all' ? [...cards] : cards.filter(c => c.deckId === deck.id);
    return list.sort((a, b) => {
      const numA = typeof a.sectionRawNum === 'number' && !isNaN(a.sectionRawNum) ? a.sectionRawNum : parseRawSectionNumber(a.sectionNumber);
      const numB = typeof b.sectionRawNum === 'number' && !isNaN(b.sectionRawNum) ? b.sectionRawNum : parseRawSectionNumber(b.sectionNumber);
      if (numA !== numB) return numA - numB;
      return a.sectionNumber.localeCompare(b.sectionNumber, 'th');
    });
  }, [cards, deck]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState<boolean>(false);
  const [structureFilter, setStructureFilter] = useState<string>('all');
  const [isTocModalOpen, setIsTocModalOpen] = useState<boolean>(false);

  // Natural Law Structure Tree (Book -> Title -> Chapter -> Part) in chronological statute sequence
  const treeResult = useMemo(() => {
    return buildLawHierarchyTree(rawDeckCards);
  }, [rawDeckCards]);

  // Filtered deck cards based on selected hierarchy node
  const deckCards = useMemo(() => {
    return filterCardsByHierarchyNode(rawDeckCards, structureFilter);
  }, [rawDeckCards, structureFilter]);

  // If an initial card was requested, jump to it
  useEffect(() => {
    if (initialCardId && deckCards.length > 0) {
      const foundIdx = deckCards.findIndex(c => c.id === initialCardId);
      if (foundIdx !== -1) {
        setCurrentIndex(foundIdx);
      }
    }
  }, [initialCardId, deckCards]);

  // Reset index if out of bounds
  useEffect(() => {
    if (currentIndex >= deckCards.length && deckCards.length > 0) {
      setCurrentIndex(0);
    }
  }, [deckCards.length, currentIndex]);

  const currentCard = deckCards[currentIndex] || deckCards[0];

  // Next card
  const handleNext = () => {
    if (currentIndex < deckCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Previous card
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Copy text handler
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'card') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'ArrowRight' || e.code === 'KeyJ' || e.code === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyK') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, deckCards.length, viewMode]);

  const deckTitle = deck === 'all' ? 'รวมทุกสำรับกฎหมาย' : deck.name;
  const deckShort = deck === 'all' ? 'ทุกฉบับ' : deck.shortName;

  if (deckCards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-zinc-900">สำรับนี้ยังไม่มีมาตรากฎหมาย</h2>
          <p className="text-xs text-zinc-500 mt-1">คุณสามารถเพิ่มมาตราใหม่ หรือนำเข้าตัวบทลงในสำรับนี้ได้ทันที</p>
          <div className="flex flex-col sm:flex-row justify-center gap-2 mt-5">
            {onOpenImportModal && (
              <button
                id="empty-deck-import-btn"
                onClick={() => onOpenImportModal(deck !== 'all' ? deck.id : undefined)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>นำเข้าตัวบทลงสำรับนี้</span>
              </button>
            )}
            {deck !== 'all' && onOpenAddSectionToDeck && (
              <button
                id="empty-deck-add-btn"
                onClick={() => onOpenAddSectionToDeck(deck.id)}
                className="flex items-center justify-center gap-1 px-4 py-2.5 bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มมาตรา</span>
              </button>
            )}
            <button
              onClick={onBackToLibrary}
              className="px-4 py-2.5 bg-zinc-100 text-zinc-600 text-xs font-semibold rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              กลับสู่ห้องสมุด
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Top Deck Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back button & Deck Info */}
        <div className="flex items-center gap-3">
          <button
            id="back-to-library-btn"
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับ</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-white">
                {deckShort}
              </span>
              <h2 className="text-sm font-bold text-zinc-900 truncate max-w-[180px] sm:max-w-xs">
                {deckTitle}
              </h2>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              มาตราที่ {currentIndex + 1} / {deckCards.length}
            </p>
          </div>
        </div>

        {/* Right: Controls (Jump dropdown, Filter by Chapter, Actions, View mode, Font size) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Import law text directly into this deck */}
          {onOpenImportModal && (
            <button
              id="deck-import-btn"
              onClick={() => onOpenImportModal(deck !== 'all' ? deck.id : undefined)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title="นำเข้าตัวบทกฎหมาย"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">นำเข้าตัวบท</span>
            </button>
          )}

          {/* Add section directly into this deck */}
          {deck !== 'all' && onOpenAddSectionToDeck && (
            <button
              onClick={() => onOpenAddSectionToDeck(deck.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="เพิ่มมาตรา"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เพิ่มมาตรา</span>
            </button>
          )}

          {/* Edit deck button */}
          {deck !== 'all' && onOpenEditDeck && (
            <button
              onClick={() => onOpenEditDeck(deck)}
              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
              title="แก้ไขสำรับ"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Export this deck */}
          {deck !== 'all' && (
            <button
              onClick={() => exportDeckToJson(deck, cards)}
              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
              title="ส่งออก JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Natural Tree Structure Filter (บรรพ -> ลักษณะ -> หมวด -> ส่วน) & TOC Modal Button */}
          {treeResult.hasMultipleStructures && (
            <div className="flex items-center gap-1">
              <button
                id="open-toc-modal-btn"
                onClick={() => setIsTocModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-zinc-200"
                title="เปิดสารบัญโครงสร้างกฎหมาย (Tree View)"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-600" />
                <span className="hidden sm:inline">สารบัญ</span>
              </button>

              <div className="relative">
                <select
                  id="filter-structure-select"
                  value={structureFilter}
                  onChange={(e) => {
                    setStructureFilter(e.target.value);
                    setCurrentIndex(0);
                  }}
                  className="appearance-none bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-medium text-zinc-800 py-1.5 pl-3 pr-7 rounded-xl cursor-pointer focus:outline-none max-w-[170px] sm:max-w-[240px] truncate font-sans"
                  title="เลือกโครงสร้างกฎหมาย (บรรพ / ลักษณะ / หมวด / ส่วน)"
                >
                  <option value="all">
                    โครงสร้างทั้งหมด ({formatNumeralText(treeResult.totalCards.toString(), numeralSystem)})
                  </option>
                  {treeResult.flatList.map((node) => (
                    <option key={node.id} value={node.id}>
                      {formatTreeOptionLabel(node, numeralSystem)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Quick Jump Selector */}
          <div className="relative">
            <select
              id="jump-section-select"
              value={currentIndex}
              onChange={(e) => setCurrentIndex(Number(e.target.value))}
              className="appearance-none bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-medium text-zinc-800 py-1.5 pl-3 pr-7 rounded-xl cursor-pointer focus:outline-none max-w-[130px]"
            >
              {deckCards.map((card, idx) => (
                <option key={card.id} value={idx}>
                  {formatNumeralText(card.sectionNumber, numeralSystem)} {card.title ? `— ${formatNumeralText(card.title, numeralSystem)}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Toggle View Mode (Card vs List) */}
          <div className="flex items-center bg-zinc-100 rounded-xl p-0.5 border border-zinc-200">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'card' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="การ์ด"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="สารบัญ"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Numeral System In-Reader Toggle */}
          {onNumeralSystemChange && (
            <div 
              className="flex items-center bg-zinc-100 rounded-xl p-0.5 border border-zinc-200"
              title={`ระบบตัวเลข: ${numeralSystem === 'arabic' ? 'เลขอารบิก (1, 2, 3)' : 'เลขไทย (๑, ๒, ๓)'}`}
            >
              <button
                onClick={() => onNumeralSystemChange('arabic')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  numeralSystem === 'arabic'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                123
              </button>
              <button
                onClick={() => onNumeralSystemChange('thai')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  numeralSystem === 'thai'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                ๑๒๓
              </button>
            </div>
          )}

          {/* Text size selector */}
          <button
            onClick={() => {
              if (fontSize === 'normal') setFontSize('large');
              else if (fontSize === 'large') setFontSize('xlarge');
              else setFontSize('normal');
            }}
            className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="ขนาดตัวอักษร"
          >
            A{fontSize === 'normal' ? '' : fontSize === 'large' ? '+' : '++'}
          </button>
        </div>
      </div>

      {/* ACTIVE HIERARCHY FILTER BANNER */}
      {structureFilter !== 'all' && (
        <div className="flex items-center justify-between bg-zinc-100 border border-zinc-200 px-4 py-2.5 rounded-xl text-xs text-zinc-700">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-zinc-900 shrink-0">กำลังกรองอ่าน:</span>
            <span className="truncate font-medium text-zinc-800">
              {formatNumeralText(treeResult.flatList.find(n => n.id === structureFilter)?.label || structureFilter, numeralSystem)}
            </span>
            <span className="text-[11px] text-zinc-500 shrink-0">
              ({formatNumeralText(deckCards.length.toString(), numeralSystem)} มาตรา)
            </span>
          </div>
          <button
            onClick={() => {
              setStructureFilter('all');
              setCurrentIndex(0);
            }}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:underline shrink-0 ml-2 cursor-pointer"
          >
            ✕ ล้างตัวกรอง (ดูทั้งหมด)
          </button>
        </div>
      )}

      {/* VIEW MODE: LIST OF ALL SECTIONS IN THIS DECK */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-zinc-900">
              ตัวบทมาตราทั้งหมด ({deckCards.length} มาตรา)
            </h3>
            <button
              onClick={() => setViewMode('card')}
              className="text-xs text-zinc-600 hover:text-zinc-900 font-medium underline cursor-pointer"
            >
              สลับไปโหมดอ่านทีละการ์ด
            </button>
          </div>

          <div className="space-y-4">
            {deckCards.map((card, idx) => (
              <div
                key={card.id}
                id={`statute-item-${card.id}`}
                className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all ${
                  idx === currentIndex ? 'border-zinc-900 ring-1 ring-zinc-900 shadow-sm' : 'border-zinc-200 shadow-xs'
                }`}
              >
                {/* Structural Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 mb-2.5">
                  {card.book && (
                    <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                      {formatNumeralText(card.book, numeralSystem)}
                    </span>
                  )}
                  {card.titleStructure && (
                    <>
                      {card.book && <span>›</span>}
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                        {formatNumeralText(card.titleStructure, numeralSystem)}
                      </span>
                    </>
                  )}
                  {card.chapter && (
                    <>
                      {(card.book || card.titleStructure) && <span>›</span>}
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                        {formatNumeralText(card.chapter, numeralSystem)}
                      </span>
                    </>
                  )}
                  {card.part && card.part.length <= 65 && /^ส่วน(?:ที่)?\s*([0-9\u0E50-\u0E59]+(?:\/[0-9\u0E50-\u0E59]+)?|[๑-๙IVXLCDMivxlcdm]+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)(?:\s|$|[:：\/-])/u.test(card.part.trim()) && (
                    <>
                      {(card.book || card.titleStructure || card.chapter) && <span>›</span>}
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                        {formatNumeralText(card.part, numeralSystem)}
                      </span>
                    </>
                  )}
                </div>

                {/* Section Header & Title */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-zinc-900 text-white">
                      {formatNumeralText(card.sectionNumber, numeralSystem)}
                    </span>
                    {card.title && (
                      <h4 className="font-bold text-sm sm:text-base text-zinc-900">
                        {formatNumeralText(card.title, numeralSystem)}
                      </h4>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {onOpenEditCard && (
                      <button
                        onClick={() => onOpenEditCard(card)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขมาตรานี้"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyText(`${card.deckName} ${formatNumeralText(card.sectionNumber, numeralSystem)} ${card.title ? `(${formatNumeralText(card.title, numeralSystem)})` : ''}\n\n${formatNumeralText(card.fullText, numeralSystem)}`)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                      title="คัดลอกตัวบทกฎหมาย"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {onDeleteCard && (
                      <button
                        onClick={() => {
                          if (window.confirm(`ต้องการลบมาตรา ${formatNumeralText(card.sectionNumber, numeralSystem)} ออกจากสำรับใช่หรือไม่?`)) {
                            onDeleteCard(card.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบมาตรานี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Statutory Text with Paragraphs */}
                <div className="mt-4 space-y-3 font-serif">
                  {card.paragraphs && card.paragraphs.length > 0 ? (
                    card.paragraphs.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-3">
                        <span className="font-sans text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                          {formatNumeralText(p.label, numeralSystem)}
                        </span>
                        <p className={`text-zinc-900 leading-relaxed ${
                          fontSize === 'normal' ? 'text-sm sm:text-base' : fontSize === 'large' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
                        }`}>
                          {formatNumeralText(p.text, numeralSystem)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className={`text-zinc-900 whitespace-pre-line leading-relaxed ${
                      fontSize === 'normal' ? 'text-sm sm:text-base' : fontSize === 'large' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
                    }`}>
                      {formatNumeralText(card.fullText, numeralSystem)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VIEW MODE: PURE SECTION CARD READER */
        <div>
          {/* Progress Bar */}
          <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden mb-5">
            <div 
              className="bg-zinc-900 h-full transition-all duration-300 ease-out"
              style={{ width: `${((currentIndex + 1) / deckCards.length) * 100}%` }}
            />
          </div>

          {/* MAIN STATUTORY CARD */}
          <div 
            id={`law-card-${currentCard.id}`}
            className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-8 min-h-[420px] flex flex-col justify-between relative transition-all"
          >
            {/* Top row: Legal Taxonomy Breadcrumbs */}
            <div className="pb-4 border-b border-zinc-100">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {currentCard.deckName}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Edit Card Button */}
                  {onOpenEditCard && (
                    <button
                      id="edit-statute-btn"
                      onClick={() => onOpenEditCard(currentCard)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                      title="แก้ไขมาตรานี้"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete Card Button */}
                  {onDeleteCard && (
                    <button
                      onClick={() => {
                        if (window.confirm(`ต้องการลบมาตรา ${formatNumeralText(currentCard.sectionNumber, numeralSystem)} ออกจากสำรับใช่หรือไม่?`)) {
                          onDeleteCard(currentCard.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="ลบมาตรานี้ออกจากสำรับ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Copy Statute Button */}
                  <button
                    id="copy-statute-btn"
                    onClick={() => handleCopyText(`${currentCard.deckName} ${formatNumeralText(currentCard.sectionNumber, numeralSystem)} ${currentCard.title ? `(${formatNumeralText(currentCard.title, numeralSystem)})` : ''}\n\n${formatNumeralText(currentCard.fullText, numeralSystem)}`)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                    title={copied ? "คัดลอกแล้ว" : "คัดลอกตัวบทกฎหมาย"}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Hierarchy: บรรพ › ลักษณะ › หมวด › ส่วน */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600">
                {currentCard.book && (
                  <span className="bg-zinc-100/90 text-zinc-800 font-semibold px-2 py-0.5 rounded-md border border-zinc-200">
                    {formatNumeralText(currentCard.book, numeralSystem)}
                  </span>
                )}
                {currentCard.titleStructure && (
                  <>
                    {currentCard.book && <span className="text-zinc-400">›</span>}
                    <span className="bg-zinc-100/90 text-zinc-800 font-semibold px-2 py-0.5 rounded-md border border-zinc-200">
                      {formatNumeralText(currentCard.titleStructure, numeralSystem)}
                    </span>
                  </>
                )}
                {currentCard.chapter && (
                  <>
                    {(currentCard.book || currentCard.titleStructure) && <span className="text-zinc-400">›</span>}
                    <span className="bg-zinc-100/90 text-zinc-800 font-semibold px-2 py-0.5 rounded-md border border-zinc-200">
                      {formatNumeralText(currentCard.chapter, numeralSystem)}
                    </span>
                  </>
                )}
                {currentCard.part && currentCard.part.length <= 65 && /^ส่วน(?:ที่)?\s*([0-9\u0E50-\u0E59]+(?:\/[0-9\u0E50-\u0E59]+)?|[๑-๙IVXLCDMivxlcdm]+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)(?:\s|$|[:：\/-])/u.test(currentCard.part.trim()) && (
                  <>
                    {(currentCard.book || currentCard.titleStructure || currentCard.chapter) && <span className="text-zinc-400">›</span>}
                    <span className="bg-zinc-100/90 text-zinc-800 font-semibold px-2 py-0.5 rounded-md border border-zinc-200">
                      {formatNumeralText(currentCard.part, numeralSystem)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* CARD TITLE & SECTION NUMBER */}
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-base sm:text-lg font-extrabold px-3 py-1 rounded-xl bg-zinc-900 text-white tracking-wide">
                  {formatNumeralText(currentCard.sectionNumber, numeralSystem)}
                </span>
                {currentCard.title && (
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                    {formatNumeralText(currentCard.title, numeralSystem)}
                  </h3>
                )}
              </div>
            </div>

            {/* VERBATIM STATUTE TEXT WITH PARAGRAPH / CLAUSE DISPLAY */}
            <div className="py-4 flex-1">
              <div className="bg-[#FAF9F6] rounded-2xl p-5 sm:p-7 border border-zinc-200/90 space-y-4">
                {currentCard.paragraphs && currentCard.paragraphs.length > 0 ? (
                  currentCard.paragraphs.map((p, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-3">
                      <span className="font-sans text-[11px] font-bold text-zinc-700 bg-zinc-200/80 px-2 py-0.5 rounded-md shrink-0 mt-0.5 select-none">
                        {formatNumeralText(p.label, numeralSystem)}
                      </span>
                      <p className={`font-serif text-zinc-900 leading-relaxed ${
                        fontSize === 'normal' 
                          ? 'text-sm sm:text-base' 
                          : fontSize === 'large' 
                          ? 'text-base sm:text-lg' 
                          : 'text-lg sm:text-xl'
                      }`}>
                        {formatNumeralText(p.text, numeralSystem)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className={`font-serif text-zinc-900 whitespace-pre-line leading-relaxed ${
                    fontSize === 'normal' 
                      ? 'text-sm sm:text-base' 
                      : fontSize === 'large' 
                      ? 'text-base sm:text-lg' 
                      : 'text-lg sm:text-xl'
                  }`}>
                    {formatNumeralText(currentCard.fullText, numeralSystem)}
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM CARD CONTROLS: PREV, SECTION COUNTER, NEXT */}
            <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
              <button
                id="prev-card-btn"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentIndex === 0
                    ? 'opacity-40 text-zinc-400 cursor-not-allowed bg-zinc-100'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ก่อนหน้า</span>
              </button>

              <div className="text-xs font-semibold text-zinc-500">
                {currentIndex + 1} / {deckCards.length}
              </div>

              <button
                id="next-card-btn"
                onClick={handleNext}
                disabled={currentIndex === deckCards.length - 1}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentIndex === deckCards.length - 1
                    ? 'opacity-40 text-zinc-400 cursor-not-allowed bg-zinc-100'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs'
                }`}
              >
                <span>ถัดไป</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* STRUCTURE TABLE OF CONTENTS MODAL (TREE VIEW) */}
      <StructureTocModal
        isOpen={isTocModalOpen}
        onClose={() => setIsTocModalOpen(false)}
        treeResult={treeResult}
        currentFilter={structureFilter}
        onSelectFilter={(nodeId) => {
          setStructureFilter(nodeId);
          setCurrentIndex(0);
        }}
        deckTitle={deckTitle}
        numeralSystem={numeralSystem}
      />
    </div>
  );
};
