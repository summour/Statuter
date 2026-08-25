import React, { useRef } from 'react';
import { X, Download, Upload, Trash2, Volume2, Settings } from 'lucide-react';
import { AppSettings, LawCard } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  cards: LawCard[];
  onImportCards: (cards: LawCard[]) => void;
  onResetToDefault: () => void;
  onClearAllCards?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  cards,
  onImportCards,
  onResetToDefault,
  onClearAllCards,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cards, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `legal_anki_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportCards(parsed);
          alert(`นำเข้าสำเร็จ ${parsed.length} มาตรา!`);
          onClose();
        } else {
          alert('ไฟล์ไม่ถูกต้องหรือไม่พบข้อมูลตัวบท');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-zinc-950">
                ตั้งค่าระบบ
              </h2>
              <p className="text-xs text-zinc-700">ปรับแต่งเสียงอ่าน สำรองข้อมูล และจัดการคลัง</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Speech Rate Control */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-zinc-950">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-black" />
                <span>ความเร็วเสียงอ่านตัวบท (Text-to-Speech)</span>
              </div>
              <span>{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.05"
              value={settings.speechRate}
              onChange={e => onUpdateSettings({ ...settings, speechRate: parseFloat(e.target.value) })}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-700">
              <span>ช้าชัดเจน (0.7x)</span>
              <span>ปกติ (1.0x)</span>
              <span>เร็ว (1.3x)</span>
            </div>
          </div>

          {/* Daily Goal Setting */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-zinc-950">
              <span>เป้าหมายทบทวนรายวัน</span>
              <span>{settings.dailyReviewGoal} มาตรา / วัน</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={settings.dailyReviewGoal}
              onChange={e => onUpdateSettings({ ...settings, dailyReviewGoal: parseInt(e.target.value, 10) })}
              className="w-full accent-black cursor-pointer"
            />
          </div>

          {/* Data Backup & Export / Import */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
            <div className="font-bold text-zinc-950">การสำรองและถ่ายโอนข้อมูล (Backup & Sync)</div>
            <p className="text-zinc-700 text-[11px]">
              ส่งออกไฟล์สำรองเพื่อนำไปใช้บนอุปกรณ์อื่น หรือนำเข้าชุดมาตราที่คุณบันทึกไว้
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 font-bold text-zinc-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ส่งออก JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 font-bold text-zinc-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>นำเข้า JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Clear Database */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-zinc-950">ลบฐานข้อมูลตัวบททั้งหมด</div>
              <div className="text-[11px] text-zinc-700">ล้างตัวบททั้งหมดในระบบเพื่อเริ่มเพิ่มข้อมูลใหม่</div>
            </div>
            <button
              onClick={() => {
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตัวบททั้งหมดในระบบ?')) {
                  if (onClearAllCards) onClearAllCards();
                  alert('ลบฐานข้อมูลตัวบทเรียบร้อยแล้ว');
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
