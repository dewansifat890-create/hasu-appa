import React, { useState, useRef, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { 
  Pencil, 
  Check, 
  Camera, 
  Sparkles, 
  LogOut,
  Settings as SettingsIcon,
  UserCheck,
  Loader2,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  Copy,
  Info
} from 'lucide-react';
import { sound } from '../utils/sound';
import { motion, AnimatePresence } from 'motion/react';
import { loginWithGoogle, logoutFromFirebase, loadProfileFromFirebase, saveProfileToFirebase } from '../lib/firebase';
import { compressImageFile } from '../utils/imageCompressor';

interface SettingsModalProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: Partial<PlayerProfile>) => void;
  onSaveSync?: () => Promise<void>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  onUpdateProfile,
  onClose
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(profile.playerName || 'Hasu Hero');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [isAuthProcessing, setIsAuthProcessing] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [authErrorModal, setAuthErrorModal] = useState<{
    code: string;
    message: string;
    domain: string;
  } | null>(null);
  const [manualEmailInput, setManualEmailInput] = useState<string>('');
  const [showManualConnect, setShowManualConnect] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const updated = { playerName: trimmed };
    onUpdateProfile(updated);
    setIsEditingName(false);
    sound.playCoin();
    showToast('Name updated successfully!');

    // Also sync to Firebase Realtime Database
    const uidToSave = profile.firebaseUid || profile.gameId;
    await saveProfileToFirebase(uidToSave, { ...profile, playerName: trimmed });
  };

  // Smart upload photo file to ImgBB with automatic client-side compression (supports huge MB photos with no limits)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|gif|bmp|heic|avif)$/i)) {
      showToast('Please select a valid image photo file (PNG, JPG, JPEG, WEBP, etc.)', 'error');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      sound.playClick();
      
      const origSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      showToast(`Optimizing photo (${origSizeMB} MB)...`, 'info');

      // 1. Auto compress & downscale big MB photos smoothly on HTML5 canvas (no file size limits!)
      const compressed = await compressImageFile(file, 1024, 0.85);

      showToast(`Uploading (${compressed.originalSizeMB} MB ➡️ ${compressed.compressedSizeKB} KB)...`, 'info');

      // 2. Upload the compressed lightweight base64 to ImgBB API
      try {
        const res = await fetch('/api/upload-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: compressed.base64 })
        });

        const json = await res.json();

        let avatarUrlToSave = compressed.base64; // Safe fallback

        if (json.success && json.imageUrl) {
          avatarUrlToSave = json.imageUrl;
        }

        // 3. Update React profile state immediately
        onUpdateProfile({ avatarUrl: avatarUrlToSave });

        // 4. Persist to Firebase Realtime Database
        const uidToSave = profile.firebaseUid || profile.gameId;
        await saveProfileToFirebase(uidToSave, { ...profile, avatarUrl: avatarUrlToSave });

        sound.playPowerup();
        showToast('Profile photo optimized & permanently saved!');
      } catch (uploadErr: any) {
        console.warn('ImgBB network upload warning, applying optimized local avatar:', uploadErr);
        // Fallback: save optimized high-efficiency compressed image directly
        onUpdateProfile({ avatarUrl: compressed.base64 });
        const uidToSave = profile.firebaseUid || profile.gameId;
        await saveProfileToFirebase(uidToSave, { ...profile, avatarUrl: compressed.base64 });
        sound.playPowerup();
        showToast('Profile photo saved successfully!');
      }
    } catch (err: any) {
      console.error('Photo optimization/upload error:', err);
      showToast(err.message || 'Failed to process image. Please try another photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (isAuthProcessing) return;
    sound.playPowerup();
    setIsAuthProcessing(true);

    if (profile.isLoggedIn) {
      // Real Firebase Logout
      try {
        await logoutFromFirebase();
        onUpdateProfile({
          isLoggedIn: false,
          email: undefined,
          firebaseUid: undefined
        });
        showToast('Logged out from Google account.', 'info');
      } catch (err: any) {
        console.error('Logout error:', err);
        showToast('Logout failed. Please try again.', 'error');
      } finally {
        setIsAuthProcessing(false);
      }
    } else {
      // Real Firebase Google Login
      try {
        const user = await loginWithGoogle();
        if (!user) {
          // User closed popup or cancelled
          showToast('Sign-in cancelled.', 'info');
          return;
        }

        const userEmail = user.email || '';
        const userDisplayName = user.displayName || profile.playerName || 'Hasu Hero';
        const userPhoto = user.photoURL || profile.avatarUrl || '';
        const uid = user.uid;

        // Check if data already exists in Firebase Realtime Database
        const cloudData = await loadProfileFromFirebase(uid);

        let updatedProfile: PlayerProfile;
        if (cloudData) {
          // Restore cloud data and merge
          updatedProfile = {
            ...profile,
            ...cloudData,
            firebaseUid: uid,
            isLoggedIn: true,
            email: userEmail,
            playerName: cloudData.playerName || userDisplayName,
            avatarUrl: userPhoto || cloudData.avatarUrl || profile.avatarUrl,
            coins: Math.max(Number(profile.coins) || 0, Number(cloudData.coins) || 0),
            highScoreRunner: Math.max(Number(profile.highScoreRunner) || 0, Number(cloudData.highScoreRunner) || 0),
            unlockedCharacters: Array.from(new Set([
              ...(profile.unlockedCharacters || ['hasu_default']),
              ...(cloudData.unlockedCharacters || [])
            ]))
          };
        } else {
          // Save initial local data to Firebase under this user's UID
          updatedProfile = {
            ...profile,
            firebaseUid: uid,
            isLoggedIn: true,
            email: userEmail,
            playerName: userDisplayName,
            avatarUrl: userPhoto || profile.avatarUrl
          };
          await saveProfileToFirebase(uid, updatedProfile);
        }

        onUpdateProfile(updatedProfile);
        showToast(`Welcome ${userDisplayName}! Connected to Cloud Save.`);
      } catch (err: any) {
        const errorCode = err?.code || '';
        const errorMessage = err?.message || '';

        if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
          showToast('Sign-in popup was closed.', 'info');
          return;
        }

        console.error('Google Sign-In error:', err);

        if (errorCode === 'auth/popup-blocked') {
          setAuthErrorModal({
            code: 'auth/popup-blocked',
            message: 'Browser has blocked the Google Sign-in popup window.',
            domain: currentDomain
          });
        } else if (errorCode === 'auth/unauthorized-domain') {
          setAuthErrorModal({
            code: 'auth/unauthorized-domain',
            message: `Domain "${currentDomain}" is not in Firebase Authorized Domains.`,
            domain: currentDomain
          });
        } else if (errorCode === 'auth/operation-not-allowed' || errorCode === 'auth/configuration-not-found') {
          setAuthErrorModal({
            code: errorCode,
            message: 'Google Sign-In provider is disabled in Firebase Console.',
            domain: currentDomain
          });
        } else {
          setAuthErrorModal({
            code: errorCode || 'auth/unknown',
            message: errorMessage || 'Failed to authenticate with Google.',
            domain: currentDomain
          });
        }
      } finally {
        setIsAuthProcessing(false);
      }
    }
  };

  const handleManualEmailConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = manualEmailInput.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid Google email address.', 'error');
      return;
    }

    try {
      setIsAuthProcessing(true);
      const generatedUid = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const defaultName = email.split('@')[0].toUpperCase();

      // Check if existing data is in Firebase Realtime Database
      const cloudData = await loadProfileFromFirebase(generatedUid);

      let updatedProfile: PlayerProfile;
      if (cloudData) {
        updatedProfile = {
          ...profile,
          ...cloudData,
          firebaseUid: generatedUid,
          isLoggedIn: true,
          email: email,
          playerName: cloudData.playerName || profile.playerName || defaultName,
          avatarUrl: cloudData.avatarUrl || profile.avatarUrl,
          coins: Math.max(Number(profile.coins) || 0, Number(cloudData.coins) || 0),
          highScoreRunner: Math.max(Number(profile.highScoreRunner) || 0, Number(cloudData.highScoreRunner) || 0)
        };
      } else {
        updatedProfile = {
          ...profile,
          firebaseUid: generatedUid,
          isLoggedIn: true,
          email: email,
          playerName: profile.playerName || defaultName
        };
        await saveProfileToFirebase(generatedUid, updatedProfile);
      }

      onUpdateProfile(updatedProfile);
      setShowManualConnect(false);
      setAuthErrorModal(null);
      sound.playPowerup();
      showToast(`Connected as ${email}! All coins and scores will sync to Cloud Save.`);
    } catch (err: any) {
      console.error('Manual connect error:', err);
      showToast('Failed to connect. Please check internet connection.', 'error');
    } finally {
      setIsAuthProcessing(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 pb-28 select-none relative overflow-y-auto">
      {/* Background Ambient Glow */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg mx-auto flex flex-col space-y-6 relative z-10">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-headline-lg drop-shadow-md">
                Settings
              </h2>
              <p className="text-xs text-slate-400 font-medium">Profile & Account Setup</p>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-2xl text-xs sm:text-sm font-bold text-center border backdrop-blur-md z-20 ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
              }`}
            >
              {toastMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PROFILE CARD WITH GLASS EFFECT EDIT ICONS --- */}
        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {/* Profile Picture with Glass Effect Edit Button */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-pink-500 to-cyan-400 shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center border-2 border-slate-950 shadow-inner">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.playerName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-5xl">🐯</span>
                )}
              </div>
            </div>

            {/* Hidden File Input for Device Gallery/Camera */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Glass Effect Avatar Edit Icon Button - Directly opens Gallery/File picker */}
            <button
              onClick={() => {
                sound.playClick();
                fileInputRef.current?.click();
              }}
              disabled={isUploadingPhoto}
              className="absolute bottom-0 right-0 p-2.5 bg-white/25 hover:bg-white/40 active:scale-90 backdrop-blur-xl border border-white/40 rounded-full text-white shadow-[0_4px_15px_rgba(0,0,0,0.6)] transition cursor-pointer disabled:opacity-60"
              title="Upload Photo from Gallery / Device (গ্যালারি থেকে ছবি আপলোড করুন)"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Player Name with Glass Effect Edit Icon */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-xs mt-1">
                <input
                  type="text"
                  maxLength={20}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  className="flex-1 px-3.5 py-2 bg-black/60 border border-white/30 rounded-2xl text-white font-bold text-base text-center focus:outline-none focus:border-amber-400 shadow-inner"
                />
                <button
                  onClick={handleSaveName}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl active:scale-95 transition shadow-md"
                  title="Save Name"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
                <button
                  onClick={() => {
                    setNameInput(profile.playerName || 'Hasu Hero');
                    setIsEditingName(false);
                  }}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-2xl active:scale-95 transition"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2.5 mt-1">
                <h3 className="text-xl sm:text-2xl font-black text-white font-headline-lg tracking-wide drop-shadow-md">
                  {profile.playerName || 'Hasu Hero'}
                </h3>
                {/* Glass Effect Name Edit Icon Button */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsEditingName(true);
                  }}
                  className="p-2 bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/25 rounded-xl text-slate-200 hover:text-white transition active:scale-90 shadow-sm"
                  title="Edit Name (নাম পরিবর্তন করুন)"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Google Logged-In Badge or Guest Status */}
            {profile.isLoggedIn && profile.email ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold mt-1 shadow-sm">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Connected: {profile.email}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium mt-0.5">Guest Player • Tap below to link Google</span>
            )}
          </div>
        </div>

        {/* --- GOOGLE LOGIN BUTTON (Large Cartoon Solid White Button) --- */}
        <div className="w-full pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            disabled={isAuthProcessing}
            onClick={handleGoogleLogin}
            className={`w-full py-4 px-6 rounded-2xl border-2 font-headline-lg text-base sm:text-lg font-black transition-all duration-150 ease-in-out flex items-center justify-center gap-3 group cursor-pointer disabled:opacity-60 ${
              profile.isLoggedIn
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-950 shadow-[0_8px_25px_rgba(244,63,94,0.25)]'
                : 'bg-white hover:bg-slate-100 border-white/90 text-slate-900 shadow-[0_8px_30px_rgba(255,255,255,0.4)]'
            }`}
          >
            {/* Cartoon Style Google Icon Container */}
            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform">
              {isAuthProcessing ? (
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              ) : profile.isLoggedIn ? (
                <LogOut className="w-4 h-4 text-rose-600" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
            </div>

            <span className="tracking-wider drop-shadow-sm">
              {isAuthProcessing 
                ? 'CONNECTING...' 
                : profile.isLoggedIn 
                ? 'LOGOUT FROM GOOGLE' 
                : 'CONTINUE WITH GOOGLE'}
            </span>

            <span className="text-slate-500 group-hover:translate-x-1 transition-transform font-bold text-lg">
              ➔
            </span>
          </motion.button>

          {/* Quick Manual Link fallback button if needed */}
          {!profile.isLoggedIn && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowManualConnect(true);
                }}
                className="text-[11px] text-cyan-400/80 hover:text-cyan-300 underline font-medium cursor-pointer transition"
              >
                Popup সমস্যা হলে? Direct Google Email দিয়ে লিংক করুন ↗
              </button>
            </div>
          )}
        </div>

      </div>

      {/* --- GOOGLE AUTH DIAGNOSTIC / ERROR MODAL --- */}
      <AnimatePresence>
        {authErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-white relative"
            >
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline-lg font-black text-base sm:text-lg text-amber-300">
                    Google Sign-In সেটিংস প্রয়োজন
                  </h3>
                  <p className="text-[11px] text-slate-400">Error: {authErrorModal.code}</p>
                </div>
              </div>

              {/* Error Explanation */}
              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 space-y-2 text-xs leading-relaxed text-slate-200">
                {authErrorModal.code === 'auth/unauthorized-domain' ? (
                  <>
                    <p className="text-amber-200 font-bold">
                      ⚠️ আপনার বর্তমান ডোমেইনটি অথোরাইজড তালিকায় অ্যাড করা নেই।
                    </p>
                    <p>
                      ১. <strong className="text-white">Authentication Settings &gt; Authorized domains</strong>-এ যান।<br />
                      ২. <strong className="text-cyan-300">"Add domain"</strong> ক্লিক করে নিচের ডোমেইনটি পেস্ট করুন:
                    </p>
                    <div className="flex items-center justify-between bg-black/70 p-2 rounded-xl border border-cyan-500/30 font-mono text-[11px] text-cyan-300 break-all">
                      <span>{authErrorModal.domain}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(authErrorModal.domain);
                          showToast('Domain copied to clipboard!');
                        }}
                        className="ml-2 px-2 py-1 bg-cyan-500 text-slate-950 rounded font-bold text-[10px] shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </>
                ) : authErrorModal.code === 'auth/popup-blocked' ? (
                  <>
                    <p className="text-amber-200 font-bold">
                      ⚠️ আপনার ব্রাউজার পপআপ ব্লক করেছে অথবা প্রিভিউ আইফ্রেমের কারণে পপআপ বন্ধ হয়েছে।
                    </p>
                    <p>
                      ব্রাউজারের URL বারে গিয়ে পপআপ <strong>"Always allow popups"</strong> সিলেক্ট করুন অথবা সরাসরি নতুন ট্যাবে ওপেন করুন।
                    </p>
                  </>
                ) : authErrorModal.code === 'auth/operation-not-allowed' ? (
                  <>
                    <p className="text-amber-200 font-bold">
                      ⚠️ Google Sign-in Provider বর্তমানে নিষ্ক্রিয় রয়েছে।
                    </p>
                    <p>
                      কন্ট্রোলে গিয়ে <strong>Authentication &gt; Sign-in method &gt; Google</strong> এনাবল করুন।
                    </p>
                  </>
                ) : (
                  <p>{authErrorModal.message}</p>
                )}
              </div>

              {/* Direct Fallback Action */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthErrorModal(null);
                    setShowManualConnect(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg hover:from-cyan-400 hover:to-blue-400 transition"
                >
                  Direct Google Email দিয়ে লিংক করুন (তাত্ক্ষণিক কাজ করবে)
                </button>

                <button
                  type="button"
                  onClick={() => setAuthErrorModal(null)}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MANUAL DIRECT GOOGLE LINK MODAL --- */}
      <AnimatePresence>
        {showManualConnect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-cyan-400/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-white relative"
            >
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline-lg font-black text-base sm:text-lg text-cyan-300">
                    Google Account Direct Link
                  </h3>
                  <p className="text-[11px] text-slate-400">Live Cloud Sync & Auto-Save</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার Google Email দিন। এই ইমেইলের আন্ডারে আপনার সমস্ত কয়েন, স্কোর ও ক্যারেক্টার ক্লাউড সার্ভারে চিরস্থায়ীভাবে সুরক্ষিত থাকবে।
              </p>

              <form onSubmit={handleManualEmailConnect} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={manualEmailInput}
                    onChange={(e) => setManualEmailInput(e.target.value)}
                    className="w-full px-4 py-3 bg-black/60 border border-white/20 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualConnect(false)}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthProcessing || !manualEmailInput.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg transition disabled:opacity-50"
                  >
                    {isAuthProcessing ? 'Linking...' : 'Connect & Sync'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="w-full text-center pt-6 pb-2 border-t border-white/10 relative z-10 max-w-lg mx-auto">
        <p className="text-xs text-slate-500 font-medium">
          Hasu Appa Adventure Edition • Version 2.4.0
        </p>
      </div>
    </div>
  );
};
