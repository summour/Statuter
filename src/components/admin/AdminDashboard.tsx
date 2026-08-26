import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  FileUp, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Globe, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  FileText, 
  Download, 
  Edit3, 
  Database,
  ArrowLeft,
  Search,
  BookOpen
} from 'lucide-react';
import { OfficialLawDeck, LawCard, LawDeck, NumeralSystem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchOfficialDecks, 
  fetchOfficialDeckCards, 
  publishOfficialDeckToCloud, 
  deleteOfficialDeckFromCloud, 
  toggleOfficialDeckPublishStatus 
} from '../../lib/firebase';
import { parseThaiLawText, formatNumeralText, thaiToArabicDigits } from '../../utils/thaiLawParser';
import { renderDeckIcon } from '../DeckIconHelper';
import { loadAllDataFromDB, seedDefaultOfficialCivilCode } from '../../utils/storage';

interface AdminDashboardProps {
  onBackToHome: () => void;
  numeralSystem?: NumeralSystem;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToHome,
  numeralSystem = 'arabic',
}) => {
  const { user, isDevAdmin, adminIdentifier, deactivateDevAdmin, signInGoogle } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'decks' | 'importer' | 'editor'>('decks');
  
  // Data state
  const [officialDecks, setOfficialDecks] = useState<OfficialLawDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState<boolean>(true);
  const [statusToast, setStatusToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [localUserData, setLocalUserData] = useState<{ decks: LawDeck[]; cards: LawCard[] }>({ decks: [], cards: [] });
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  
  // Selection & inspection
  const [selectedDeck, setSelectedDeck] = useState<OfficialLawDeck | null>(null);
  const [selectedDeckCards, setSelectedDeckCards] = useState<LawCard[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(false);
  const [cardSearchQuery, setCardSearchQuery] = useState<string>('');

  // Importer state
  const [importerText, setImporterText] = useState<string>('');
  const [targetDeckId, setTargetDeckId] = useState<string>('new');
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckShortName, setNewDeckShortName] = useState<string>('');
  const [newDeckCategory, setNewDeckCategory] = useState<OfficialLawDeck['category']>('code');
  const [newDeckIcon, setNewDeckIcon] = useState<string>('BookOpen');
  const [newDeckColor, setNewDeckColor] = useState<string>('#2563eb');
  const [newDeckDescription, setNewDeckDescription] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishProgress, setPublishProgress] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusToast({ message, type });
    setTimeout(() => setStatusToast(null), 4500);
  };

  // Load official decks from Cloud / Local DB
  const loadDecks = useCallback(async () => {
    setLoadingDecks(true);
    try {
      const decks = await fetchOfficialDecks(true); // Include unpublished drafts
      setOfficialDecks(decks);
      
      // Also fetch any user decks from local database
      const userDB = await loadAllDataFromDB();
      setLocalUserData(userDB);
    } catch (err: any) {
      console.error('Failed to load official decks:', err);
      showToast('ไม่สามารถโหลดรายการคลังกฎหมายส่วนกลางได้', 'error');
    } finally {
      setLoadingDecks(false);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  // Seed default official Civil and Commercial Code
  const handleSeedDefaultCivilCode = async () => {
    setIsSeeding(true);
    try {
      const seeded = await seedDefaultOfficialCivilCode();
      if (seeded) {
        showToast('ติดตั้งตัวบทมาตรฐาน "ประมวลกฎหมายแพ่งและพาณิชย์" สำเร็จแล้ว', 'success');
        await loadDecks();
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการติดตั้งตัวบทมาตรฐาน', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Publish a local user deck to Official Library
  const handlePublishLocalUserDeck = async (deck: LawDeck) => {
    const deckCards = localUserData.cards.filter(c => c.deckId === deck.id);
    if (deckCards.length === 0) {
      showToast(`สำรับ "${deck.name}" ไม่มีมาตราสำหรับเผยแพร่`, 'error');
      return;
    }

    const officialDeck: OfficialLawDeck = {
      id: `official_${deck.id.replace(/[^a-zA-Z0-9_]/g, '') || 'deck_' + Date.now().toString(36)}`,
      name: deck.name,
      shortName: deck.shortName || deck.name.slice(0, 8),
      category: deck.category || 'code',
      categoryLabel: deck.categoryLabel || 'ประมวลกฎหมาย',
      iconName: deck.iconName || 'BookOpen',
      color: deck.color || '#2563eb',
      description: deck.description || `ตัวบทกฎหมาย ${deck.name} ฉบับมาตรฐานทางการ`,
      isPublished: true,
      version: '1.0',
      totalSections: deckCards.length,
      author: adminIdentifier || 'Statuter-Dev',
      updatedAt: Date.now(),
      isDefault: true,
    };

    try {
      setIsPublishing(true);
      setPublishProgress(`กำลังเผยแพร่ "${deck.name}" สู่คลังกลาง...`);
      await publishOfficialDeckToCloud(officialDeck, deckCards, (msg) => setPublishProgress(msg));
      showToast(`เผยแพร่ "${deck.name}" (${deckCards.length} มาตรา) สู่คลังส่วนกลางสำเร็จแล้ว`, 'success');
      await loadDecks();
      setActiveSubTab('decks');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเผยแพร่สำรับ', 'error');
    } finally {
      setIsPublishing(false);
      setPublishProgress('');
    }
  };

  // Load cards for selected deck
  const handleSelectDeckToInspect = async (deck: OfficialLawDeck) => {
    setSelectedDeck(deck);
    setLoadingCards(true);
    try {
      const cards = await fetchOfficialDeckCards(deck.id, (msg) => setPublishProgress(msg));
      setSelectedDeckCards(cards);
      setActiveSubTab('editor');
    } catch (err) {
      console.error('Failed to load deck cards:', err);
      showToast('เกิดข้อผิดพลาดในการโหลดตัวบทของสำรับนี้', 'error');
    } finally {
      setLoadingCards(false);
      setPublishProgress('');
    }
  };

  // Toggle publish status
  const handleTogglePublish = async (deck: OfficialLawDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = !deck.isPublished;
      await toggleOfficialDeckPublishStatus(deck.id, newStatus);
      setOfficialDecks(prev => prev.map(d => d.id === deck.id ? { ...d, isPublished: newStatus } : d));
      showToast(`เปลี่ยนสถานะ "${deck.name}" เป็น ${newStatus ? 'เผยแพร่สู่สาธารณะแล้ว' : 'ฉบับร่าง (ซ่อน)'} สำเร็จ`, 'success');
    } catch (err) {
      showToast('ไม่สามารถเปลี่ยนสถานะการเผยแพร่ได้', 'error');
    }
  };

  // Delete official deck
  const handleDeleteDeck = async (deck: OfficialLawDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${deck.name}" ออกจากคลังกลางของระบบ?`)) return;
    try {
      await deleteOfficialDeckFromCloud(deck.id);
      setOfficialDecks(prev => prev.filter(d => d.id !== deck.id));
      if (selectedDeck?.id === deck.id) {
        setSelectedDeck(null);
        setSelectedDeckCards([]);
        setActiveSubTab('decks');
      }
      showToast(`ลบ "${deck.name}" ออกจากคลังส่วนกลางแล้ว`, 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบสำรับ', 'error');
    }
  };

  // Parse importer text preview
  const auditReport = React.useMemo(() => {
    if (!importerText.trim()) return null;
    return parseThaiLawText(importerText);
  }, [importerText]);

  // Execute Publishing of imported text to Cloud
  const handlePublishImportedToCloud = async () => {
    if (!auditReport || auditReport.sections.length === 0) {
      showToast('กรุณากรอกหรือวางข้อความตัวบทกฎหมายก่อนเผยแพร่', 'error');
      return;
    }

    let deckToSave: OfficialLawDeck;

    if (targetDeckId === 'new') {
      if (!newDeckName.trim()) {
        showToast('กรุณาระบุชื่อสำรับกฎหมาย', 'error');
        return;
      }
      // Generate a robust safe ID (never empty or official__)
      const rawShort = (newDeckShortName.trim() || newDeckName.trim()).toLowerCase();
      const asciiOnly = rawShort.replace(/[^a-z0-9]/g, '');
      const uniqueSuffix = Date.now().toString(36);
      const generatedId = asciiOnly 
        ? `official_${asciiOnly}_${uniqueSuffix}` 
        : `official_deck_${uniqueSuffix}`;

      deckToSave = {
        id: generatedId,
        name: newDeckName.trim(),
        shortName: newDeckShortName.trim() || newDeckName.trim().slice(0, 8),
        category: newDeckCategory,
        categoryLabel: newDeckCategory === 'code' ? 'ประมวลกฎหมาย' : newDeckCategory === 'constitution' ? 'รัฐธรรมนูญ' : 'พระราชบัญญัติ',
        iconName: newDeckIcon,
        color: newDeckColor,
        description: newDeckDescription.trim() || `ตัวบทกฎหมาย ${newDeckName.trim()} ฉบับมาตรฐานทางการ`,
        isPublished: true,
        version: '1.0',
        totalSections: auditReport.sections.length,
        author: adminIdentifier || 'Statuter-Dev',
        updatedAt: Date.now(),
        isDefault: true,
      };
    } else {
      const existing = officialDecks.find(d => d.id === targetDeckId);
      if (!existing) {
        showToast('ไม่พบสำรับเป้าหมายที่เลือก', 'error');
        return;
      }
      deckToSave = {
        ...existing,
        totalSections: auditReport.sections.length,
        updatedAt: Date.now(),
      };
    }

    // Convert parsed sections to LawCards
    const cardsToSave: LawCard[] = auditReport.sections.map((sec, idx) => ({
      id: `${deckToSave.id}_sec_${sec.sectionRawNum || idx + 1}`,
      deckId: deckToSave.id,
      deckName: deckToSave.name,
      deckShortName: deckToSave.shortName,
      book: sec.book,
      titleStructure: sec.titleStructure,
      chapter: sec.chapter,
      part: sec.part,
      sectionNumber: sec.sectionNumber,
      sectionRawNum: sec.sectionRawNum,
      title: sec.title,
      fullText: sec.fullText,
      paragraphs: sec.paragraphs,
      isVerified: true,
      createdAt: Date.now(),
    }));

    try {
      setIsPublishing(true);
      setPublishProgress('กำลังอัปโหลดและประมวลผลข้อมูลสู่คลังกลาง...');
      const result = await publishOfficialDeckToCloud(
        deckToSave, 
        cardsToSave, 
        (msg) => setPublishProgress(msg),
        importerText
      );
      
      showToast(`เผยแพร่ "${deckToSave.name}" (${result.totalCards} มาตรา) สู่คลังกลางสำเร็จใน ${(result.durationMs / 1000).toFixed(1)} วินาที`, 'success');
      
      // Reset form
      setImporterText('');
      setNewDeckName('');
      setNewDeckShortName('');
      setNewDeckDescription('');
      
      await loadDecks();
      setActiveSubTab('decks');
    } catch (err: any) {
      console.error('Failed to publish deck to cloud:', err);
      showToast('เกิดข้อผิดพลาดในการเผยแพร่สู่คลังกลาง กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsPublishing(false);
      setPublishProgress('');
    }
  };

  // Filter cards in editor view
  const filteredCards = React.useMemo(() => {
    if (!cardSearchQuery.trim()) return selectedDeckCards;
    const q = cardSearchQuery.toLowerCase().trim();
    const arabicQ = thaiToArabicDigits(q);
    return selectedDeckCards.filter(c => 
      c.sectionNumber.toLowerCase().includes(q) ||
      thaiToArabicDigits(c.sectionNumber).includes(arabicQ) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      c.fullText.toLowerCase().includes(q)
    );
  }, [selectedDeckCards, cardSearchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans pb-28 selection:bg-amber-100 selection:text-amber-900">
      {/* Admin Top Banner */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 pt-[env(safe-area-inset-top,0px)] shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">กลับหน้าแอป</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                    Admin CMS & Official Library
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold border border-amber-200">
                    UID: {adminIdentifier}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">ระบบจัดการตัวบทกฎหมายส่วนกลางและคลังข้อมูลระดับคลาวด์</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <button
                onClick={async () => {
                  try {
                    await signInGoogle();
                    showToast('เข้าสู่ระบบ Google สำเร็จ', 'success');
                  } catch (err: any) {
                    showToast('การเข้าสู่ระบบถูกยกเลิก', 'info');
                  }
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                title="เข้าสู่ระบบ Google เพื่อเชื่อมต่อ Firestore Cloud โดยตรง"
              >
                <span>เข้าสู่ระบบ Google</span>
              </button>
            )}

            <button
              onClick={loadDecks}
              disabled={loadingDecks}
              title="รีเฟรชข้อมูลคลังกลาง"
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDecks ? 'animate-spin' : ''}`} />
            </button>

            {isDevAdmin && (
              <button
                onClick={deactivateDevAdmin}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                ออกจากโหมด Dev
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 border-t border-zinc-100 pt-2 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('decks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'decks'
                ? 'bg-zinc-900 text-white font-bold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>คลังกฎหมายส่วนกลาง ({officialDecks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('importer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'importer'
                ? 'bg-zinc-900 text-white font-bold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>นำเข้าตัวบทขนาดใหญ่ (Bulk Parser)</span>
          </button>

          {selectedDeck && (
            <button
              onClick={() => setActiveSubTab('editor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeSubTab === 'editor'
                  ? 'bg-zinc-900 text-white font-bold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ตรวจ/แก้ไข: {selectedDeck.shortName} ({selectedDeckCards.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Toast Notification */}
      {statusToast && (
        <div className={`fixed top-24 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-3 duration-200 ${
          statusToast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : statusToast.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-white text-zinc-900 border-zinc-200 shadow-md'
        }`}>
          {statusToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {statusToast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{statusToast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: OFFICIAL DECKS HUB */}
        {activeSubTab === 'decks' && (
          <div className="space-y-6">
            {/* Quick Metrics & Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-xs text-zinc-500 font-medium">สำรับกฎหมายส่วนกลางทั้งหมด</div>
                  <div className="text-2xl font-bold text-zinc-900 mt-1">{officialDecks.length} ฉบับ</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-xs text-zinc-500 font-medium">จำนวนมาตราที่เผยแพร่แล้ว</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {officialDecks.reduce((acc, d) => acc + (d.totalSections || 0), 0).toLocaleString()} มาตรา
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-xs text-zinc-500 font-medium">สถานะระบบ Cloud (Firestore)</div>
                  <div className="text-sm font-bold text-zinc-900 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ออนไลน์ (พร้อมซิงค์)
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('importer')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มฉบับใหม่</span>
                </button>
              </div>
            </div>

            {/* Decks List Table / Cards */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-zinc-900">รายการคลังตัวบทกฎหมายทางการ (Official Decks)</h2>
                <span className="text-xs text-zinc-500">ผู้ใช้ทุกคนสามารถกดติดตั้งเข้าสู่เครื่องได้ทันที</span>
              </div>

              {loadingDecks ? (
                <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                  <p className="text-xs">กำลังเชื่อมต่อและดึงข้อมูลจาก Cloud Repository...</p>
                </div>
              ) : officialDecks.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 space-y-4">
                  <BookOpen className="w-10 h-10 mx-auto text-zinc-300" />
                  <div>
                    <div className="text-sm font-semibold text-zinc-800">ยังไม่มีสำรับกฎหมายในคลังกลาง</div>
                    <p className="text-xs max-w-md mx-auto text-zinc-500 mt-1">
                      คุณสามารถเริ่มนำเข้าตัวบทกฎหมายใหม่ หรือกู้คืนสำรับกฎหมายมาตรฐานได้ทันที
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      onClick={handleSeedDefaultCivilCode}
                      disabled={isSeeding}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>ติดตั้งตัวบทมาตรฐาน (ป.พ.พ.) ทันที</span>
                    </button>

                    <button
                      onClick={() => setActiveSubTab('importer')}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>นำเข้าตัวบทใหม่ (Bulk Parser)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {officialDecks.map(deck => (
                    <div
                      key={deck.id}
                      onClick={() => handleSelectDeckToInspect(deck)}
                      className="p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: deck.color || '#2563eb' }}
                        >
                          {renderDeckIcon(deck.iconName, 'w-5 h-5')}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-zinc-900 group-hover:text-amber-600 transition-colors truncate">
                              {deck.name}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                              {deck.shortName}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              deck.isPublished 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {deck.isPublished ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {deck.isPublished ? 'เผยแพร่สู่ผู้ใช้' : 'ฉบับร่าง (Draft)'}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                            {deck.description || 'ไม่มีคำอธิบาย'}
                          </p>

                          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-3">
                            <span>{deck.totalSections.toLocaleString()} มาตรา</span>
                            <span>•</span>
                            <span>หมวดหมู่: {deck.categoryLabel}</span>
                            <span>•</span>
                            <span>เวอร์ชัน {deck.version || '1.0'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={(e) => handleTogglePublish(deck, e)}
                          title={deck.isPublished ? 'ซ่อนจากผู้ใช้' : 'เผยแพร่สู่ผู้ใช้'}
                          className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            deck.isPublished
                              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {deck.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{deck.isPublished ? 'ซ่อน' : 'เผยแพร่'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDeckToInspect(deck);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>จัดการตัวบท</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteDeck(deck, e)}
                          title="ลบสำรับนี้"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Local User Decks detected in Browser Database (Quick 1-Click Promote to Official) */}
            {localUserData.decks.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-transparent border border-amber-200/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-700" />
                    <h3 className="text-sm font-bold text-zinc-900">
                      ตรวจพบสำรับกฎหมายที่นำเข้าไว้ในเครื่องของคุณ ({localUserData.decks.length} ฉบับ)
                    </h3>
                  </div>
                  <span className="text-xs text-amber-700 font-medium">กดเพื่อแปลงเป็นสำรับทางการสู่คลังกลางได้ทันที</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {localUserData.decks.map(localDeck => {
                    const count = localUserData.cards.filter(c => c.deckId === localDeck.id).length;
                    return (
                      <div 
                        key={localDeck.id}
                        className="bg-white border border-amber-200/60 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">{localDeck.name}</h4>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {count.toLocaleString()} มาตรา • {localDeck.categoryLabel}
                          </p>
                        </div>

                        <button
                          onClick={() => handlePublishLocalUserDeck(localDeck)}
                          disabled={isPublishing}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          เผยแพร่สู่คลังกลาง
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BULK LAW IMPORTER & STRUCTURING */}
        {activeSubTab === 'importer' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-amber-600" />
                    <span>ระบบนำเข้าตัวบทขนาดใหญ่ (Bulk Importer & Structuring)</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    วางข้อความกฎหมายฉบับเต็ม ระบบจะตรวจจับ บรรพ, ลักษณะ, หมวด, ส่วน, มาตรา, วรรค และอนุมาตราให้อัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Target Deck Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    เลือกเป้าหมายการบันทึก
                  </label>
                  <select
                    value={targetDeckId}
                    onChange={(e) => setTargetDeckId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="new">+ สร้างสำรับกฎหมายใหม่ในคลังกลาง (Create New Official Deck)</option>
                    {officialDecks.map(d => (
                      <option key={d.id} value={d.id}>
                        อัปเดตทับสำรับเดิม: {d.name} ({d.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                {targetDeckId === 'new' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      ชื่อกฎหมายทางการ *
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ประมวลกฎหมายอาญา หรือ พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล"
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:bg-white focus:border-amber-500 focus:outline-none placeholder-zinc-400"
                    />
                  </div>
                )}
              </div>

              {targetDeckId === 'new' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      ชื่อย่อ (Short Name)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ป.อ. หรือ PDPA"
                      value={newDeckShortName}
                      onChange={(e) => setNewDeckShortName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:bg-white focus:border-amber-500 focus:outline-none placeholder-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      หมวดหมู่
                    </label>
                    <select
                      value={newDeckCategory}
                      onChange={(e) => setNewDeckCategory(e.target.value as any)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="code">ประมวลกฎหมาย (Code)</option>
                      <option value="proc">กฎหมายวิธีพิจารณาความ (Procedure)</option>
                      <option value="constitution">รัฐธรรมนูญ (Constitution)</option>
                      <option value="act">พระราชบัญญัติ (Act)</option>
                      <option value="custom">ทั่วไป / วิชาการ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      สีประจำสำรับ
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newDeckColor}
                        onChange={(e) => setNewDeckColor(e.target.value)}
                        className="w-10 h-9 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        value={newDeckColor}
                        onChange={(e) => setNewDeckColor(e.target.value)}
                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Textarea for Bulk Text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-700">
                    วางข้อความตัวบทกฎหมายทั้งหมดที่นี่ (รองรับทั้งฉบับ หลายร้อยถึงหลายพันมาตรา)
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    {importerText.length.toLocaleString()} ตัวอักษร
                  </span>
                </div>
                <textarea
                  rows={12}
                  placeholder={`ตัวอย่างเช่น:

ภาค ๑ บทบัญญัติทั่วไป
ลักษณะ ๑ บทนิยาม
มาตรา ๑ ในประมวลกฎหมายนี้
(๑) "โดยทุจริต" หมายความว่า เพื่อแสวงหาประโยชน์อันมิควรได้โดยชอบด้วยกฎหมายสำหรับตนเองหรือผู้อื่น
...
มาตรา ๒ บุคคลจักต้องรับโทษในทางอาญาต่อเมื่อได้กระทำการอันกฎหมายที่ใช้ในขณะกระทำนั้นบัญญัติเป็นความผิดและกำหนดโทษไว้`}
                  value={importerText}
                  onChange={(e) => setImporterText(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs font-mono text-zinc-900 focus:bg-white focus:border-amber-500 focus:outline-none placeholder-zinc-400 leading-relaxed shadow-inner"
                />
              </div>

              {/* Live Audit Report */}
              {auditReport && (
                <div className="bg-zinc-50/80 border border-zinc-200/90 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>ผลการตรวจจับโครงสร้างและมาตราอัตโนมัติ</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                        ตรวจพบ {auditReport.totalCount} มาตรา
                      </span>
                      {auditReport.uncertainCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                          ต้องตรวจทาน {auditReport.uncertainCount} รายการ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Section Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
                      <span className="text-zinc-500 block text-[10px]">มาตราลำดับหลัก</span>
                      <span className="font-bold text-zinc-900 text-sm">{auditReport.primaryCount}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
                      <span className="text-zinc-500 block text-[10px]">มาตราแทรก (ทวิ/ตรี/ฯลฯ)</span>
                      <span className="font-bold text-amber-700 text-sm">{auditReport.insertedCount}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
                      <span className="text-zinc-500 block text-[10px]">มาตราที่ถูกยกเลิก</span>
                      <span className="font-bold text-rose-600 text-sm">{auditReport.repealedCount}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
                      <span className="text-zinc-500 block text-[10px]">เชิงอรรถที่ตัดออก</span>
                      <span className="font-bold text-zinc-600 text-sm">{auditReport.footnotesCleanedCount || 0}</span>
                    </div>
                  </div>

                  {/* Preview First 3 and Last 3 Sections */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-semibold text-zinc-600">ตัวอย่างมาตราที่ตรวจจับได้:</div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {auditReport.sections.slice(0, 10).map((sec, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-xl border border-zinc-200/80 flex items-start gap-2.5 shadow-2xs">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold font-mono text-[11px] shrink-0 border border-amber-200/60">
                            {sec.sectionNumber}
                          </span>
                          <div className="min-w-0 flex-1">
                            {sec.title && <div className="font-bold text-zinc-900 text-[11px] truncate">{sec.title}</div>}
                            <p className="text-zinc-600 text-[11px] line-clamp-1">{sec.fullText}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Publish Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-zinc-500">
                  {publishProgress ? (
                    <span className="text-amber-700 font-medium flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {publishProgress}
                    </span>
                  ) : (
                    <span>พร้อมที่จะเผยแพร่ข้อมูลสู่ Firestore และระบบคลาวด์ส่วนกลาง</span>
                  )}
                </div>

                <button
                  onClick={handlePublishImportedToCloud}
                  disabled={isPublishing || !auditReport || auditReport.sections.length === 0}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>กำลังเผยแพร่สู่คลังกลาง...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>เผยแพร่สู่คลังตัวบทส่วนกลาง (Publish to Cloud)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CARD EDITOR & SECTION MANAGEMENT */}
        {activeSubTab === 'editor' && selectedDeck && (
          <div className="space-y-4">
            {/* Header of selected deck */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedDeck.color || '#2563eb' }}
                >
                  {renderDeckIcon(selectedDeck.iconName, 'w-6 h-6')}
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">{selectedDeck.name}</h2>
                  <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                    <span>{selectedDeckCards.length} มาตรา</span>
                    <span>•</span>
                    <span>เวอร์ชัน {selectedDeck.version || '1.0'}</span>
                    <span>•</span>
                    <span>UID: {selectedDeck.author || 'Statuter-Dev'}</span>
                  </div>
                </div>
              </div>

              {/* Search within this deck */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขมาตราหรือเนื้อหา..."
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Cards List in this deck */}
            {loadingCards ? (
              <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                <p className="text-xs">กำลังดาวน์โหลดข้อมูลตัวบททั้งหมดของสำรับนี้...</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 text-xs">
                ไม่พบมาตราที่ตรงกับคำค้นหา
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-zinc-500 px-1">
                  แสดง {filteredCards.length} มาตรา
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60">
                            {formatNumeralText(card.sectionNumber, numeralSystem)}
                          </span>

                          {(card.book || card.titleStructure || card.chapter) && (
                            <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                              {[card.book, card.chapter].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>

                        {card.title && (
                          <h4 className="text-xs font-bold text-zinc-900 mb-1.5">
                            {card.title}
                          </h4>
                        )}

                        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-4 font-sans">
                          {card.fullText}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{card.paragraphs?.length || 1} วรรค</span>
                        <span>ID: {card.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
