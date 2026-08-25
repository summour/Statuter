import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Scale, 
  AlertTriangle,
  FileCheck2,
  CheckCircle
} from 'lucide-react';
import { LawCard } from '../types';

interface ElementsBreakdownProps {
  cards: LawCard[];
  onBackToDashboard: () => void;
}

export const ElementsBreakdown: React.FC<ElementsBreakdownProps> = ({
  cards,
  onBackToDashboard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedElements, setCheckedElements] = useState<Record<number, boolean>>({});

  const currentCard = cards[currentIndex];

  const toggleElementCheck = (index: number) => {
    setCheckedElements(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleNext = () => {
    setCheckedElements({});
    setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setCheckedElements({});
    setCurrentIndex(prev => Math.max(0, prev - 1));
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

  const allChecked = currentCard.elements.length > 0 && 
    currentCard.elements.every((_, i) => checkedElements[i]);

  return (
    <div id="elements-breakdown-view" className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4 animate-fadeIn">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-700">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 font-semibold text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200/80 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ออกจากการแยกองค์ประกอบ</span>
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
              ฝึกเช็คและจำแนกองค์ประกอบความผิด/หลักเกณฑ์ทีละข้อ เพื่อไม่ให้พลาดคะแนนในการเขียนตอบข้อสอบ
            </p>
          </div>
        </div>

        {/* Verbatim Statute Summary Box */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs leading-relaxed text-zinc-800">
          <div className="font-bold text-zinc-950 mb-1">ข้อความตัวบทเต็ม:</div>
          <p className="whitespace-pre-line text-zinc-700">{currentCard.fullText}</p>
        </div>

        {/* Elements Checklist */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-950">
            <span>แยกองค์ประกอบตัวบท ({currentCard.elements.length} องค์ประกอบ)</span>
            <span className="text-zinc-700 font-normal">
              แตะเพื่อติ๊กทดสอบความเข้าใจ
            </span>
          </div>

          <div className="space-y-2">
            {currentCard.elements.map((elem, idx) => {
              const isChecked = !!checkedElements[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleElementCheck(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-white" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="text-xs font-medium leading-relaxed">
                    {elem}
                  </div>
                </div>
              );
            })}
          </div>

          {allChecked && (
            <div className="p-3 rounded-2xl bg-zinc-100 border border-zinc-300 text-xs font-bold text-zinc-950 flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-black" />
              <span>ยินดีด้วย! คุณเข้าใจและเช็คครบทุกองค์ประกอบของมาตรานี้แล้ว</span>
            </div>
          )}
        </div>

        {/* Exceptions or Special Notes */}
        {currentCard.exceptions && currentCard.exceptions.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-1.5">
            <div className="font-bold text-zinc-950 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ข้อยกเว้นและข้อพึงระวัง:</span>
            </div>
            <ul className="list-disc list-inside text-zinc-700 space-y-0.5 pl-1">
              {currentCard.exceptions.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
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
