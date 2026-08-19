import React from 'react';
import { Character, PlayerProfile } from '../types';
import { sound } from '../utils/sound';
import { Play, Volume2, VolumeX, Lock, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameHomeProps {
  profile: PlayerProfile;
  activeCharacter: Character;
  onStartRunner: () => void;
  onStartAdventure: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onOpenBengaliGuide: () => void;
  onOpenNotice: () => void;
}

export const GameHome: React.FC<GameHomeProps> = ({
  profile,
  activeCharacter,
  onStartRunner,
  onStartAdventure,
  onOpenShop,
  onOpenSettings,
  onOpenBengaliGuide,
  onOpenNotice
}) => {
  const [isMuted, setIsMuted] = React.useState<boolean>(sound.isMuted);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between font-body-lg text-[#e2e2e5] bg-[#121416] select-none">
      {/* 2D Vibrant Cartoon Landscape Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBf3fHoNGnVP5Jf5CnkLYBgD8rfO47tfqa986Prqy9fl1I5z6HrmAOyqgjSBbVsAByrEfl1ClXch2RbcvUuIq01Orl-nWdNxPHXw-vnw1RIHKN3kK60brpfmUUHLgQ4wPJTJ_wDLbFCwX6q-DuWARhhe41DRmt-Gw4qNKhdyCe89-kZwpXb72SaSw59UBXeT4Vi7O0sflJBU9iFXStwAGThsMJxqdgJFBXTm-Q8akTuMCWNqFQd_li0")`
          }}
        />
        {/* Darkening overlay for visual contrast */}
        <div className="absolute inset-0 bg-[#121416]/40 backdrop-brightness-90 mix-blend-multiply" />
      </div>

      {/* --- ULTRA-SLIM GLASS TOP APP BAR --- */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-black/30 backdrop-blur-xl border-b border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex justify-between items-center px-3 sm:px-5 z-50">
        {/* Left Section: Logo & Glass Effect Notice Icon Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="font-display-hero text-lg sm:text-xl text-[#ffbd7f] font-black italic uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
            HasuAppa
          </h1>

          {/* Sleek Glass Effect Notice Icon Button in Top Bar */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenNotice();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-amber-400/40 hover:border-amber-400/80 rounded-full text-amber-200 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="বিশেষ নোটিশ ও দাবিত্যাগ (Notice / Disclaimer)"
          >
            <span className="text-sm">📜</span>
            <span className="font-bold text-[11px] sm:text-xs">নোটিশ</span>
          </button>
        </div>

        {/* Right Section: Active Hero & Coin Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Character Pill - Slim Glass */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/15 transition cursor-pointer active:scale-95 shadow-sm"
            title="Change Active Hero"
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden text-[10px] border border-white/30 shrink-0"
              style={{ backgroundColor: activeCharacter.color }}
            >
              {activeCharacter.imageUrl ? (
                <img src={activeCharacter.imageUrl} alt="Avatar" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                '🏃'
              )}
            </div>
            <span className="hidden sm:inline text-[11px] font-bold text-white max-w-[80px] truncate">{activeCharacter.name}</span>
          </button>

          {/* Slim Coins Counter (Text removed, number only with spinning coin) */}
          <div
            onClick={onOpenShop}
            className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 backdrop-blur-md rounded-full px-3 py-0.5 border border-amber-400/40 shadow-sm cursor-pointer transition active:scale-95"
            title="Coins collected - Click to visit Shop"
          >
            <span className="text-sm">🪙</span>
            <span className="font-score-md text-xs sm:text-sm text-[#ffbd7f] font-black tracking-wide">
              {profile.coins.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* --- FLOATING SOUND TOGGLE BUTTON (Below Top Bar on Top Right) --- */}
      <div className="fixed top-14 right-3 sm:top-16 sm:right-6 z-40">
        <motion.button
          onClick={toggleSound}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.88 }}
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center backdrop-blur-2xl border transition-all duration-300 shadow-2xl cursor-pointer ${
            isMuted
              ? 'bg-red-950/40 hover:bg-red-900/60 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-400/50 text-emerald-300 shadow-[0_0_22px_rgba(16,185,129,0.35)]'
          }`}
          title={isMuted ? 'Unmute Sound (শব্দ চালু করুন)' : 'Mute Sound (শব্দ বন্ধ করুন)'}
        >
          {/* Animated Pulse Ring When Sound is Active */}
          {!isMuted && (
            <motion.span
              className="absolute inset-0 rounded-2xl border-2 border-emerald-400/50 pointer-events-none"
              animate={{ scale: [1, 1.28, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            />
          )}

          <AnimatePresence mode="wait" initial={false}>
            {isMuted ? (
              <motion.div
                key="muted"
                initial={{ rotate: -90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                className="flex items-center justify-center"
              >
                <VolumeX className="w-6 h-6 text-red-400 drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]" />
              </motion.div>
            ) : (
              <motion.div
                key="unmuted"
                initial={{ rotate: 90, scale: 0, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                className="flex items-center justify-center"
              >
                <Volume2 className="w-6 h-6 text-emerald-300 drop-shadow-[0_2px_8px_rgba(16,185,129,0.8)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* --- MAIN HERO CANVAS --- */}
      <main className="flex-grow flex flex-col justify-center items-center z-10 relative px-4 pt-12 pb-20 max-w-2xl mx-auto w-full text-center -translate-y-6 sm:-translate-y-9">
        {/* Game Title Display (Clean on its own) */}
        <div className="relative mb-2.5 sm:mb-3">
          <h2 className="font-display-hero text-5xl sm:text-7xl md:text-8xl text-center text-[#ffbd7f] drop-shadow-[0_6px_10px_rgba(0,0,0,0.9)] uppercase tracking-wider scale-100 md:scale-105 transform transition-transform animate-pulse italic font-black">
            Hasu Appa
          </h2>
        </div>

        {/* Selected Hero Badge */}
        <div 
          onClick={onOpenShop}
          className="bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-4 py-1 mb-4 sm:mb-5 cursor-pointer hover:bg-white/20 transition shadow-xl inline-flex items-center gap-2.5 active:scale-95"
          title="Active Hero"
        >
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border border-white/40 text-base overflow-hidden shadow-inner shrink-0"
            style={{ backgroundColor: activeCharacter.color }}
          >
            {activeCharacter.imageUrl ? (
              <img src={activeCharacter.imageUrl} alt="Hero" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              '🐯'
            )}
          </div>
          <span className="text-xs sm:text-sm font-black text-white tracking-wide">{activeCharacter.name}</span>
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-col items-center gap-3 sm:gap-3.5 w-full max-w-sm">
          {/* START RUNNER Button - Glass Effect, Sleek Arrow Shape */}
          <button
            onClick={() => {
              sound.playClick();
              onStartRunner();
            }}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-headline-lg text-lg sm:text-xl font-black rounded-2xl py-3 px-6 border-2 border-white/60 shadow-[0_8px_25px_rgba(255,189,127,0.3)] transition-all duration-150 ease-in-out flex items-center justify-center gap-3 active:scale-95 group"
          >
            <div className="w-8 h-8 rounded-full bg-[#ff9500] flex items-center justify-center text-slate-950 shadow-md group-hover:scale-110 transition">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <span className="tracking-wider drop-shadow-md">START RUNNER</span>
            <span className="text-amber-300 group-hover:translate-x-1 transition-transform">➔</span>
          </button>

          {/* ADVENTURE PUZZLES Button - Locked with Lock Icon & Coming Soon Badge */}
          <div className="relative w-full">
            <button
              onClick={() => {
                sound.playClick();
              }}
              className="w-full bg-[#8b5cf6]/60 hover:bg-[#8b5cf6]/70 text-white/90 font-headline-lg text-base sm:text-lg font-black rounded-xl py-3 px-6 border-2 border-white/40 shadow-lg transition-all duration-150 ease-in-out flex items-center justify-between gap-3 active:scale-98 cursor-not-allowed select-none relative overflow-hidden"
              title="Adventure Puzzles (Coming Soon)"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shrink-0">
                  <Lock className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </div>
                <span className="tracking-wide">ADVENTURE PUZZLES</span>
              </div>

              {/* Small Coming Soon Badge */}
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm shrink-0">
                Coming Soon
              </span>
            </button>
          </div>
        </div>

        {/* Lifetime Best Distance Badge (Persisted across reloads/sessions) */}
        <div className="flex items-center justify-center mt-3.5 sm:mt-4 text-xs sm:text-sm text-amber-200/90 font-bold bg-[#121416]/80 px-4 py-1.5 rounded-full border border-white/10 shadow-md">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>Best Distance:</span>
            <span className="text-amber-300 font-black">
              {profile.highScoreRunner >= 1000
                ? `${(profile.highScoreRunner / 1000).toFixed(2)} km`
                : `${profile.highScoreRunner || 0} m`}
            </span>
          </span>
        </div>
      </main>
    </div>
  );
};


