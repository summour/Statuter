import React, { useState, useEffect } from 'react';
import { LawDeck } from '../types';
import { DECK_ICON_OPTIONS, renderDeckIcon } from './DeckIconHelper';
import { X, FolderPlus, Edit3, Check } from 'lucide-react';

interface DeckEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDeck: (deck: LawDeck) => void;
  editingDeck?: LawDeck | null;
}

const CATEGORY_OPTIONS: { value: LawDeck['category']; label: string }[] = [
  { value: 'code', label: 'ประมวลกฎหมาย' },
  { value: 'proc', label: 'วิธีพิจารณาความ' },
  { value: 'constitution', label: 'รัฐธรรมนูญ' },
  { value: 'act', label: 'พระราชบัญญัติ' },
  { value: 'custom', label: 'สำรับส่วนตัว / อื่นๆ' },
];

const COLOR_OPTIONS = [
  { id: 'zinc', name: 'เทาเข้ม', bg: 'bg-zinc-900', border: 'border-zinc-900' },
  { id: 'blue', name: 'น้ำเงิน', bg: 'bg-blue-600', border: 'border-blue-600' },
  { id: 'emerald', name: 'เขียว', bg: 'bg-emerald-600', border: 'border-emerald-600' },
  { id: 'purple', name: 'ม่วง', bg: 'bg-purple-600', border: 'border-purple-600' },
  { id: 'amber', name: 'ส้ม', bg: 'bg-amber-600', border: 'border-amber-600' },
  { id: 'rose', name: 'แดง', bg: 'bg-rose-600', border: 'border-rose-600' },
];

export const DeckEditModal: React.FC<DeckEditModalProps> = ({
  isOpen,
  onClose,
  onSaveDeck,
  editingDeck,
}) => {
  const [name, setName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<LawDeck['category']>('custom');
  const [categoryLabel, setCategoryLabel] = useState<string>('สำรับส่วนตัว');
  const [iconName, setIconName] = useState<string>('BookOpen');
  const [color, setColor] = useState<string>('zinc');

  useEffect(() => {
    if (editingDeck) {
      setName(editingDeck.name);
      setShortName(editingDeck.shortName);
      setDescription(editingDeck.description);
      setCategory(editingDeck.category);
      setCategoryLabel(editingDeck.categoryLabel);
      setIconName(editingDeck.iconName || 'BookOpen');
      setColor(editingDeck.color || 'zinc');
    } else {
      // Default reset for new deck
      setName('');
      setShortName('');
      setDescription('');
      setCategory('custom');
      setCategoryLabel('สำรับส่วนตัว');
      setIconName('BookOpen');
      setColor('zinc');
    }
  }, [editingDeck, isOpen]);

  // Sync category label when category changes
  const handleCategoryChange = (cat: LawDeck['category']) => {
    setCategory(cat);
    switch (cat) {
      case 'code':
        setCategoryLabel('ประมวลกฎหมาย');
        break;
      case 'proc':
        setCategoryLabel('วิธีพิจารณา');
        break;
      case 'constitution':
        setCategoryLabel('รัฐธรรมนูญ');
        break;
      case 'act':
        setCategoryLabel('พระราชบัญญัติ');
        break;
      default:
        setCategoryLabel('สำรับส่วนตัว');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณาระบุชื่อสำรับ');
      return;
    }

    const trimmedShort = shortName.trim() || name.trim().slice(0, 10);
    const deckId = editingDeck ? editingDeck.id : `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newOrUpdatedDeck: LawDeck = {
      id: deckId,
      name: name.trim(),
      shortName: trimmedShort,
      description: description.trim(),
      category,
      categoryLabel: categoryLabel.trim() || 'สำรับส่วนตัว',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-zinc-200 shadow-2xl p-6 text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              {editingDeck ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-zinc-900">
                {editingDeck ? 'แก้ไขสำรับ' : 'สร้างสำรับใหม่'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deck Name & Short Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                ชื่อสำรับ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น พ.ร.บ. คุ้มครองแรงงาน พ.ศ. ๒๕๔๑"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                ชื่อย่อ
              </label>
              <input
                type="text"
                placeholder="เช่น แรงงาน"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Category & Category Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as LawDeck['category'])}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                ป้ายกำกับหมวด
              </label>
              <input
                type="text"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                placeholder="เช่น พระราชบัญญัติ"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-2">
              ไอคอน
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
              {DECK_ICON_OPTIONS.map(icon => {
                const isSelected = iconName === icon.name;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setIconName(icon.name)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-xs scale-102'
                        : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}
                    title={icon.label}
                  >
                    <icon.component className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-medium truncate w-full leading-tight">
                      {icon.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Accent */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-2">
              สี
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_OPTIONS.map(col => {
                const isSelected = color === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setColor(col.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-100 text-zinc-900 font-bold shadow-2xs'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${col.bg} flex items-center justify-center text-white`}>
                      {isSelected && <Check className="w-2 h-2" />}
                    </span>
                    <span>{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              {editingDeck ? 'บันทึก' : 'สร้างสำรับ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
