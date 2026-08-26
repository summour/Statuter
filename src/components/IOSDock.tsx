import React from 'react';
import { Home, Settings, BookOpen, Layers } from 'lucide-react';

export type TabType = 'home' | 'settings';

interface IOSDockProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cardsCount?: number;
  decksCount?: number;
}

export const IOSDock: React.FC<IOSDockProps> = ({
  activeTab,
  onTabChange,
  cardsCount = 0,
  decksCount = 0,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-auto">
      {/* iOS 26 Floating Frosted Island */}
      <nav 
        aria-label="Bottom Navigation Dock"
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-white/80 backdrop-blur-2xl border border-white/70 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] transition-all duration-300 hover:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.16)]"
      >
        {/* Tab 1: หน้าโฮม */}
        <button
          id="dock-tab-home"
          onClick={() => onTabChange('home')}
          className={`relative flex items-center gap-2.5 px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 cursor-pointer ${
            activeTab === 'home'
              ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-[1.02]'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
          }`}
        >
          <Home className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'home' ? 'scale-110' : ''}`} />
          <span>หน้าโฮม</span>
          {activeTab === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
          )}
        </button>

        {/* Subtle Divider */}
        <div className="w-[1px] h-5 bg-zinc-200/80 mx-0.5" />

        {/* Tab 2: หน้าตั้งค่า */}
        <button
          id="dock-tab-settings"
          onClick={() => onTabChange('settings')}
          className={`relative flex items-center gap-2.5 px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-[1.02]'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
          }`}
        >
          <Settings className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'settings' ? 'scale-110 rotate-45' : ''}`} />
          <span>ตั้งค่า</span>
          {activeTab === 'settings' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
          )}
        </button>
      </nav>
    </div>
  );
};
