import React from 'react';
import { X, Volume2, VolumeX, Star, Edit3, Trash2, BookOpen, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { LawCard } from '../types';
import { speakText, stopSpeaking, isSpeaking } from '../utils/speech';

interface CardDetailModalProps {
  card: LawCard | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (card: LawCard) => void;
  onDelete: (cardId: string) => void;
  onToggleStar: (cardId: string) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleStar,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  if (!isOpen || !card) return null;

  const handleSpeech = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakText(`${card.sectionNumber} ${card.title}. ${card.fullText}`, 0.95, () => {
        setIsPlaying(false);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-black text-white font-bold text-xs">
              {card.codeShortName}
            </span>
            <div>
              <h2 className="font-black text-base text-zinc-950">
                {card.sectionNumber}
              </h2>
              <p className="text-xs text-zinc-700">{card.codeName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeech}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
              title="ฟังเสียงอ่าน"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleStar(card.id)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
              title="ติดดาว"
            >
              <Star className={`w-4 h-4 ${card.isStarred ? 'fill-zinc-950 text-zinc-950' : ''}`} />
            </button>
            <button
              onClick={() => onEdit(card)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
              title="แก้ไข"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-700">ชื่อหัวข้อ</span>
            <div className="text-sm font-black text-zinc-950">{card.title}</div>
          </div>

          {/* Full Statute */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-700">ข้อความตัวบทเต็ม</span>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 leading-relaxed text-zinc-900 whitespace-pre-line font-medium text-xs">
              {card.fullText}
            </div>
          </div>

          {/* Summary */}
          {card.simplifiedSummary && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-700">หัวใจสำคัญ</span>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 leading-relaxed">
                {card.simplifiedSummary}
              </div>
            </div>
          )}

          {/* Elements */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-700">
              แยกองค์ประกอบตัวบท ({card.elements.length} ข้อ)
            </span>
            <div className="space-y-1.5">
              {card.elements.map((el, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-md bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-zinc-900 font-medium">{el}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cloze Keywords */}
          {card.clozeKeywords.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-700">คำสำคัญ (Keywords)</span>
              <div className="flex flex-wrap gap-1.5">
                {card.clozeKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 font-bold text-zinc-950 text-[11px]">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mnemonic */}
          {card.mnemonic && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-700">เทคนิคการจำ</span>
              <div className="p-3 rounded-xl bg-zinc-100 text-zinc-950 font-bold">
                {card.mnemonic}
              </div>
            </div>
          )}

          {/* SRS Metrics Pill */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="font-bold text-zinc-950">สถานะความจำ (Spaced Repetition SM-2)</div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-zinc-700">ช่วงห่าง:</span> <strong className="text-zinc-900">{card.srs.interval} วัน</strong>
              </div>
              <div>
                <span className="text-zinc-700">ทบทวนแล้ว:</span> <strong className="text-zinc-900">{card.srs.totalReviews} ครั้ง</strong>
              </div>
              <div>
                <span className="text-zinc-700">กำหนดถัดไป:</span> <strong className="text-zinc-900">{card.srs.dueDate}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('คุณต้องการลบมาตรานี้ออกจากคลังใช่หรือไม่?')) {
                onDelete(card.id);
                onClose();
              }
            }}
            className="px-3 py-2 rounded-xl text-zinc-700 hover:text-black hover:bg-zinc-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ลบมาตรานี้</span>
          </button>

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
