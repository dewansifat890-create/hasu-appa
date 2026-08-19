import React from 'react';
import { sound } from '../utils/sound';

interface BottomNavProps {
  activeTab: 'HOME' | 'SHOP' | 'SETTINGS';
  onSelectTab: (tab: 'HOME' | 'SHOP' | 'SETTINGS') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="fixed bottom-3 sm:bottom-5 left-4 right-4 max-w-sm mx-auto z-[100] transition-all duration-300 animate-fade-in">
      {/* Liquid Glass Container with Safe Margins on All 4 Sides */}
      <div className="relative rounded-full p-1.5 sm:p-2 bg-slate-900/40 backdrop-blur-2xl border border-white/25 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex justify-around items-center overflow-hidden">
        {/* Liquid Glass Highlight/Reflection Layer */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none border-t border-white/30" />

        {/* Tab 1: HOME */}
        <button
          onClick={() => {
            sound.playClick();
            onSelectTab('HOME');
          }}
          className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 ${
            activeTab === 'HOME'
              ? 'bg-gradient-to-r from-amber-500/30 to-amber-400/20 border border-amber-400/70 text-amber-300 shadow-[0_0_15px_rgba(255,189,127,0.3)] scale-105'
              : 'text-slate-300/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-xl sm:text-2xl">home</span>
          <span className="font-label-sm text-xs font-bold tracking-wide">Home</span>
        </button>

        {/* Tab 2: SHOP */}
        <button
          onClick={() => {
            sound.playClick();
            onSelectTab('SHOP');
          }}
          className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 ${
            activeTab === 'SHOP'
              ? 'bg-gradient-to-r from-sky-500/30 to-cyan-400/20 border border-cyan-400/70 text-cyan-300 shadow-[0_0_15px_rgba(0,203,254,0.3)] scale-105'
              : 'text-slate-300/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-xl sm:text-2xl">storefront</span>
          <span className="font-label-sm text-xs font-bold tracking-wide">Shop</span>
        </button>

        {/* Tab 3: SETTINGS */}
        <button
          onClick={() => {
            sound.playClick();
            onSelectTab('SETTINGS');
          }}
          className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 ${
            activeTab === 'SETTINGS'
              ? 'bg-gradient-to-r from-indigo-500/30 to-purple-400/20 border border-indigo-400/70 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.3)] scale-105'
              : 'text-slate-300/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-xl sm:text-2xl">settings</span>
          <span className="font-label-sm text-xs font-bold tracking-wide">Settings</span>
        </button>
      </div>
    </nav>
  );
};
