export type ScreenState = 'HOME' | 'RUNNER' | 'ADVENTURE' | 'SHOP' | 'PROFILE' | 'SETTINGS' | 'BENGALI_GUIDE';

export interface Character {
  id: string;
  name: string;
  imageUrl?: string;
  svgType?: 'hasu_boy' | 'appa_classic' | 'ninja_appa' | 'cyber_hasu' | 'golden_king' | 'panda_hasu';
  cost: number;
  speedBonus: number; // multiplier e.g. 1.0, 1.1, 1.2
  jumpPower: number;  // jump force multiplier
  description: string;
  color: string;
  isCustom?: boolean;
}

export interface PlayerProfile {
  gameId: string;
  firebaseUid?: string;
  playerName: string;
  avatarUrl?: string;
  email?: string;
  isLoggedIn?: boolean;
  coins: number;
  unlockedCharacters: string[];
  selectedCharacterId: string;
  highScoreRunner: number;
  puzzlesCompleted: number[];
  customCharacters: Character[];
  lastSaved?: string;
}

// Runner Game Types
export type ObstacleType = 
  | 'ROCK' 
  | 'WOOD_BARRIER' 
  | 'FLYING_DRONE' 
  | 'ROLLING_BOULDER' 
  | 'CACTUS_BUSH' 
  | 'OVERHANG_SIGN' 
  | 'FIRE_BALL' 
  | 'ROAD_CONE'
  | 'CUSTOM_CHARACTER_OBSTACLE';

export interface RunnerObstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  passed?: boolean;
  speedOffset?: number;
  rotation?: number;
  characterIndex?: number;
}

export interface RunnerCoin {
  id: string;
  x: number;
  y: number;
  radius: number;
  value: number;
  collected?: boolean;
  type: 'COIN' | 'GREEN_COIN' | 'MAGNET' | 'SHIELD' | 'BOOST';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

// Adventure Puzzle Types
export interface PuzzleLever {
  id: string;
  x: number;
  y: number;
  isOn: boolean;
  color: string;
  label: string;
}

export interface PuzzleGate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  requiredLeverIds: string[];
  requiredKeyColor?: string;
}

export interface PuzzleKey {
  id: string;
  x: number;
  y: number;
  color: string;
  collected: boolean;
}

export interface PuzzlePlate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isPressed: boolean;
  requiredOrder: number; // e.g. 1, 2, 3
  currentOrder?: number;
}

export interface PuzzleBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  isPlaced?: boolean;
  color: string;
}

export interface AdventureLevel {
  id: number;
  title: string;
  theme: string;
  description: string;
  rewardCoins: number;
  bgGradient: [string, string];
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  levers: PuzzleLever[];
  gates: PuzzleGate[];
  keys: PuzzleKey[];
  plates: PuzzlePlate[];
  blocks: PuzzleBlock[];
  hint: string;
}
