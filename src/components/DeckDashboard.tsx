import React, { useState } from 'react';
import { 
  BookOpen, 
  Play, 
  Sparkles, 
  Search, 
  Scale, 
  ShieldAlert, 
  Gavel, 
  FileText, 
  Landmark, 
  Star, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowRight,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Brain
} from 'lucide-react';
import { LawCard, LawCodeCategory, StudyMode } from '../types';
import { LAW_CATEGORIES_INFO } from '../data/defaultDecks';
import { isCardDue } from '../utils/srs';

interface DeckDashboardProps {
  cards: LawCard[];
  onStartStudy: (category: LawCodeCategory | 'all', mode: StudyMode) => void;
  onSelectCategory: (category: LawCodeCategory | 'all') => void;
  onOpenAddModal: () => void;
  onToggleStar: (cardId: string) => void;
  onOpenCardDetail: (card: LawCard) => void;
}

export const DeckDashboard: React.FC<DeckDashboardProps> = ({
  cards,
  onStartStudy,
  onOpenAddModal,
  onToggleStar,
  onOpenCardDetail,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LawCodeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate metrics
  const totalCards = cards.length;
  const dueCards = cards.filter(c => isCardDue(c.srs));
  const masteredCards = cards.filter(c => c.srs.status === 'mastered');
  const learningCards = cards.filter(c => c.srs.status === 'learning' || c.srs.status === 'review');
  const starredCards = cards.filter(c => c.isStarred);

  // Filter cards for list
  const filteredCards = cards.filter(c => {
    const matchesCategory = selectedCategory === 'all' || c.codeCategory === selectedCategory;
    const matchesSearch = 
      c.sectionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fullText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'criminal': return <ShieldAlert className="w-5 h-5 text-black" />;
      case 'civil': return <Scale className="w-5 h-5 text-black" />;
      case 'crim_proc': return <Gavel className="w-5 h-5 text-black" />;
      case 'civ_proc': return <FileText className="w-5 h-5 text-black" />;
      case 'constitution': return <Landmark className="w-5 h-5 text-black" />;
      default: return <Layers className="w-5 h-5 text-black" />;
    }
  };

  const categories: (LawCodeCategory | 'all')[] = ['all', 'criminal', 'civil', 'crim_proc', 'civ_proc', 'constitution'];

  return (
    <div id="deck-dashboard" className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Hero Widget: iOS 26 Frosted Master Dashboard */}
      <section id="study-hero-widget" className="relative overflow-hidden rounded-3xl bg-white border border-zinc-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-950 text-xs font-semibold">
              <Brain className="w-3.5 h-3.5" />
              <span>ระบบทบทวนตามช่วงเวลา Spaced Repetition (SRS)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
              ท่องจำตัวบทกฎหมาย
            </h1>
            <p className="text-sm text-zinc-700 max-w-lg leading-relaxed">
              ฝึกฝนทบทวนตามอัลกอริทึม Anki SM-2 เพื่อการจดจำตัวบทได้อย่างแม่นยำและยาวนาน สำหรับเตรียมสอบเนติบัณฑิต, ผู้พิพากษา, อัยการ และปริญญาตรี
            </p>
          </div>

          {/* Big Quick Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {totalCards > 0 ? (
              <>
                <button
                  id="btn-start-all-flashcards"
                  onClick={() => onStartStudy('all', 'flashcard')}
                  className="px-6 py-3.5 rounded-2xl bg-black text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>เริ่มทบทวนวันนี้ ({dueCards.length} มาตรา)</span>
                </button>
                <button
                  id="btn-start-cloze-mode"
                  onClick={() => onStartStudy('all', 'cloze')}
                  className="px-5 py-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-zinc-700" />
                  <span>โหมดเติมคำ</span>
                </button>
              </>
            ) : (
              <button
                id="btn-add-first-card"
                onClick={onOpenAddModal}
                className="px-6 py-3.5 rounded-2xl bg-black text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ เพิ่มมาตราแรกของคุณ</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 iOS Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-100">
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="text-xs font-semibold text-zinc-700">ถึงกำหนดวันนี้</div>
            <div className="text-2xl font-black text-zinc-950 mt-1">{dueCards.length}</div>
            <div className="text-[11px] text-zinc-700 mt-0.5">ต้องทบทวน</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="text-xs font-semibold text-zinc-700">กำลังเรียนรู้</div>
            <div className="text-2xl font-black text-zinc-950 mt-1">{learningCards.length}</div>
            <div className="text-[11px] text-zinc-700 mt-0.5">ช่วงปรับความจำ</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="text-xs font-semibold text-zinc-700">จำได้แม่นยำ</div>
            <div className="text-2xl font-black text-zinc-950 mt-1">{masteredCards.length}</div>
            <div className="text-[11px] text-zinc-700 mt-0.5">ความจำระยะยาว</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="text-xs font-semibold text-zinc-700">ตัวบททั้งหมด</div>
            <div className="text-2xl font-black text-zinc-950 mt-1">{totalCards}</div>
            <div className="text-[11px] text-zinc-700 mt-0.5">ในคลังของคุณ</div>
          </div>
        </div>
      </section>

      {/* Study Modes Selector Grid */}
      <section id="study-modes-section" className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 px-1">
          เลือกรูปแบบการฝึกฝน (Study Modes)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div 
            onClick={() => onStartStudy(selectedCategory, 'flashcard')}
            className="group p-4 rounded-2xl bg-white border border-zinc-200/90 hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-950 mb-3 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-bold text-sm text-zinc-950 flex items-center justify-between">
              <span>บัตรคำ Anki SRS</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-700 mt-1">
              เปิดหน้าการ์ด ท่องในใจ แล้วประเมินระดับความจำ 4 ระดับ (Again, Hard, Good, Easy)
            </p>
          </div>

          <div 
            onClick={() => onStartStudy(selectedCategory, 'cloze')}
            className="group p-4 rounded-2xl bg-white border border-zinc-200/90 hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-950 mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-bold text-sm text-zinc-950 flex items-center justify-between">
              <span>โหมดเติมคำสำคัญ</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-700 mt-1">
              ปิดคำสำคัญในตัวบทกฎหมาย แตะเพื่อเฉลยทีละคำหรือทดสอบจำคำสำคัญ
            </p>
          </div>

          <div 
            onClick={() => onStartStudy(selectedCategory, 'elements')}
            className="group p-4 rounded-2xl bg-white border border-zinc-200/90 hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-950 mb-3 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-bold text-sm text-zinc-950 flex items-center justify-between">
              <span>ถอดองค์ประกอบตัวบท</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-700 mt-1">
              จำแนกองค์ประกอบความผิด องค์ประกอบภายใน เจตนาพิเศษ และเงื่อนไขรับโทษ
            </p>
          </div>

          <div 
            onClick={() => onStartStudy(selectedCategory, 'recite_test')}
            className="group p-4 rounded-2xl bg-white border border-zinc-200/90 hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-950 mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-bold text-sm text-zinc-950 flex items-center justify-between">
              <span>พิมพ์ทดสอบตัวบทเต็ม</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-700 mt-1">
              พิมพ์ตัวบทตามความทรงจำ ระบบจะเปรียบเทียบความถูกต้องคำต่อคำ
            </p>
          </div>
        </div>
      </section>

      {/* Decks by Category */}
      <section id="category-decks-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 px-1">
            หมวดประมวลกฎหมาย (Legal Codes)
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-200 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>เพิ่มมาตราใหม่</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => {
            const count = cat === 'all' ? cards.length : cards.filter(c => c.codeCategory === cat).length;
            const dueInCat = (cat === 'all' ? cards : cards.filter(c => c.codeCategory === cat)).filter(c => isCardDue(c.srs)).length;
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
                {dueInCat > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Cards Grid / List */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหามาตรา, ชื่อหัวข้อ, คีย์เวิร์ด, แท็ก เช่น มาตรา 59, ลักทรัพย์..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-zinc-200 text-sm focus:outline-hidden focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-zinc-900 placeholder:text-zinc-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 hover:text-zinc-900"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Cards List View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCards.length === 0 ? (
              <div className="col-span-full py-12 px-6 text-center rounded-3xl bg-white border border-zinc-200">
                {cards.length === 0 ? (
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-900">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-base font-bold text-zinc-950">ลบฐานข้อมูลเรียบร้อยแล้ว (คลังตัวบทว่าง)</p>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      ระบบพร้อมให้คุณเพิ่มมาตรากฎหมายใหม่ตามที่ต้องการแล้ว แตะปุ่มด้านล่างเพื่อเริ่มสร้างตัวบทแรก
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={onOpenAddModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>+ เพิ่มมาตราใหม่เข้าระบบ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-zinc-900">ไม่พบตัวบทที่ตรงกับเงื่อนไขการค้นหา</p>
                    <p className="text-xs text-zinc-600 mt-1">ลองเปลี่ยนหมวดหมู่ คำค้นหา หรือเพิ่มมาตราใหม่</p>
                  </>
                )}
              </div>
            ) : (
              filteredCards.map(card => {
                const isDue = isCardDue(card.srs);
                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl bg-white border border-zinc-200/90 hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-900 font-bold text-xs">
                            {card.codeShortName}
                          </span>
                          <span className="font-extrabold text-sm text-zinc-950">
                            {card.sectionNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isDue && (
                            <span className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-bold">
                              ถึงกำหนด
                            </span>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onToggleStar(card.id);
                            }}
                            className="p-1 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                            title="ติดดาว"
                          >
                            <Star className={`w-4 h-4 ${card.isStarred ? 'fill-zinc-950 text-zinc-950' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-semibold text-sm text-zinc-900 mt-2 leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-xs text-zinc-700 mt-1 line-clamp-2 leading-relaxed">
                        {card.simplifiedSummary || card.fullText}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-700">
                      <div className="flex items-center gap-2">
                        <span>ทบทวน: {card.srs.totalReviews} ครั้ง</span>
                        <span>•</span>
                        <span>ช่วงห่าง: {card.srs.interval} วัน</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenCardDetail(card)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 font-semibold text-zinc-900 transition-colors cursor-pointer"
                        >
                          ดูรายละเอียด
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
