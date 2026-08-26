import React, { useState } from 'react';
import { LawDeck, LawCard, LawParagraph } from '../types';
import { stripFootnotes } from '../utils/thaiLawParser';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [showStructure, setShowStructure] = useState(false);
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
    const selectedDeck = decks.find(d => d.id === deckId) || decks[0];
    if (!selectedDeck) {
      alert('กรุณาสร้างสำรับกฎหมายก่อนเพิ่มมาตรา');
      return;
    }

    const cleanSecInput = stripFootnotes(sectionNumber).trim();
    const cleanFullTextInput = stripFootnotes(fullText).trim();

    if (!cleanSecInput || !cleanFullTextInput) {
      alert('กรุณากรอกเลขมาตราและตัวบทกฎหมาย');
      return;
    }

    const rawNum = parseInt(cleanSecInput.replace(/\D/g, ''), 10) || 999;

    // Parse paragraphs automatically if there are blank lines or paragraph markers
    const textLines = cleanFullTextInput.split('\n\n').map(t => t.trim()).filter(Boolean);
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

    const formattedSecNum = cleanSecInput.startsWith('มาตรา') ? cleanSecInput : `มาตรา ${cleanSecInput}`;

    const newCard: LawCard = {
      id: `custom-${Date.now()}`,
      deckId: selectedDeck.id,
      deckName: selectedDeck.name,
      deckShortName: selectedDeck.shortName,
      book: book.trim() || undefined,
      titleStructure: titleStructure.trim() || undefined,
      chapter: chapter.trim() || undefined,
      part: part.trim() || undefined,
      sectionNumber: formattedSecNum,
      sectionRawNum: rawNum,
      title: title.trim() || undefined,
      fullText: cleanFullTextInput,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-zinc-200/80 shadow-2xl p-5 text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">เพิ่มมาตราใหม่</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Deck select */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              สำรับกฎหมาย
            </label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors"
            >
              {decks.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.shortName})
                </option>
              ))}
            </select>
          </div>

          {/* Section Number & Title */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                เลขมาตรา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น 59 หรือ ๑"
                value={sectionNumber}
                onChange={(e) => setSectionNumber(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                หัวข้อมาตรา <span className="text-zinc-400 font-normal">(ถ้ามี)</span>
              </label>
              <input
                type="text"
                placeholder="เช่น ความรับผิดในทางอาญา"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
          </div>

          {/* Full Text */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              ตัวบทกฎหมาย <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="กรอกข้อความตัวบทกฎหมาย..."
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              required
              rows={4}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors leading-relaxed"
            />
          </div>

          {/* Optional Structure Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowStructure(!showStructure)}
              className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              {showStructure ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showStructure ? 'ซ่อนโครงสร้างกฎหมาย' : '+ ระบุโครงสร้าง (บรรพ/ลักษณะ/หมวด)'}</span>
            </button>

            {showStructure && (
              <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <input
                  type="text"
                  placeholder="บรรพ / ภาค"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                />
                <input
                  type="text"
                  placeholder="ลักษณะ"
                  value={titleStructure}
                  onChange={(e) => setTitleStructure(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                />
                <input
                  type="text"
                  placeholder="หมวด"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                />
                <input
                  type="text"
                  placeholder="ส่วน"
                  value={part}
                  onChange={(e) => setPart(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
                />
              </div>
            )}
          </div>

          {/* Actions */}
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
              บันทึกมาตรา
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
