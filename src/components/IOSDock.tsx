import React from 'react';
import { Home, Settings, ShieldCheck } from 'lucide-react';

export type TabType = 'home' | 'settings' | 'admin';

interface IOSDockProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cardsCount?: number;
  decksCount?: number;
  isAdmin?: boolean;
}

export const IOSDock: React.FC<IOSDockProps> = ({
  activeTab,
  onTabChange,
  isAdmin = false,
}) => {
  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] left-1/2 -translate-x-1/2 z-40 select-none pointer-events-auto">
      {/* Floating Frosted Island */}
      <nav 
        aria-label="Bottom Navigation Dock"
        className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] transition-all duration-300 hover:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.16)]"
      >
        {/* Tab 1: หน้าโฮม */}
        <button
          id="dock-tab-home"
          onClick={() => onTabChange('home')}
          title="หน้าโฮม"
          aria-label="หน้าโฮม"
          className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 cursor-pointer ${
            activeTab === 'home'
              ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-105'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
          }`}
        >
          <Home className="w-5 h-5 transition-transform duration-300" />
        </button>

        {/* Tab: Admin CMS (Only visible for Admins / Statuter-Dev) */}
        {isAdmin && (
          <>
            <div className="w-[1px] h-4 bg-zinc-200/80 mx-0.5" />
            <button
              id="dock-tab-admin"
              onClick={() => onTabChange('admin')}
              title="Admin CMS"
              aria-label="Admin CMS"
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 scale-105'
                  : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
              }`}
            >
              <ShieldCheck className="w-5 h-5 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
            </button>
          </>
        )}

        {/* Subtle Divider */}
        <div className="w-[1px] h-4 bg-zinc-200/80 mx-0.5" />

        {/* Tab 2: หน้าตั้งค่า */}
        <button
          id="dock-tab-settings"
          onClick={() => onTabChange('settings')}
          title="ตั้งค่า"
          aria-label="ตั้งค่า"
          className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-105'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
          }`}
        >
          <Settings className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'settings' ? 'rotate-45' : ''}`} />
        </button>
      </nav>
    </div>
  );
};
