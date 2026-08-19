import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface PlayerProfile {
  gameId: string;
  playerName: string;
  coins: number;
  unlockedCharacters: string[];
  selectedCharacterId: string;
  highScoreRunner: number;
  puzzlesCompleted: number[];
  customCharacters: Array<{
    id: string;
    name: string;
    imageUrl: string;
    cost: number;
    speedBonus: number;
    jumpPower: number;
    description: string;
  }>;
  lastSaved: string;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory profile store with disk persistence backup
const profilesFilePath = path.join(process.cwd(), 'data_profiles.json');
let profilesStore: Record<string, PlayerProfile> = {};

// ImgBB API Key provided by user
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'c0c254c4242bc9b3146fc75d1951faa0';

// Load existing profiles from disk if available
try {
  if (fs.existsSync(profilesFilePath)) {
    const raw = fs.readFileSync(profilesFilePath, 'utf-8');
    profilesStore = JSON.parse(raw);
    console.log(`[Server] Loaded ${Object.keys(profilesStore).length} player profiles from storage.`);
  }
} catch (err) {
  console.error('[Server] Failed to read saved profiles:', err);
  profilesStore = {};
}

function saveProfilesToDisk() {
  try {
    fs.writeFileSync(profilesFilePath, JSON.stringify(profilesStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Failed to persist profiles to disk:', err);
  }
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Hasu Appa', timestamp: new Date().toISOString() });
});

// Create new Game ID profile
app.post('/api/profile/create', (req, res) => {
  const { playerName } = req.body || {};
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const gameId = `HASU-${randomNum}`;

  const newProfile: PlayerProfile = {
    gameId,
    playerName: playerName || `Hasu Runner ${randomNum.toString().slice(-4)}`,
    coins: 100, // Welcome starter bonus
    unlockedCharacters: ['hasu_default', 'appa_classic'],
    selectedCharacterId: 'hasu_default',
    highScoreRunner: 0,
    puzzlesCompleted: [],
    customCharacters: [],
    lastSaved: new Date().toISOString()
  };

  profilesStore[gameId] = newProfile;
  saveProfilesToDisk();

  res.json({ success: true, profile: newProfile });
});

// Load profile by Game ID
app.get('/api/profile/load/:gameId', (req, res) => {
  const rawId = (req.params.gameId || '').toUpperCase().trim();
  const profile = profilesStore[rawId];

  if (profile) {
    res.json({ success: true, profile });
  } else {
    res.status(404).json({ success: false, message: `Game ID "${rawId}" not found. You can create a new ID!` });
  }
});

// Save or sync profile
app.post('/api/profile/save', (req, res) => {
  const { gameId, profileData } = req.body || {};
  if (!gameId) {
    return res.status(400).json({ success: false, message: 'Missing gameId' });
  }

  const existing = profilesStore[gameId] || {
    gameId,
    playerName: 'Hasu Hero',
    coins: 0,
    unlockedCharacters: ['hasu_default'],
    selectedCharacterId: 'hasu_default',
    highScoreRunner: 0,
    puzzlesCompleted: [],
    customCharacters: [],
    lastSaved: new Date().toISOString()
  };

  const updatedProfile: PlayerProfile = {
    ...existing,
    ...profileData,
    gameId,
    lastSaved: new Date().toISOString()
  };

  profilesStore[gameId] = updatedProfile;
  saveProfilesToDisk();

  res.json({ success: true, profile: updatedProfile, message: 'Profile saved successfully!' });
});

// Upload avatar image to ImgBB via API key
app.post('/api/upload-avatar', async (req, res) => {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Missing imageBase64 data' });
    }

    // Clean any data URI base64 header (e.g. data:image/jpeg;base64, data:image/png;base64, etc.)
    const cleanBase64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, '').trim();

    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', cleanBase64);

    const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    const data = (await imgbbResponse.json()) as any;

    if (data && data.success && data.data && (data.data.url || data.data.display_url)) {
      const permanentUrl = data.data.display_url || data.data.url;
      return res.json({
        success: true,
        imageUrl: permanentUrl,
        thumbUrl: data.data.thumb?.url || permanentUrl,
        deleteUrl: data.data.delete_url
      });
    } else {
      console.error('[ImgBB API Error]', data);
      return res.status(500).json({
        success: false,
        message: data?.error?.message || 'Failed to upload image to ImgBB server.'
      });
    }
  } catch (error: any) {
    console.error('[ImgBB Upload Server Error]', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error while uploading avatar'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hasu Appa] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
