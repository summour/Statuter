import React, { useState, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  Check
} from 'lucide-react';
import { LawDeck, LawCard, ParsedLawSection, ImportAuditReport } from '../types';
import { parseThaiLawText, extractParagraphs, stripFootnotes } from '../utils/thaiLawParser';
import { SAMPLE_CIVIL_CODE_TEXT } from '../data/sampleLawText';

interface ImportLawModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: LawDeck[];
  existingCards: LawCard[];
  onImportSuccess: (newCards: LawCard[], targetDeck: LawDeck, duplicateAction: 'replace' | 'skip' | 'keep-both') => void;
  onAddNewDeck?: (newDeck: LawDeck) => void;
  defaultDeckId?: string;
}

type TabMode = 'input' | 'report' | 'review';

export const ImportLawModal: React.FC<ImportLawModalProps> = ({
  isOpen,
  onClose,
  decks,
  existingCards,
  onImportSuccess,
  defaultDeckId,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('input');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [targetDeckId, setTargetDeckId] = useState<string>(defaultDeckId || (decks[1]?.id || decks[0]?.id || 'civil'));
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<ImportAuditReport | null>(null);
  const [filterAmendingActs, setFilterAmendingActs] = useState<boolean>(true);
  const [filterFootnotes, setFilterFootnotes] = useState<boolean>(true);
  const [viewParagraphsMode, setViewParagraphsMode] = useState<'structured' | 'raw'>('structured');
  const [excludeRepealedSections, setExcludeRepealedSections] = useState<boolean>(false);
  const [importOnlyPrimarySections, setImportOnlyPrimarySections] = useState<boolean>(false);

  React.useEffect(() => {
    if (defaultDeckId) {
      setTargetDeckId(defaultDeckId);
    } else if (decks.length > 0 && !decks.some(d => d.id === targetDeckId)) {
      setTargetDeckId(decks[0].id);
    }
  }, [defaultDeckId, decks, isOpen]);
  
  // Staging Review State
  const [stagedSections, setStagedSections] = useState<ParsedLawSection[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'valid' | 'uncertain' | 'duplicate' | 'error' | 'primary' | 'inserted' | 'repealed'>('all');
  const [reviewSearch, setReviewSearch] = useState<string>('');
  const [editingSection, setEditingSection] = useState<ParsedLawSection | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'replace' | 'skip' | 'keep-both'>('replace');
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected target deck or fallback dynamically created deck
  const selectedDeck: LawDeck = decks.find(d => d.id === targetDeckId) || decks[0] || {
    id: `deck-${Date.now()}`,
    name: auditReport?.lawNameDetected || 'สำรับกฎหมายนำเข้า',
    shortName: auditReport?.lawNameDetected ? auditReport.lawNameDetected.substring(0, 10) : 'กฎหมาย',
    description: '',
    category: 'code',
    categoryLabel: 'ประมวลกฎหมาย',
    iconName: 'Scale',
  };

  // Handle file drop / selection
  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };

  // Run parser
  const handleStartParsing = (customFilterAmending?: boolean, customFilterFootnotes?: boolean) => {
    if (!rawText.trim()) return;
    setIsParsing(true);

    const shouldFilter = customFilterAmending !== undefined ? customFilterAmending : filterAmendingActs;
    const shouldFilterFn = customFilterFootnotes !== undefined ? customFilterFootnotes : filterFootnotes;

    setTimeout(() => {
      try {
        const report = parseThaiLawText(rawText, {
          existingCards,
          targetDeckId,
          filterAmendingActs: shouldFilter,
          filterFootnotes: shouldFilterFn,
        });
        setAuditReport(report);
        setStagedSections(report.sections);
        setActiveTab('report');
      } catch (err) {
        console.error('Parsing error', err);
        alert('เกิดข้อผิดพลาดในการแยกตัวบทกฎหมาย กรุณาตรวจสอบไฟล์');
      } finally {
        setIsParsing(false);
      }
    }, 100);
  };

  // Load preset sample text (Civil code)
  const handleLoadSample = () => {
    setRawText(SAMPLE_CIVIL_CODE_TEXT);
    setFileName('ประมวลกฎหมายแพ่งและพาณิชย์_ฉบับสมบูรณ์.txt');
    setTargetDeckId('civil');
  };

  // Filter staged sections
  const filteredStagedSections = useMemo(() => {
    return stagedSections.filter(sec => {
      // Direct filters
      if (excludeRepealedSections && sec.isRepealed) return false;
      if (importOnlyPrimarySections && sec.isInsertedSection) return false;

      // Status filter
      if (reviewFilter === 'valid' && sec.status !== 'valid') return false;
      if (reviewFilter === 'uncertain' && sec.status !== 'uncertain') return false;
      if (reviewFilter === 'duplicate' && sec.status !== 'duplicate') return false;
      if (reviewFilter === 'error' && sec.status !== 'error') return false;
      if (reviewFilter === 'primary' && !sec.isPrimarySection) return false;
      if (reviewFilter === 'inserted' && !sec.isInsertedSection) return false;
      if (reviewFilter === 'repealed' && !sec.isRepealed) return false;

      // Search filter
      if (reviewSearch.trim()) {
        const q = reviewSearch.toLowerCase().trim();
        const inSecNum = sec.sectionNumber.toLowerCase().includes(q);
        const inText = sec.fullText.toLowerCase().includes(q);
        const inBook = (sec.book || '').toLowerCase().includes(q);
        const inTitle = (sec.title || '').toLowerCase().includes(q);
        return inSecNum || inText || inBook || inTitle;
      }
      return true;
    });
  }, [stagedSections, reviewFilter, reviewSearch, excludeRepealedSections, importOnlyPrimarySections]);

  // Update a staged section after user edits it
  const handleSaveSectionEdit = (updated: ParsedLawSection) => {
    const cleanedText = filterFootnotes ? stripFootnotes(updated.fullText) : updated.fullText;
    const cleanedSecNum = filterFootnotes ? stripFootnotes(updated.sectionNumber) : updated.sectionNumber;
    const freshParagraphs = extractParagraphs(cleanedText, filterFootnotes);
    setStagedSections(prev => prev.map(s => s.tempId === updated.tempId ? { 
      ...updated, 
      sectionNumber: cleanedSecNum,
      fullText: cleanedText,
      paragraphs: freshParagraphs,
      isResolved: true, 
      status: 'valid',
      uncertaintyReason: undefined
    } : s));
    setEditingSection(null);
  };

  // Delete/dismiss section from staging
  const handleDeleteSection = (tempId: string) => {
    setStagedSections(prev => prev.filter(s => s.tempId !== tempId));
  };

  // Final Commit Import
  const handleConfirmImport = () => {
    if (!stagedSections.length) return;

    // Filter items to import based on duplicate action, error removal, and options
    let validOrResolved = stagedSections.filter(s => s.status !== 'error');

    if (excludeRepealedSections) {
      validOrResolved = validOrResolved.filter(s => !s.isRepealed);
    }
    if (importOnlyPrimarySections) {
      validOrResolved = validOrResolved.filter(s => !s.isInsertedSection);
    }

    const newCardsToImport: LawCard[] = validOrResolved.map(s => ({
      id: s.duplicateCardId && duplicateAction === 'replace' ? s.duplicateCardId : `card_${Date.now()}_${s.sectionRawNum}_${Math.random().toString(36).substring(2, 7)}`,
      deckId: selectedDeck.id,
      deckName: selectedDeck.name,
      deckShortName: selectedDeck.shortName,
      book: s.book,
      titleStructure: s.titleStructure,
      chapter: s.chapter,
      part: s.part,
      sectionNumber: s.sectionNumber,
      sectionRawNum: s.sectionRawNum,
      title: s.title,
      fullText: s.fullText,
      paragraphs: s.paragraphs,
      isVerified: true,
      createdAt: Date.now(),
    }));

    onImportSuccess(newCardsToImport, selectedDeck, duplicateAction);
    onClose();
  };

  // Export audit report as JSON
  const handleExportJSON = () => {
    if (!stagedSections.length) return;
    const exportData = {
      lawName: auditReport?.lawNameDetected || selectedDeck.name,
      exportedAt: new Date().toISOString(),
      totalSections: stagedSections.length,
      sections: stagedSections,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal_sections_${selectedDeck.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-zinc-900 rounded-2xl max-w-4xl w-full h-[90vh] max-h-[850px] shadow-2xl flex flex-col border border-zinc-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-zinc-900">นำเข้าตัวบทกฎหมาย</h2>
          </div>

          <button
            id="close-import-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex border-b border-zinc-200 bg-white px-6">
          <button
            id="import-tab-input-btn"
            onClick={() => setActiveTab('input')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'input'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-bold flex items-center justify-center">1</span>
            นำเข้าไฟล์ / วางข้อความ
          </button>

          <button
            id="import-tab-report-btn"
            disabled={!auditReport}
            onClick={() => auditReport && setActiveTab('report')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              !auditReport ? 'opacity-40 cursor-not-allowed border-transparent text-zinc-300' :
              activeTab === 'report'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-bold flex items-center justify-center">2</span>
            รายงานผลการตรวจสอบ
            {auditReport && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-zinc-100 text-zinc-700 rounded-md">
                {auditReport.totalCount} มาตรา
              </span>
            )}
          </button>

          <button
            id="import-tab-review-btn"
            disabled={!auditReport}
            onClick={() => auditReport && setActiveTab('review')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              !auditReport ? 'opacity-40 cursor-not-allowed border-transparent text-zinc-300' :
              activeTab === 'review'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-bold flex items-center justify-center">3</span>
            รายการรอตรวจสอบ & แก้ไข
            {auditReport && (auditReport.uncertainCount > 0 || auditReport.duplicateCount > 0) && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                {auditReport.uncertainCount + auditReport.duplicateCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
          
          {/* TAB 1: INPUT / FILE UPLOAD */}
          {activeTab === 'input' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              
              {/* Target Deck Selector */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <label className="block text-xs font-bold text-zinc-700 mb-2">
                  เลือกสำรับกฎหมายเป้าหมาย
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {decks.length === 0 ? (
                    <div className="col-span-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                      สร้างสำรับใหม่อัตโนมัติจากชื่อกฎหมายที่ตรวจพบ
                    </div>
                  ) : (
                    decks.map(deck => (
                      <div
                        key={deck.id}
                        onClick={() => setTargetDeckId(deck.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          targetDeckId === deck.id
                            ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                            : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/80 text-zinc-800'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs">{deck.name}</div>
                          <div className={`text-[11px] ${targetDeckId === deck.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {deck.shortName} • {deck.categoryLabel}
                          </div>
                        </div>
                        {targetDeckId === deck.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upload Drop Zone & Preset Button */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-700">อัปโหลดไฟล์หรือวางข้อความตัวบท</span>
                <button
                  id="load-sample-civil-code-btn"
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors border border-zinc-300 cursor-pointer"
                >
                  โหลดตัวอย่าง ป.พ.พ.
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-zinc-300 hover:border-zinc-900 bg-white p-6 rounded-2xl text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json,.law,.csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="text-xs font-bold text-zinc-800">
                  {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ตัวบทกฎหมาย (.txt, .law, .json) หรือลากไฟล์มาวาง'}
                </div>
              </div>

              {/* Raw Text Textarea */}
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-700">
                    ข้อความตัวบทกฎหมาย
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {rawText.length.toLocaleString()} ตัวอักษร • {rawText.split('\n').length.toLocaleString()} บรรทัด
                  </span>
                </div>
                <textarea
                  id="law-raw-text-input"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="วางเนื้อหาตัวบทกฎหมายที่นี่..."
                  rows={9}
                  className="w-full text-xs font-mono bg-zinc-50 p-3 rounded-lg border border-zinc-200 focus:border-zinc-400 focus:bg-white focus:outline-none resize-y leading-relaxed text-zinc-800"
                />
              </div>

              {/* Smart Law Filtering Options */}
              <div className="space-y-2.5">
                {/* Filter Footnotes Option */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="filter-footnotes-checkbox"
                    checked={filterFootnotes}
                    onChange={(e) => setFilterFootnotes(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                  <label htmlFor="filter-footnotes-checkbox" className="text-xs text-zinc-800 cursor-pointer">
                    <span className="font-semibold text-zinc-900 block">
                      กรองเชิงอรรถออก
                    </span>
                  </label>
                </div>

                {/* Filter Amending Acts Option */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="filter-amending-checkbox"
                    checked={filterAmendingActs}
                    onChange={(e) => setFilterAmendingActs(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                  <label htmlFor="filter-amending-checkbox" className="text-xs text-zinc-800 cursor-pointer">
                    <span className="font-semibold text-zinc-900 block">
                      นำเข้าเฉพาะตัวบทกฎหมายหลัก (ตัด พ.ร.บ. แก้ไขเพิ่มเติม)
                    </span>
                  </label>
                </div>
              </div>

              {/* Parse Action Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  id="start-parsing-btn"
                  disabled={!rawText.trim() || isParsing}
                  onClick={() => handleStartParsing(filterAmendingActs, filterFootnotes)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer ${
                    !rawText.trim() || isParsing
                      ? 'bg-zinc-300 cursor-not-allowed'
                      : 'bg-zinc-900 hover:bg-zinc-800'
                  }`}
                >
                  {isParsing ? 'กำลังแยกโครงสร้าง...' : 'เริ่มแยกและตรวจสอบตัวบท'}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: AUDIT REPORT & SUMMARY */}
          {activeTab === 'report' && auditReport && (
            <div className="space-y-4 max-w-3xl mx-auto">
              
              {/* Header Law Title Banner */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    {auditReport.lawNameDetected}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-500">
                    <span className="font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                      เป้าหมาย: {selectedDeck.name}
                    </span>
                    {auditReport.footnotesCleanedCount !== undefined && auditReport.footnotesCleanedCount > 0 && (
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                        กรองเชิงอรรถออก {auditReport.footnotesCleanedCount} จุด
                      </span>
                    )}
                    <span>
                      {(auditReport.rawTextLength / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 transition-colors cursor-pointer"
                >
                  ส่งออก JSON
                </button>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total */}
                <div className="bg-white p-3 rounded-xl border border-zinc-200 text-center">
                  <div className="text-[11px] font-semibold text-zinc-500">มาตราทั้งหมด</div>
                  <div className="text-xl font-bold text-zinc-900 mt-0.5">{auditReport.totalCount}</div>
                </div>

                {/* Valid */}
                <div className="bg-white p-3 rounded-xl border border-zinc-200 text-center">
                  <div className="text-[11px] font-semibold text-emerald-700">พร้อมนำเข้า</div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">{auditReport.validCount}</div>
                </div>

                {/* Uncertain */}
                <div 
                  onClick={() => { setReviewFilter('uncertain'); setActiveTab('review'); }}
                  className="bg-white hover:bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center cursor-pointer transition-colors"
                >
                  <div className="text-[11px] font-semibold text-amber-700">รอตรวจสอบ</div>
                  <div className="text-xl font-bold text-amber-700 mt-0.5">{auditReport.uncertainCount}</div>
                </div>

                {/* Duplicate */}
                <div 
                  onClick={() => { setReviewFilter('duplicate'); setActiveTab('review'); }}
                  className="bg-white hover:bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center cursor-pointer transition-colors"
                >
                  <div className="text-[11px] font-semibold text-zinc-700">มาตราซ้ำ</div>
                  <div className="text-xl font-bold text-zinc-800 mt-0.5">{auditReport.duplicateCount}</div>
                </div>
              </div>

              {/* Breakdown & Toggles */}
              <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-[11px] text-zinc-500 block">มาตราหลัก</span>
                    <span className="text-base font-bold text-zinc-900 mt-0.5 block">{auditReport.primaryCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-[11px] text-zinc-500 block">มาตราแทรก</span>
                    <span className="text-base font-bold text-zinc-900 mt-0.5 block">+{auditReport.insertedCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <span className="text-[11px] text-zinc-500 block">ยกเลิกแล้ว</span>
                    <span className="text-base font-bold text-zinc-900 mt-0.5 block">{auditReport.repealedCount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                  <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer text-xs text-zinc-800">
                    <input
                      type="checkbox"
                      checked={excludeRepealedSections}
                      onChange={(e) => setExcludeRepealedSections(e.target.checked)}
                      className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                    />
                    <span>ข้ามมาตราที่ถูกยกเลิกแล้ว ({auditReport.repealedCount})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer text-xs text-zinc-800">
                    <input
                      type="checkbox"
                      checked={importOnlyPrimarySections}
                      onChange={(e) => setImportOnlyPrimarySections(e.target.checked)}
                      className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                    />
                    <span>นำเข้าเฉพาะมาตราหลัก 1-1755</span>
                  </label>
                </div>
              </div>

              {/* Duplicate Handling Selector */}
              {auditReport.duplicateCount > 0 && (
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
                  <div className="text-xs font-semibold text-zinc-800">
                    จัดการมาตราซ้ำ ({auditReport.duplicateCount} รายการ):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      duplicateAction === 'replace' ? 'bg-white border-zinc-900 font-bold text-zinc-900 shadow-2xs' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        checked={duplicateAction === 'replace'}
                        onChange={() => setDuplicateAction('replace')}
                        className="text-zinc-900"
                      />
                      แทนที่ของเดิม
                    </label>

                    <label className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      duplicateAction === 'skip' ? 'bg-white border-zinc-900 font-bold text-zinc-900 shadow-2xs' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        checked={duplicateAction === 'skip'}
                        onChange={() => setDuplicateAction('skip')}
                        className="text-zinc-900"
                      />
                      ข้ามรายการที่ซ้ำ
                    </label>

                    <label className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      duplicateAction === 'keep-both' ? 'bg-white border-zinc-900 font-bold text-zinc-900 shadow-2xs' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        checked={duplicateAction === 'keep-both'}
                        onChange={() => setDuplicateAction('keep-both')}
                        className="text-zinc-900"
                      />
                      บันทึกเพิ่มทั้งคู่
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveTab('input')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                >
                  กลับไปแก้ไข
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id="review-staged-btn"
                    onClick={() => setActiveTab('review')}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer border border-zinc-200"
                  >
                    ตรวจดูรายมาตรา ({stagedSections.length})
                  </button>

                  <button
                    id="commit-import-btn"
                    onClick={handleConfirmImport}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-transform cursor-pointer"
                  >
                    ยืนยันนำเข้า {stagedSections.filter(s => s.status !== 'error' && (!excludeRepealedSections || !s.isRepealed) && (!importOnlyPrimarySections || !s.isInsertedSection)).length} มาตรา
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: STAGING REVIEW & EDIT */}
          {activeTab === 'review' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              
              {/* Filter, Search, and Paragraph View Mode Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setReviewFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        reviewFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      ทั้งหมด ({stagedSections.length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('primary')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        reviewFilter === 'primary' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      มาตราหลัก 1-1755 ({stagedSections.filter(s => s.isPrimarySection).length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('inserted')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        reviewFilter === 'inserted' ? 'bg-blue-700 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
                      }`}
                    >
                      มาตราแทรก (/ หรือ ทวิ) ({stagedSections.filter(s => s.isInsertedSection).length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('repealed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        reviewFilter === 'repealed' ? 'bg-rose-700 text-white' : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                      }`}
                    >
                      ยกเลิกแล้ว ({stagedSections.filter(s => s.isRepealed).length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('valid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        reviewFilter === 'valid' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      พร้อมนำเข้า ({stagedSections.filter(s => s.status === 'valid').length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('uncertain')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        reviewFilter === 'uncertain' ? 'bg-amber-700 text-white' : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                      }`}
                    >
                      ⚠️ รอตรวจสอบ ({stagedSections.filter(s => s.status === 'uncertain').length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('duplicate')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        reviewFilter === 'duplicate' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      🔄 ซ้ำ ({stagedSections.filter(s => s.status === 'duplicate').length})
                    </button>
                  </div>

                  {/* View Mode Selector (Structured Paragraphs vs Raw Verbatim) */}
                  <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
                    <button
                      onClick={() => setViewParagraphsMode('structured')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        viewParagraphsMode === 'structured'
                          ? 'bg-white text-zinc-900 shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      แยกวรรค/อนุ
                    </button>
                    <button
                      onClick={() => setViewParagraphsMode('raw')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        viewParagraphsMode === 'raw'
                          ? 'bg-white text-zinc-900 shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      ตัวบทเต็ม
                    </button>
                  </div>
                </div>

                {/* Search in results */}
                <div className="relative w-full">
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="ค้นหา (เลขมาตรา, วรรค, ข้อความ, หมวด)..."
                    className="w-full px-3 py-1.5 text-xs bg-zinc-100 focus:bg-white rounded-lg border border-zinc-200 focus:border-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* List of Sections */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredStagedSections.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-zinc-200 text-zinc-400 text-xs">
                    ไม่พบมาตราในหมวดหมู่นี้
                  </div>
                ) : (
                  filteredStagedSections.map((sec, idx) => {
                    const paragraphCount = sec.paragraphs?.filter(p => p.label.startsWith('วรรค')).length || 1;
                    const subItemCount = sec.paragraphs?.filter(p => p.label.startsWith('(')).length || 0;

                    return (
                      <div
                        key={sec.tempId}
                        className="p-4 rounded-xl border bg-white border-zinc-200 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-lg border border-zinc-200">
                                {sec.sectionNumber}
                              </span>
                              
                              {sec.book && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium">
                                  {sec.book}
                                </span>
                              )}

                              {sec.titleStructure && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium hidden sm:inline">
                                  {sec.titleStructure}
                                </span>
                              )}

                              {sec.isInsertedSection ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  มาตราแทรก
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  มาตราหลัก
                                </span>
                              )}

                              {sec.isRepealed && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                  (ยกเลิก)
                                </span>
                              )}

                              <span className="text-[10px] text-zinc-500">
                                {paragraphCount} วรรค{subItemCount > 0 ? ` • ${subItemCount} อนุ` : ''}
                              </span>

                              {sec.status === 'valid' && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  พร้อมนำเข้า
                                </span>
                              )}

                              {sec.status === 'uncertain' && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                  รอตรวจสอบ
                                </span>
                              )}

                              {sec.status === 'duplicate' && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  ซ้ำกับในระบบ
                                </span>
                              )}

                              {sec.status === 'error' && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                  ผิดรูปแบบ
                                </span>
                              )}
                            </div>

                            {sec.uncertaintyReason && (
                              <div className="text-[11px] text-amber-800 font-medium mt-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                หมายเหตุ: {sec.uncertaintyReason}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingSection(sec)}
                              className="px-2.5 py-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec.tempId)}
                              className="px-2.5 py-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>

                        {viewParagraphsMode === 'structured' && sec.paragraphs && sec.paragraphs.length > 0 ? (
                          <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
                            {sec.paragraphs.map((p, pIdx) => {
                              const isSubItem = p.label.startsWith('(');
                              return (
                                <div 
                                  key={pIdx} 
                                  className={`flex items-start gap-2 ${isSubItem ? 'pl-4 sm:pl-6' : ''}`}
                                >
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 mt-0.5 select-none ${
                                    isSubItem 
                                      ? 'bg-zinc-200 text-zinc-700 font-mono' 
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {p.label}
                                  </span>
                                  <p className="text-xs sm:text-sm font-serif text-zinc-900 leading-relaxed">
                                    {p.text}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs leading-relaxed font-serif text-zinc-800 max-h-36 overflow-y-auto whitespace-pre-wrap">
                            {sec.fullText}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                <button
                  onClick={() => setActiveTab('report')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                >
                  กลับหน้ารายงาน
                </button>

                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-transform cursor-pointer"
                >
                  ยืนยันนำเข้า {stagedSections.filter(s => s.status !== 'error' && (!excludeRepealedSections || !s.isRepealed) && (!importOnlyPrimarySections || !s.isInsertedSection)).length} มาตรา สู่ระบบ
                </button>
              </div>

            </div>
          )}

        </div>

        {/* INLINE EDIT MODAL FOR SINGLE SECTION */}
        {editingSection && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-zinc-900">แก้ไขข้อมูลมาตราและวรรค/อนุ</h3>
                <button 
                  onClick={() => setEditingSection(null)}
                  className="text-zinc-400 hover:text-zinc-700 w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">เลขมาตรา</label>
                  <input
                    type="text"
                    value={editingSection.sectionNumber}
                    onChange={(e) => setEditingSection({ ...editingSection, sectionNumber: e.target.value })}
                    className="w-full p-2 bg-zinc-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">บรรพ / ภาค</label>
                  <input
                    type="text"
                    value={editingSection.book || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, book: e.target.value })}
                    className="w-full p-2 bg-zinc-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">ลักษณะ</label>
                  <input
                    type="text"
                    value={editingSection.titleStructure || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, titleStructure: e.target.value })}
                    className="w-full p-2 bg-zinc-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">หมวด / ส่วน</label>
                  <input
                    type="text"
                    value={editingSection.chapter || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, chapter: e.target.value })}
                    className="w-full p-2 bg-zinc-50 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  เนื้อหาตัวบทฉบับเต็ม (Verbatim Text)
                </label>
                <textarea
                  rows={5}
                  value={editingSection.fullText}
                  onChange={(e) => setEditingSection({ ...editingSection, fullText: e.target.value })}
                  className="w-full p-3 text-xs font-serif bg-zinc-50 border rounded-lg focus:bg-white focus:outline-none leading-relaxed"
                />
              </div>

              {/* LIVE PARAGRAPH & SUB-ITEM PREVIEW */}
              {editingSection.fullText && (
                <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-zinc-200">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                    ตัวอย่างผลการแยกวรรคและอนุมาตราอัตโนมัติ (Live Preview):
                  </span>
                  <div className="space-y-2">
                    {extractParagraphs(editingSection.fullText).map((p, pIdx) => {
                      const isSub = p.label.startsWith('(');
                      return (
                        <div key={pIdx} className={`flex items-start gap-2 ${isSub ? 'pl-4' : ''}`}>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSub ? 'bg-zinc-200 text-zinc-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {p.label}
                          </span>
                          <span className="text-xs font-serif text-zinc-800 leading-snug">
                            {p.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleSaveSectionEdit(editingSection)}
                  className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg cursor-pointer shadow-xs"
                >
                  บันทึกและอนุมัติมาตรานี้
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
