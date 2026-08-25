import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Sparkles, BookOpen } from 'lucide-react';
import { LawCard, LawCodeCategory } from '../types';
import { createInitialSRSState } from '../utils/srs';

interface CardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: LawCard) => void;
  editingCard?: LawCard | null;
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveCard,
  editingCard,
}) => {
  const [codeCategory, setCodeCategory] = useState<LawCodeCategory>('criminal');
  const [codeName, setCodeName] = useState('ประมวลกฎหมายอาญา');
  const [codeShortName, setCodeShortName] = useState('ป.อ.');
  const [sectionNumber, setSectionNumber] = useState('');
  const [title, setTitle] = useState('');
  const [fullText, setFullText] = useState('');
  const [simplifiedSummary, setSimplifiedSummary] = useState('');
  const [elementsInput, setElementsInput] = useState('');
  const [clozeKeywordsInput, setClozeKeywordsInput] = useState('');
  const [exceptionsInput, setExceptionsInput] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [tagsInput, setTagsInput] = useState('#เนติบัณฑิต');

  useEffect(() => {
    if (editingCard) {
      setCodeCategory(editingCard.codeCategory);
      setCodeName(editingCard.codeName);
      setCodeShortName(editingCard.codeShortName);
      setSectionNumber(editingCard.sectionNumber);
      setTitle(editingCard.title);
      setFullText(editingCard.fullText);
      setSimplifiedSummary(editingCard.simplifiedSummary || '');
      setElementsInput(editingCard.elements.join('\n'));
      setClozeKeywordsInput(editingCard.clozeKeywords.join(', '));
      setExceptionsInput(editingCard.exceptions.join('\n'));
      setMnemonic(editingCard.mnemonic || '');
      setTagsInput(editingCard.tags.join(', '));
    } else {
      setSectionNumber('');
      setTitle('');
      setFullText('');
      setSimplifiedSummary('');
      setElementsInput('');
      setClozeKeywordsInput('');
      setExceptionsInput('');
      setMnemonic('');
      setTagsInput('#เนติบัณฑิต');
    }
  }, [editingCard, isOpen]);

  const handleCategoryChange = (cat: LawCodeCategory) => {
    setCodeCategory(cat);
    switch (cat) {
      case 'criminal':
        setCodeName('ประมวลกฎหมายอาญา');
        setCodeShortName('ป.อ.');
        break;
      case 'civil':
        setCodeName('ประมวลกฎหมายแพ่งและพาณิชย์');
        setCodeShortName('ป.พ.พ.');
        break;
      case 'crim_proc':
        setCodeName('ประมวลกฎหมายวิธีพิจารณาความอาญา');
        setCodeShortName('ป.วิ.อ.');
        break;
      case 'civ_proc':
        setCodeName('ประมวลกฎหมายวิธีพิจารณาความแพ่ง');
        setCodeShortName('ป.วิ.พ.');
        break;
      case 'constitution':
        setCodeName('รัฐธรรมนูญแห่งราชอาณาจักรไทย');
        setCodeShortName('รธน.');
        break;
      case 'custom':
        setCodeName('กฎหมายพิเศษ/กำหนดเอง');
        setCodeShortName('พิเศษ');
        break;
    }
  };

  const handleSave = () => {
    if (!sectionNumber.trim() || !fullText.trim()) {
      alert('กรุณากรอกเลขมาตราและตัวบทกฎหมาย');
      return;
    }

    const rawNum = parseInt(sectionNumber.replace(/\D/g, ''), 10) || 0;
    const elements = elementsInput
      .split('\n')
      .map(e => e.trim())
      .filter(Boolean);
    const clozeKeywords = clozeKeywordsInput
      .split(/[,,\n]/)
      .map(k => k.trim())
      .filter(Boolean);
    const exceptions = exceptionsInput
      .split('\n')
      .map(e => e.trim())
      .filter(Boolean);
    const tags = tagsInput
      .split(/[,,\s]/)
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    const cardToSave: LawCard = {
      id: editingCard?.id || `custom-card-${Date.now()}`,
      codeCategory,
      codeName,
      codeShortName,
      sectionNumber: sectionNumber.trim().startsWith('มาตรา') ? sectionNumber.trim() : `มาตรา ${sectionNumber.trim()}`,
      sectionRawNum: rawNum,
      title: title.trim() || `ตัวบท ${sectionNumber}`,
      fullText: fullText.trim(),
      simplifiedSummary: simplifiedSummary.trim(),
      elements: elements.length > 0 ? elements : ['1. องค์ประกอบตามตัวบท'],
      clozeKeywords: clozeKeywords.length > 0 ? clozeKeywords : [],
      exceptions,
      mnemonic: mnemonic.trim(),
      tags,
      isStarred: editingCard?.isStarred || false,
      srs: editingCard?.srs || createInitialSRSState(),
      createdAt: editingCard?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveCard(cardToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-zinc-950">
                {editingCard ? 'แก้ไขตัวบทกฎหมาย' : 'เพิ่มตัวบทกฎหมายใหม่'}
              </h2>
              <p className="text-xs text-zinc-700">กำหนดหมวด ข้อความตัวบท และคีย์เวิร์ดสำหรับท่องจำ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-900">หมวดประมวลกฎหมาย</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['criminal', 'civil', 'crim_proc', 'civ_proc', 'constitution', 'custom'] as LawCodeCategory[]).map(cat => {
                const labels: Record<string, string> = {
                  criminal: 'ป.อ. (อาญา)',
                  civil: 'ป.พ.พ. (แพ่ง)',
                  crim_proc: 'ป.วิ.อ.',
                  civ_proc: 'ป.วิ.พ.',
                  constitution: 'รธน.',
                  custom: 'กำหนดเอง',
                };
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`py-2 px-2 rounded-xl font-bold text-xs text-center border transition-all cursor-pointer ${
                      codeCategory === cat
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {labels[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Number & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-zinc-900">เลขมาตรา *</label>
              <input
                type="text"
                placeholder="เช่น มาตรา 59 หรือ 288"
                value={sectionNumber}
                onChange={e => setSectionNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-hidden focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-zinc-900">ชื่อหัวข้อ / ฐานความผิด</label>
              <input
                type="text"
                placeholder="เช่น ฆ่าผู้อื่นโดยเจตนา"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-hidden focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Full Statute Text */}
          <div className="space-y-1">
            <label className="font-bold text-zinc-900">ข้อความตัวบทเต็ม (Verbatim Text) *</label>
            <textarea
              rows={4}
              placeholder="กรอกข้อความตัวบทกฎหมายเต็ม..."
              value={fullText}
              onChange={e => setFullText(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs leading-relaxed focus:outline-hidden focus:border-zinc-500"
            />
          </div>

          {/* Cloze Keywords */}
          <div className="space-y-1">
            <label className="font-bold text-zinc-900">
              คำสำคัญสำหรับโหมดเติมคำ (คั่นด้วยจุลภาค)
            </label>
            <input
              type="text"
              placeholder="เช่น เจตนา, ประมาท, รู้สำนึก, เล็งเห็นผล"
              value={clozeKeywordsInput}
              onChange={e => setClozeKeywordsInput(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-hidden focus:border-zinc-500"
            />
          </div>

          {/* Elements Breakdown */}
          <div className="space-y-1">
            <label className="font-bold text-zinc-900">แยกองค์ประกอบ (1 บรรทัด = 1 องค์ประกอบ)</label>
            <textarea
              rows={3}
              placeholder="1. ผู้ใด&#10;2. ฆ่า&#10;3. ผู้อื่น&#10;4. โดยเจตนา"
              value={elementsInput}
              onChange={e => setElementsInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs leading-relaxed focus:outline-hidden focus:border-zinc-500"
            />
          </div>

          {/* Mnemonic / Memory Hook */}
          <div className="space-y-1">
            <label className="font-bold text-zinc-900">เทคนิคการจำ / คำย่อ (Mnemonic)</label>
            <input
              type="text"
              placeholder="เช่น จำ 4 เสา: ภัยละเมิดกม. + ใกล้ถึง + ป้องกันสิทธิ + พอสมควรแก่เหตุ"
              value={mnemonic}
              onChange={e => setMnemonic(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-hidden focus:border-zinc-500"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="font-bold text-zinc-900">แท็ก (Tags)</label>
            <input
              type="text"
              placeholder="#เนติบัณฑิต, #ข้อสอบอัยการ, #มาตราเด็ด"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:outline-hidden focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 font-semibold text-zinc-800 text-xs transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 font-bold text-white text-xs transition-colors cursor-pointer shadow-xs"
          >
            บันทึกมาตรา
          </button>
        </div>
      </div>
    </div>
  );
};
