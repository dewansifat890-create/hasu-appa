import React, { useEffect, useRef, useState } from 'react';
import { AdventureLevel, Character, Particle } from '../types';
import { ADVENTURE_LEVELS } from '../data/puzzles';
import { drawCharacter } from '../utils/characterRenderer';
import { sound } from '../utils/sound';
import { ArrowLeft, CheckCircle, HelpCircle, Key, Lock, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface AdventureCanvasProps {
  character: Character;
  completedLevelIds: number[];
  onLevelComplete: (levelId: number, rewardCoins: number) => void;
  onBackToHome: () => void;
}

export const AdventureCanvas: React.FC<AdventureCanvasProps> = ({
  character,
  completedLevelIds,
  onLevelComplete,
  onBackToHome
}) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [levelState, setLevelState] = useState<AdventureLevel>(ADVENTURE_LEVELS[0]);
  const [isVictorious, setIsVictorious] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active level state ref for loop
  const currentLevel = ADVENTURE_LEVELS[currentLevelIdx];

  const stateRef = useRef({
    x: currentLevel.startX,
    y: currentLevel.startY,
    vx: 0,
    vy: 0,
    width: 48,
    height: 60,
    facingRight: true,
    isMoving: false,
    frame: 0,
    heldKeys: new Set<string>(),
    inventoryKeys: [] as string[], // array of key colors e.g. ['#3b82f6']
    plateSequence: [] as number[],
    particles: [] as Particle[],
    // Level objects cloned
    levers: JSON.parse(JSON.stringify(currentLevel.levers)),
    gates: JSON.parse(JSON.stringify(currentLevel.gates)),
    keys: JSON.parse(JSON.stringify(currentLevel.keys)),
    plates: JSON.parse(JSON.stringify(currentLevel.plates)),
    blocks: JSON.parse(JSON.stringify(currentLevel.blocks)),
  });

  const charRef = useRef<Character>(character);
  useEffect(() => {
    charRef.current = character;
  }, [character]);

  // Load level state when levelIdx changes
  const loadLevel = (idx: number) => {
    const lvl = ADVENTURE_LEVELS[idx];
    setCurrentLevelIdx(idx);
    setLevelState(lvl);
    setIsVictorious(false);

    stateRef.current = {
      x: lvl.startX,
      y: lvl.startY,
      vx: 0,
      vy: 0,
      width: 48,
      height: 60,
      facingRight: true,
      isMoving: false,
      frame: 0,
      heldKeys: new Set<string>(),
      inventoryKeys: [],
      plateSequence: [],
      particles: [],
      levers: JSON.parse(JSON.stringify(lvl.levers)),
      gates: JSON.parse(JSON.stringify(lvl.gates)),
      keys: JSON.parse(JSON.stringify(lvl.keys)),
      plates: JSON.parse(JSON.stringify(lvl.plates)),
      blocks: JSON.parse(JSON.stringify(lvl.blocks)),
    };
  };

  useEffect(() => {
    loadLevel(currentLevelIdx);
  }, [currentLevelIdx]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.heldKeys.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.heldKeys.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const render = () => {
      const s = stateRef.current;
      const lvl = ADVENTURE_LEVELS[currentLevelIdx];
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      s.frame++;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // --- 1. DRAW ADVENTURE ENVIRONMENT BACKGROUND ---
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, lvl.bgGradient[0]);
      bgGrad.addColorStop(1, lvl.bgGradient[1]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Floor Grid Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // --- 2. PLAYER MOVEMENT & PHYSICS ---
      const speed = 4.5 * (charRef.current.speedBonus || 1.0);
      s.vx = 0;
      s.vy = 0;

      if (s.heldKeys.has('ArrowLeft') || s.heldKeys.has('KeyA')) {
        s.vx = -speed;
        s.facingRight = false;
      }
      if (s.heldKeys.has('ArrowRight') || s.heldKeys.has('KeyD')) {
        s.vx = speed;
        s.facingRight = true;
      }
      if (s.heldKeys.has('ArrowUp') || s.heldKeys.has('KeyW')) {
        s.vy = -speed;
      }
      if (s.heldKeys.has('ArrowDown') || s.heldKeys.has('KeyS')) {
        s.vy = speed;
      }

      s.isMoving = s.vx !== 0 || s.vy !== 0;

      // Proposed next position
      let nextX = s.x + s.vx;
      let nextY = s.y + s.vy;

      // Bound within screen walls
      nextX = Math.max(20, Math.min(width - s.width - 20, nextX));
      nextY = Math.max(100, Math.min(height - s.height - 20, nextY));

      // --- 3. GATES & COLLISION LOGIC ---
      s.gates.forEach((gate: any) => {
        // Check if gate conditions are met
        let unlocked = true;

        if (gate.requiredLeverIds && gate.requiredLeverIds.length > 0) {
          unlocked = gate.requiredLeverIds.every((lid: string) => {
            const lever = s.levers.find((l: any) => l.id === lid);
            return lever && lever.isOn;
          });
        }

        if (gate.requiredKeyColor) {
          unlocked = unlocked && s.inventoryKeys.includes(gate.requiredKeyColor);
        }

        // Special Level 2 Plate Condition
        if (lvl.id === 2) {
          unlocked = s.plates.length > 0 && s.plates.every((p: any) => p.isPressed);
        }

        // Special Level 4 Block Condition
        if (lvl.id === 4) {
          unlocked = s.blocks.length > 0 && s.blocks.every((b: any) => b.isPlaced);
        }

        gate.isOpen = unlocked;

        // Gate Wall Collision if closed
        if (!gate.isOpen) {
          if (
            nextX + s.width > gate.x &&
            nextX < gate.x + gate.width &&
            nextY + s.height > gate.y &&
            nextY < gate.y + gate.height
          ) {
            // Revert movement into closed gate
            nextX = s.x;
            nextY = s.y;
          }
        }
      });

      // Update position
      s.x = nextX;
      s.y = nextY;

      // --- 4. INTERACTION WITH LEVERS ---
      s.levers.forEach((lever: any) => {
        const dx = (s.x + s.width / 2) - lever.x;
        const dy = (s.y + s.height / 2) - lever.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 45) {
          if (s.heldKeys.has('KeyE') || s.isMoving) {
            if (!lever.isOn) {
              lever.isOn = true;
              sound.playClick();
              // Spawn sparkle
              for (let i = 0; i < 8; i++) {
                s.particles.push({
                  x: lever.x,
                  y: lever.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: lever.color,
                  size: 4,
                  alpha: 1,
                  life: 0,
                  maxLife: 20
                });
              }
            }
          }
        }
      });

      // --- 5. INTERACTION WITH KEYS ---
      s.keys.forEach((key: any) => {
        if (key.collected) return;

        const dx = (s.x + s.width / 2) - key.x;
        const dy = (s.y + s.height / 2) - key.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 40) {
          key.collected = true;
          s.inventoryKeys.push(key.color);
          sound.playCoin();
        }
      });

      // --- 6. INTERACTION WITH RUNE PLATES ---
      s.plates.forEach((plate: any) => {
        const pCenterX = plate.x + plate.width / 2;
        const pCenterY = plate.y + plate.height / 2;
        const dx = (s.x + s.width / 2) - pCenterX;
        const dy = (s.y + s.height / 2) - pCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 35 && !plate.isPressed) {
          // Check order sequence
          const expectedNum = s.plateSequence.length + 1;
          if (plate.requiredOrder === expectedNum) {
            plate.isPressed = true;
            s.plateSequence.push(plate.requiredOrder);
            sound.playClick();
          } else {
            // Reset sequence on wrong step!
            sound.playHurt();
            s.plateSequence = [];
            s.plates.forEach((p: any) => (p.isPressed = false));
          }
        }
      });

      // --- 7. INTERACTION WITH PUSHABLE BLOCKS ---
      s.blocks.forEach((block: any) => {
        const pCenterX = s.x + s.width / 2;
        const pCenterY = s.y + s.height / 2;
        const bCenterX = block.x + block.width / 2;
        const bCenterY = block.y + block.height / 2;

        const dx = bCenterX - pCenterX;
        const dy = bCenterY - pCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50 && !block.isPlaced) {
          // Push block in direction of movement
          block.x += s.vx * 0.8;
          block.y += s.vy * 0.8;

          // Check if snapped into target socket
          const tDx = Math.abs(block.x - block.targetX);
          const tDy = Math.abs(block.y - block.targetY);
          if (tDx < 20 && tDy < 20) {
            block.x = block.targetX;
            block.y = block.targetY;
            block.isPlaced = true;
            sound.playPuzzleSolve();
          }
        }
      });

      // --- 8. DRAW LEVERS ---
      s.levers.forEach((lever: any) => {
        ctx.save();
        ctx.translate(lever.x, lever.y);

        ctx.fillStyle = '#334155';
        ctx.fillRect(-15, 10, 30, 8);

        // Switch Arm
        ctx.strokeStyle = lever.isOn ? lever.color : '#94A3B8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(lever.isOn ? 12 : -12, -10);
        ctx.stroke();

        // Switch Knob
        ctx.fillStyle = lever.isOn ? lever.color : '#64748B';
        ctx.beginPath();
        ctx.arc(lever.isOn ? 12 : -12, -10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // --- 9. DRAW RUNE FLOOR PLATES ---
      s.plates.forEach((plate: any) => {
        ctx.save();
        ctx.translate(plate.x, plate.y);

        ctx.fillStyle = plate.isPressed ? '#10B981' : '#334155';
        ctx.strokeStyle = plate.isPressed ? '#34D399' : '#64748B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, plate.width, plate.height, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${plate.requiredOrder}`, plate.width / 2, plate.height / 2);

        ctx.restore();
      });

      // --- 10. DRAW KEYS ---
      s.keys.forEach((key: any) => {
        if (key.collected) return;
        ctx.save();
        ctx.translate(key.x, key.y + Math.sin(s.frame * 0.1) * 3);

        ctx.fillStyle = key.color;
        ctx.beginPath();
        ctx.arc(0, -6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-2, -6, 4, 18);
        ctx.fillRect(-2, 4, 6, 3);

        ctx.restore();
      });

      // --- 11. DRAW BLOCKS & TARGET SOCKETS ---
      s.blocks.forEach((block: any) => {
        // Draw Target Socket
        ctx.save();
        ctx.strokeStyle = block.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(block.targetX, block.targetY, block.width, block.height);
        ctx.restore();

        // Draw Pushable Block
        ctx.save();
        ctx.translate(block.x, block.y);
        ctx.fillStyle = block.isPlaced ? '#10B981' : block.color;
        ctx.beginPath();
        ctx.roundRect(0, 0, block.width, block.height, 8);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', block.width / 2, block.height / 2);
        ctx.restore();
      });

      // --- 12. DRAW GATES / BARRIERS ---
      s.gates.forEach((gate: any) => {
        ctx.save();
        ctx.translate(gate.x, gate.y);

        if (gate.isOpen) {
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(0, 0, gate.width, gate.height);
        } else {
          // Closed Laser Barrier
          ctx.fillStyle = gate.requiredKeyColor || '#EF4444';
          ctx.fillRect(0, 0, gate.width, gate.height);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🔒', gate.width / 2, gate.height / 2);
        }

        ctx.restore();
      });

      // --- 13. DRAW ANCIENT PORTAL GOAL ---
      ctx.save();
      ctx.translate(lvl.goalX, lvl.goalY);
      const portalSpin = s.frame * 0.05;
      ctx.rotate(portalSpin);

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Goal Portal Icon
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌟', lvl.goalX, lvl.goalY);

      // --- 14. CHECK GOAL REACHED ---
      const dxGoal = (s.x + s.width / 2) - lvl.goalX;
      const dyGoal = (s.y + s.height / 2) - lvl.goalY;
      const distGoal = Math.sqrt(dxGoal * dxGoal + dyGoal * dyGoal);

      if (distGoal < 40 && !isVictorious) {
        setIsVictorious(true);
        sound.playPuzzleSolve();
        onLevelComplete(lvl.id, lvl.rewardCoins);
      }

      // --- 15. DRAW CHARACTER WITH MOVING LIMBS ---
      drawCharacter({
        ctx,
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
        character: charRef.current,
        state: s.isMoving ? 'WALKING' : 'IDLE',
        frame: s.frame,
        facingRight: s.facingRight
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [currentLevelIdx, isVictorious]);

  // Mobile D-Pad Control Buttons
  const handleTouchDir = (code: string, pressed: boolean) => {
    if (pressed) {
      stateRef.current.heldKeys.add(code);
    } else {
      stateRef.current.heldKeys.delete(code);
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col select-none">
      {/* Top Header & Level Navigator */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-3 bg-slate-800/80 backdrop-blur border border-slate-700 text-white rounded-xl shadow-lg hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => loadLevel(currentLevelIdx)}
            className="p-3 bg-slate-800/80 backdrop-blur border border-slate-700 text-slate-200 rounded-xl shadow-lg hover:bg-slate-700 transition"
            title="Restart Level"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowHint(!showHint)}
            className="p-3 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-xl shadow-lg hover:bg-indigo-500/30 transition flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="hidden sm:inline font-bold text-xs">HINT</span>
          </button>
        </div>

        {/* Level Badges Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur">
          {ADVENTURE_LEVELS.map((lvl, idx) => {
            const isDone = completedLevelIds.includes(lvl.id);
            const isCurrent = idx === currentLevelIdx;
            return (
              <button
                key={lvl.id}
                onClick={() => loadLevel(idx)}
                className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center transition ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : lvl.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint Dialog Box */}
      {showHint && (
        <div className="absolute top-20 left-4 right-4 max-w-lg mx-auto z-20 bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-xl backdrop-blur animate-fade-in">
          <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4" /> LEVEL HINT
          </h4>
          <p className="text-slate-200 text-xs leading-relaxed">{levelState.hint}</p>
        </div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* VICTORY OVERLAY */}
      {isVictorious && (
        <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-scale-up">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-4xl mb-4">
              🌟
            </div>
            <h2 className="text-3xl font-black text-white tracking-wide mb-1">Puzzle Solved!</h2>
            <p className="text-slate-300 text-sm mb-6">
              Great job! You navigated {levelState.title} successfully.
            </p>

            <div className="bg-amber-500/20 border border-amber-500/40 px-6 py-3 rounded-2xl mb-6">
              <span className="text-xs text-amber-300 font-bold block">REWARD EARNED</span>
              <span className="text-2xl font-black text-amber-400">+ {levelState.rewardCoins} 🪙</span>
            </div>

            <div className="w-full flex flex-col gap-3">
              {currentLevelIdx < ADVENTURE_LEVELS.length - 1 ? (
                <button
                  onClick={() => loadLevel(currentLevelIdx + 1)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-lg rounded-2xl shadow-xl hover:brightness-110 transition"
                >
                  NEXT PUZZLE LEVEL
                </button>
              ) : (
                <button
                  onClick={onBackToHome}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-lg rounded-2xl shadow-xl hover:brightness-110 transition"
                >
                  RETURN TO HOME
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE TOUCH D-PAD */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-1 sm:hidden">
        <div className="flex justify-center">
          <button
            onTouchStart={() => handleTouchDir('ArrowUp', true)}
            onTouchEnd={() => handleTouchDir('ArrowUp', false)}
            className="w-14 h-14 bg-slate-800/80 border border-slate-600 rounded-xl text-xl text-white active:bg-amber-500 active:text-slate-950 font-bold shadow-lg"
          >
            ▲
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onTouchStart={() => handleTouchDir('ArrowLeft', true)}
            onTouchEnd={() => handleTouchDir('ArrowLeft', false)}
            className="w-14 h-14 bg-slate-800/80 border border-slate-600 rounded-xl text-xl text-white active:bg-amber-500 active:text-slate-950 font-bold shadow-lg"
          >
            ◄
          </button>
          <button
            onTouchStart={() => handleTouchDir('ArrowDown', true)}
            onTouchEnd={() => handleTouchDir('ArrowDown', false)}
            className="w-14 h-14 bg-slate-800/80 border border-slate-600 rounded-xl text-xl text-white active:bg-amber-500 active:text-slate-950 font-bold shadow-lg"
          >
            ▼
          </button>
          <button
            onTouchStart={() => handleTouchDir('ArrowRight', true)}
            onTouchEnd={() => handleTouchDir('ArrowRight', false)}
            className="w-14 h-14 bg-slate-800/80 border border-slate-600 rounded-xl text-xl text-white active:bg-amber-500 active:text-slate-950 font-bold shadow-lg"
          >
            ►
          </button>
        </div>
      </div>
    </div>
  );
};
