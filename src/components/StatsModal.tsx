import React from 'react';
import { X, Flame, Trophy, BarChart3, CheckCircle2, Clock, Calendar, ShieldCheck } from 'lucide-react';
import { LawCard, UserStats } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: LawCard[];
  stats: UserStats;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  cards,
  stats,
}) => {
  if (!isOpen) return null;

  const totalCards = cards.length;
  const newCards = cards.filter(c => c.srs.status === 'new').length;
  const learningCards = cards.filter(c => c.srs.status === 'learning').length;
  const reviewCards = cards.filter(c => c.srs.status === 'review').length;
  const masteredCards = cards.filter(c => c.srs.status === 'mastered').length;

  const masteredPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-zinc-950">
                สถิติการท่องจำ (Spaced Repetition)
              </h2>
              <p className="text-xs text-zinc-700">รายงานการเรียนรู้และระดับความคงทนของความจำ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-1 text-zinc-700 font-bold">
                <Flame className="w-4 h-4 text-black fill-black" />
                <span>สตรีคต่อเนื่อง</span>
              </div>
              <div className="text-2xl font-black text-zinc-950 mt-1">{stats.dailyStreak} วัน</div>
              <div className="text-[11px] text-zinc-700 mt-0.5">ท่องจำสม่ำเสมอ</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-1 text-zinc-700 font-bold">
                <Trophy className="w-4 h-4 text-black" />
                <span>จำแม่นยำ</span>
              </div>
              <div className="text-2xl font-black text-zinc-950 mt-1">{masteredPercent}%</div>
              <div className="text-[11px] text-zinc-700 mt-0.5">{masteredCards} จาก {totalCards} มาตรา</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1 text-zinc-700 font-bold">
                <Clock className="w-4 h-4 text-black" />
                <span>ทบทวนวันนี้</span>
              </div>
              <div className="text-2xl font-black text-zinc-950 mt-1">{stats.totalReviewsToday} ครั้ง</div>
              <div className="text-[11px] text-zinc-700 mt-0.5">เป้าหมาย {stats.dailyGoal} ครั้ง/วัน</div>
            </div>
          </div>

          {/* Retention Funnel / Mastery Distribution */}
          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-3">
            <h3 className="font-bold text-zinc-950 text-xs">
              การกระจายระดับความจำ (Anki SM-2 Maturity)
            </h3>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-zinc-700 mb-1">
                  <span>จำได้แม่นยำถาวร (Mastered / Interval &ge; 21 วัน)</span>
                  <span className="font-bold text-zinc-950">{masteredCards} มาตรา</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full"
                    style={{ width: `${(masteredCards / totalCards) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-zinc-700 mb-1">
                  <span>กำลังทบทวนตามกำหนด (Review / Interval 1-20 วัน)</span>
                  <span className="font-bold text-zinc-950">{reviewCards} มาตรา</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 rounded-full"
                    style={{ width: `${(reviewCards / totalCards) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-zinc-700 mb-1">
                  <span>อยู่ในช่วงปรับความจำ (Learning / ซ้ำบ่อย)</span>
                  <span className="font-bold text-zinc-950">{learningCards} มาตรา</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-400 rounded-full"
                    style={{ width: `${(learningCards / totalCards) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-zinc-700 mb-1">
                  <span>ยังไม่เคยทบทวน (New Cards)</span>
                  <span className="font-bold text-zinc-950">{newCards} มาตรา</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-300 rounded-full"
                    style={{ width: `${(newCards / totalCards) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reviews Log */}
          <div className="space-y-2">
            <h3 className="font-bold text-zinc-950 text-xs">
              ประวัติการทบทวนล่าสุด ({stats.reviewLogs?.length || 0} รายการ)
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {(!stats.reviewLogs || stats.reviewLogs.length === 0) ? (
                <div className="p-4 text-center text-zinc-700 bg-zinc-50 rounded-2xl border border-zinc-200">
                  ยังไม่มีประวัติการทบทวนในวันนี้
                </div>
              ) : (
                stats.reviewLogs.slice(0, 10).map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-950">{log.sectionNumber}</span>
                      <span className="text-zinc-700">({log.studyMode})</span>
                    </div>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${
                      log.grade === 'again'
                        ? 'bg-zinc-900 text-white'
                        : log.grade === 'hard'
                        ? 'bg-zinc-200 text-zinc-900'
                        : log.grade === 'good'
                        ? 'bg-white border border-zinc-300 text-zinc-900'
                        : 'bg-black text-white'
                    }`}>
                      {log.grade === 'again' ? 'ซ้ำ' : log.grade === 'hard' ? 'ยาก' : log.grade === 'good' ? 'จำได้' : 'ง่ายมาก'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
