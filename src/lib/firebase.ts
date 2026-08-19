import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics, logEvent } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  child,
  Database
} from 'firebase/database';
import { PlayerProfile } from '../types';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCUejsoqnhBX2zu0FPXfq7gwAixWNGf3u0",
  authDomain: "hasu-appa.firebaseapp.com",
  databaseURL: "https://hasu-appa-default-rtdb.firebaseio.com",
  projectId: "hasu-appa",
  storageBucket: "hasu-appa.firebasestorage.app",
  messagingSenderId: "476759050114",
  appId: "1:476759050114:web:8c03d9bbafb89153f5319b",
  measurementId: "G-VL4F7673LE"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Analytics safely (with environment check for browser/preview)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('[Firebase] Analytics successfully initialized:', firebaseConfig.measurementId);
    }
  }).catch((err) => {
    console.info('[Firebase Analytics] Analytics initialization skipped:', err);
  });
}

// Analytics Helper
export const logGameEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, eventParams);
    } catch (e) {
      // ignore
    }
  }
};

export const auth = getAuth(app);
export const rtdb: Database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut
};
export type { User };
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const errorCode = error?.code || '';
    // Gracefully handle harmless user-cancelled actions (popup dismissed / closed by user)
    if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
      console.info('[Firebase Auth] Sign-in cancelled or popup closed by user.');
      return null;
    }
    console.warn('Google sign-in attempt warning:', error);
    throw error;
  }
};

// Logout helper
export const logoutFromFirebase = async (): Promise<void> => {
  await signOut(auth);
};

// Save profile to Realtime Database
export const saveProfileToFirebase = async (uidOrGameId: string, profile: PlayerProfile): Promise<boolean> => {
  if (!uidOrGameId) return false;
  try {
    const userRef = ref(rtdb, `users/${uidOrGameId}`);
    const dataToSave = {
      gameId: profile.gameId,
      playerName: profile.playerName || 'Hasu Hero',
      avatarUrl: profile.avatarUrl || '',
      email: profile.email || '',
      isLoggedIn: !!profile.isLoggedIn,
      coins: Number(profile.coins) || 0,
      unlockedCharacters: profile.unlockedCharacters || ['hasu_default'],
      selectedCharacterId: profile.selectedCharacterId || 'hasu_default',
      highScoreRunner: Number(profile.highScoreRunner) || 0,
      puzzlesCompleted: profile.puzzlesCompleted || [],
      customCharacters: profile.customCharacters || [],
      lastSaved: new Date().toISOString()
    };
    await set(userRef, dataToSave);
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('Permission denied')) {
      console.info('[Cloud Sync] Realtime Database permission restricted (saved to local device storage).');
    } else {
      console.warn('[Cloud Sync] Database save warning:', errMsg);
    }
    return false;
  }
};

// Load profile from Realtime Database
export const loadProfileFromFirebase = async (uidOrGameId: string): Promise<Partial<PlayerProfile> | null> => {
  if (!uidOrGameId) return null;
  try {
    const dbRef = ref(rtdb);
    const snapshot = await get(child(dbRef, `users/${uidOrGameId}`));
    if (snapshot.exists()) {
      return snapshot.val() as Partial<PlayerProfile>;
    }
    return null;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('Permission denied')) {
      console.info('[Cloud Sync] Realtime Database permission restricted for unauthenticated/guest read.');
    } else {
      console.warn('[Cloud Sync] Database load warning:', errMsg);
    }
    return null;
  }
};
