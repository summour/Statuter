import React, { useState, useEffect } from 'react';
import { LawDeck } from '../types';
import { renderDeckIcon } from './DeckIconHelper';
import { X, Check } from 'lucide-react';

interface DeckEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDeck: (deck: LawDeck) => void;
  editingDeck?: LawDeck | null;
}

const ICONS = [
  'BookOpen',
  'Scale',
  'Gavel',
  'Shield',
  'FileText',
  'Landmark',
  'Briefcase',
  'Bookmark',
  'Star',
  'Folder'
];

const COLORS = [
  { id: 'zinc', bg: 'bg-zinc-900', ring: 'ring-zinc-900' },
  { id: 'blue', bg: 'bg-blue-600', ring: 'ring-blue-600' },
  { id: 'emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-600' },
  { id: 'purple', bg: 'bg-purple-600', ring: 'ring-purple-600' },
  { id: 'amber', bg: 'bg-amber-600', ring: 'ring-amber-600' },
  { id: 'rose', bg: 'bg-rose-600', ring: 'ring-rose-600' },
];

export const DeckEditModal: React.FC<DeckEditModalProps> = ({
  isOpen,
  onClose,
  onSaveDeck,
  editingDeck,
}) => {
  const [name, setName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [iconName, setIconName] = useState<string>('BookOpen');
  const [color, setColor] = useState<string>('zinc');

  useEffect(() => {
    if (editingDeck) {
      setName(editingDeck.name || '');
      setShortName(editingDeck.shortName || '');
      setIconName(editingDeck.iconName || 'BookOpen');
      setColor(editingDeck.color || 'zinc');
    } else {
      setName('');
      setShortName('');
      setIconName('BookOpen');
      setColor('zinc');
    }
  }, [editingDeck, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const trimmedName = name.trim();
    let autoCategory: LawDeck['category'] = 'custom';
    let autoCategoryLabel = 'สำรับส่วนตัว';

    if (trimmedName.includes('ประมวล')) {
      autoCategory = 'code';
      autoCategoryLabel = 'ประมวลกฎหมาย';
    } else if (trimmedName.includes('วิธีพิจารณา') || trimmedName.includes('วิ.แพ่ง') || trimmedName.includes('วิ.อาญา')) {
      autoCategory = 'proc';
      autoCategoryLabel = 'วิธีพิจารณา';
    } else if (trimmedName.includes('รัฐธรรมนูญ')) {
      autoCategory = 'constitution';
      autoCategoryLabel = 'รัฐธรรมนูญ';
    } else if (trimmedName.startsWith('พ.ร.บ.') || trimmedName.includes('พระราชบัญญัติ')) {
      autoCategory = 'act';
      autoCategoryLabel = 'พระราชบัญญัติ';
    }

    const trimmedShort = shortName.trim() || trimmedName.slice(0, 8);
    const deckId = editingDeck ? editingDeck.id : `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newOrUpdatedDeck: LawDeck = {
      id: deckId,
      name: trimmedName,
      shortName: trimmedShort,
      description: editingDeck?.description || '',
      category: editingDeck?.category || autoCategory,
      categoryLabel: editingDeck?.categoryLabel || autoCategoryLabel,
      iconName,
      color,
      createdAt: editingDeck?.createdAt || Date.now(),
      isDefault: editingDeck?.isDefault || false,
    };

    onSaveDeck(newOrUpdatedDeck);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-zinc-200/80 shadow-2xl text-zinc-900">
        {/* Clean Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              {renderDeckIcon(iconName, 'w-4 h-4')}
            </div>
            <h3 className="font-bold text-sm text-zinc-900">
              {editingDeck ? 'แก้ไขสำรับกฎหมาย' : 'สร้างสำรับใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Deck Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              ชื่อสำรับกฎหมาย
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="เช่น พ.ร.บ. คุ้มครองแรงงาน"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
            />
          </div>

          {/* Short Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              ชื่อย่อ <span className="text-zinc-400 font-normal">(แสดงบนหัวการ์ด)</span>
            </label>
            <input
              type="text"
              placeholder="เช่น แรงงาน, ป.พ.พ."
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
            />
          </div>

          {/* Icons & Colors Row */}
          <div className="space-y-3 pt-1">
            {/* Icon Picker - Single Clean Row */}
            <div>
              <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
                เลือกไอคอน
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ICONS.map((icon) => {
                  const isSelected = iconName === icon;
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setIconName(icon)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {renderDeckIcon(icon, 'w-4 h-4')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Dots */}
            <div>
              <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
                สีประจำสำรับ
              </span>
              <div className="flex items-center gap-2.5">
                {COLORS.map((col) => {
                  const isSelected = color === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setColor(col.id)}
                      className={`w-6 h-6 rounded-full ${col.bg} flex items-center justify-center text-white cursor-pointer transition-transform ${
                        isSelected ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-black text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {editingDeck ? 'บันทึก' : 'สร้างสำรับ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
