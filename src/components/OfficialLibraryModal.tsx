import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Layers, 
  Search,
  ShieldCheck
} from 'lucide-react';
import { OfficialLawDeck, LawCard, LawDeck, NumeralSystem } from '../types';
import { fetchOfficialDecks, fetchOfficialDeckCards } from '../lib/firebase';
import { loadOfficialDecksFromLocalDB } from '../utils/storage';
import { renderDeckIcon } from './DeckIconHelper';
import { formatNumeralText } from '../utils/thaiLawParser';

interface OfficialLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallDeck: (deck: LawDeck, cards: LawCard[]) => void;
  installedDeckIds: string[];
  numeralSystem?: NumeralSystem;
}

export const OfficialLibraryModal: React.FC<OfficialLibraryModalProps> = ({
  isOpen,
  onClose,
  onInstallDeck,
  installedDeckIds,
  numeralSystem = 'arabic',
}) => {
  const [officialDecks, setOfficialDecks] = useState<OfficialLawDeck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [installingDeckId, setInstallingDeckId] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successDeckId, setSuccessDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMsg(null);

    // 1. Instant load from local IndexedDB cache (<5ms)
    loadOfficialDecksFromLocalDB().then(local => {
      if (isMounted && local && local.length > 0) {
        setOfficialDecks(local.filter(d => d.isPublished));
        setLoading(false);
      }
    });

    // 2. Fetch fresh updates from Cloud in background
    fetchOfficialDecks(false) // Only published decks
      .then(decks => {
        if (isMounted) {
          setOfficialDecks(decks);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn('Official decks using local DB fallback:', err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle 1-Click Install Deck into Local User Library
  const handleDownloadAndInstall = async (deck: OfficialLawDeck) => {
    try {
      setInstallingDeckId(deck.id);
      setInstallProgress('กำลังดาวน์โหลดข้อมูลตัวบทจากคลังกลาง...');

      const cards = await fetchOfficialDeckCards(deck.id, (msg) => setInstallProgress(msg));
      
      if (cards.length === 0) {
        throw new Error('ไม่พบข้อมูลตัวบทในสำรับนี้');
      }

      const userDeck: LawDeck = {
        id: deck.id,
        name: deck.name,
        shortName: deck.shortName,
        category: deck.category,
        categoryLabel: deck.categoryLabel,
        iconName: deck.iconName,
        color: deck.color,
        description: deck.description,
        isDefault: true,
        createdAt: Date.now(),
      };

      onInstallDeck(userDeck, cards);
      setSuccessDeckId(deck.id);
      setTimeout(() => setSuccessDeckId(null), 3000);
    } catch (err: any) {
      console.error('Install error:', err);
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการดาวน์โหลดสำรับกฎหมาย');
    } finally {
      setInstallingDeckId(null);
      setInstallProgress('');
    }
  };

  const filteredDecks = officialDecks.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return d.name.toLowerCase().includes(q) || 
           d.shortName.toLowerCase().includes(q) ||
           (d.description && d.description.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200/80 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                  คลังตัวบทกฎหมายมาตรฐาน
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                  Official Library
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                ดาวน์โหลดตัวบทกฎหมายฉบับทางการที่ตรวจสอบความถูกต้องแล้วเข้าสู่เครื่องคุณ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกฎหมาย เช่น อาญา, แพ่ง, รัฐธรรมนูญ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-all"
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-5 sm:mx-6 my-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Deck List Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
              <p className="text-xs">กำลังเชื่อมต่อและค้นหาตัวบทกฎหมายในคลังกลาง...</p>
            </div>
          ) : filteredDecks.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-zinc-300" />
              <p className="text-sm font-semibold text-zinc-600">ไม่พบสำรับกฎหมายที่ค้นหา</p>
              <p className="text-xs text-zinc-400">
                หรือยังไม่มีสำรับที่แอดมินเผยแพร่ในคลังส่วนกลาง
              </p>
            </div>
          ) : (
            filteredDecks.map((deck) => {
              const isAlreadyInstalled = installedDeckIds.includes(deck.id);
              const isCurrentlyInstalling = installingDeckId === deck.id;
              const isJustInstalled = successDeckId === deck.id;

              return (
                <div
                  key={deck.id}
                  className="bg-zinc-50/60 hover:bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: deck.color || '#3b82f6' }}
                    >
                      {renderDeckIcon(deck.iconName, 'w-5 h-5')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-zinc-900 truncate">
                          {deck.name}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-zinc-700 border border-zinc-200 shadow-2xs">
                          {deck.shortName}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                        {deck.description || 'ฉบับมาตรฐานรับรองความถูกต้อง'}
                      </p>

                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                        <span>{deck.totalSections.toLocaleString()} มาตรา</span>
                        <span>•</span>
                        <span>{deck.categoryLabel}</span>
                        <span>•</span>
                        <span>v{deck.version || '1.0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Install Button */}
                  <div className="shrink-0 self-end sm:self-center">
                    {isCurrentlyInstalling ? (
                      <button
                        disabled
                        className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-2 cursor-wait border border-zinc-200"
                      >
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                        <span>กำลังติดตั้ง...</span>
                      </button>
                    ) : isJustInstalled ? (
                      <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>ติดตั้งสำเร็จ!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownloadAndInstall(deck)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          isAlreadyInstalled
                            ? 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                            : 'bg-zinc-900 hover:bg-black text-white'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isAlreadyInstalled ? 'ดาวน์โหลดซ้ำ (อัปเดต)' : 'ติดตั้งเข้าเครื่อง'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>{officialDecks.length} สำรับมาตรฐานในคลัง</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
