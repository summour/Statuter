import React, { useState } from 'react';
import { LawDeck, LawCard } from '../types';
import { Trash2, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface DeleteDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: LawDeck | null;
  cards: LawCard[];
  allDecks: LawDeck[];
  onConfirmDelete: (deckId: string, action: 'delete-cards' | 'move-cards', targetDeckId?: string) => void;
}

export const DeleteDeckModal: React.FC<DeleteDeckModalProps> = ({
  isOpen,
  onClose,
  deck,
  cards,
  allDecks,
  onConfirmDelete,
}) => {
  const [deleteAction, setDeleteAction] = useState<'delete-cards' | 'move-cards'>('delete-cards');
  
  const deckCards = deck ? cards.filter(c => c.deckId === deck.id) : [];
  const otherDecks = allDecks.filter(d => d.id !== deck?.id);
  const [targetDeckId, setTargetDeckId] = useState<string>(otherDecks[0]?.id || '');

  if (!isOpen || !deck) return null;

  const handleConfirm = () => {
    onConfirmDelete(deck.id, deleteAction, targetDeckId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-zinc-200 shadow-2xl p-6 sm:p-7 text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">ยืนยันการลบสำรับกฎหมาย</h3>
              <p className="text-xs text-zinc-500">จัดการมาตราที่อยู่ในสำรับก่อนลบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                คุณกำลังจะลบสำรับ: &ldquo;{deck.name}&rdquo; ({deck.shortName})
              </h4>
              <p className="text-xs text-rose-700 mt-1">
                ปัจจุบันมีตัวบทกฎหมายอยู่ในสำรับนี้ทั้งหมด <strong className="font-bold underline">{deckCards.length} มาตรา</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Options if deck has cards */}
        {deckCards.length > 0 ? (
          <div className="space-y-3 mb-5">
            <span className="text-xs font-bold text-zinc-800 block">
              เลือกสิ่งที่คุณต้องการทำกับ {deckCards.length} มาตราในสำรับนี้:
            </span>

            {/* Option 1: Delete cards */}
            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              deleteAction === 'delete-cards' ? 'border-rose-400 bg-rose-50/50 shadow-xs' : 'border-zinc-200 bg-zinc-50/50'
            }`}>
              <input
                type="radio"
                name="deleteDeckAction"
                checked={deleteAction === 'delete-cards'}
                onChange={() => setDeleteAction('delete-cards')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="text-xs font-bold text-zinc-900 block">
                  ลบทั้งสำรับและลบตัวบทกฎหมายทั้งหมด ({deckCards.length} มาตรา)
                </span>
                <span className="text-[11px] text-zinc-500 block mt-0.5">
                  มาตราทั้งหมดในสำรับนี้จะถูกลบออกจากฐานข้อมูลถาวร
                </span>
              </div>
            </label>

            {/* Option 2: Move cards to another deck */}
            {otherDecks.length > 0 && (
              <label className={`p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                deleteAction === 'move-cards' ? 'border-zinc-900 bg-zinc-50 shadow-xs' : 'border-zinc-200 bg-zinc-50/50'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="deleteDeckAction"
                    checked={deleteAction === 'move-cards'}
                    onChange={() => setDeleteAction('move-cards')}
                    className="mt-0.5 text-zinc-900 focus:ring-zinc-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">
                      ลบเฉพาะสำรับ แต่ย้าย {deckCards.length} มาตราไปยังสำรับอื่น
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      รักษาตัวบทกฎหมายไว้โดยย้ายไปยัง Deck ปลายทางที่คุณเลือก
                    </span>
                  </div>
                </div>

                {deleteAction === 'move-cards' && (
                  <div className="mt-2 pl-7">
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      เลือกสำรับปลายทาง (Target Deck):
                    </label>
                    <select
                      value={targetDeckId}
                      onChange={(e) => setTargetDeckId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      {otherDecks.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </label>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-600 mb-5">
            สำรับนี้ไม่มีมาตราคงค้างอยู่ สามารถลบได้อย่างปลอดภัยทันที
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยืนยันลบสำรับ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
