import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Star,
  CheckCircle2
} from 'lucide-react';
import { LawCard } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

interface ClozeStudyProps {
  cards: LawCard[];
  onBackToDashboard: () => void;
  onToggleStar: (cardId: string) => void;
}

export const ClozeStudy: React.FC<ClozeStudyProps> = ({
  cards,
  onBackToDashboard,
  onToggleStar,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedKeywords, setRevealedKeywords] = useState<Set<string>>(new Set());
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    setRevealedKeywords(new Set());
    stopSpeaking();
    setIsPlayingAudio(false);
  }, [currentIndex]);

  if (!currentCard) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <p className="text-sm font-semibold">ไม่มีตัวบทในหมวดนี้</p>
        <button onClick={onBackToDashboard} className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-xs">
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  const toggleKeyword = (kw: string) => {
    setRevealedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(kw)) {
        next.delete(kw);
      } else {
        next.add(kw);
      }
      return next;
    });
  };

  const revealAll = () => {
    setRevealedKeywords(new Set(currentCard.clozeKeywords));
  };

  const hideAll = () => {
    setRevealedKeywords(new Set());
  };

  const allRevealed = currentCard.clozeKeywords.length > 0 && 
    currentCard.clozeKeywords.every(k => revealedKeywords.has(k));

  // Render text with interactive blanks
  const renderClozeText = () => {
    const keywords = currentCard.clozeKeywords || [];
    if (keywords.length === 0) {
      return <p className="text-base leading-relaxed whitespace-pre-line">{currentCard.fullText}</p>;
    }

    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = currentCard.fullText.split(regex);

    return (
      <div className="text-base leading-relaxed text-zinc-900 whitespace-pre-line space-y-2">
        {parts.map((part, index) => {
          const isKey = keywords.includes(part);
          if (!isKey) {
            return <span key={index}>{part}</span>;
          }

          const isRevealed = revealedKeywords.has(part);
          return (
            <button
              key={index}
              onClick={() => toggleKeyword(part)}
              className={`inline-flex items-center justify-center font-bold px-2 py-0.5 mx-0.5 my-0.5 rounded-lg text-sm transition-all cursor-pointer ${
                isRevealed
                  ? 'bg-zinc-900 text-white border border-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-300 hover:border-zinc-500 hover:bg-zinc-200'
              }`}
              title={isRevealed ? 'แตะเพื่อซ่อน' : 'แตะเพื่อเฉลยคำ'}
            >
              {isRevealed ? part : ' [ ? ] '}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div id="cloze-study-view" className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4 animate-fadeIn">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-700">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 font-semibold text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200/80 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ออกจากการเติมคำ</span>
        </button>

        <div className="flex items-center gap-2 font-semibold">
          <span>มาตราที่ {currentIndex + 1} จาก {cards.length}</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl bg-white border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Card Title & Code Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-black text-white text-xs font-bold">
                {currentCard.codeShortName}
              </span>
              <h2 className="text-base font-extrabold text-zinc-950">
                {currentCard.sectionNumber} — {currentCard.title}
              </h2>
            </div>
            <p className="text-xs text-zinc-700 mt-1">
              แตะที่กล่อง <strong className="text-zinc-900">[ ? ]</strong> เพื่อเปิดดูคำสำคัญ หรือแตะเฉลยทั้งหมด
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleStar(currentCard.id)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
              title="ติดดาว"
            >
              <Star className={`w-4 h-4 ${currentCard.isStarred ? 'fill-zinc-950 text-zinc-950' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cloze Text Body */}
        <div className="p-4 sm:p-6 rounded-2xl bg-zinc-50 border border-zinc-200/70 min-h-[200px]">
          {renderClozeText()}
        </div>

        {/* Cloze Progress & Fast Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
            <span>คำที่เปิดเผยแล้ว:</span>
            <span className="font-bold text-zinc-950">
              {revealedKeywords.size} / {currentCard.clozeKeywords.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!allRevealed ? (
              <button
                onClick={revealAll}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-bold text-zinc-950 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>เฉลยคำทั้งหมด</span>
              </button>
            ) : (
              <button
                onClick={hideAll}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-bold text-zinc-950 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>ซ่อนคำทั้งหมด</span>
              </button>
            )}
          </div>
        </div>

        {/* Next / Prev Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-zinc-900 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>มาตราก่อนหน้า</span>
          </button>

          <button
            onClick={() => setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1))}
            disabled={currentIndex === cards.length - 1}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <span>มาตราถัดไป</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
