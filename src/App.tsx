import React, { useEffect, useState } from 'react';
import { Character, PlayerProfile, ScreenState } from './types';
import { PRESET_CHARACTERS, getCharacterById } from './data/characters';
import { GameHome } from './components/GameHome';
import { RunnerCanvas } from './components/RunnerCanvas';
import { AdventureCanvas } from './components/AdventureCanvas';
import { ShopModal } from './components/ShopModal';
import { SettingsModal } from './components/SettingsModal';
import { BengaliGuideModal } from './components/BengaliGuideModal';
import { NoticeModal } from './components/NoticeModal';
import { BottomNav } from './components/BottomNav';
import { auth, onAuthStateChanged, saveProfileToFirebase, loadProfileFromFirebase } from './lib/firebase';

import { sound } from './utils/sound';

const LOCAL_STORAGE_KEY = 'hasu_appa_player_profile';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('HOME');

  // Modals state
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showBengaliGuide, setShowBengaliGuide] = useState<boolean>(false);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);

  // Player Profile (Fresh/new state starts with 0 coins and fresh stats)
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    // Check localStorage first
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return {
      gameId: `HASU-${randomNum}`,
      playerName: 'Hasu Hero',
      coins: 0, // Fresh new player starts with 0 coins
      unlockedCharacters: ['hasu_default'],
      selectedCharacterId: 'hasu_default',
      highScoreRunner: 0,
      puzzlesCompleted: [],
      customCharacters: []
    };
  });

  // Save profile to localStorage and sync with Firebase & local server
  const saveProfile = (updated: PlayerProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // 1. Sync to Firebase Realtime Database
    const firebaseId = updated.firebaseUid || updated.gameId;
    saveProfileToFirebase(firebaseId, updated).catch(err => {
      console.warn('Firebase RTDB save warning:', err);
    });

    // 2. Sync to local backend API asynchronously
    fetch('/api/profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: updated.gameId, profileData: updated })
    }).catch(err => console.error('Local backup sync warning:', err));
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const cloudData = await loadProfileFromFirebase(uid);
        
        if (cloudData) {
          setProfile(prev => {
            const merged: PlayerProfile = {
              ...prev,
              ...cloudData,
              firebaseUid: uid,
              isLoggedIn: true,
              email: firebaseUser.email || prev.email,
              playerName: cloudData.playerName || firebaseUser.displayName || prev.playerName,
              avatarUrl: firebaseUser.photoURL || cloudData.avatarUrl || prev.avatarUrl,
              coins: Math.max(Number(prev.coins) || 0, Number(cloudData.coins) || 0),
              highScoreRunner: Math.max(Number(prev.highScoreRunner) || 0, Number(cloudData.highScoreRunner) || 0),
              unlockedCharacters: Array.from(new Set([
                ...(prev.unlockedCharacters || ['hasu_default']),
                ...(cloudData.unlockedCharacters || [])
              ]))
            };
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        } else {
          // Push local profile to new Firebase UID
          setProfile(prev => {
            const updated: PlayerProfile = {
              ...prev,
              firebaseUid: uid,
              isLoggedIn: true,
              email: firebaseUser.email || undefined,
              playerName: firebaseUser.displayName || prev.playerName,
              avatarUrl: firebaseUser.photoURL || prev.avatarUrl
            };
            saveProfileToFirebase(uid, updated);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } else {
        // User not logged in: local storage is primary, backup from local server API
        const guestId = profile.gameId;
        if (guestId) {
          fetch(`/api/profile/load/${guestId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.profile) {
                setProfile(prev => ({
                  ...prev,
                  ...data.profile,
                  coins: Math.max(prev.coins, Number(data.profile.coins) || 0),
                  highScoreRunner: Math.max(prev.highScoreRunner, Number(data.profile.highScoreRunner) || 0)
                }));
              }
            })
            .catch(() => {});
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Get active selected character
  const activeCharacter = getCharacterById(profile.selectedCharacterId, profile.customCharacters);

  // --- HANDLERS ---
  const handleUpdateProfile = (updatedFields: Partial<PlayerProfile>) => {
    const updated = {
      ...profile,
      ...updatedFields
    };
    saveProfile(updated);
  };

  const handleUnlockCharacter = (characterId: string, cost: number) => {
    if (profile.coins < cost) return;

    const updatedCoins = profile.coins - cost;
    const updatedUnlocked = [...profile.unlockedCharacters, characterId];

    saveProfile({
      ...profile,
      coins: updatedCoins,
      unlockedCharacters: updatedUnlocked,
      selectedCharacterId: characterId
    });
  };

  const handleSelectCharacter = (characterId: string) => {
    saveProfile({
      ...profile,
      selectedCharacterId: characterId
    });
  };

  const handleAddCustomCharacter = (customChar: Character) => {
    const updatedCustomList = [...profile.customCharacters, customChar];
    const updatedUnlocked = [...profile.unlockedCharacters, customChar.id];

    saveProfile({
      ...profile,
      customCharacters: updatedCustomList,
      unlockedCharacters: updatedUnlocked,
      selectedCharacterId: customChar.id
    });
  };

  const handleRunnerGameOver = (coinsCollected: number, distance: number) => {
    const newCoins = profile.coins + coinsCollected;
    const newHighScore = Math.max(profile.highScoreRunner, distance);

    saveProfile({
      ...profile,
      coins: newCoins,
      highScoreRunner: newHighScore
    });
  };

  const handleAdventureLevelComplete = (levelId: number, rewardCoins: number) => {
    const newCoins = profile.coins + rewardCoins;
    const completedSet = new Set(profile.puzzlesCompleted);
    completedSet.add(levelId);

    saveProfile({
      ...profile,
      coins: newCoins,
      puzzlesCompleted: Array.from(completedSet)
    });
  };

  const handleSaveSync = async () => {
    saveProfile(profile);
  };

  const activeNavTab: 'HOME' | 'SHOP' | 'SETTINGS' = showShop
    ? 'SHOP'
    : screen === 'SETTINGS'
    ? 'SETTINGS'
    : 'HOME';

  const handleSelectNavTab = (tab: 'HOME' | 'SHOP' | 'SETTINGS') => {
    if (tab === 'HOME') {
      sound.stopRunnerMusic();
      setShowShop(false);
      setShowBengaliGuide(false);
      setScreen('HOME');
    } else if (tab === 'SHOP') {
      setShowBengaliGuide(false);
      setShowShop(true);
    } else if (tab === 'SETTINGS') {
      sound.stopRunnerMusic();
      setShowShop(false);
      setShowBengaliGuide(false);
      setScreen('SETTINGS');
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 font-sans antialiased text-white select-none">
      {/* SCREEN 1: GAME HOMEPAGE */}
      {screen === 'HOME' && (
        <GameHome
          profile={profile}
          activeCharacter={activeCharacter}
          onStartRunner={() => setScreen('RUNNER')}
          onStartAdventure={() => setScreen('ADVENTURE')}
          onOpenShop={() => setShowShop(true)}
          onOpenSettings={() => setScreen('SETTINGS')}
          onOpenBengaliGuide={() => setShowBengaliGuide(true)}
          onOpenNotice={() => setShowNoticeModal(true)}
        />
      )}

      {/* SCREEN 2: 2D ENDLESS RUNNER GAME */}
      {screen === 'RUNNER' && (
        <RunnerCanvas
          character={activeCharacter}
          onGameOver={handleRunnerGameOver}
          onBackToHome={() => {
            sound.stopRunnerMusic();
            setScreen('HOME');
          }}
          onOpenShop={() => setShowShop(true)}
        />
      )}

      {/* SCREEN 3: 2D ADVENTURE PUZZLE GAME */}
      {screen === 'ADVENTURE' && (
        <AdventureCanvas
          character={activeCharacter}
          completedLevelIds={profile.puzzlesCompleted}
          onLevelComplete={handleAdventureLevelComplete}
          onBackToHome={() => {
            sound.stopRunnerMusic();
            setScreen('HOME');
          }}
        />
      )}

      {/* SCREEN 4: FULL DEDICATED SETTINGS PAGE */}
      {screen === 'SETTINGS' && (
        <SettingsModal
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onSaveSync={handleSaveSync}
          onClose={() => setScreen('HOME')}
        />
      )}

      {/* MODAL 1: CHARACTER LOCKER & SHOP */}
      {showShop && (
        <ShopModal
          coins={profile.coins}
          unlockedCharacterIds={profile.unlockedCharacters}
          selectedCharacterId={profile.selectedCharacterId}
          customCharacters={profile.customCharacters}
          onUnlockCharacter={handleUnlockCharacter}
          onSelectCharacter={handleSelectCharacter}
          onAddCustomCharacter={handleAddCustomCharacter}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* MODAL 3: BENGALI INSTRUCTIONS */}
      {showBengaliGuide && (
        <BengaliGuideModal
          onClose={() => setShowBengaliGuide(false)}
          onOpenShop={() => {
            setShowBengaliGuide(false);
            setShowShop(true);
          }}
        />
      )}

      {/* MODAL 4: SPECIAL DISCLAIMER & NOTICE */}
      {showNoticeModal && (
        <NoticeModal onClose={() => setShowNoticeModal(false)} />
      )}

      {/* FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR - VISIBLE ON HOME, SETTINGS & SHOP */}
      {(screen === 'HOME' || screen === 'SETTINGS' || showShop) && (
        <BottomNav activeTab={activeNavTab} onSelectTab={handleSelectNavTab} />
      )}
    </div>
  );
}
