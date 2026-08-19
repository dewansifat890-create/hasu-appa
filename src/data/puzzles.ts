import { AdventureLevel } from '../types';

export const ADVENTURE_LEVELS: AdventureLevel[] = [
  {
    id: 1,
    title: 'The Whispering Stone Gate',
    theme: 'Ruins',
    description: 'Flip the ancient energy levers in the correct sequence to deactivate the barrier gate and proceed.',
    rewardCoins: 200,
    bgGradient: ['#1e1b4b', '#312e81'],
    startX: 80,
    startY: 320,
    goalX: 720,
    goalY: 320,
    hint: 'Flip Lever 1 first to unlock Gate A, then flip Lever 2 to clear your path to the Portal!',
    levers: [
      { id: 'L1', x: 220, y: 180, isOn: false, color: '#3b82f6', label: 'Lever Alpha' },
      { id: 'L2', x: 480, y: 440, isOn: false, color: '#eab308', label: 'Lever Beta' },
    ],
    gates: [
      { id: 'G1', x: 350, y: 260, width: 24, height: 120, isOpen: false, requiredLeverIds: ['L1'] },
      { id: 'G2', x: 600, y: 260, width: 24, height: 120, isOpen: false, requiredLeverIds: ['L2'] },
    ],
    keys: [],
    plates: [],
    blocks: []
  },
  {
    id: 2,
    title: 'Rune Pressure Sanctuary',
    theme: 'Mystic Cavern',
    description: 'Step on the magical Rune Floor Plates in numerical order (1 -> 2 -> 3) to lower the elemental shield.',
    rewardCoins: 350,
    bgGradient: ['#064e3b', '#022c22'],
    startX: 80,
    startY: 320,
    goalX: 720,
    goalY: 320,
    hint: 'Step on Plate 1, then Plate 2, then Plate 3. Stepping out of sequence resets the plates!',
    levers: [],
    gates: [
      { id: 'G_MAIN', x: 580, y: 250, width: 30, height: 140, isOpen: false, requiredLeverIds: [] }
    ],
    keys: [],
    plates: [
      { id: 'P1', x: 200, y: 200, width: 50, height: 50, isPressed: false, requiredOrder: 1 },
      { id: 'P2', x: 360, y: 420, width: 50, height: 50, isPressed: false, requiredOrder: 2 },
      { id: 'P3', x: 480, y: 180, width: 50, height: 50, isPressed: false, requiredOrder: 3 },
    ],
    blocks: []
  },
  {
    id: 3,
    title: 'Hasu Crystal Key Maze',
    theme: 'Crystal Caves',
    description: 'Locate the Blue Crystal Key and Gold Star Key hidden in the maze to open the corresponding Vault Doors.',
    rewardCoins: 500,
    bgGradient: ['#4c1d95', '#2e1065'],
    startX: 80,
    startY: 120,
    goalX: 720,
    goalY: 460,
    hint: 'Collect the Blue Key first to pass through the Blue Barrier and reach the Gold Key!',
    levers: [],
    gates: [
      { id: 'G_BLUE', x: 320, y: 80, width: 24, height: 120, isOpen: false, requiredLeverIds: [], requiredKeyColor: '#3b82f6' },
      { id: 'G_GOLD', x: 550, y: 380, width: 24, height: 120, isOpen: false, requiredLeverIds: [], requiredKeyColor: '#f59e0b' }
    ],
    keys: [
      { id: 'K_BLUE', x: 180, y: 440, color: '#3b82f6', collected: false },
      { id: 'K_GOLD', x: 420, y: 120, color: '#f59e0b', collected: false }
    ],
    plates: [],
    blocks: []
  },
  {
    id: 4,
    title: 'Sky Fortress Energy Matrix',
    theme: 'Tech Citadel',
    description: 'Push the Quantum Power Block onto its glowing Target Receiver Socket to charge the portal generator.',
    rewardCoins: 750,
    bgGradient: ['#0f172a', '#1e293b'],
    startX: 80,
    startY: 320,
    goalX: 720,
    goalY: 320,
    hint: 'Walk into the blue glowing block to push it toward the glowing target socket on the right!',
    levers: [],
    gates: [
      { id: 'G_TECH', x: 620, y: 250, width: 24, height: 140, isOpen: false, requiredLeverIds: [] }
    ],
    keys: [],
    plates: [],
    blocks: [
      { id: 'B1', x: 280, y: 320, width: 50, height: 50, targetX: 500, targetY: 320, isPlaced: false, color: '#06b6d4' }
    ]
  },
  {
    id: 5,
    title: 'The Grand Hasu Temple Shrine',
    theme: 'Sacred Sanctuary',
    description: 'Combine all your puzzle skills! Activate Lever Sol, step on the Royal Runes, and unlock the Ancient Portal.',
    rewardCoins: 1200,
    bgGradient: ['#78350f', '#451a03'],
    startX: 80,
    startY: 320,
    goalX: 720,
    goalY: 320,
    hint: 'Flip the Lever first, step on the Rune Plate, and collect the Golden Crown Key to finish!',
    levers: [
      { id: 'L_SOL', x: 180, y: 160, isOn: false, color: '#ef4444', label: 'Sol Lever' }
    ],
    gates: [
      { id: 'G_SOL', x: 280, y: 260, width: 24, height: 120, isOpen: false, requiredLeverIds: ['L_SOL'] },
      { id: 'G_FINAL', x: 600, y: 260, width: 24, height: 120, isOpen: false, requiredLeverIds: [], requiredKeyColor: '#eab308' }
    ],
    keys: [
      { id: 'K_CROWN', x: 480, y: 160, color: '#eab308', collected: false }
    ],
    plates: [
      { id: 'P_SOL', x: 380, y: 440, width: 50, height: 50, isPressed: false, requiredOrder: 1 }
    ],
    blocks: []
  }
];
