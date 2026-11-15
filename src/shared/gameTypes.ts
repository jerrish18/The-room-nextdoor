export type PlayerRole = 'P1_SECURITY' | 'P2_STUDY';

export type GameStatus = 'LOBBY' | 'PLAYING' | 'OUT_OF_POWER' | 'ESCAPED';

export type KeycardLocation = 'SAFE' | 'VENT' | 'SECURITY_DESK' | 'INSERTED';

export type WireColor = 'AMBER' | 'TEAL' | 'CRIMSON';

export interface PlayerSlot {
  playerId: string;
  name: string;
  role: PlayerRole;
  connected: boolean;
  holdingLatch: boolean;
  holdingSince: number | null;
}

export interface ClueItem {
  id: string;
  title: string;
  detail: string;
  authorRole: PlayerRole | 'SYSTEM';
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: PlayerRole | 'SYSTEM';
  text: string;
  timestamp: number;
}

export interface InventoryItem {
  id: 'fuse_15a' | 'blindspot_photo' | 'override_keycard' | 'ntp_memo';
  name: string;
  description: string;
  holder: PlayerRole | 'SHARED';
}

export interface RoomPuzzleState {
  // Puzzle 1: Blackout & Glow Mural -> Desk Drawer
  studyLightsOn: boolean;
  muralInspected: boolean;
  deskDrawerOpen: boolean;
  puzzle1Solved: boolean;

  // Puzzle 2: 15A Fuse + CCTV Feeds + Junction Box
  fuseInserted: boolean;
  cctvChannel: 1 | 2 | 3 | 4;
  cctvNightVision: boolean;
  junctionSwitches: [boolean, boolean, boolean, boolean]; // true = UP, false = DOWN
  wireOrder: [WireColor, WireColor, WireColor]; // Target: ['TEAL', 'AMBER', 'CRIMSON']
  puzzle2Solved: boolean;

  // Puzzle 3: DVR Scrubber + Calendar + Wall Safe + Vent Pass
  dvrMinute: 41 | 42 | 43 | 44 | 45;
  calendarTilted: boolean;
  wallSafeOpen: boolean;
  keycardLocation: KeycardLocation;
  puzzle3Solved: boolean;

  // Puzzle 4: Keycard Insert + Clock Reset + Coordinated Hold
  dvrOffsetFixed: boolean;
  dualHoldProgress: number; // 0 to 1
}

export interface RoomState {
  code: string;
  status: GameStatus;
  createdAt: number;
  startedAt: number | null;
  escapedAt: number | null;
  remainingSeconds: number;
  elapsedSeconds: number;
  auxiliaryUsed: boolean;
  hintsUsed: number;
  unlockedHints: Record<number, number>; // stage (1..4) -> max tier unlocked (1..3)
  players: {
    P1_SECURITY: PlayerSlot | null;
    P2_STUDY: PlayerSlot | null;
  };
  puzzle: RoomPuzzleState;
  inventory: InventoryItem[];
  clues: ClueItem[];
  chat: ChatMessage[];
  lastEventBanner: { id: string; text: string; targetRole?: PlayerRole } | null;
}

export interface HintStage {
  stage: 1 | 2 | 3 | 4;
  title: string;
  tiers: [string, string, string];
}

export const PROGRESSIVE_HINTS: HintStage[] = [
  {
    stage: 1,
    title: 'Stage 1 · Blackout & Glow Mural',
    tiers: [
      'Subtle: The overhead emergency tube in Flat 4B is washing out something faint on the plaster wall. Have the Security Booth cut Study 4B’s ceiling power.',
      'Clear: With Study 4B in the dark, four glowing utility symbols and directional arrows appear. Relay those exact symbols and arrows to Security so they can decode them on the Maintenance Chart.',
      'Exact Solution: Trident ↑ (4+0=4), Crescent → (6+2=8), Lotus ← (3-2=1), Surge ↓ (2+4=6). Enter 4816 on the Brass Desk Drawer in Flat 4B.'
    ]
  },
  {
    stage: 2,
    title: 'Stage 2 · Rerouted CCTV & Junction Box',
    tiers: [
      'Subtle: Insert the 15A Reserve Fuse from the drawer into Flat 4B’s Wall Junction Box. That wakes up offline cameras in the Security Booth.',
      'Clear: Security needs to check CAM 03 with IR Night Vision ON for the 4-switch pattern, and read the mirrored sticky note in CAM 02’s hallway mirror.',
      'Exact Solution: In Flat 4B Junction Box, set toggles to A: UP, B: DOWN, C: UP, D: UP, swap the Amber and Teal jumper wires (Teal, Amber, Crimson), then tap Engage Relay.'
    ]
  },
  {
    stage: 3,
    title: 'Stage 3 · The +5:00 Timestamp & Wall Safe',
    tiers: [
      'Subtle: Security can now scrub CAM 01’s DVR replay between 21:41 and 21:45 to watch where the guard tapped the hallway keypad. In Flat 4B, inspect behind the Mylapore wall calendar.',
      'Clear: Map the 4 glowing positions from the DVR replay (Top-Left, Center, Bottom-Right, Top-Right) onto the 3×3 scrambled Keypad Remap taped behind Flat 4B’s calendar.',
      'Exact Solution: Enter 9527 on Flat 4B’s Wall Safe to retrieve the Override Keycard, then slide the Keycard through the Air Vent Slot so Security receives it.'
    ]
  },
  {
    stage: 4,
    title: 'Stage 4 · Coordinated Dual-Door Override',
    tiers: [
      'Subtle: If the Keycard is still in Flat 4B, pass it through the Air Vent Slot. Security must insert the Keycard and fix the +05:00 DVR clock offset.',
      'Clear: Once Security inserts the Keycard and resets the DVR offset to 00:00 (LIVE), both players must open their Exit Door panels and hold their release latches at the exact same time.',
      'Exact Solution: Security inserts Keycard + sets Clock Offset to 00:00 LIVE. Then BOTH players press and hold their Door Release buttons simultaneously for 2.5 seconds.'
    ]
  }
];

export const QUICK_RADIO_CALLOUTS: Record<PlayerRole, string[]> = {
  P1_SECURITY: [
    'Cutting Flat 4B lights now',
    'Turning lights back on',
    'Reading Maintenance Chart…',
    'Checking CAM 02 / 03 feeds',
    'Keycard received — arming lock!',
    'Hold your door latch NOW!'
  ],
  P2_STUDY: [
    'Cut my lights please!',
    'Lights back on when ready',
    'Pinned symbols to Clue Board',
    'Drawer open — inserted 15A fuse',
    'Sliding Keycard through vent',
    'Ready to hold door latch!'
  ]
};

export function getActiveStage(puzzle: RoomPuzzleState): 1 | 2 | 3 | 4 {
  if (!puzzle.puzzle1Solved) return 1;
  if (!puzzle.puzzle2Solved) return 2;
  if (!puzzle.puzzle3Solved) return 3;
  return 4;
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
