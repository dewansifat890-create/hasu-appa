import React, { useEffect, useRef, useState } from 'react';
import { Character, Particle, RunnerCoin, RunnerObstacle, ObstacleType } from '../types';
import { drawCharacter } from '../utils/characterRenderer';
import { sound } from '../utils/sound';
import { Play, RotateCcw, ShoppingBag, Volume2, VolumeX, ArrowLeft, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RunnerCanvasProps {
  character: Character;
  onGameOver: (coinsCollected: number, distance: number) => void;
  onBackToHome: () => void;
  onOpenShop: () => void;
}

export const RunnerCanvas: React.FC<RunnerCanvasProps> = ({
  character,
  onGameOver,
  onBackToHome,
  onOpenShop
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  // First time player gesture animated tutorial state
  const [showFirstTimeTutorial, setShowFirstTimeTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<'SWIPE_UP' | 'SWIPE_DOWN'>('SWIPE_UP');
  const tutorialTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Active powerups
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [hasMagnet, setHasMagnet] = useState<boolean>(false);
  const [boostTimer, setBoostTimer] = useState<number>(0);

  // Preload custom home images & custom character obstacles with automatic PNG background removal
  const homeImagesRef = useRef<HTMLImageElement[]>([]);
  const customObstacleImagesRef = useRef<HTMLImageElement[]>([]);
  const customObstacleCanvasesRef = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    // Preload and convert all 4 custom obstacle characters into clean transparent PNG cutouts
    const customObstacleUrls = [
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1787032925/photo_2026-08-17_22-57-57_sbaxfy.jpg',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1787059009/images_gajndd.jpg',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1787059013/fabe3eaa5957ccefc276250bbb91dc9a_mieb59.jpg',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1787059018/pngtree-funny-bengali-tea-seller-cartoon-png-image_19039636_xxukzy.webp'
    ];

    const convertToTransparent = (img: HTMLImageElement, idx: number) => {
      try {
        const offCanvas = document.createElement('canvas');
        const w = img.naturalWidth || img.width || 300;
        const h = img.naturalHeight || img.height || 400;
        if (w <= 0 || h <= 0) return;
        offCanvas.width = w;
        offCanvas.height = h;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
        if (offCtx) {
          offCtx.drawImage(img, 0, 0, w, h);
          const imgData = offCtx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // 1. Sample 4 outer corners for specific background color
          const cornerColors = [
            { r: data[0], g: data[1], b: data[2], a: data[3] },
            { r: data[(w - 1) * 4], g: data[(w - 1) * 4 + 1], b: data[(w - 1) * 4 + 2], a: data[(w - 1) * 4 + 3] },
            { r: data[(h - 1) * w * 4], g: data[(h - 1) * w * 4 + 1], b: data[(h - 1) * w * 4 + 2], a: data[(h - 1) * w * 4 + 3] },
            { r: data[((h - 1) * w + (w - 1)) * 4], g: data[((h - 1) * w + (w - 1)) * 4 + 1], b: data[((h - 1) * w + (w - 1)) * 4 + 2], a: data[((h - 1) * w + (w - 1)) * 4 + 3] }
          ];

          // 2. Safe Edge BFS: Only remove pixels matching outer corner colors or bright white
          const visited = new Uint8Array(w * h);
          const queue: number[] = [];

          const isStrictBg = (r: number, g: number, b: number, a: number) => {
            if (a < 15) return true;
            // Pure white or solid pale background
            if (r > 225 && g > 225 && b > 225) return true;
            if (r > 205 && g > 205 && b > 205 && Math.abs(r - g) < 14 && Math.abs(g - b) < 14) return true;

            // Matches any corner with tight tolerance (prevents wiping character skin/clothes)
            for (const c of cornerColors) {
              if (c.a > 50) {
                const d = Math.hypot(r - c.r, g - c.g, b - c.b);
                if (d < 24) return true;
              }
            }
            return false;
          };

          // Seed border pixels
          for (let x = 0; x < w; x++) {
            const t = x;
            if (isStrictBg(data[t * 4], data[t * 4 + 1], data[t * 4 + 2], data[t * 4 + 3])) {
              visited[t] = 1;
              queue.push(t);
            }
            const b = (h - 1) * w + x;
            if (isStrictBg(data[b * 4], data[b * 4 + 1], data[b * 4 + 2], data[b * 4 + 3])) {
              visited[b] = 1;
              queue.push(b);
            }
          }
          for (let y = 0; y < h; y++) {
            const l = y * w;
            if (!visited[l] && isStrictBg(data[l * 4], data[l * 4 + 1], data[l * 4 + 2], data[l * 4 + 3])) {
              visited[l] = 1;
              queue.push(l);
            }
            const r = y * w + (w - 1);
            if (!visited[r] && isStrictBg(data[r * 4], data[r * 4 + 1], data[r * 4 + 2], data[r * 4 + 3])) {
              visited[r] = 1;
              queue.push(r);
            }
          }

          let head = 0;
          while (head < queue.length) {
            const curr = queue[head++];
            const cx = curr % w;
            const cy = Math.floor(curr / w);
            const cp = curr * 4;

            data[cp + 3] = 0; // Transparent

            const nbs = [
              cx > 0 ? curr - 1 : -1,
              cx < w - 1 ? curr + 1 : -1,
              cy > 0 ? curr - w : -1,
              cy < h - 1 ? curr + w : -1
            ];

            for (const n of nbs) {
              if (n !== -1 && visited[n] === 0) {
                const np = n * 4;
                if (isStrictBg(data[np], data[np + 1], data[np + 2], data[np + 3])) {
                  visited[n] = 1;
                  queue.push(n);
                }
              }
            }
          }

          // Safety validation: verify that character is intact (at least 8% non-transparent pixels)
          let visibleCount = 0;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 30) visibleCount++;
          }

          if (visibleCount > (w * h) * 0.08) {
            offCtx.putImageData(imgData, 0, 0);
          } else {
            // If over-erased, redraw original safely
            offCtx.clearRect(0, 0, w, h);
            offCtx.drawImage(img, 0, 0, w, h);
          }

          customObstacleCanvasesRef.current[idx] = offCanvas;
        }
      } catch (err) {
        console.warn('[Runner] Transparency notice for obstacle ' + idx + ':', err);
      }
    };

    customObstacleImagesRef.current = customObstacleUrls.map((url, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;

      img.onload = () => {
        convertToTransparent(img, idx);
      };

      if (img.complete && img.naturalWidth > 0) {
        convertToTransparent(img, idx);
      }

      return img;
    });

    const urls = [
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882100/IMG_4529_nmoj2m.png',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882101/IMG_4530_tojseo.png',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882101/IMG_4533_vrpu4a.png',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882102/IMG_4526_qe9sdp.png',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882102/IMG_4527_jjetzp.png',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882102/IMG_4531_aq85ek.png',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882102/IMG_4527_upjkqg.png',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882103/IMG_4532_tgghtt.png',
      'https://res.cloudinary.com/cwrroxz3/image/upload/v1786882100/IMG_4534_ms6sum.png'
    ];

    homeImagesRef.current = urls.map(url => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      return img;
    });
  }, []);

  // Refs for animation loop state
  const stateRef = useRef({
    gameState: 'READY',
    coinsCollected: 0,
    coinsSpawnedTotal: 0,
    distance: 0,
    speed: 6 * (character.speedBonus || 1.0),
    frame: 0,
    // Player Physics (Positioned further backward to the left for better visibility)
    playerX: 50,
    playerY: 0,
    playerVy: 0,
    isGrounded: true,
    isSliding: false,
    slideTimer: 0,
    canDoubleJump: true,
    // Powerups
    shield: false,
    shieldTimer: 0,
    nextShieldDistance: 75,
    magnetTimer: 0,
    nextMagnetDistance: 130,
    boostTimer: 0,
    // Arrays
    obstacles: [] as RunnerObstacle[],
    coins: [] as RunnerCoin[],
    particles: [] as Particle[],
    nextObstacleFrame: 50,
    customObsCounter: 0,
    // Ground level
    groundY: 0,
    playerWidth: 46,
    playerHeight: 64,
  });

  // Keep character reference updated in loop
  const charRef = useRef<Character>(character);
  useEffect(() => {
    charRef.current = character;
    stateRef.current.speed = 6.5 * (character.speedBonus || 1.0);
  }, [character]);

  // Touch controls state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Dismiss tutorial helper & save to localStorage so it never shows again
  const dismissTutorial = () => {
    tutorialTimerRef.current.forEach(t => clearTimeout(t));
    tutorialTimerRef.current = [];
    setShowFirstTimeTutorial(false);
    try {
      localStorage.setItem('hasu_runner_tutorial_done', 'true');
    } catch {
      // ignore
    }
  };

  // Trigger jump action
  const handleJump = () => {
    const s = stateRef.current;
    if (s.gameState !== 'PLAYING') return;

    if (showFirstTimeTutorial && tutorialStep === 'SWIPE_UP') {
      setTutorialStep('SWIPE_DOWN');
    }

    if (s.isGrounded) {
      // Natural, satisfying platformer jump arc with comfortable leap distance
      s.playerVy = -9.8 * (charRef.current.jumpPower || 1.0);
      s.isGrounded = false;
      s.isSliding = false;
      s.canDoubleJump = true;
      sound.playJump();
      addDustParticles(s.playerX, s.playerY + s.playerHeight, '#E2E8F0', 10);
    } else if (s.canDoubleJump) {
      s.playerVy = -9.0 * (charRef.current.jumpPower || 1.0);
      s.canDoubleJump = false;
      sound.playJump();
      addDustParticles(s.playerX, s.playerY + s.playerHeight, '#38BDF8', 12);
    }
  };

  // Trigger slide/duck action with instant ground-hug
  const handleSlide = () => {
    const s = stateRef.current;
    if (s.gameState !== 'PLAYING') return;

    if (showFirstTimeTutorial && tutorialStep === 'SWIPE_DOWN') {
      dismissTutorial();
    }

    if (!s.isGrounded) {
      // Fast drop down directly into low road slide if swiped in air
      s.playerVy = 16;
    }
    s.isSliding = true;
    s.slideTimer = 40; // duration of slide in frames
    sound.playSlide();
    addDustParticles(s.playerX + s.playerWidth / 2, s.groundY - 2, '#CBD5E1', 12);
  };

  // Particle explosion helper (Optimized with strict cap to prevent garbage collection lag)
  const addDustParticles = (x: number, y: number, color: string, count: number) => {
    const s = stateRef.current;
    const safeCount = Math.min(count, 8); // Light particle count for zero lag
    for (let i = 0; i < safeCount; i++) {
      if (s.particles.length >= 25) {
        s.particles.shift(); // Evict oldest particle
      }
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 3 - 2,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 15 + 10
      });
    }
  };

  const handleStartGame = () => {
    sound.playRunnerMusic();
    const s = stateRef.current;
    s.gameState = 'PLAYING';
    s.coinsCollected = 0;
    s.distance = 0;
    s.speed = 6.5 * (charRef.current.speedBonus || 1.0);
    s.frame = 0;
    s.playerY = s.groundY - s.playerHeight;
    s.playerVy = 0;
    s.isGrounded = true;
    s.isSliding = false;
    s.shield = false;
    s.shieldTimer = 0;
    s.nextShieldDistance = 75;
    s.magnetTimer = 0;
    s.nextMagnetDistance = 140;
    s.boostTimer = 0;
    s.obstacles = [];
    s.coins = [];
    s.particles = [];
    s.nextObstacleFrame = 50;
    s.customObsCounter = 0;

    setGameState('PLAYING');
    setCoinsCollected(0);
    setDistance(0);
    setHasShield(false);
    setHasMagnet(false);
    setBoostTimer(0);

    // Check if player is playing for the very FIRST TIME
    const isTutorialDone = (() => {
      try {
        return localStorage.getItem('hasu_runner_tutorial_done') === 'true';
      } catch {
        return false;
      }
    })();

    if (!isTutorialDone) {
      setShowFirstTimeTutorial(true);
      setTutorialStep('SWIPE_UP');

      // Clear any previous timers
      tutorialTimerRef.current.forEach(t => clearTimeout(t));
      tutorialTimerRef.current = [];

      // Step 1: Upward Swipe (0 to 1.8s)
      const t1 = setTimeout(() => {
        setTutorialStep('SWIPE_DOWN');
      }, 1900);

      // Step 2: Downward Swipe (1.9s to 3.8s), then auto dismiss
      const t2 = setTimeout(() => {
        dismissTutorial();
      }, 3800);

      tutorialTimerRef.current.push(t1, t2);
    }
  };

  // Setup Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let cachedSkyGrad: CanvasGradient | null = null;
    let lastRecordedDistance = -1;

    const updateCanvasSize = () => {
      // Cap DPR to 1.75 to prevent GPU pixel fill bottlenecks & heating on high-DPI budget phones
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const rect = canvas.getBoundingClientRect();

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);

      const displayW = rect.width;
      const displayH = rect.height;
      
      // Position character further backward to the left for plenty of forward running reaction view
      stateRef.current.playerX = Math.max(35, Math.min(65, displayW * 0.12));
      stateRef.current.groundY = displayH - 80;
      
      if (stateRef.current.isGrounded) {
        stateRef.current.playerY = stateRef.current.groundY - stateRef.current.playerHeight;
      }

      // Pre-create and cache sky gradient on resize
      cachedSkyGrad = ctx.createLinearGradient(0, 0, 0, displayH);
      cachedSkyGrad.addColorStop(0, '#0F172A');
      cachedSkyGrad.addColorStop(0.4, '#1E1B4B');
      cachedSkyGrad.addColorStop(0.8, '#312E81');
      cachedSkyGrad.addColorStop(1, '#4338CA');
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // --- GAME LOOP ---
    const render = () => {
      const s = stateRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      s.frame++;

      // --- 1. DRAW PARALLAX BACKGROUND (Sky, Clouds, Mountains, Trees, Track) ---
      // Sky Gradient
      ctx.fillStyle = cachedSkyGrad || '#1E1B4B';
      ctx.fillRect(0, 0, width, height);

      // Parallax Distant Mountains
      const mtnOffset = (s.frame * 0.5) % width;
      ctx.fillStyle = '#1E1B4B';
      ctx.beginPath();
      ctx.moveTo(-mtnOffset, s.groundY);
      ctx.lineTo(150 - mtnOffset, s.groundY - 140);
      ctx.lineTo(350 - mtnOffset, s.groundY - 40);
      ctx.lineTo(550 - mtnOffset, s.groundY - 180);
      ctx.lineTo(800 - mtnOffset, s.groundY - 60);
      ctx.lineTo(width + 300 - mtnOffset, s.groundY);
      ctx.fill();

      // Second layer of mountains
      ctx.fillStyle = '#312E81';
      ctx.beginPath();
      ctx.moveTo(-mtnOffset + width, s.groundY);
      ctx.lineTo(150 - mtnOffset + width, s.groundY - 140);
      ctx.lineTo(350 - mtnOffset + width, s.groundY - 40);
      ctx.lineTo(550 - mtnOffset + width, s.groundY - 180);
      ctx.lineTo(800 - mtnOffset + width, s.groundY - 60);
      ctx.lineTo(width * 2 + 300 - mtnOffset, s.groundY);
      ctx.fill();

      // --- Light White-Blue Parallax Sky Clouds (Optimized without shadowBlur for silky 60fps) ---
      const drawCloud = (cx: number, cy: number, scale: number, opacity: number) => {
        // Soft outer ambient halo puff (Fast hardware opacity fill, 0 blur lag)
        ctx.fillStyle = `rgba(186, 230, 253, ${opacity * 0.35})`;
        ctx.beginPath();
        ctx.arc(cx + 28 * scale, cy - 2 * scale, 38 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Base light white-blue puff body
        ctx.fillStyle = `rgba(240, 249, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 18 * scale, cy - 12 * scale, 28 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 46 * scale, cy - 8 * scale, 24 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 68 * scale, cy + 2 * scale, 19 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 34 * scale, cy + 6 * scale, 22 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Shaded lower highlight in pastel sky-blue
        ctx.fillStyle = `rgba(186, 230, 253, ${opacity * 0.85})`;
        ctx.beginPath();
        ctx.arc(cx + 16 * scale, cy + 6 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 42 * scale, cy + 8 * scale, 17 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 62 * scale, cy + 6 * scale, 13 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Pure white top-lit crest
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.95})`;
        ctx.beginPath();
        ctx.arc(cx + 20 * scale, cy - 10 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 44 * scale, cy - 6 * scale, 14 * scale, 0, Math.PI * 2);
        ctx.fill();
      };

      // Layer 1: High distant clouds
      const cloudSpeed1 = s.distance * 18 + s.frame * 0.3;
      const cloudSpacing1 = 280;
      for (let i = -1; i < Math.ceil(width / cloudSpacing1) + 2; i++) {
        const cx = ((i * cloudSpacing1 - (cloudSpeed1 % (cloudSpacing1 * 4))) % (width + 300 + cloudSpacing1)) - 100;
        const cy = 72 + ((i * 37) % 35);
        drawCloud(cx, cy, 0.95, 0.75);
      }

      // Layer 2: Mid-sky clouds
      const cloudSpeed2 = s.distance * 34 + s.frame * 0.6;
      const cloudSpacing2 = 360;
      for (let j = -1; j < Math.ceil(width / cloudSpacing2) + 2; j++) {
        const cx = ((j * cloudSpacing2 - (cloudSpeed2 % (cloudSpacing2 * 4))) % (width + 400 + cloudSpacing2)) - 120;
        const cy = 120 + ((j * 43) % 40);
        drawCloud(cx, cy, 1.25, 0.88);
      }

      // Custom Background Scenery: Continuous Row of Homes
      const PIXELS_PER_METER = 1 / 0.015;
      const currentWorldX = s.distance * PIXELS_PER_METER;
      const HOUSE_SPACING = 200;
      const houseImgs = homeImagesRef.current;

      const minWorldX = currentWorldX - s.playerX - 450;
      const maxWorldX = currentWorldX + (width - s.playerX) + 450;
      const minK = Math.max(0, Math.floor(minWorldX / HOUSE_SPACING));
      const maxK = Math.ceil(maxWorldX / HOUSE_SPACING);

      for (let k = minK; k <= maxK; k++) {
        const houseWorldX = k * HOUSE_SPACING;
        const drawX = s.playerX + (houseWorldX - currentWorldX);

        if (drawX >= -400 && drawX <= width + 400) {
          const seed = Math.abs(Math.sin(k * 12.9898 + 45.32) * 43758.5453);
          const imgIndex = houseImgs.length > 0 ? Math.floor(seed * houseImgs.length) % houseImgs.length : 0;
          const homeImg = houseImgs[imgIndex];

          const scale = 0.96 + (seed % 0.14);
          const houseW = 280 * scale;
          const houseH = 290 * scale;
          const drawY = s.groundY - houseH + 6;

          // Soft ground shadow for grounded look
          ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
          ctx.beginPath();
          ctx.ellipse(drawX + houseW / 2, s.groundY - 1, houseW * 0.46, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          if (homeImg && homeImg.complete && homeImg.naturalWidth > 0) {
            ctx.drawImage(homeImg, drawX, drawY, houseW, houseH);
            // Soft dark tint over individual house for depth & focus
            ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
            ctx.fillRect(drawX, drawY, houseW, houseH);
          } else {
            const loaded = houseImgs.find(img => img.complete && img.naturalWidth > 0);
            if (loaded) {
              ctx.drawImage(loaded, drawX, drawY, houseW, houseH);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
              ctx.fillRect(drawX, drawY, houseW, houseH);
            }
          }
        }
      }

      // Soft Atmospheric Backdrop Tint: Keeps background scenery slightly dark so runner & track pop
      const bgAtmosphereGrad = ctx.createLinearGradient(0, s.groundY - 260, 0, s.groundY);
      bgAtmosphereGrad.addColorStop(0, 'rgba(15, 23, 42, 0.15)');
      bgAtmosphereGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.35)');
      bgAtmosphereGrad.addColorStop(1, 'rgba(15, 23, 42, 0.48)');
      ctx.fillStyle = bgAtmosphereGrad;
      ctx.fillRect(0, 0, width, s.groundY);

      // Moving Ground Track
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, s.groundY, width, height - s.groundY);

      // Ground Top Trim line
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(0, s.groundY - 6, width, 6);

      // Moving Ground Stripes
      const stripeOffset = (s.frame * s.speed) % 40;
      ctx.fillStyle = '#334155';
      for (let x = -stripeOffset; x < width; x += 40) {
        ctx.fillRect(x, s.groundY + 15, 20, 4);
        ctx.fillRect(x + 10, s.groundY + 35, 15, 3);
      }

      // --- 2. GAMEPLAY LOGIC WHEN PLAYING ---
      if (s.gameState === 'PLAYING') {
        // Detect PC/Desktop widescreen layout (width >= 768px) vs mobile phone size
        const isPCScreen = width >= 768;

        // PC gets a faster, more thrilling sprint speed while mobile stays at normal touch-friendly speed
        const baseSpeed = isPCScreen ? 4.3 : 2.8;
        const speedGrowthMax = isPCScreen ? 2.4 : 1.8;
        const boostSpeed = isPCScreen ? 7.5 : 5.2;

        // Boost timer
        if (s.boostTimer > 0) {
          s.boostTimer--;
          s.speed = boostSpeed * (charRef.current.speedBonus || 1.0);
        } else {
          s.speed = (baseSpeed + Math.min(s.distance / 450, speedGrowthMax)) * (charRef.current.speedBonus || 1.0);
        }

        s.distance += s.speed * 0.015;
        const currentDistInt = Math.floor(s.distance);
        if (currentDistInt !== lastRecordedDistance && s.frame % 6 === 0) {
          lastRecordedDistance = currentDistInt;
          setDistance(currentDistInt);
        }

        // Player Gravity & Jump Physics (Comfortable platformer leap distance)
        if (!s.isGrounded) {
          s.playerVy += 0.39; // Balanced gravity for extended, comfortable leap arc
          s.playerY += s.playerVy;

          if (s.playerY >= s.groundY - s.playerHeight) {
            s.playerY = s.groundY - s.playerHeight;
            s.playerVy = 0;
            s.isGrounded = true;
            addDustParticles(s.playerX + s.playerWidth / 2, s.groundY, '#CBD5E1', 6);
          }
        }

        // Slide Timer & Low Ground Friction Trail
        if (s.isSliding) {
          s.slideTimer--;
          if (s.isGrounded && s.frame % 3 === 0) {
            // Emits road friction sparks/dust while sliding low
            addDustParticles(s.playerX, s.groundY - 2, '#94A3B8', 2);
          }
          if (s.slideTimer <= 0) {
            s.isSliding = false;
          }
        }

        // Shield timer decrement
        if (s.shieldTimer > 0) {
          s.shieldTimer--;
          if (s.shieldTimer <= 0) {
            s.shield = false;
            setHasShield(false);
          }
        }

        // Magnet timer
        if (s.magnetTimer > 0) {
          s.magnetTimer--;
          if (s.magnetTimer === 0) setHasMagnet(false);
        }

        // Distance-based auto shield activation (First at 75m for 7s, then spaced out every 200m)
        if (s.distance >= s.nextShieldDistance) {
          s.shield = true;
          setHasShield(true);
          s.shieldTimer = 7 * 60; // 7 seconds duration

          sound.playPowerup();
          addDustParticles(s.playerX + s.playerWidth / 2, s.playerY + s.playerHeight / 2, '#38BDF8', 16);

          s.nextShieldDistance += 200; // Spaced out every 200m
        }

        // Distance-based auto magnet activation (First at 140m for 6s, then spaced out every 220m)
        if (s.distance >= s.nextMagnetDistance) {
          s.magnetTimer = 6 * 60; // 6 seconds duration
          setHasMagnet(true);

          sound.playPowerup();
          addDustParticles(s.playerX + s.playerWidth / 2, s.playerY + s.playerHeight / 2, '#EC4899', 16);

          s.nextMagnetDistance += 220; // Spaced out every 220m
        }

        // Spawn Obstacles early from 2m - strictly your 4 custom obstacle characters, helicopter/drone, and slide barrier
        if (s.distance >= 2 && s.frame >= s.nextObstacleFrame) {
          // Only the 4 custom uploaded character obstacles, helicopter (flying drone), and slide-under obstacle
          const availableTypes: ObstacleType[] = [
            'CUSTOM_CHARACTER_OBSTACLE',
            'CUSTOM_CHARACTER_OBSTACLE',
            'CUSTOM_CHARACTER_OBSTACLE',
            'CUSTOM_CHARACTER_OBSTACLE',
            'FLYING_DRONE',
            'OVERHANG_SIGN'
          ];
          
          const obsType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

          let obsW = 84; // Thicker, wider prominent obstacle character
          let obsH = 96;
          let obsY = s.groundY - obsH;

          if (obsType === 'FLYING_DRONE') {
            obsW = 62;
            obsH = 36;
            obsY = s.groundY - 76; // Air helicopter hazard (slide under)
          } else if (obsType === 'OVERHANG_SIGN') {
            obsW = 66;
            obsH = 36;
            obsY = s.groundY - 74; // Overhead barrier (slide under)
          } else if (obsType === 'CUSTOM_CHARACTER_OBSTACLE') {
            obsW = 84; // Thicker and bolder villain character obstacles
            obsH = 96;
            obsY = s.groundY - obsH;
          }

          let charIdx = 0;
          if (obsType === 'CUSTOM_CHARACTER_OBSTACLE') {
            charIdx = s.customObsCounter % 4;
            s.customObsCounter++;
          }

          s.obstacles.push({
            id: `obs_${s.frame}`,
            type: obsType,
            x: width + 40,
            y: obsY,
            width: obsW,
            height: obsH,
            rotation: 0,
            characterIndex: charIdx
          });

          // Guiding coins: low coins under air obstacles to reward slide; arched coins above ground obstacles to reward jump
          if (obsType === 'FLYING_DRONE' || obsType === 'OVERHANG_SIGN') {
            s.coins.push(
              { id: `c_under1_${s.frame}`, x: width + 30, y: s.groundY - 22, radius: 11, value: 2, type: 'COIN' },
              { id: `c_under2_${s.frame}`, x: width + 65, y: s.groundY - 22, radius: 11, value: 2, type: 'COIN' }
            );
          } else if (obsType === 'CUSTOM_CHARACTER_OBSTACLE') {
            s.coins.push(
              { id: `c_char1_${s.frame}`, x: width + 14, y: s.groundY - 122, radius: 12, value: 2, type: 'COIN' },
              { id: `c_char2_${s.frame}`, x: width + 56, y: s.groundY - 162, radius: 12, value: 2, type: 'COIN' },
              { id: `c_char3_${s.frame}`, x: width + 98, y: s.groundY - 122, radius: 12, value: 2, type: 'COIN' }
            );
          }

          // Spaced obstacle spawning interval
          const speedFactor = Math.min(s.distance / 100, 30);
          const minGap = Math.max(75, 120 - speedFactor);
          const maxGap = Math.max(115, 170 - speedFactor);
          s.nextObstacleFrame = s.frame + Math.floor(minGap + Math.random() * (maxGap - minGap));
        }

        // Spawn Regular Floating Coins & Rare Spaced Powerups (Regular coins worth 2 or 1, Green Coin worth 10 every 30 coins)
        if (s.frame % 35 === 0) {
          s.coinsSpawnedTotal++;
          const coinY = s.groundY - (Math.random() < 0.4 ? 120 : 50);

          let pType: 'COIN' | 'GREEN_COIN' | 'SHIELD' | 'MAGNET';
          let coinValue = 2;
          let coinRadius = 12;

          // Special Green Coin appears every 30 coins (worth 10)
          if (s.coinsSpawnedTotal % 30 === 0) {
            pType = 'GREEN_COIN';
            coinValue = 10;
            coinRadius = 15;
          } else if (s.coinsSpawnedTotal % 90 === 0) {
            // Rare Floating Powerup Pickup cleanly spaced every 90 coin spawns
            pType = Math.random() < 0.5 ? 'SHIELD' : 'MAGNET';
            coinRadius = 16;
            coinValue = 0;
          } else {
            pType = 'COIN';
            // Mostly 2, sometimes 1 per request
            coinValue = Math.random() < 0.25 ? 1 : 2;
            coinRadius = 12;
          }

          s.coins.push({
            id: `coin_${s.frame}`,
            x: width + 30,
            y: coinY,
            radius: coinRadius,
            value: coinValue,
            type: pType
          });
        }

        // Natural forward leap carry multiplier while in the air (+15% smooth momentum)
        const airLeapMultiplier = !s.isGrounded ? 1.15 : 1.0;

        // --- UPDATE & COLLISION: COINS ---
        for (let i = s.coins.length - 1; i >= 0; i--) {
          const c = s.coins[i];
          c.x -= s.speed * airLeapMultiplier;

          // Magnet Attraction
          if (s.magnetTimer > 0) {
            const dx = (s.playerX + s.playerWidth / 2) - c.x;
            const dy = (s.playerY + s.playerHeight / 2) - c.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 280) {
              c.x += (dx / dist) * 12;
              c.y += (dy / dist) * 12;
            }
          }

          // Check Player Pickup
          const pCenterX = s.playerX + s.playerWidth / 2;
          const pCenterY = s.playerY + (s.isSliding ? s.playerHeight * 0.75 : s.playerHeight / 2);
          const pRadius = s.isSliding ? 25 : 32;

          const dx = pCenterX - c.x;
          const dy = pCenterY - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pRadius + c.radius) {
            if (c.type === 'GREEN_COIN') {
              s.coinsCollected += c.value;
              setCoinsCollected(s.coinsCollected);
              sound.playGreenCoin();
              addDustParticles(c.x, c.y, '#10B981', 16);
              addDustParticles(c.x, c.y, '#34D399', 10);
              addDustParticles(c.x, c.y, '#FEF08A', 8);
            } else if (c.type === 'COIN') {
              s.coinsCollected += c.value;
              setCoinsCollected(s.coinsCollected);
              sound.playCoin();
              addDustParticles(c.x, c.y, '#F59E0B', 8);
            } else if (c.type === 'SHIELD') {
              s.shield = true;
              setHasShield(true);
              s.shieldTimer = 10 * 60; // Exactly 10 seconds
              sound.playPowerup();
              addDustParticles(c.x, c.y, '#38BDF8', 12);
            } else if (c.type === 'MAGNET') {
              s.magnetTimer = 360; // 6 seconds
              setHasMagnet(true);
              sound.playPowerup();
              addDustParticles(c.x, c.y, '#EC4899', 12);
            }

            s.coins.splice(i, 1);
            continue;
          }

          // Remove offscreen
          if (c.x < -30) {
            s.coins.splice(i, 1);
          }
        }

        // --- UPDATE & COLLISION: OBSTACLES ---
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          // Uniform steady ground movement - completely stable in place without jumping or speed jitter
          obs.x -= s.speed;

          if (obs.type === 'ROLLING_BOULDER') {
            obs.rotation = (obs.rotation || 0) - 0.1;
          }

          // Bounding Box Collision
          const curPH = s.isSliding ? s.playerHeight * 0.5 : s.playerHeight;
          const curPY = s.isSliding ? s.playerY + s.playerHeight * 0.5 : s.playerY;

          // Padding for hit box forgiveness - gives player a fair, smooth platformer clearing experience
          const hitPaddingX = 8;
          const hitPaddingY = 8;
          const pBox = {
            left: s.playerX + hitPaddingX,
            right: s.playerX + s.playerWidth - hitPaddingX,
            top: curPY + hitPaddingY,
            bottom: curPY + curPH - hitPaddingY
          };

          const obsPaddingX = obs.type === 'CUSTOM_CHARACTER_OBSTACLE' ? 14 : hitPaddingX;
          const obsPaddingTop = obs.type === 'CUSTOM_CHARACTER_OBSTACLE' ? 12 : 10;
          const oBox = {
            left: obs.x + obsPaddingX,
            right: obs.x + obs.width - obsPaddingX,
            top: obs.y + obsPaddingTop,
            bottom: obs.y + obs.height - 4
          };

          const isColliding =
            pBox.right > oBox.left &&
            pBox.left < oBox.right &&
            pBox.bottom > oBox.top &&
            pBox.top < oBox.bottom;

          if (isColliding) {
            if (s.boostTimer > 0) {
              // Destroy obstacle during boost!
              if (obs.type === 'CUSTOM_CHARACTER_OBSTACLE') {
                sound.playCustomObstacleHitSound();
              } else {
                sound.playHurt();
              }
              addDustParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#F59E0B', 15);
              s.obstacles.splice(i, 1);
              continue;
            }

            if (s.shield) {
              // Shield absorbs hit
              s.shield = false;
              s.shieldTimer = 0;
              setHasShield(false);
              if (obs.type === 'CUSTOM_CHARACTER_OBSTACLE') {
                sound.playCustomObstacleHitSound();
              } else {
                sound.playHurt();
              }
              addDustParticles(s.playerX, s.playerY, '#38BDF8', 20);
              s.obstacles.splice(i, 1);
              continue;
            }

            // GAME OVER - Play custom audio if hitting custom obstacle character
            if (obs.type === 'CUSTOM_CHARACTER_OBSTACLE') {
              sound.playCustomObstacleHitSound();
            } else {
              sound.playHurt();
            }
            s.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            onGameOver(s.coinsCollected, Math.floor(s.distance));
            break;
          }

          if (obs.x < -60) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // --- 3. DRAW COINS & POWERUPS ---
      s.coins.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);

        if (c.type === 'GREEN_COIN') {
          // Special Emerald Green Coin (Value 10)
          const spin = Math.abs(Math.sin(s.frame * 0.12));

          // Outer Emerald Glow Ring (Hardware accelerated, zero blur lag)
          ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 0, (c.radius + 4) * spin + 2, c.radius + 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Outer Green Rim
          ctx.fillStyle = '#065F46';
          ctx.beginPath();
          ctx.ellipse(0, 0, c.radius * spin + 2.5, c.radius + 1, 0, 0, Math.PI * 2);
          ctx.fill();

          // Main Emerald Face
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.ellipse(0, 0, c.radius * spin + 1, c.radius, 0, 0, Math.PI * 2);
          ctx.fill();

          // Bright Jade Core
          ctx.fillStyle = '#6EE7B7';
          ctx.beginPath();
          ctx.ellipse(0, 0, c.radius * spin * 0.65, c.radius * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();

          // Distinct Value "10" indicator
          if (spin > 0.4) {
            ctx.fillStyle = '#064E3B';
            ctx.font = '900 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('10', 0, 0.5);
          }
        } else if (c.type === 'COIN') {
          // Spinning Golden Coin
          const spin = Math.abs(Math.sin(s.frame * 0.1));
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.ellipse(0, 0, c.radius * spin + 2, c.radius, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FCD34D';
          ctx.beginPath();
          ctx.ellipse(0, 0, c.radius * spin * 0.6, c.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (c.type === 'SHIELD') {
          // Shield Badge
          ctx.fillStyle = '#0284C7';
          ctx.beginPath();
          ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.arc(0, 0, c.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (c.type === 'MAGNET') {
          // Magnet Badge
          ctx.fillStyle = '#DB2777';
          ctx.beginPath();
          ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#F472B6';
          ctx.beginPath();
          ctx.arc(0, 0, c.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // --- 4. DRAW OBSTACLES ---
      s.obstacles.forEach(obs => {
        ctx.save();
        const drawY = obs.type === 'CUSTOM_CHARACTER_OBSTACLE' ? (s.groundY - obs.height) : obs.y;
        ctx.translate(obs.x + obs.width / 2, drawY + obs.height / 2);

        if (obs.type === 'ROCK') {
          // 1. Faceted Craggy Rock with Moss
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(-obs.width / 2, obs.height / 2);
          ctx.lineTo(-obs.width * 0.45, -obs.height * 0.2);
          ctx.lineTo(-obs.width * 0.15, -obs.height / 2);
          ctx.lineTo(obs.width * 0.35, -obs.height * 0.35);
          ctx.lineTo(obs.width / 2, obs.height / 2);
          ctx.closePath();
          ctx.fill();

          // Top Lit Facet
          ctx.fillStyle = '#64748B';
          ctx.beginPath();
          ctx.moveTo(-obs.width * 0.45, -obs.height * 0.2);
          ctx.lineTo(-obs.width * 0.15, -obs.height / 2);
          ctx.lineTo(obs.width * 0.05, 0);
          ctx.lineTo(-obs.width * 0.2, obs.height * 0.2);
          ctx.fill();

          // Bright Highlight Crest
          ctx.fillStyle = '#94A3B8';
          ctx.beginPath();
          ctx.moveTo(-obs.width * 0.15, -obs.height / 2);
          ctx.lineTo(obs.width * 0.35, -obs.height * 0.35);
          ctx.lineTo(obs.width * 0.05, 0);
          ctx.fill();

          // Cartoon Moss Spots on Top
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(-obs.width * 0.12, -obs.height * 0.38, 5, 0, Math.PI * 2);
          ctx.arc(obs.width * 0.1, -obs.height * 0.3, 4.5, 0, Math.PI * 2);
          ctx.fill();

        } else if (obs.type === 'WOOD_BARRIER') {
          // 2. Wooden Barricade with Hazard Caution Stripes & Blinking Light
          // Support Legs
          ctx.fillStyle = '#78350F';
          ctx.fillRect(-obs.width * 0.4, -obs.height / 2 + 6, 6, obs.height - 6);
          ctx.fillRect(obs.width * 0.4 - 6, -obs.height / 2 + 6, 6, obs.height - 6);

          // Horizontal Plank
          ctx.fillStyle = '#92400E';
          ctx.fillRect(-obs.width / 2, -obs.height * 0.35, obs.width, obs.height * 0.52);

          // Yellow Caution Face
          ctx.fillStyle = '#FDE047';
          ctx.fillRect(-obs.width / 2 + 2, -obs.height * 0.3, obs.width - 4, obs.height * 0.42);

          // Black Diagonal Warning Stripes
          ctx.fillStyle = '#1E293B';
          for (let sx = -obs.width / 2 - 4; sx < obs.width / 2 + 10; sx += 12) {
            ctx.beginPath();
            ctx.moveTo(sx, -obs.height * 0.3);
            ctx.lineTo(sx + 6, -obs.height * 0.3);
            ctx.lineTo(sx, -obs.height * 0.3 + obs.height * 0.42);
            ctx.lineTo(sx - 6, -obs.height * 0.3 + obs.height * 0.42);
            ctx.fill();
          }

          // Top Blinking Safety Lamp
          const isLampBlink = Math.sin(s.frame * 0.2) > 0;
          ctx.fillStyle = isLampBlink ? '#EF4444' : '#7F1D1D';
          ctx.beginPath();
          ctx.arc(0, -obs.height / 2 + 1, 5, 0, Math.PI * 2);
          ctx.fill();
          if (isLampBlink) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.beginPath();
            ctx.arc(0, -obs.height / 2 + 1, 9, 0, Math.PI * 2);
            ctx.fill();
          }

        } else if (obs.type === 'ROAD_CONE') {
          // 3. Bright Orange Traffic Cone
          // Heavy Black Base
          ctx.fillStyle = '#1E293B';
          ctx.beginPath();
          ctx.roundRect(-obs.width / 2, obs.height / 2 - 6, obs.width, 6, 2);
          ctx.fill();

          // Orange Body
          ctx.fillStyle = '#EA580C';
          ctx.beginPath();
          ctx.moveTo(-obs.width * 0.38, obs.height / 2 - 6);
          ctx.lineTo(-obs.width * 0.08, -obs.height / 2);
          ctx.lineTo(obs.width * 0.08, -obs.height / 2);
          ctx.lineTo(obs.width * 0.38, obs.height / 2 - 6);
          ctx.closePath();
          ctx.fill();

          // Two White Reflective Bands
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(-obs.width * 0.28, -obs.height * 0.08, obs.width * 0.56, 5);
          ctx.fillRect(-obs.width * 0.18, -obs.height * 0.3, obs.width * 0.36, 4.5);

          // Orange Safety Gleam
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.moveTo(-obs.width * 0.06, -obs.height / 2 + 1);
          ctx.lineTo(0, -obs.height / 2 + 1);
          ctx.lineTo(-obs.width * 0.08, obs.height / 2 - 7);
          ctx.lineTo(-obs.width * 0.2, obs.height / 2 - 7);
          ctx.fill();

        } else if (obs.type === 'CACTUS_BUSH') {
          // 4. Spiky Green Cactus Plant
          // Main Body
          ctx.fillStyle = '#16A34A';
          ctx.beginPath();
          ctx.roundRect(-obs.width * 0.18, -obs.height / 2 + 2, obs.width * 0.36, obs.height - 2, 7);
          ctx.fill();

          // Left Sprout
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.roundRect(-obs.width / 2 + 2, -obs.height * 0.18, obs.width * 0.34, 6, 3);
          ctx.roundRect(-obs.width / 2 + 2, -obs.height * 0.36, 6, obs.height * 0.22, 3);
          ctx.fill();

          // Right Sprout
          ctx.fillStyle = '#22C55E';
          ctx.beginPath();
          ctx.roundRect(obs.width * 0.14, -obs.height * 0.08, obs.width * 0.34, 6, 3);
          ctx.roundRect(obs.width * 0.48 - 6, -obs.height * 0.26, 6, obs.height * 0.22, 3);
          ctx.fill();

          // Yellow Prickles
          ctx.fillStyle = '#FEF08A';
          ctx.fillRect(-obs.width * 0.2 - 2, -obs.height * 0.28, 2.5, 2);
          ctx.fillRect(obs.width * 0.18, -obs.height * 0.34, 2.5, 2);
          ctx.fillRect(-obs.width * 0.08, -obs.height * 0.05, 2.5, 2);
          ctx.fillRect(obs.width * 0.08, 0, 2.5, 2);

          // Blossom Flower on Head
          ctx.fillStyle = '#F43F5E';
          ctx.beginPath();
          ctx.arc(0, -obs.height / 2, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(0, -obs.height / 2, 2, 0, Math.PI * 2);
          ctx.fill();

        } else if (obs.type === 'ROLLING_BOULDER') {
          // 5. Rolling Craggy Boulder (Spins with Ground Contact)
          ctx.rotate(obs.rotation || 0);

          // Outer Boulder
          ctx.fillStyle = '#64748B';
          ctx.beginPath();
          ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();

          // Shaded Rocky Pits
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(-8, -8, 6.5, 0, Math.PI * 2);
          ctx.arc(7, 7, 7, 0, Math.PI * 2);
          ctx.arc(-7, 7, 4.5, 0, Math.PI * 2);
          ctx.arc(8, -6, 5, 0, Math.PI * 2);
          ctx.fill();

          // Stone Light Specks
          ctx.fillStyle = '#CBD5E1';
          ctx.beginPath();
          ctx.arc(-11, -10, 2.5, 0, Math.PI * 2);
          ctx.arc(4, 4, 3, 0, Math.PI * 2);
          ctx.fill();

        } else if (obs.type === 'FLYING_DRONE') {
          // 6. Cyber Flying Drone (Air Hazard - Duck Under! Fixed static air height, no bobbing)
          // High Speed Spinning Propeller
          const propSpin = Math.sin(s.frame * 0.85);
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(-obs.width * 0.42 * propSpin, -obs.height / 2 - 4, obs.width * 0.84 * propSpin, 3);
          ctx.fillStyle = '#475569';
          ctx.fillRect(-2, -obs.height / 2 - 2, 4, 4);

          // Cyber Drone Hull
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.roundRect(-obs.width / 2, -obs.height / 2 + 2, obs.width, obs.height - 4, 8);
          ctx.fill();

          // Cyan Wing Highlights
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(-obs.width / 2 + 2, -obs.height / 2 + 6, 4, obs.height - 12);
          ctx.fillRect(obs.width / 2 - 6, -obs.height / 2 + 6, 4, obs.height - 12);

          // Glowing Red Cyclops Eye
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FCA5A5';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();

          // Downward Scanning Laser Glow (Warns player to slide!)
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.moveTo(-3, 6);
          ctx.lineTo(3, 6);
          ctx.lineTo(14, obs.height + 15);
          ctx.lineTo(-14, obs.height + 15);
          ctx.fill();

        } else if (obs.type === 'OVERHANG_SIGN') {
          // 7. Overhead Caution Hazard Sign (Air Hazard - Duck Under!)
          // Metal Hanging Chains / Bars
          ctx.fillStyle = '#475569';
          ctx.fillRect(-obs.width * 0.36, -obs.height / 2 - 70, 3, 70);
          ctx.fillRect(obs.width * 0.36 - 3, -obs.height / 2 - 70, 3, 70);

          // Dark Signboard
          ctx.fillStyle = '#1E293B';
          ctx.beginPath();
          ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 6);
          ctx.fill();

          // Caution Amber Frame
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.strokeRect(-obs.width / 2 + 2, -obs.height / 2 + 2, obs.width - 4, obs.height - 4);

          // Bold Warning Text
          ctx.fillStyle = '#FBBF24';
          ctx.font = '900 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚠️ SLIDE', 0, 0.5);

        } else if (obs.type === 'FIRE_BALL') {
          // 8. Glowing Fireball Hazard (Static track position)
          // Outer Glow
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.beginPath();
          ctx.arc(0, 0, obs.width / 2 + 4, 0, Math.PI * 2);
          ctx.fill();

          // Red Flame Layer
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();

          // Orange Heart
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.arc(0, 0, obs.width * 0.36, 0, Math.PI * 2);
          ctx.fill();

          // Yellow Hot Center
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(0, 0, obs.width * 0.22, 0, Math.PI * 2);
          ctx.fill();

          // Spark Center
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, obs.width * 0.1, 0, Math.PI * 2);
          ctx.fill();

        } else if (obs.type === 'CUSTOM_CHARACTER_OBSTACLE') {
          // 9. Custom Villain Character Obstacles - Firmly grounded in place (no jump/bobbing)
          const charIdx = (obs.characterIndex ?? 0) % 4;
          const transparentCanvas = customObstacleCanvasesRef.current[charIdx];
          const fallbackImg = customObstacleImagesRef.current[charIdx];

          // 1. Deep, Solid Ground Contact Shadow beneath feet
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.beginPath();
          ctx.ellipse(0, obs.height / 2 + 1, obs.width * 0.46, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2. Soft White Glowing Shadow & Contrast Aura (Halaka Sada Shadow for distinct clarity)
          ctx.save();
          ctx.shadowColor = 'rgba(255, 255, 255, 0.92)'; // Soft glowing white shadow aura
          ctx.shadowBlur = 14;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          let drawn = false;
          if (transparentCanvas) {
            try {
              ctx.drawImage(transparentCanvas, -obs.width / 2, -obs.height / 2, obs.width, obs.height);
              drawn = true;
            } catch {
              drawn = false;
            }
          }
          
          if (!drawn && fallbackImg && (fallbackImg.complete || fallbackImg.naturalWidth > 0)) {
            try {
              ctx.drawImage(fallbackImg, -obs.width / 2, -obs.height / 2, obs.width, obs.height);
              drawn = true;
            } catch {
              drawn = false;
            }
          }

          if (!drawn) {
            // High-visibility stylish villain card fallback
            const villainColors = ['#DC2626', '#EA580C', '#7C3AED', '#DB2777'];
            const bgCol = villainColors[charIdx];
            
            ctx.fillStyle = bgCol;
            ctx.beginPath();
            ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 16);
            ctx.fill();
            
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(['🥷', '👹', '👺', '🦹'][charIdx], 0, 0);
          }

          ctx.restore();
        }

        ctx.restore();
      });

      // --- 5. DRAW PARTICLES ---
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      // --- 6. DRAW CHARACTER WITH ANIMATED LIMBS & SHIELD ---
      const playerAnimState = s.isSliding ? 'SLIDING' : (!s.isGrounded ? 'JUMPING' : 'RUNNING');
      drawCharacter({
        ctx,
        x: s.playerX,
        y: s.playerY,
        width: s.playerWidth,
        height: s.playerHeight,
        character: charRef.current,
        state: playerAnimState,
        frame: s.frame,
        facingRight: true,
        hasShield: s.shield
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateCanvasSize);
      sound.stopRunnerMusic();
      if (stateRef.current.distance > 0 || stateRef.current.coinsCollected > 0) {
        onGameOver(stateRef.current.coinsCollected, Math.floor(stateRef.current.distance));
      }
    };
  }, []);

  // Touch Handlers for Mobile Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dy = touch.clientY - touchStartRef.current.y;

    if (dy < -30) {
      handleJump(); // Swipe up
    } else if (dy > 30) {
      handleSlide(); // Swipe down
    } else {
      handleJump(); // Tap anywhere
    }
    touchStartRef.current = null;
  };

  const handleExitToHome = () => {
    if (stateRef.current.coinsCollected > 0 || stateRef.current.distance > 0) {
      onGameOver(stateRef.current.coinsCollected, Math.floor(stateRef.current.distance));
    }
    onBackToHome();
  };

  return (
    <div
      className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col justify-between select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* HUD Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExitToHome}
            className="p-3 bg-slate-800/80 backdrop-blur border border-slate-700 text-white rounded-xl shadow-lg hover:bg-slate-700 transition active:scale-95 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-bold">Exit</span>
          </button>

          <button
            onClick={() => setIsMuted(sound.toggleMute())}
            className="p-3 bg-slate-800/80 backdrop-blur border border-slate-700 text-slate-200 rounded-xl shadow-lg hover:bg-slate-700 transition"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>

        {/* Live Score & Coins */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl backdrop-blur flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="text-amber-400 font-extrabold text-lg sm:text-xl tracking-wider">{coinsCollected}</span>
          </div>

          <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl backdrop-blur">
            <span className="text-xs text-indigo-300 font-medium block">DISTANCE</span>
            <span className="text-white font-extrabold text-lg sm:text-xl">{distance}m</span>
          </div>
        </div>
      </div>

      {/* Active Powerup Badges */}
      <div className="absolute top-20 left-4 z-20 flex flex-col gap-2">
        {hasShield && (
          <div className="px-3 py-1.5 bg-sky-500/20 border border-sky-400/50 text-sky-300 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
            🛡️ SHIELD ACTIVE
          </div>
        )}
        {hasMagnet && (
          <div className="px-3 py-1.5 bg-pink-500/20 border border-pink-400/50 text-pink-300 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
            🧲 COIN MAGNET ACTIVE
          </div>
        )}
      </div>

      {/* Game Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* --- FIRST-TIME PLAYER ANIMATED GESTURE TUTORIAL (1-TIME ONLY) --- */}
      <AnimatePresence>
        {showFirstTimeTutorial && gameState === 'PLAYING' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={dismissTutorial}
            className="absolute inset-0 z-30 pointer-events-auto flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] cursor-pointer"
          >
            <div className="bg-slate-950/90 backdrop-blur-2xl border-2 border-amber-400/60 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col items-center text-center max-w-xs sm:max-w-sm w-full relative">
              
              {/* Top Pulse Glow Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Guide • প্রথমবার প্লেয়ার</span>
              </div>

              {/* Animated Gesture Showcase Container */}
              <div className="relative w-28 h-28 rounded-2xl bg-black/80 border border-white/20 flex flex-col items-center justify-center mb-3.5 overflow-hidden shadow-inner">
                {tutorialStep === 'SWIPE_UP' ? (
                  <motion.div
                    key="step-up"
                    initial={{ y: 28, opacity: 0 }}
                    animate={{ y: -20, opacity: [0, 1, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="p-3 rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.9)]">
                      <ArrowUp className="w-7 h-7 stroke-[3.5]" />
                    </div>
                    <span className="text-[10px] font-black text-cyan-300 tracking-wider">SWIPE UP</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step-down"
                    initial={{ y: -22, opacity: 0 }}
                    animate={{ y: 26, opacity: [0, 1, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="p-3 rounded-full bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.9)]">
                      <ArrowDown className="w-7 h-7 stroke-[3.5]" />
                    </div>
                    <span className="text-[10px] font-black text-amber-300 tracking-wider">SWIPE DOWN</span>
                  </motion.div>
                )}
              </div>

              {/* Instruction Labels */}
              <div className="space-y-1.5 w-full">
                <h3 className="text-lg sm:text-xl font-black text-white font-headline-lg">
                  {tutorialStep === 'SWIPE_UP' ? (
                    <span className="text-cyan-300 drop-shadow">⬆️ SWIPE UP TO JUMP</span>
                  ) : (
                    <span className="text-amber-300 drop-shadow">⬇️ SWIPE DOWN TO SLIDE</span>
                  )}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-200">
                  {tutorialStep === 'SWIPE_UP' 
                    ? 'উপরে সোয়াইপ করুন = লাফ দিন' 
                    : 'নিচে সোয়াইপ করুন = গুঁড়ি মারুন'}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 font-medium">
                    {tutorialStep === 'SWIPE_UP' ? 'PC: Space বা Up Arrow' : 'PC: Down Arrow বা S'} • ট্যাপ করলে বন্ধ হবে
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* START OVERLAY */}
      {gameState === 'READY' && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/20 mb-4">
              🏃‍♂️
            </div>
            <h2 className="text-3xl font-black text-white tracking-wide mb-2">Ready to Run?</h2>
            <p className="text-slate-400 text-sm mb-6">
              Tap <span className="text-amber-400 font-bold">Space / Up</span> or Swipe Up to Jump.<br />
              Tap <span className="text-amber-400 font-bold">Down / S</span> or Swipe Down to Slide under obstacles!
            </p>

            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xl rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" /> START RUNNER
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900/95 border border-red-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-scale-up">
            <div className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-4xl mb-4">
              💥
            </div>
            <h2 className="text-3xl font-black text-white tracking-wide mb-1">Game Over!</h2>
            <p className="text-slate-400 text-sm mb-6">You hit an obstacle! Better luck next time.</p>

            <div className="w-full grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold block mb-1">COINS EARNED</span>
                <span className="text-2xl font-black text-amber-400">+ {coinsCollected} 🪙</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold block mb-1">DISTANCE</span>
                <span className="text-2xl font-black text-indigo-400">{distance}m</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleStartGame}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-lg rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> PLAY AGAIN
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onOpenShop}
                  className="py-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-2xl hover:bg-amber-500/30 transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> CHARACTER SHOP
                </button>
                <button
                  onClick={onBackToHome}
                  className="py-3 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition"
                >
                  MAIN MENU
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
