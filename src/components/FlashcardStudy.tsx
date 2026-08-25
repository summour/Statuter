import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  VolumeX, 
  Star, 
  RotateCw, 
  Check, 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  ArrowLeft, 
  Eye, 
  Layers,
  ChevronRight,
  Trophy,
  RefreshCcw,
  Tag,
  AlertCircle
} from 'lucide-react';
import { CardGrade, LawCard, StudyMode } from '../types';
import { getEstimatedIntervals } from '../utils/srs';
import { speakText, stopSpeaking, isSpeaking } from '../utils/speech';

interface FlashcardStudyProps {
  cards: LawCard[];
  onGradeCard: (card: LawCard, grade: CardGrade) => void;
  onToggleStar: (cardId: string) => void;
  onFinishStudy: () => void;
  onBackToDashboard: () => void;
  speechRate?: number;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({
  cards,
  onGradeCard,
  onToggleStar,
  onFinishStudy,
  onBackToDashboard,
  speechRate = 0.95,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'statute' | 'elements' | 'rulings'>('statute');
  const [reviewedInSession, setReviewedInSession] = useState<{ card: LawCard; grade: CardGrade }[]>([]);

  const currentCard = cards[currentIndex];
  const isFinished = !currentCard || currentIndex >= cards.length;

  // Trigger confetti when completed
  useEffect(() => {
    if (isFinished && reviewedInSession.length > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#000000', '#4B5563', '#9CA3AF', '#E5E7EB'],
        });
      } catch (e) {
        // ignore
      }
    }
  }, [isFinished, reviewedInSession.length]);

  // Reset state on card change
  useEffect(() => {
    setIsFlipped(false);
    setActiveTab('statute');
    stopSpeaking();
    setIsPlayingAudio(false);
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleSpeech = (text: string) => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakText(text, speechRate, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  const handleGrade = useCallback((grade: CardGrade) => {
    if (!currentCard) return;
    stopSpeaking();
    setIsPlayingAudio(false);

    setReviewedInSession(prev => [...prev, { card: currentCard, grade }]);
    onGradeCard(currentCard, grade);

    // Advance to next card
    setCurrentIndex(prev => prev + 1);
  }, [currentCard, onGradeCard]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleGrade('again');
        if (e.key === '2') handleGrade('hard');
        if (e.key === '3') handleGrade('good');
        if (e.key === '4') handleGrade('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleFlip, handleGrade]);

  // If no cards or finished
  if (isFinished) {
    if (cards.length === 0 && reviewedInSession.length === 0) {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto border border-zinc-200">
            <BookOpen className="w-8 h-8 stroke-[1.75]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-zinc-950">ยังไม่มีตัวบทสำหรับการทบทวน</h2>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              ฐานข้อมูลปัจจุบันว่างเปล่า เพิ่มมาตรากฎหมายใหม่เข้าสู่ระบบเพื่อเริ่มการทบทวนบัตรคำ
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onBackToDashboard}
              className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-all cursor-pointer"
            >
              กลับหน้าหลักเพื่อเพิ่มมาตรา
            </button>
          </div>
        </div>
      );
    }

    const againCount = reviewedInSession.filter(r => r.grade === 'again').length;
    const hardCount = reviewedInSession.filter(r => r.grade === 'hard').length;
    const goodCount = reviewedInSession.filter(r => r.grade === 'good').length;
    const easyCount = reviewedInSession.filter(r => r.grade === 'easy').length;

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-black text-white flex items-center justify-center mx-auto shadow-md">
          <Trophy className="w-8 h-8 stroke-[2]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-zinc-950">ยอดเยี่ยม! ทบทวนครบแล้ว</h2>
          <p className="text-sm text-zinc-700">
            คุณได้ทบทวนตัวบทกฎหมายไปทั้งหมด {reviewedInSession.length} มาตราในเซสชันนี้
          </p>
        </div>

        {/* Session Stats Grid */}
        <div className="grid grid-cols-4 gap-2.5 p-4 rounded-3xl bg-white border border-zinc-200 shadow-xs">
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="text-[11px] font-bold text-zinc-700">ซ้ำ (Again)</div>
            <div className="text-xl font-extrabold text-zinc-950 mt-1">{againCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="text-[11px] font-bold text-zinc-700">ยาก (Hard)</div>
            <div className="text-xl font-extrabold text-zinc-950 mt-1">{hardCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="text-[11px] font-bold text-zinc-700">พอได้ (Good)</div>
            <div className="text-xl font-extrabold text-zinc-950 mt-1">{goodCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <div className="text-[11px] font-bold text-zinc-700">ง่าย (Easy)</div>
            <div className="text-xl font-extrabold text-zinc-950 mt-1">{easyCount}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setReviewedInSession([]);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>ทบทวนซ้ำอีกรอบ</span>
          </button>
          <button
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-black text-white font-semibold text-sm hover:bg-zinc-800 shadow-sm cursor-pointer transition-all"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const estimatedIntervals = getEstimatedIntervals(currentCard.srs);
  const progressPercent = Math.round((currentIndex / cards.length) * 100);

  // Helper to highlight cloze words in back text
  const renderHighlightedStatute = (text: string, keywords: string[]) => {
    if (!keywords || keywords.length === 0) {
      return <p className="text-base leading-relaxed text-zinc-900 whitespace-pre-line">{text}</p>;
    }

    // Replace keywords with bold underline
    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(regex);

    return (
      <div className="text-base leading-relaxed text-zinc-900 whitespace-pre-line">
        {parts.map((part, i) => {
          const isKeyword = keywords.includes(part);
          if (isKeyword) {
            return (
              <span
                key={i}
                className="font-bold underline decoration-zinc-950 decoration-2 underline-offset-4 bg-zinc-100 px-1 py-0.5 rounded-sm"
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div id="flashcard-study-view" className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Top Controls & Progress */}
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-700">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 font-semibold text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200/80 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ออกจากการทบทวน</span>
        </button>

        <div className="flex items-center gap-2 font-semibold">
          <span>มาตราที่ {currentIndex + 1} จาก {cards.length}</span>
          <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Flashcard with iOS 26 Aesthetic */}
      <div className="relative min-h-[420px] sm:min-h-[460px] rounded-3xl bg-white border border-zinc-200/90 shadow-sm p-6 sm:p-8 flex flex-col justify-between transition-all">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-black text-white text-xs font-bold tracking-tight">
              {currentCard.codeShortName}
            </span>
            <span className="text-sm font-extrabold text-zinc-950">
              {currentCard.sectionNumber}
            </span>
            <span className="text-xs text-zinc-700 font-medium">
              ({currentCard.codeName})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleSpeech(isFlipped ? currentCard.fullText : `${currentCard.sectionNumber} ${currentCard.title}`)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
              title="ฟังเสียงอ่านตัวบท"
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleStar(currentCard.id)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
              title="ติดดาว"
            >
              <Star className={`w-4 h-4 ${currentCard.isStarred ? 'fill-zinc-950 text-zinc-950' : ''}`} />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="my-auto py-6">
          {!isFlipped ? (
            /* FRONT OF CARD */
            <div className="space-y-4 text-center py-6 animate-fadeIn">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>คำถาม / หัวข้อหลัก</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 leading-snug">
                {currentCard.title}
              </h2>
              <p className="text-sm text-zinc-700 max-w-md mx-auto leading-relaxed">
                จงท่องตัวบทของ <strong className="text-zinc-950">{currentCard.sectionNumber}</strong> ให้ครบถ้วน แล้วแตะเปิดดูเฉลย
              </p>

              {currentCard.mnemonic && (
                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 max-w-md mx-auto text-left">
                  <div className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>คำใบ้ / สูตรจำย่อ:</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-900 mt-0.5">
                    {currentCard.mnemonic}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* BACK OF CARD (Full Legal Analysis & Elements) */
            <div className="space-y-4 animate-fadeIn">
              {/* Back Tab Switcher */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('statute')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'statute'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-700 hover:text-zinc-950'
                    }`}
                  >
                    ตัวบทเต็ม
                  </button>
                  <button
                    onClick={() => setActiveTab('elements')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'elements'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-700 hover:text-zinc-950'
                    }`}
                  >
                    แยกองค์ประกอบ ({currentCard.elements.length})
                  </button>
                  {currentCard.keyRulings && currentCard.keyRulings.length > 0 && (
                    <button
                      onClick={() => setActiveTab('rulings')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'rulings'
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'text-zinc-700 hover:text-zinc-950'
                      }`}
                    >
                      ฎีกา / ข้อสังเกต
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-zinc-700 hidden sm:block">
                  <span className="font-bold underline">คำขีดเส้นใต้</span> คือคีย์เวิร์ดสำคัญ
                </div>
              </div>

              {/* Tab 1: Full Statute */}
              {activeTab === 'statute' && (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  {renderHighlightedStatute(currentCard.fullText, currentCard.clozeKeywords)}

                  {currentCard.simplifiedSummary && (
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs text-zinc-800 space-y-1">
                      <div className="font-bold text-zinc-950">สรุปหัวใจสำคัญ:</div>
                      <div>{currentCard.simplifiedSummary}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Elements Breakdown */}
              {activeTab === 'elements' && (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {currentCard.elements.map((el, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-900 font-medium flex items-start gap-2"
                    >
                      <span className="w-5 h-5 rounded-md bg-zinc-200 text-zinc-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{el}</span>
                    </div>
                  ))}
                  {currentCard.exceptions && currentCard.exceptions.length > 0 && (
                    <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-900 mt-2">
                      <div className="font-bold mb-1 flex items-center gap-1 text-zinc-950">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>ข้อยกเว้น / ข้อควรระวัง:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
                        {currentCard.exceptions.map((ex, idx) => (
                          <li key={idx}>{ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Rulings / Precedents */}
              {activeTab === 'rulings' && (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {currentCard.keyRulings?.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 leading-relaxed"
                    >
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Footer / Flip Trigger or Anki Rating Controls */}
        <div className="pt-4 border-t border-zinc-100">
          {!isFlipped ? (
            <button
              id="btn-flip-card"
              onClick={handleFlip}
              className="w-full py-3.5 rounded-2xl bg-black text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
            >
              <Eye className="w-4 h-4" />
              <span>เปิดดูตัวบทเฉลย (Space / Enter)</span>
            </button>
          ) : (
            /* The 4 Standard Anki SRS Grade Buttons */
            <div className="space-y-2 animate-fadeIn">
              <div className="text-center text-[11px] font-semibold text-zinc-700">
                ประเมินระดับความแม่นยำของคุณ (Anki SM-2 Rating)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1: AGAIN */}
                <button
                  id="btn-anki-again"
                  onClick={() => handleGrade('again')}
                  className="p-2.5 rounded-2xl bg-zinc-900 text-white font-semibold flex flex-col items-center justify-center hover:bg-black active:scale-[0.98] transition-all cursor-pointer border border-zinc-800"
                >
                  <div className="text-xs font-bold">1. ซ้ำ (Again)</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{estimatedIntervals.again}</div>
                </button>

                {/* 2: HARD */}
                <button
                  id="btn-anki-hard"
                  onClick={() => handleGrade('hard')}
                  className="p-2.5 rounded-2xl bg-zinc-100 text-zinc-900 font-semibold flex flex-col items-center justify-center hover:bg-zinc-200 active:scale-[0.98] transition-all cursor-pointer border border-zinc-200"
                >
                  <div className="text-xs font-bold">2. ยาก (Hard)</div>
                  <div className="text-[10px] text-zinc-700 mt-0.5">{estimatedIntervals.hard}</div>
                </button>

                {/* 3: GOOD */}
                <button
                  id="btn-anki-good"
                  onClick={() => handleGrade('good')}
                  className="p-2.5 rounded-2xl bg-white text-zinc-950 font-bold flex flex-col items-center justify-center hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer border-2 border-zinc-900 shadow-xs"
                >
                  <div className="text-xs">3. จำได้ (Good)</div>
                  <div className="text-[10px] text-zinc-700 mt-0.5">{estimatedIntervals.good}</div>
                </button>

                {/* 4: EASY */}
                <button
                  id="btn-anki-easy"
                  onClick={() => handleGrade('easy')}
                  className="p-2.5 rounded-2xl bg-black text-white font-bold flex flex-col items-center justify-center hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                >
                  <div className="text-xs">4. ง่าย (Easy)</div>
                  <div className="text-[10px] text-zinc-300 mt-0.5">{estimatedIntervals.easy}</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcut Help Pill */}
      <div className="text-center text-[11px] text-zinc-700">
        💡 แป้นพิมพ์ลัด: กด <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded-md font-mono text-[10px]">Space</kbd> เพื่อพลิกการ์ด และกดตัวเลข <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded-md font-mono text-[10px]">1</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded-md font-mono text-[10px]">2</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded-md font-mono text-[10px]">3</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded-md font-mono text-[10px]">4</kbd> เพื่อให้คะแนน
      </div>
    </div>
  );
};
