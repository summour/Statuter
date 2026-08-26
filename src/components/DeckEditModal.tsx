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
  { value: 'code', label: 'ประมวลกฎหมาย (Code)' },
  { value: 'proc', label: 'วิธีพิจารณาความ (Procedure)' },
  { value: 'constitution', label: 'กฎหมายสูงสุด (Constitution)' },
  { value: 'act', label: 'พระราชบัญญัติ (Act)' },
  { value: 'custom', label: 'สำรับส่วนตัว / อื่นๆ (Custom)' },
];

const COLOR_OPTIONS = [
  { id: 'zinc', name: 'สีเทาเข้ม (Classic Dark)', bg: 'bg-zinc-900', border: 'border-zinc-900' },
  { id: 'blue', name: 'สีน้ำเงิน (Royal Blue)', bg: 'bg-blue-600', border: 'border-blue-600' },
  { id: 'emerald', name: 'สีเขียวมรกต (Emerald)', bg: 'bg-emerald-600', border: 'border-emerald-600' },
  { id: 'purple', name: 'สีม่วง (Violet)', bg: 'bg-purple-600', border: 'border-purple-600' },
  { id: 'amber', name: 'สีส้มอำพัน (Amber)', bg: 'bg-amber-600', border: 'border-amber-600' },
  { id: 'rose', name: 'สีแดงกุหลาบ (Rose)', bg: 'bg-rose-600', border: 'border-rose-600' },
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
        setCategoryLabel('กฎหมายสูงสุด');
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
      alert('กรุณาระบุชื่อสำรับกฎหมาย');
      return;
    }

    const trimmedShort = shortName.trim() || name.trim().slice(0, 10);
    const deckId = editingDeck ? editingDeck.id : `deck_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newOrUpdatedDeck: LawDeck = {
      id: deckId,
      name: name.trim(),
      shortName: trimmedShort,
      description: description.trim() || 'สำรับตัวบทกฎหมายไทยสำหรับทบทวนและฝึกความจำ',
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
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto border border-zinc-200 shadow-2xl p-6 sm:p-7 text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              {editingDeck ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-zinc-900">
                {editingDeck ? 'แก้ไขสำรับกฎหมาย (Edit Deck)' : 'สร้างสำรับใหม่ (Create New Deck)'}
              </h3>
              <p className="text-xs text-zinc-500">
                {editingDeck ? `ปรับแต่งข้อมูลของสำรับ "${editingDeck.name}"` : 'สร้าง Deck เปล่า หรือเพื่อเตรียมนำเข้าตัวบทมาตรา'}
              </p>
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
                ชื่อสำรับกฎหมาย (Deck Name) <span className="text-red-500">*</span>
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
                ชื่อย่อ (Short Name)
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
                หมวดหมู่หลัก (Category)
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
                ป้ายกำกับหมวดหมู่ (Badge Label)
              </label>
              <input
                type="text"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                placeholder="เช่น พระราชบัญญัติ หรือ สรุปสอบเนติ"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              คำอธิบายสำรับ (Description)
            </label>
            <textarea
              rows={2}
              placeholder="เช่น รวมมาตราสำคัญสำหรับการสอบ หรือ หมวด ๑ ถึง หมวด ๕..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-2">
              เลือกไอคอนประจำ Deck (Icon)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
              {DECK_ICON_OPTIONS.map(icon => {
                const isSelected = iconName === icon.name;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setIconName(icon.name)}
                    className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-sm ring-2 ring-zinc-900 scale-102'
                        : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}
                    title={icon.label}
                  >
                    <icon.component className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] font-medium truncate w-full leading-tight">
                      {icon.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Accent */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-2">
              โทนสีไฮไลต์ (Accent Color)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_OPTIONS.map(col => {
                const isSelected = color === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setColor(col.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-100 text-zinc-900 font-bold shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${col.bg} flex items-center justify-center text-white`}>
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span>{col.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              ตัวอย่างการแสดงผลบนหน้าจอ (Preview)
            </span>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                {renderDeckIcon(iconName, 'w-6 h-6')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                    {shortName || 'ชื่อย่อ'}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    {categoryLabel}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mt-1 truncate">
                  {name || 'ชื่อสำรับกฎหมาย'}
                </h4>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {description || 'คำอธิบายสำรับ'}
                </p>
              </div>
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
              className="px-6 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
            >
              {editingDeck ? 'บันทึกการแก้ไข' : 'สร้างสำรับ Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
