import React, { useState } from 'react';
import { 
  Search, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Star, 
  BookOpen, 
  Layers, 
  Filter, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import { LawCard, LawCodeCategory, StudyMode } from '../types';
import { LAW_CATEGORIES_INFO } from '../data/defaultDecks';
import { speakText, stopSpeaking, isSpeaking } from '../utils/speech';

interface StatuteBrowserProps {
  cards: LawCard[];
  onToggleStar: (cardId: string) => void;
  onOpenCardDetail: (card: LawCard) => void;
  onOpenAddModal: () => void;
  onStudySpecificCard: (card: LawCard) => void;
}

export const StatuteBrowser: React.FC<StatuteBrowserProps> = ({
  cards,
  onToggleStar,
  onOpenCardDetail,
  onOpenAddModal,
  onStudySpecificCard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LawCodeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

  const categories: (LawCodeCategory | 'all')[] = ['all', 'criminal', 'civil', 'crim_proc', 'civ_proc', 'constitution', 'custom'];

  const filteredCards = cards.filter(c => {
    const matchesCat = selectedCategory === 'all' || c.codeCategory === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      c.sectionNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.fullText.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const handleCopy = (card: LawCard) => {
    const textToCopy = `${card.codeName} ${card.sectionNumber}\n${card.title}\n\n${card.fullText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCardId(card.id);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  const handleSpeech = (card: LawCard) => {
    if (playingCardId === card.id) {
      stopSpeaking();
      setPlayingCardId(null);
    } else {
      setPlayingCardId(card.id);
      speakText(`${card.sectionNumber} ${card.title}. ${card.fullText}`, 0.95, () => {
        setPlayingCardId(null);
      });
    }
  };

  return (
    <div id="statute-browser-view" className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            คลังตัวบทกฎหมาย
          </h1>
          <p className="text-xs sm:text-sm text-zinc-700 mt-1">
            ค้นหาตัวบท คัดลอกข้อความ ฟังเสียงอ่าน และเลือกทบทวนรายมาตรา
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-2xl bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มมาตราใหม่</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตามเลขมาตรา เช่น 59, 288, 149 หรือคำค้น เช่น ฆ่า, เจตนา, ละเมิด, ฟ้องซ้ำ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-zinc-200 text-sm focus:outline-hidden focus:border-zinc-500 transition-all text-zinc-900 placeholder:text-zinc-600 shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => {
            const count = cat === 'all' ? cards.length : cards.filter(c => c.codeCategory === cat).length;
            if (cat !== 'all' && count === 0 && cat === 'custom') return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <span>{LAW_CATEGORIES_INFO[cat]?.shortName || cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === cat ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-zinc-700 px-1">
          ผลลัพธ์ทั้งหมด {filteredCards.length} มาตรา
        </div>

        {filteredCards.length === 0 ? (
          <div className="py-14 px-6 text-center rounded-3xl bg-white border border-zinc-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-900">
              <BookOpen className="w-6 h-6" />
            </div>
            {cards.length === 0 ? (
              <>
                <p className="text-base font-bold text-zinc-950">ยังไม่มีตัวบทในระบบ</p>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                  คุณได้ลบฐานข้อมูลเรียบร้อยแล้ว แตะปุ่มด้านล่างเพื่อเพิ่มมาตรากฎหมายใหม่ของคุณ
                </p>
                <div className="pt-2">
                  <button
                    onClick={onOpenAddModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ เพิ่มมาตราใหม่</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-zinc-900">ไม่พบตัวบทที่ตรงกับคำค้นหา</p>
                <p className="text-xs text-zinc-600">ลองเปลี่ยนหมวดหมู่หรือคำค้นหา</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredCards.map(card => {
            const isPlaying = playingCardId === card.id;
            const isCopied = copiedCardId === card.id;

            return (
              <div
                key={card.id}
                className="p-5 rounded-3xl bg-white border border-zinc-200/90 hover:border-zinc-400 hover:shadow-xs transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 font-bold text-xs text-zinc-900">
                        {card.codeShortName}
                      </span>
                      <h3 className="font-extrabold text-base text-zinc-950">
                        {card.sectionNumber}
                      </h3>
                      <span className="text-xs text-zinc-700 hidden sm:inline">
                        — {card.codeName}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-900">
                      {card.title}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSpeech(card)}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                      title="ฟังเสียงอ่าน"
                    >
                      {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleCopy(card)}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                      title="คัดลอกตัวบท"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onToggleStar(card.id)}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
                      title="ติดดาว"
                    >
                      <Star className={`w-4 h-4 ${card.isStarred ? 'fill-zinc-950 text-zinc-950' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Law Text */}
                <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed whitespace-pre-line font-normal bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/70">
                  {card.fullText}
                </p>

                {/* Footer Badges & Quick Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-zinc-700">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {card.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenCardDetail(card)}
                      className="px-3 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 font-semibold text-zinc-900 transition-colors cursor-pointer"
                    >
                      ดูองค์ประกอบ/ฎีกา
                    </button>
                    <button
                      onClick={() => onStudySpecificCard(card)}
                      className="px-3 py-1 rounded-xl bg-black text-white font-semibold flex items-center gap-1 hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <span>ท่องจำมาตรานี้</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};
