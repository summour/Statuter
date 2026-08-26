import React, { useState, useRef } from 'react';
import { 
  Hash, 
  Layers, 
  Plus, 
  UploadCloud, 
  Download, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Check, 
  ChevronRight, 
  Info, 
  FileText, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { LawDeck, LawCard, NumeralSystem } from '../types';
import { renderDeckIcon } from './DeckIconHelper';
import { exportDeckToJson, exportAllDataToJson } from '../utils/storage';

interface SettingsViewProps {
  numeralSystem: NumeralSystem;
  onNumeralSystemChange: (system: NumeralSystem) => void;
  decks: LawDeck[];
  cards: LawCard[];
  onOpenCreateDeck: () => void;
  onOpenEditDeck: (deck: LawDeck) => void;
  onOpenDeleteDeck: (deck: LawDeck) => void;
  onOpenImportModal: () => void;
  onImportBackup: (importedDecks: LawDeck[], importedCards: LawCard[]) => void;
  onResetData: () => void;
  onSelectDeckToRead: (deck: LawDeck) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  numeralSystem,
  onNumeralSystemChange,
  decks,
  cards,
  onOpenCreateDeck,
  onOpenEditDeck,
  onOpenDeleteDeck,
  onOpenImportModal,
  onImportBackup,
  onResetData,
  onSelectDeckToRead,
}) => {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">ตั้งค่า</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">ปรับแต่งระบบตัวเลข จัดการสำรับ และสำรองข้อมูล</p>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div className="mb-6 p-3.5 bg-zinc-900 text-white rounded-2xl text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-zinc-400 hover:text-white ml-3">✕</button>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Numeral System */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">
            การแสดงผลตัวเลข
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">รูปแบบตัวเลข</div>
                  <div className="text-xs text-zinc-500">เลือกรูปแบบที่แสดงในเลขมาตราและข้อความ</div>
                </div>
              </div>

              {/* Segmented Switch */}
              <div className="flex items-center bg-zinc-100 rounded-xl p-1 border border-zinc-200">
                <button
                  id="settings-numeral-arabic-btn"
                  onClick={() => onNumeralSystemChange('arabic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    numeralSystem === 'arabic'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  อารบิก (123)
                </button>
                <button
                  id="settings-numeral-thai-btn"
                  onClick={() => onNumeralSystemChange('thai')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    numeralSystem === 'thai'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  ไทย (๑๒๓)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Deck Operations */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">
            สำรับกฎหมาย
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden divide-y divide-zinc-100">
            {/* Create Deck */}
            <button
              id="settings-create-deck-btn"
              onClick={onOpenCreateDeck}
              className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">สร้างสำรับใหม่</div>
                  <div className="text-xs text-zinc-500">สร้างหมวดหรือชุดกฎหมายที่กำหนดเอง</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Import Laws */}
            <button
              id="settings-import-law-btn"
              onClick={onOpenImportModal}
              className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">นำเข้าตัวบทกฎหมาย</div>
                  <div className="text-xs text-zinc-500">วางข้อความกฎหมายเพื่อแยกรายมาตราอัตโนมัติ</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Section 3: Decks List Management */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
            <span>สำรับทั้งหมด ({decks.length})</span>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden divide-y divide-zinc-100">
            {decks.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                ยังไม่มีสำรับกฎหมาย
              </div>
            ) : (
              decks.map(deck => {
                const deckCount = cards.filter(c => c.deckId === deck.id).length;
                return (
                  <div key={deck.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/50 transition-colors">
                    <div 
                      onClick={() => onSelectDeckToRead(deck)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0 group-hover:bg-zinc-200 transition-colors">
                        {renderDeckIcon(deck.iconName, "w-4 h-4")}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 truncate group-hover:text-black">
                          {deck.name}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {deck.shortName} • {deckCount} มาตรา
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => exportDeckToJson(deck, cards.filter(c => c.deckId === deck.id))}
                        className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                        title="ส่งออกสำรับนี้ (JSON)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenEditDeck(deck)}
                        className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                        title="แก้ไขสำรับ"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenDeleteDeck(deck)}
                        className="p-2 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="ลบสำรับ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 4: Backup & Reset */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">
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
              className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">สำรองข้อมูลทั้งหมด (Export JSON)</div>
                  <div className="text-xs text-zinc-500">บันทึกทั้ง {decks.length} สำรับ และ {cards.length} มาตรา ลงในเครื่อง</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Restore from JSON */}
            <label className="w-full p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors text-left cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">กู้คืนจากไฟล์สำรอง (Import JSON)</div>
                  <div className="text-xs text-zinc-500">นำเข้าไฟล์สำรองข้อมูลที่เคยบันทึกไว้</div>
                </div>
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
            <div className="p-4">
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
                    <div>
                      <div className="text-sm font-medium">ล้างข้อมูลทั้งหมดในเครื่อง</div>
                      <div className="text-xs text-zinc-400">ลบสำรับและมาตราทั้งหมดที่บันทึกไว้</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              ) : (
                <div className="bg-rose-50/80 rounded-xl p-3 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-rose-900 font-medium text-center sm:text-left">
                    ยืนยันการล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้
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
        <div className="text-center pt-4 text-xs text-zinc-400 space-y-1">
          <div>Statutler • ท่องตัวบทกฎหมายไทย</div>
          <div>{totalDecksCount} สำรับ • {totalCardsCount} มาตรา</div>
        </div>
      </div>
    </div>
  );
};
