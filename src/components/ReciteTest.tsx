import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  ChevronRight, 
  ChevronLeft, 
  Award,
  Sparkles,
  Layers
} from 'lucide-react';
import { LawCard } from '../types';

interface ReciteTestProps {
  cards: LawCard[];
  onBackToDashboard: () => void;
}

export const ReciteTest: React.FC<ReciteTestProps> = ({
  cards,
  onBackToDashboard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setTypedText('');
    setIsChecked(false);
    setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setTypedText('');
    setIsChecked(false);
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setTypedText('');
    setIsChecked(false);
  };

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

  // Calculate similarity and keyword matching
  const checkResults = () => {
    const cleanActual = currentCard.fullText.replace(/\s+/g, ' ').trim();
    const cleanTyped = typedText.replace(/\s+/g, ' ').trim();

    // Check keywords present
    const matchedKeywords = currentCard.clozeKeywords.filter(kw => 
      cleanTyped.includes(kw)
    );
    const keywordScore = currentCard.clozeKeywords.length > 0 
      ? Math.round((matchedKeywords.length / currentCard.clozeKeywords.length) * 100)
      : 100;

    // Simple rough character/word overlap ratio
    let matchCount = 0;
    const actualWords = cleanActual.split(' ');
    actualWords.forEach(w => {
      if (cleanTyped.includes(w)) matchCount++;
    });
    const overallScore = Math.min(100, Math.round((keywordScore * 0.7) + ((matchCount / Math.max(1, actualWords.length)) * 100 * 0.3)));

    return {
      overallScore,
      keywordScore,
      matchedKeywords,
      missedKeywords: currentCard.clozeKeywords.filter(kw => !cleanTyped.includes(kw)),
    };
  };

  const results = isChecked ? checkResults() : null;

  return (
    <div id="recite-test-view" className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4 animate-fadeIn">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-700">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 font-semibold text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200/80 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ออกจากการพิมพ์ทดสอบ</span>
        </button>

        <div className="flex items-center gap-2 font-semibold">
          <span>มาตราที่ {currentIndex + 1} จาก {cards.length}</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl bg-white border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Title Header */}
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
              พิมพ์ข้อความตัวบทเต็มจากความจำของคุณ แล้วกด "ตรวจสอบความแม่นยำ"
            </p>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-950 flex items-center justify-between">
            <span>พิมพ์ตัวบท:</span>
            <span className="text-[11px] font-normal text-zinc-700">
              {typedText.length} ตัวอักษร
            </span>
          </label>
          <textarea
            value={typedText}
            onChange={e => setTypedText(e.target.value)}
            disabled={isChecked}
            placeholder="เช่น ผู้ใดกระทำความผิด... หรือ บุคคลจะต้องรับผิดในทางอาญาก็ต่อเมื่อ..."
            rows={5}
            className="w-full p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-sm leading-relaxed focus:outline-hidden focus:border-zinc-500 focus:bg-white transition-all text-zinc-900 placeholder:text-zinc-600 disabled:opacity-80"
          />
        </div>

        {/* Action Button */}
        {!isChecked ? (
          <button
            onClick={() => setIsChecked(true)}
            disabled={!typedText.trim()}
            className="w-full py-3.5 rounded-2xl bg-black hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ตรวจความถูกต้องของตัวบท</span>
          </button>
        ) : (
          /* Results Analysis View */
          <div className="space-y-4 animate-fadeIn">
            {/* Score Banner */}
            <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm">
                  {results?.overallScore}%
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-950">
                    {results && results.overallScore >= 85 ? 'แม่นยำระดับยอดเยี่ยม! 🌟' : results && results.overallScore >= 60 ? 'ผ่านเกณฑ์ระดับดี 👍' : 'ควรทบทวนเพิ่มเติม 💡'}
                  </div>
                  <div className="text-xs text-zinc-700">
                    ตรงกับคีย์เวิร์ด {results?.matchedKeywords.length}/{currentCard.clozeKeywords.length} คำ
                  </div>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-semibold hover:bg-zinc-50 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>พิมพ์ใหม่</span>
              </button>
            </div>

            {/* Keyword Breakdown */}
            {results && results.missedKeywords.length > 0 && (
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                <div className="font-bold text-zinc-950">คำสำคัญที่ตกหล่นในคำตอบของคุณ:</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {results.missedKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-200 font-bold text-zinc-900 text-[11px]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison Side by Side */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="font-bold text-zinc-950">ตัวบทที่ถูกต้องตามประมวลกฎหมาย:</div>
              <p className="text-zinc-800 leading-relaxed whitespace-pre-line font-medium">
                {currentCard.fullText}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-zinc-900 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>มาตราก่อนหน้า</span>
          </button>

          <button
            onClick={handleNext}
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
