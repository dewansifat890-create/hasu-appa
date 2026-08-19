import React from 'react';
import { Character } from '../types';
import { PRESET_CHARACTERS } from '../data/characters';
import { sound } from '../utils/sound';
import { Lock, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ShopModalProps {
  coins: number;
  unlockedCharacterIds: string[];
  selectedCharacterId: string;
  customCharacters: Character[];
  onUnlockCharacter: (characterId: string, cost: number) => void;
  onSelectCharacter: (characterId: string) => void;
  onAddCustomCharacter: (customChar: Character) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  unlockedCharacterIds,
  selectedCharacterId,
  customCharacters,
  onUnlockCharacter,
  onSelectCharacter,
  onClose
}) => {
  const allCharacters = [...PRESET_CHARACTERS, ...customCharacters];

  return (
    <div className="fixed inset-0 z-50 w-full h-screen overflow-hidden flex flex-col justify-between font-body-lg text-[#e2e2e5] bg-[#121416] select-none animate-fade-in">
      {/* 2D Vibrant Cartoon Landscape Background Image matching Home */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBf3fHoNGnVP5Jf5CnkLYBgD8rfO47tfqa986Prqy9fl1I5z6HrmAOyqgjSBbVsAByrEfl1ClXch2RbcvUuIq01Orl-nWdNxPHXw-vnw1RIHKN3kK60brpfmUUHLgQ4wPJTJ_wDLbFCwX6q-DuWARhhe41DRmt-Gw4qNKhdyCe89-kZwpXb72SaSw59UBXeT4Vi7O0sflJBU9iFXStwAGThsMJxqdgJFBXTm-Q8akTuMCWNqFQd_li0")`
          }}
        />
        {/* Darkening overlay for visual contrast */}
        <div className="absolute inset-0 bg-[#121416]/60 backdrop-blur-sm backdrop-brightness-75" />
      </div>

      {/* --- ULTRA-SLIM GLASS TOP APP BAR --- */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-black/40 backdrop-blur-xl border-b border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex justify-between items-center px-3 sm:px-6 z-50">
        {/* Left Section: Page Title with Icon */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <h1 className="font-display-hero text-lg sm:text-xl text-[#ffbd7f] font-black italic uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
            Character Shop
          </h1>
        </div>

        {/* Right Section: Coins Pill */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md rounded-full px-3.5 py-1 border border-amber-400/40 shadow-sm"
            title="Your Coins"
          >
            <span className="text-sm">🪙</span>
            <span className="font-score-md text-xs sm:text-sm text-[#ffbd7f] font-black tracking-wide">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* --- MAIN FULL-PAGE ROSTER CONTENT --- */}
      <main className="flex-1 z-10 relative px-3 sm:px-6 pt-16 pb-24 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Page Title & Subtext Header */}
        <div className="text-center my-4 sm:my-6">
          <h2 className="font-display-hero text-3xl sm:text-4xl md:text-5xl text-[#ffbd7f] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] uppercase tracking-wider font-black italic">
            Hero Collection
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 drop-shadow">
            Choose or unlock unique heroes for your adventure run!
          </p>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 pb-8">
          {allCharacters.map((char) => {
            const isUnlocked = unlockedCharacterIds.includes(char.id) || char.cost === 0;
            const isSelected = selectedCharacterId === char.id;
            const canAfford = coins >= char.cost;
            const isEpic = char.cost >= 2000;

            const handleCardTap = () => {
              if (char.id === 'hero_alom') {
                sound.playHeroAlomSound();
              } else {
                sound.playClick();
              }
            };

            return (
              <motion.div
                key={char.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                onClick={handleCardTap}
                className={`relative rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-between transition-all duration-300 backdrop-blur-xl cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-2 border-[#ffbd7f] shadow-[0_0_25px_rgba(255,189,127,0.35)]'
                    : isUnlocked
                    ? 'bg-black/40 hover:bg-black/50 border border-white/20 shadow-lg'
                    : isEpic
                    ? 'bg-black/40 hover:bg-black/50 border border-[#ff8e95]/50 shadow-[0_0_15px_rgba(255,142,149,0.15)]'
                    : 'bg-black/40 hover:bg-black/50 border border-white/20 shadow-lg'
                }`}
              >
                {/* Top Badges */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 bg-[#ffbd7f] text-[#2d1600] font-label-sm text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase z-20 shadow-md">
                    Active
                  </div>
                )}

                {!isSelected && isEpic && !isUnlocked && (
                  <div className="absolute top-2.5 left-2.5 bg-[#ff8e95] text-[#40000c] font-label-sm text-[10px] font-black px-2 py-0.5 rounded-full uppercase z-20 shadow-md">
                    Epic
                  </div>
                )}

                {/* Character Avatar Container (Always 100% clear and bright) */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden mb-2.5 bg-black/30 border-2 border-[#ffbd7f]/40 flex items-center justify-center relative p-1 mt-2 shadow-inner">
                  {char.imageUrl ? (
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-full h-full object-contain drop-shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-3xl sm:text-4xl">
                      {char.id === 'hasu_default' ? '🐰' :
                       char.id === 'hero_alom' ? '🌟' : '🐱'}
                    </div>
                  )}
                </div>

                <h3 className="font-score-md text-sm sm:text-base text-white font-bold mb-0.5 text-center truncate max-w-full">
                  {char.name}
                </h3>

                <p className="text-[10px] sm:text-xs text-slate-300 text-center line-clamp-1 mb-2 px-1">
                  {char.description}
                </p>

                {/* Stat dots or Coin cost badge */}
                <div className="flex gap-1 mb-3 z-20 items-center min-h-[22px]">
                  {isUnlocked ? (
                    <div className="flex gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-[#9be1ff]"></span>
                      <span className="w-2 h-2 rounded-full bg-[#ffb8bb]"></span>
                      <span className="w-2 h-2 rounded-full bg-[#7cfc00]"></span>
                    </div>
                  ) : (
                    <div className="bg-black/50 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-inner border border-white/15">
                      <span className="text-xs">🪙</span>
                      <span className={`font-label-sm text-xs font-black ${isEpic ? 'text-[#ff8e95]' : 'text-[#ffbd7f]'}`}>
                        {char.cost}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="w-full z-20" onClick={(e) => e.stopPropagation()}>
                  {isSelected ? (
                    <button
                      disabled
                      className="w-full bg-[#ffbd7f]/20 text-[#ffbd7f] border border-[#ffbd7f]/40 font-body-lg text-xs sm:text-sm font-bold py-2 rounded-xl cursor-default text-center"
                    >
                      Selected
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => {
                        onSelectCharacter(char.id);
                        if (char.id === 'hero_alom') {
                          sound.playHeroAlomSound();
                        } else {
                          sound.playClick();
                        }
                      }}
                      className="w-full bg-[#00cbfe] hover:bg-[#38d7ff] text-[#003b4b] font-body-lg text-xs sm:text-sm font-black py-2 rounded-xl shadow-[0_4px_12px_rgba(0,203,254,0.3)] active:scale-95 transition"
                    >
                      Select
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          onUnlockCharacter(char.id, char.cost);
                          if (char.id === 'hero_alom') {
                            sound.playHeroAlomSound();
                          } else {
                            sound.playPowerup();
                          }
                        } else {
                          if (char.id === 'hero_alom') {
                            sound.playHeroAlomSound();
                          }
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full font-body-lg text-xs sm:text-sm font-black py-2 rounded-xl active:scale-95 transition flex items-center justify-center gap-1.5 ${
                        isEpic
                          ? 'bg-[#ff8e95] text-[#40000c] shadow-[0_4px_15px_rgba(255,142,149,0.4)]'
                          : 'bg-[#ffbd7f] text-[#2d1600] shadow-[0_4px_15px_rgba(255,189,127,0.4)]'
                      } ${!canAfford ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:brightness-110'}`}
                    >
                      <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Unlock</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

