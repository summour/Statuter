import React, { useState, useRef } from 'react';
import { 
  RotateCcw, 
  ChevronRight, 
  FileText, 
  LogOut,
  Cloud,
  CloudUpload,
  CloudDownload,
  Download,
  Loader2
} from 'lucide-react';
import { LawDeck, LawCard } from '../types';
import { exportAllDataToJson } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { syncDataToCloud, fetchUserDataFromCloud } from '../lib/firebase';

interface SettingsViewProps {
  decks: LawDeck[];
  cards: LawCard[];
  onImportBackup: (importedDecks: LawDeck[], importedCards: LawCard[]) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  decks,
  cards,
  onImportBackup,
  onResetData,
}) => {
  const { user, loading: authLoading, signInGoogle, signOut } = useAuth();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4500);
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      setAuthActionLoading(true);
      const loggedUser = await signInGoogle();
      showStatus(`เข้าสู่ระบบสำเร็จ: ${loggedUser.displayName || loggedUser.email}`);
    } catch (err: any) {
      console.error('Google Sign-in error details:', err);
      const errorCode = err?.code || '';
      if (errorCode === 'auth/popup-closed-by-user') {
        // User closed popup, do nothing
      } else if (errorCode === 'auth/unauthorized-domain') {
        showStatus(`โดเมน ${window.location.hostname} ยังไม่ได้รับอนุญาตใน Firebase Auth (Authorized Domains) หรือให้ลองเปิดในแท็บใหม่`);
      } else if (errorCode === 'auth/operation-not-allowed') {
        showStatus('ยังไม่ได้เปิดใช้งาน Google Sign-in ใน Firebase Console (Authentication > Sign-in method)');
      } else if (errorCode === 'auth/popup-blocked') {
        showStatus('เบราว์เซอร์บล็อกหน้าต่าง Pop-up กรุณาอนุญาต Pop-up หรือเปิดเว็บในแท็บใหม่');
      } else {
        showStatus(`เกิดข้อผิดพลาด (${errorCode || err?.message || 'ไม่ทราบสาเหตุ'}): กรุณาลองเปิดเว็บในแท็บใหม่`);
      }
    } finally {
      setAuthActionLoading(false);
    }
  };

  // Google Logout Handler
  const handleGoogleLogout = async () => {
    try {
      setAuthActionLoading(true);
      await signOut();
      showStatus('ออกจากระบบเรียบร้อยแล้ว');
    } catch (err) {
      showStatus('เกิดข้อผิดพลาดในการออกจากระบบ');
    } finally {
      setAuthActionLoading(false);
    }
  };

  // Sync to Cloud
  const handleSyncToCloud = async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      showStatus('กำลังบีบอัดและซิงค์ข้อมูลขึ้นคลาวด์...');
      const result = await syncDataToCloud(user.uid, decks, cards, (msg) => {
        setStatusMsg(msg);
      });
      const sec = (result.durationMs / 1000).toFixed(1);
      showStatus(`ซิงค์ข้อมูล ${result.totalDecks} สำรับ (${result.totalCards} มาตรา) สำเร็จใน ${sec} วินาที`);
    } catch (err: any) {
      console.error('Cloud Sync Error:', err);
      const msg = err?.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลขึ้นคลาวด์';
      showStatus(msg.includes('{') ? 'เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์ กรุณาลองใหม่อีกครั้ง' : msg);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull from Cloud
  const handlePullFromCloud = async () => {
    if (!user) return;
    try {
      setIsPulling(true);
      showStatus('กำลังดึงข้อมูลจากคลาวด์...');
      const cloudData = await fetchUserDataFromCloud(user.uid, (msg) => {
        setStatusMsg(msg);
      });
      if (cloudData && (cloudData.decks.length > 0 || cloudData.cards.length > 0)) {
        onImportBackup(cloudData.decks, cloudData.cards);
        showStatus(`ดาวน์โหลดข้อมูลจากคลาวด์สำเร็จ: ${cloudData.decks.length} สำรับ, ${cloudData.cards.length} มาตรา`);
      } else {
        showStatus('ไม่พบข้อมูลสำรองบนคลาวด์');
      }
    } catch (err: any) {
      console.error('Cloud Pull Error:', err);
      const msg = err?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจากคลาวด์';
      showStatus(msg.includes('{') ? 'เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง' : msg);
    } finally {
      setIsPulling(false);
    }
  };

  // Handle JSON backup import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (data.type === 'law_deck_export' && data.deck && Array.isArray(data.cards)) {
          onImportBackup([data.deck], data.cards);
          showStatus(`นำเข้าสำรับ "${data.deck.name}" สำเร็จ`);
        } else if (data.type === 'law_full_backup' && Array.isArray(data.decks) && Array.isArray(data.cards)) {
          onImportBackup(data.decks, data.cards);
          showStatus(`กู้คืนข้อมูลสำเร็จ: ${data.decks.length} สำรับ, ${data.cards.length} มาตรา`);
        } else {
          showStatus('รูปแบบไฟล์สำรองข้อมูล JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        showStatus('เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalCardsCount = cards.length;
  const totalDecksCount = decks.length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+7rem)]">
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">ตั้งค่า</h1>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div className="mb-4 p-3.5 bg-zinc-900 text-white rounded-2xl text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-zinc-400 hover:text-white ml-3 cursor-pointer">✕</button>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5">
        {/* Section 0: Google Account & Cloud Sync */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-1.5">
            บัญชีผู้ใช้
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
            {authLoading ? (
              <div className="p-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังโหลด...
              </div>
            ) : user ? (
              <div className="p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Google User'} 
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full border border-zinc-200 object-cover shadow-2xs"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 truncate">
                        {user.displayName || 'Google User'}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <button
                    id="google-sign-out-btn"
                    onClick={handleGoogleLogout}
                    disabled={authActionLoading}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {authActionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    <span>ออกจากระบบ</span>
                  </button>
                </div>

                {/* Cloud Sync Actions */}
                <div className="pt-2.5 border-t border-zinc-100 grid grid-cols-2 gap-2">
                  <button
                    id="cloud-sync-push-btn"
                    onClick={handleSyncToCloud}
                    disabled={isSyncing || isPulling}
                    className="p-2.5 rounded-xl bg-zinc-900 text-white hover:bg-black transition-all flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5" />
                    )}
                    <span>ซิงค์ขึ้นคลาวด์</span>
                  </button>

                  <button
                    id="cloud-sync-pull-btn"
                    onClick={handlePullFromCloud}
                    disabled={isSyncing || isPulling}
                    className="p-2.5 rounded-xl bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold border border-zinc-200/80 cursor-pointer disabled:opacity-50"
                  >
                    {isPulling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudDownload className="w-3.5 h-3.5" />
                    )}
                    <span>กู้คืนจากคลาวด์</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">
                    เชื่อมต่อ Google
                  </div>
                </div>

                <button
                  id="google-sign-in-btn"
                  onClick={handleGoogleLogin}
                  disabled={authActionLoading}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 text-white hover:bg-black transition-all flex items-center justify-center gap-2 text-xs font-semibold shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {authActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>เข้าสู่ระบบด้วย Google</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Backup & Reset */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-1.5">
            สำรองและจัดการข้อมูล
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden divide-y divide-zinc-100">
            {/* Export All Backup */}
            <button
              id="settings-export-all-btn"
              onClick={() => {
                exportAllDataToJson(decks, cards);
                showStatus('ส่งออกไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว');
              }}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold text-zinc-900">ส่งออกข้อมูลทั้งหมด (JSON)</div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Restore from JSON */}
            <label className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors text-left cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold text-zinc-900">นำเข้าไฟล์สำรอง (JSON)</div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </label>

            {/* Reset Data */}
            <div className="p-3.5 sm:p-4">
              {!showResetConfirm ? (
                <button
                  id="settings-reset-data-btn"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center justify-between text-left text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-semibold">ล้างข้อมูลทั้งหมด</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              ) : (
                <div className="bg-rose-50/80 rounded-xl p-3 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-rose-900 font-medium text-center sm:text-left">
                    ยืนยันการล้างข้อมูลทั้งหมด?
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => {
                        onResetData();
                        setShowResetConfirm(false);
                        showStatus('ล้างข้อมูลเรียบร้อยแล้ว');
                      }}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      ล้างข้อมูลทันที
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: App Info */}
        <div className="text-center pt-3 text-xs text-zinc-400 space-y-0.5">
          <div>Statuter • ท่องตัวบทกฎหมายไทย</div>
          <div>{totalDecksCount} สำรับ • {totalCardsCount} มาตรา</div>
        </div>
      </div>
    </div>
  );
};
