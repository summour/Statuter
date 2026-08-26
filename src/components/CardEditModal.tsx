import React, { useState, useEffect } from 'react';
import { LawDeck, LawCard, LawParagraph } from '../types';
import { stripFootnotes, parseRawSectionNumber } from '../utils/thaiLawParser';
import { X, Check, Edit3, ChevronDown, ChevronUp, Layers, BookOpen, AlertCircle } from 'lucide-react';

interface CardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (updatedCard: LawCard) => void;
  card: LawCard | null;
  decks: LawDeck[];
}

export const CardEditModal: React.FC<CardEditModalProps> = ({
  isOpen,
  onClose,
  onSaveCard,
  card,
  decks,
}) => {
  const [deckId, setDeckId] = useState<string>('');
  const [sectionNumber, setSectionNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [fullText, setFullText] = useState<string>('');
  
  // Hierarchy fields
  const [showStructure, setShowStructure] = useState<boolean>(false);
  const [book, setBook] = useState<string>('');
  const [titleStructure, setTitleStructure] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
  const [part, setPart] = useState<string>('');

  // Paragraph preview / edit mode
  const [autoParagraphs, setAutoParagraphs] = useState<boolean>(true);

  // Sync state when card changes or modal opens
  useEffect(() => {
    if (card && isOpen) {
      setDeckId(card.deckId || (decks[0]?.id ?? ''));
      setSectionNumber(card.sectionNumber || '');
      setTitle(card.title || '');
      setFullText(card.fullText || '');
      
      setBook(card.book || '');
      setTitleStructure(card.titleStructure || '');
      setChapter(card.chapter || '');
      setPart(card.part || '');

      // Open structure toggle if card has hierarchy data
      if (card.book || card.titleStructure || card.chapter || card.part) {
        setShowStructure(true);
      } else {
        setShowStructure(false);
      }
    }
  }, [card, isOpen, decks]);

  if (!isOpen || !card) return null;

  // Helper to parse paragraphs from text
  const computeParagraphs = (text: string): LawParagraph[] | undefined => {
    const clean = text.trim();
    if (!clean) return undefined;

    const lines = clean.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
    if (lines.length <= 1) {
      // Check if lines separated by single newlines have paragraph indicators
      const singleLines = clean.split('\n').map(t => t.trim()).filter(Boolean);
      if (singleLines.length > 1 && singleLines.some(l => l.startsWith('(') || l.startsWith('（') || l.startsWith('วรรค'))) {
        return parseLineArray(singleLines);
      }
      return undefined;
    }

    return parseLineArray(lines);
  };

  const parseLineArray = (lines: string[]): LawParagraph[] => {
    const thaiNumbers = ['หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ', 'สิบเอ็ด', 'สิบสอง'];
    let paragraphCount = 0;

    return lines.map((line) => {
      // Check if it starts with an item indicator like (๑), (1), (ก)
      const subItemMatch = line.match(/^([\(（][0-9๑-๙ivxIVXก-ฮa-zA-Z]+[\)）])/);
      if (subItemMatch) {
        return {
          label: `อนุ ${subItemMatch[1]}`,
          text: line,
        };
      }

      // Check if explicit label in text like "วรรคสอง"
      const explicitVak = line.match(/^(วรรค[^\s]+)/);
      if (explicitVak) {
        return {
          label: explicitVak[1],
          text: line.replace(/^(วรรค[^\s]+)\s*/, ''),
        };
      }

      paragraphCount++;
      const label = `วรรค${thaiNumbers[paragraphCount - 1] || paragraphCount}`;
      return {
        label,
        text: line,
      };
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSecInput = stripFootnotes(sectionNumber).trim();
    const cleanFullTextInput = stripFootnotes(fullText).trim();

    if (!cleanSecInput || !cleanFullTextInput) {
      alert('กรุณากรอกเลขมาตราและตัวบทกฎหมาย');
      return;
    }

    const selectedDeck = decks.find(d => d.id === deckId) || decks.find(d => d.id === card.deckId) || decks[0];
    const rawNum = parseRawSectionNumber(cleanSecInput) || card.sectionRawNum || 1;

    let paragraphs: LawParagraph[] | undefined = undefined;
    if (autoParagraphs) {
      paragraphs = computeParagraphs(cleanFullTextInput);
    } else {
      paragraphs = card.paragraphs;
    }

    const formattedSecNum = cleanSecInput.startsWith('มาตรา') ? cleanSecInput : `มาตรา ${cleanSecInput}`;

    const updatedCard: LawCard = {
      ...card,
      deckId: selectedDeck ? selectedDeck.id : card.deckId,
      deckName: selectedDeck ? selectedDeck.name : card.deckName,
      deckShortName: selectedDeck ? selectedDeck.shortName : card.deckShortName,
      sectionNumber: formattedSecNum,
      sectionRawNum: rawNum,
      title: title.trim() || undefined,
      fullText: cleanFullTextInput,
      paragraphs: paragraphs && paragraphs.length > 0 ? paragraphs : undefined,
      book: book.trim() || undefined,
      titleStructure: titleStructure.trim() || undefined,
      chapter: chapter.trim() || undefined,
      part: part.trim() || undefined,
      isVerified: true,
    };

    onSaveCard(updatedCard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-zinc-200/80 shadow-2xl overflow-hidden text-zinc-900">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900">แก้ไขข้อมูลมาตรา</h3>
              <p className="text-[11px] text-zinc-500">ปรับปรุงตัวบท หัวข้อ หรือหมวดหมู่ของมาตรานี้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Deck select */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              สังกัดสำรับกฎหมาย
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                เลขมาตรา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sectionNumber}
                onChange={(e) => setSectionNumber(e.target.value)}
                placeholder="เช่น มาตรา ๑ หรือ 1"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                ชื่อเรื่อง / หัวข้อมาตรา (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ความหมายของเอกสาร, โมฆียกรรม"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
          </div>

          {/* Full Statutory Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-700">
                ตัวบทกฎหมายฉบับเต็ม <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                เว้นบรรทัด 2 ครั้ง เพื่อแยกวรรค
              </span>
            </div>
            <textarea
              required
              rows={7}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="กรอกหรือวางตัวบทกฎหมายที่ถูกต้อง..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors font-serif leading-relaxed"
            />
          </div>

          {/* Auto paragraph toggle */}
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200/60">
            <span className="text-xs text-zinc-600 font-medium">
              จัดแบ่งวรรคและอนุมาตราอัตโนมัติ
            </span>
            <input
              type="checkbox"
              id="auto-paragraphs-toggle"
              checked={autoParagraphs}
              onChange={(e) => setAutoParagraphs(e.target.checked)}
              className="w-4 h-4 accent-zinc-900 rounded cursor-pointer"
            />
          </div>

          {/* Collapsible Hierarchy Structure */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowStructure(!showStructure)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span>โครงสร้างกฎหมาย (บรรพ / ลักษณะ / หมวด / ส่วน)</span>
              </div>
              {showStructure ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>

            {showStructure && (
              <div className="p-3.5 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-zinc-200">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    บรรพ / ภาค
                  </label>
                  <input
                    type="text"
                    value={book}
                    onChange={(e) => setBook(e.target.value)}
                    placeholder="เช่น บรรพ ๑ หลักทั่วไป"
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    ลักษณะ
                  </label>
                  <input
                    type="text"
                    value={titleStructure}
                    onChange={(e) => setTitleStructure(e.target.value)}
                    placeholder="เช่น ลักษณะ ๑ บทเบ็ดเสร็จทั่วไป"
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    หมวด
                  </label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="เช่น หมวด ๑ บุคคลธรรมดา"
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    ส่วนที่ / ส่วน
                  </label>
                  <input
                    type="text"
                    value={part}
                    onChange={(e) => setPart(e.target.value)}
                    placeholder="เช่น ส่วนที่ ๑ สภาพบุคคล"
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
