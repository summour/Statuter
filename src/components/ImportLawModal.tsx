import React, { useState, useMemo, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  XCircle, 
  Layers, 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Search, 
  Sparkles,
  Database,
  RefreshCw,
  FolderPlus,
  BookOpen,
  Info,
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
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-zinc-900">นำเข้าข้อมูลตัวบทกฎหมาย</h2>
            </div>
          </div>

          <button
            id="close-import-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
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
                  เลือกสำรับกฎหมายเป้าหมายที่จะนำเข้า (Target Legal Deck)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {decks.length === 0 ? (
                    <div className="col-span-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                      ✨ ระบบจะสร้างสำรับใหม่อัตโนมัติจากชื่อกฎหมายที่ตรวจพบในเนื้อหา
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors border border-zinc-300 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  โหลดตัวอย่าง ป.พ.พ. (จากไฟล์ที่ส่งมา)
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
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white text-zinc-600 flex items-center justify-center transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-zinc-800">
                  {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ตัวบทกฎหมาย (.txt, .law, .json) หรือลากไฟล์มาวางที่นี่'}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  รองรับข้อมูลขนาดใหญ่ แยกโครงสร้าง บรรพ/ลักษณะ/หมวด/มาตรา ได้อย่างแม่นยำ 100%
                </p>
              </div>

              {/* Raw Text Textarea */}
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-700">
                    กล่องข้อความตัวบทกฎหมาย (Raw Legal Text)
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {rawText.length.toLocaleString()} ตัวอักษร • {rawText.split('\n').length.toLocaleString()} บรรทัด
                  </span>
                </div>
                <textarea
                  id="law-raw-text-input"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="วางเนื้อหาตัวบทกฎหมายที่นี่ เช่น&#10;บรรพ ๑ หลักทั่วไป&#10;ลักษณะ ๑ บทเบ็ดเสร็จทั่วไป&#10;มาตรา ๔ กฎหมายนั้น ต้องใช้ในบรรดากรณี..."
                  rows={9}
                  className="w-full text-xs font-mono bg-zinc-50 p-3 rounded-lg border border-zinc-200 focus:border-zinc-400 focus:bg-white focus:outline-none resize-y leading-relaxed text-zinc-800"
                />
              </div>

              {/* Smart Law Filtering Options */}
              <div className="space-y-2.5">
                {/* Filter Footnotes Option */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="filter-footnotes-checkbox"
                    checked={filterFootnotes}
                    onChange={(e) => setFilterFootnotes(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                  <label htmlFor="filter-footnotes-checkbox" className="text-xs text-zinc-800 cursor-pointer">
                    <span className="font-bold text-zinc-900 block flex items-center gap-1.5">
                      <span>✨</span> กรองเอาเชิงอรรถออก เช่น [1], [2], [๕๓] (แนะนำ)
                    </span>
                    <span className="text-[11px] text-zinc-600 block mt-0.5">
                      ตัดเครื่องหมายเชิงอรรถในวงเล็บเหลี่ยม [...] และข้อความอ้างอิงประวัติการแก้ไขออก เพื่อให้ตัวบทกฎหมายสะอาด กระชับ พร้อมสำหรับการท่องจำ
                    </span>
                  </label>
                </div>

                {/* Filter Amending Acts Option */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="filter-amending-checkbox"
                    checked={filterAmendingActs}
                    onChange={(e) => setFilterAmendingActs(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                  <label htmlFor="filter-amending-checkbox" className="text-xs text-zinc-800 cursor-pointer">
                    <span className="font-bold text-zinc-900 block">
                      นำเข้าเฉพาะตัวบทกฎหมายหลัก (ตัด พ.ร.บ. แก้ไขเพิ่มเติมและเชิงอรรถท้ายเล่มออกอัตโนมัติ)
                    </span>
                    <span className="text-[11px] text-zinc-600 block mt-0.5">
                      แนะนำเปิดไว้เสมอสำหรับการนำเข้าตัวบทหลัก (เช่น มาตรา ๑ - ๑๗๕๕) เพื่อป้องกันเลขมาตราซ้ำซ้อนจาก พ.ร.บ. แก้ไขเพิ่มเติมท้ายฉบับ
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
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer ${
                    !rawText.trim() || isParsing
                      ? 'bg-zinc-300 cursor-not-allowed'
                      : 'bg-zinc-900 hover:bg-zinc-800 hover:scale-[1.02]'
                  }`}
                >
                  {isParsing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      กำลังแยกโครงสร้างกฎหมายและกรองเชิงอรรถ...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      เริ่มแยกและตรวจสอบตัวบทกฎหมาย (Parse & Verify)
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: AUDIT REPORT & SUMMARY */}
          {activeTab === 'report' && auditReport && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {/* Header Law Title Banner */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">กฎหมายที่ตรวจพบ (Detected Law)</span>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5">
                    {auditReport.lawNameDetected}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                      เป้าหมาย: {selectedDeck.name}
                    </span>
                    {auditReport.footnotesCleanedCount !== undefined && auditReport.footnotesCleanedCount > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <span>✨</span> กรองเชิงอรรถออก {auditReport.footnotesCleanedCount} จุด
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">
                      ขนาดข้อมูล: {(auditReport.rawTextLength / 1024).toFixed(1)} KB • วันที่: {new Date(auditReport.parsedAt).toLocaleTimeString('th-TH')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 transition-colors cursor-pointer"
                    title="ดาวน์โหลดข้อมูลเป็นไฟล์ JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    ส่งออก JSON
                  </button>
                </div>
              </div>

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Total */}
                <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs text-center">
                  <div className="text-[11px] font-bold text-zinc-400">มาตราทั้งหมด</div>
                  <div className="text-xl font-extrabold text-zinc-900 mt-1">{auditReport.totalCount}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">ตรวจพบในไฟล์</div>
                </div>

                {/* Valid */}
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-xs text-center">
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> พร้อมนำเข้า
                  </div>
                  <div className="text-xl font-extrabold text-emerald-900 mt-1">{auditReport.validCount}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">รูปแบบสมบูรณ์</div>
                </div>

                {/* Uncertain */}
                <div 
                  onClick={() => { setReviewFilter('uncertain'); setActiveTab('review'); }}
                  className="bg-amber-50/60 hover:bg-amber-50 p-3.5 rounded-xl border border-amber-200 shadow-xs text-center cursor-pointer transition-colors"
                >
                  <div className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> รอตรวจสอบ
                  </div>
                  <div className="text-xl font-extrabold text-amber-900 mt-1">{auditReport.uncertainCount}</div>
                  <div className="text-[10px] text-amber-600 mt-0.5 underline">ดูรายการที่สงสัย</div>
                </div>

                {/* Duplicate */}
                <div 
                  onClick={() => { setReviewFilter('duplicate'); setActiveTab('review'); }}
                  className="bg-blue-50/60 hover:bg-blue-50 p-3.5 rounded-xl border border-blue-200 shadow-xs text-center cursor-pointer transition-colors"
                >
                  <div className="text-[11px] font-bold text-blue-700 flex items-center justify-center gap-1">
                    <Copy className="w-3 h-3" /> มาตราซ้ำ
                  </div>
                  <div className="text-xl font-extrabold text-blue-900 mt-1">{auditReport.duplicateCount}</div>
                  <div className="text-[10px] text-blue-600 mt-0.5 underline">พบในฐานเดิม</div>
                </div>

                {/* Error */}
                <div 
                  onClick={() => { setReviewFilter('error'); setActiveTab('review'); }}
                  className="bg-rose-50/60 hover:bg-rose-50 p-3.5 rounded-xl border border-rose-200 shadow-xs text-center cursor-pointer transition-colors"
                >
                  <div className="text-[11px] font-bold text-rose-700 flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" /> ผิดรูปแบบ
                  </div>
                  <div className="text-xl font-extrabold text-rose-900 mt-1">{auditReport.errorCount}</div>
                  <div className="text-[10px] text-rose-600 mt-0.5 underline">ข้อความว่าง</div>
                </div>
              </div>

              {/* Detailed Breakdown: 1,755 Primary vs Inserted Sections */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                      <span>💡</span>
                      <span>แจกแจงจำนวนมาตรา: ป.พ.พ. มี 1,755 มาตราหลัก (ตรวจพบ {auditReport.totalCount} รายการ)</span>
                    </h4>
                    <p className="text-[11px] sm:text-xs text-amber-900/80 mt-1 leading-relaxed">
                      ตามประวัติศาสตร์การแก้ไขกฎหมายไทย มีการแทรกมาตราใหม่ระหว่างมาตราเดิมด้วยเลขทับและคำต่อท้าย (ทวิ, ตรี, จัตวา) ทำให้จำนวนมาตราทั้งหมดในตัวบทมีมากกว่าเลขลำดับสุดท้าย ๑๗๕๕
                    </p>
                  </div>
                </div>

                {/* 3 Mini Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">1. มาตราลำดับหลัก</span>
                    <span className="text-lg font-black text-zinc-900 block mt-0.5">{auditReport.primaryCount}</span>
                    <span className="text-[10px] text-zinc-500">มาตรา ๑ ถึง ๑๗๕๕</span>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">2. มาตราแทรกใหม่</span>
                    <span className="text-lg font-black text-blue-700 block mt-0.5">+{auditReport.insertedCount}</span>
                    <span className="text-[10px] text-blue-600">/๑-/๓๕, ทวิ, ตรี, จัตวา...</span>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">3. ระบุว่ายกเลิกแล้ว</span>
                    <span className="text-lg font-black text-rose-700 block mt-0.5">{auditReport.repealedCount}</span>
                    <span className="text-[10px] text-rose-600">มีข้อความ (ยกเลิก)</span>
                  </div>
                </div>

                {/* Interactive Toggles */}
                <div className="bg-white p-3 rounded-xl border border-amber-200/90 space-y-2 pt-2.5">
                  <span className="text-[11px] font-bold text-zinc-800 block">ตัวเลือกปรับแต่งการนำเข้า:</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer border border-zinc-200/80 text-xs text-zinc-800">
                      <input
                        type="checkbox"
                        checked={excludeRepealedSections}
                        onChange={(e) => setExcludeRepealedSections(e.target.checked)}
                        className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                      />
                      <span>
                        <span className="font-semibold text-zinc-900 block">ข้ามมาตราที่ถูกยกเลิกแล้ว</span>
                        <span className="text-[10px] text-zinc-500 block">ไม่นำเข้า {auditReport.repealedCount} มาตราที่มีสถานะยกเลิก</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer border border-zinc-200/80 text-xs text-zinc-800">
                      <input
                        type="checkbox"
                        checked={importOnlyPrimarySections}
                        onChange={(e) => setImportOnlyPrimarySections(e.target.checked)}
                        className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                      />
                      <span>
                        <span className="font-semibold text-zinc-900 block">นำเข้าเฉพาะมาตราหลัก 1-1755</span>
                        <span className="text-[10px] text-zinc-500 block">ตัดมาตราแทรก {auditReport.insertedCount} รายการออก</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Duplicate Handling Selector */}
              {auditReport.duplicateCount > 0 && (
                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <Info className="w-4 h-4 text-blue-600" />
                      พบมาตราซ้ำ {auditReport.duplicateCount} รายการ:
                    </div>

                    <button
                      onClick={() => {
                        const newFilter = !filterAmendingActs;
                        setFilterAmendingActs(newFilter);
                        handleStartParsing(newFilter);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer shadow-2xs"
                    >
                      {filterAmendingActs ? 'ลองแยกใหม่แบบรวม พ.ร.บ. แก้ไข' : '⚡ แยกใหม่โดยตัด พ.ร.บ. แก้ไขออก (ลดซ้ำ)'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      duplicateAction === 'replace' ? 'bg-white border-blue-500 font-bold text-blue-900 shadow-xs' : 'bg-blue-50/50 border-blue-200 text-blue-800'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        checked={duplicateAction === 'replace'}
                        onChange={() => setDuplicateAction('replace')}
                        className="text-blue-600"
                      />
                      แทนที่ของเดิม (Update Verbatim)
                    </label>

                    <label className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      duplicateAction === 'skip' ? 'bg-white border-blue-500 font-bold text-blue-900 shadow-xs' : 'bg-blue-50/50 border-blue-200 text-blue-800'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        checked={duplicateAction === 'skip'}
                        onChange={() => setDuplicateAction('skip')}
                        className="text-blue-600"
                      />
                      ข้ามรายการที่ซ้ำ (Skip Duplicates)
                    </label>

                    <label className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      duplicateAction === 'keep-both' ? 'bg-white border-blue-500 font-bold text-blue-900 shadow-xs' : 'bg-blue-50/50 border-blue-200 text-blue-800'
                    }`}>
                      <input
                        type="radio"
                        name="dupAction"
                        checked={duplicateAction === 'keep-both'}
                        onChange={() => setDuplicateAction('keep-both')}
                        className="text-blue-600"
                      />
                      บันทึกเพิ่มทั้งคู่ (Append New)
                    </label>
                  </div>
                </div>
              )}

              {/* Structure Breakdown */}
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <h4 className="text-xs font-bold text-zinc-800 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-600" />
                  การแบ่งสัดส่วนตามโครงสร้างกฎหมาย (Hierarchy Breakdown)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {auditReport.bookBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 text-xs border border-zinc-100">
                      <span className="font-medium text-zinc-800 truncate mr-2">{item.name}</span>
                      <span className="font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 text-[11px]">
                        {item.count} มาตรา
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveTab('input')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  กลับไปแก้ไขไฟล์
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id="review-staged-btn"
                    onClick={() => setActiveTab('review')}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    ตรวจดูรายการรายมาตรา ({stagedSections.length})
                  </button>

                  <button
                    id="commit-import-btn"
                    onClick={handleConfirmImport}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    ยืนยันนำเข้า {stagedSections.filter(s => s.status !== 'error' && (!excludeRepealedSections || !s.isRepealed) && (!importOnlyPrimarySections || !s.isInsertedSection)).length} มาตรา สู่ระบบ
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
                  <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs">
                    <button
                      onClick={() => setViewParagraphsMode('structured')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        viewParagraphsMode === 'structured'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      📑 แยกวรรค / อนุ
                    </button>
                    <button
                      onClick={() => setViewParagraphsMode('raw')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        viewParagraphsMode === 'raw'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      📜 ตัวบทเต็ม (Verbatim)
                    </button>
                  </div>
                </div>

                {/* Search in results */}
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="ค้นหาในรายการที่แยก (เลขมาตรา, วรรค, ข้อความ, หมวด)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-100 focus:bg-white rounded-lg border border-transparent focus:border-zinc-300 focus:outline-none"
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
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          sec.status === 'uncertain'
                            ? 'bg-amber-50/40 border-amber-200'
                            : sec.status === 'duplicate'
                            ? 'bg-blue-50/40 border-blue-200'
                            : sec.status === 'error'
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-white border-zinc-200 shadow-xs'
                        }`}
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

                              {/* Classification Badge */}
                              {sec.isInsertedSection ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                  มาตราแทรก (/ หรือ ทวิ)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  มาตราหลัก
                                </span>
                              )}

                              {sec.isRepealed && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                  (ยกเลิก)
                                </span>
                              )}

                              {/* Paragraphs Breakdown Badge */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                                {paragraphCount} วรรค{subItemCount > 0 ? ` • ${subItemCount} อนุมาตรา` : ''}
                              </span>

                              {sec.status === 'valid' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> พร้อมนำเข้า
                                </span>
                              )}

                              {sec.status === 'uncertain' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" /> รอตรวจสอบ
                                </span>
                              )}

                              {sec.status === 'duplicate' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                                  <Copy className="w-2.5 h-2.5" /> ซ้ำกับในระบบ
                                </span>
                              )}

                              {sec.status === 'error' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1">
                                  <XCircle className="w-2.5 h-2.5" /> ผิดรูปแบบ
                                </span>
                              )}
                            </div>

                            {sec.uncertaintyReason && (
                              <div className="text-[11px] text-amber-800 font-medium mt-1.5 flex items-center gap-1 bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-200/70">
                                <span>⚠️ หมายเหตุ: {sec.uncertaintyReason}</span>
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingSection(sec)}
                              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                              title="แก้ไขตัวบทมาตรานี้"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">แก้ไข</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec.tempId)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบรายการนี้ออกจากการนำเข้า"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* STATUTE DISPLAY: STRUCTURED PARAGRAPHS OR RAW VERBATIM */}
                        {viewParagraphsMode === 'structured' && sec.paragraphs && sec.paragraphs.length > 0 ? (
                          <div className="bg-[#FAF9F6] p-3.5 sm:p-4 rounded-xl border border-zinc-200/90 space-y-2.5">
                            {sec.paragraphs.map((p, pIdx) => {
                              const isSubItem = p.label.startsWith('(');
                              return (
                                <div 
                                  key={pIdx} 
                                  className={`flex items-start gap-2.5 ${isSubItem ? 'pl-4 sm:pl-6' : ''}`}
                                >
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5 select-none ${
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
                          <div className="bg-zinc-50/90 p-3 rounded-lg border border-zinc-200 text-xs leading-relaxed font-serif text-zinc-800 max-h-36 overflow-y-auto whitespace-pre-wrap">
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
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  กลับหน้ารายงาน
                </button>

                <button
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
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
