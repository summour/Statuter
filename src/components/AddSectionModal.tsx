import React, { useState } from 'react';
import { LawDeck, LawCard, LawParagraph } from '../types';
import { X, Plus, BookOpen } from 'lucide-react';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: LawCard) => void;
  decks: LawDeck[];
  defaultDeckId?: string;
}

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onSaveCard,
  decks,
  defaultDeckId,
}) => {
  const [deckId, setDeckId] = useState<string>(defaultDeckId || decks[0]?.id || 'criminal');
  const [book, setBook] = useState('');
  const [titleStructure, setTitleStructure] = useState('');
  const [chapter, setChapter] = useState('');
  const [part, setPart] = useState('');
  const [sectionNumber, setSectionNumber] = useState('');
  const [title, setTitle] = useState('');
  const [fullText, setFullText] = useState('');

  React.useEffect(() => {
    if (defaultDeckId) {
      setDeckId(defaultDeckId);
    } else if (decks.length > 0 && !decks.some(d => d.id === deckId)) {
      setDeckId(decks[0].id);
    }
  }, [defaultDeckId, decks, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionNumber.trim() || !fullText.trim()) {
      alert('กรุณากรอกเลขมาตราและตัวบทกฎหมาย');
      return;
    }

    const selectedDeck = decks.find(d => d.id === deckId) || decks[0];
    const rawNum = parseInt(sectionNumber.replace(/\D/g, ''), 10) || 999;

    // Parse paragraphs automatically if there are blank lines or paragraph markers
    const textLines = fullText.split('\n\n').map(t => t.trim()).filter(Boolean);
    let parsedParagraphs: LawParagraph[] | undefined = undefined;

    if (textLines.length > 1) {
      const thaiNumbers = ['หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ'];
      parsedParagraphs = textLines.map((line, idx) => {
        let label = `วรรค${thaiNumbers[idx] || (idx + 1)}`;
        if (line.startsWith('(') || line.startsWith('（') || line.startsWith('(๑)') || line.startsWith('(1)')) {
          const match = line.match(/^(\([0-9๑-๙ivxIVX]+\))/);
          if (match) {
            label = `อนุ ${match[1]}`;
          }
        }
        return {
          label,
          text: line,
        };
      });
    }

    const newCard: LawCard = {
      id: `custom-${Date.now()}`,
      deckId: selectedDeck.id,
      deckName: selectedDeck.name,
      deckShortName: selectedDeck.shortName,
      book: book.trim() || undefined,
      titleStructure: titleStructure.trim() || undefined,
      chapter: chapter.trim() || undefined,
      part: part.trim() || undefined,
      sectionNumber: sectionNumber.startsWith('มาตรา') ? sectionNumber.trim() : `มาตรา ${sectionNumber.trim()}`,
      sectionRawNum: rawNum,
      title: title.trim() || undefined,
      fullText: fullText.trim(),
      paragraphs: parsedParagraphs,
    };

    onSaveCard(newCard);
    onClose();

    // Reset form
    setBook('');
    setTitleStructure('');
    setChapter('');
    setPart('');
    setSectionNumber('');
    setTitle('');
    setFullText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-zinc-200 shadow-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">เพิ่มมาตราใหม่</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deck select */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              สำรับ <span className="text-red-500">*</span>
            </label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {decks.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.shortName})
                </option>
              ))}
            </select>
          </div>

          {/* Legal Structure System (บรรพ / ลักษณะ / หมวด / ส่วน) */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
            <span className="text-xs font-bold text-zinc-800 block">
              โครงสร้าง (ถ้ามี)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  บรรพ / ภาค
                </label>
                <input
                  type="text"
                  placeholder="เช่น ภาค ๑ หรือ บรรพ ๑"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  ลักษณะ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ลักษณะ ๑"
                  value={titleStructure}
                  onChange={(e) => setTitleStructure(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  หมวด
                </label>
                <input
                  type="text"
                  placeholder="เช่น หมวด ๔"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                  ส่วน
                </label>
                <input
                  type="text"
                  placeholder="เช่น ส่วนที่ ๑"
                  value={part}
                  onChange={(e) => setPart(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Section Number & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                เลขมาตรา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น 59"
                value={sectionNumber}
                onChange={(e) => setSectionNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                หัวข้อมาตรา
              </label>
              <input
                type="text"
                placeholder="เช่น ความรับผิดในทางอาญา"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Full Text (วรรค / อนุ) */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              ตัวบท <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder={`บุคคลจะต้องรับผิดในทางอาญาก็ต่อเมื่อได้กระทำโดยเจตนา...`}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              required
              rows={5}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 leading-relaxed"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
