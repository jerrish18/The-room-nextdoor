import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {
  CHAPTER_CATALOG,
  COMBINE_RECIPES,
  ChapterNumber,
  ChapterPuzzleState,
  ClueItem,
  InventoryItem,
  PlayerRole,
  RoomState,
  SafelightColor,
  WireColor,
  getActiveHintForRoom
} from './src/shared/gameTypes.js';
import { ROOF_PIPE_GRID, evaluatePipeFlow } from './src/shared/pipeGrid.js';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'rooms.json');

const DUAL_HOLD_DURATION_MS = 2800;

const rooms = new Map<string, RoomState>();
const roomSockets = new Map<string, Map<WebSocket, { playerId: string; role: PlayerRole }>>();

function generateRoomCode(): string {
  const prefixes = ['MYL', 'CHN', 'TNR', 'ADY', 'BES'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const code = `${prefix}${num}`;
  return rooms.has(code) ? generateRoomCode() : code;
}

function generateId(): string {
  return crypto.randomBytes(6).toString('hex');
}

function createInitialPuzzleState(): ChapterPuzzleState {
  return {
    // Ch 1
    ch1LightsOn: true,
    ch1MuralScanned: false,
    ch1BlotterSlid: false,
    ch1DrawerOpen: false,
    ch1ScrewsRemoved: [false, false, false, false],
    ch1FuseInserted: false,
    ch1CctvChannel: 1,
    ch1CctvIR: false,
    ch1Switches: [false, true, false, false],
    ch1Wires: ['AMBER', 'TEAL', 'CRIMSON'],
    ch1Solved: false,

    // Ch 2
    ch2ChuteSlid: false,
    ch2UvFoundNotice: false,
    ch2UvFoundFrame: false,
    ch2PadlockOpen: false,
    ch2DvrMinute: 45,
    ch2KeyPassed: false,
    ch2CorridorGateOpen: false,

    // Ch 3
    ch3WeightsOnTray: [],
    ch3BrakeReleased: false,
    ch3TrapScrews: [false, false, false],
    ch3LoomOrder: ['BLUE', 'GOLD', 'GREEN', 'RED'],
    ch3MorseAcked: false,

    // Ch 4
    ch4Valves: [15, 25, 60],
    ch4UvOilScanned: false,
    ch4OscFreq: 40,
    ch4OscPhase: 40,
    ch4OscLocked: false,
    ch4KnifeOrder: [],

    // Ch 5
    // Solvable near-finish 3x3 sliding puzzle (only a few thoughtful moves instead of frustratingly long shuffle)
    ch5SlidingTiles: [1, 2, 3, 4, 0, 6, 7, 5, 8],
    ch5SlidingSolved: false,
    ch5RadioFreq: 934,
    ch5RadioLocked: false,
    ch5KeyPassed: false,
    ch5ChestUnlocked: false,

    // Ch 6
    ch6PipeRotations: ROOF_PIPE_GRID.map((c) => c.initialRot),
    ch6PipesDrained: false,
    ch6UvBearingFound: false,
    ch6DishAzimuth: 90,
    ch6ShuntSeated: false,

    // Ch 7
    ch7Safelight: 'WHITE',
    ch7Chemicals: { dev: 10, stop: 10, fix: 10 },
    ch7FilmDeveloped: false,
    ch7FilmLoupeRead: false,
    ch7ApothecaryOpen: false,

    // Ch 8
    ch8ScrapsAligned: [false, false, false, false],
    ch8MicroficheScroll: 18,
    ch8MicroficheAligned: false,
    ch8CryptexLetters: ['A', 'A', 'A', 'A'],
    ch8DumbwaiterOpen: false,

    // Ch 9
    ch9GearSlots: [null, null, null, null],
    ch9FuelPressure: 20,
    ch9Primed: false,
    ch9LoadBreakers: [false, true, false, true],
    ch9GeneratorRunning: false,

    // Ch 10
    ch10ReelDepth: 0,
    ch10KeyFished: false,
    ch10SluiceWheelA: 0,
    ch10SluiceWheelB: 45,
    ch10CisternDrained: false,

    // Ch 11
    ch11FiberPairs: { P1: 'A', P2: 'B', P3: 'C', P4: 'D' },
    ch11FiberSolved: false,
    ch11NtpOffset: { h: 0, m: 5, s: 0 },
    ch11NtpSynced: false,
    ch11LockPins: [false, false, false],

    // Ch 12
    ch12BypassPlugged: false,
    ch12MasterCipherOpen: false,
    ch12WheelLeft: 0,
    ch12WheelRight: 180,
    ch12DualHoldProgress: 0
  };
}

function createRoom(hostName: string, hostRole: PlayerRole): { room: RoomState; playerId: string } {
  const code = generateRoomCode();
  const playerId = generateId();
  const now = Date.now();

  const room: RoomState = {
    code,
    status: 'LOBBY',
    createdAt: now,
    startedAt: null,
    escapedAt: null,
    currentChapter: 1,
    completedChapters: [],
    chapterSplits: {},
    chapterStartedElapsed: 0,
    elapsedSeconds: 0,
    hintsUsed: 0,
    unlockedHints: {},
    players: {
      P1_SECURITY:
        hostRole === 'P1_SECURITY'
          ? { playerId, name: hostName, role: 'P1_SECURITY', connected: false, holdingLatch: false, holdingSince: null }
          : null,
      P2_STUDY:
        hostRole === 'P2_STUDY'
          ? { playerId, name: hostName, role: 'P2_STUDY', connected: false, holdingLatch: false, holdingSince: null }
          : null
    },
    equipped: {
      P1_SECURITY: null,
      P2_STUDY: null
    },
    puzzle: createInitialPuzzleState(),
    inventory: [],
    clues: [
      {
        id: 'clue-intro',
        title: 'Monsoon Blackout · 21:40 IST',
        detail:
          'Security Booth CAM 01 shows the 4th-floor hallway outside Flat 4B with a timestamp +05:00 ahead (21:45). Work across all 12 wings of Marina Towers to uncover why.',
        authorRole: 'SYSTEM',
        chapter: 1,
        createdAt: now
      }
    ],
    chat: [
      {
        id: 'chat-welcome',
        senderName: 'Building Intercom',
        senderRole: 'SYSTEM',
        text: 'Emergency backup lights engaged. Both rooms locked on Floor 4. Explore your props, combine tools in your Field Bag, and coordinate on radio.',
        timestamp: now
      }
    ],
    lastEventBanner: null
  };

  rooms.set(code, room);
  persistRoomsSoon();
  return { room, playerId };
}

let persistTimer: NodeJS.Timeout | null = null;
function persistRoomsSoon() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const serializable = Array.from(rooms.values()).map((r) => ({
        ...r,
        players: {
          P1_SECURITY: r.players.P1_SECURITY
            ? { ...r.players.P1_SECURITY, connected: false, holdingLatch: false, holdingSince: null }
            : null,
          P2_STUDY: r.players.P2_STUDY
            ? { ...r.players.P2_STUDY, connected: false, holdingLatch: false, holdingSince: null }
            : null
        },
        puzzle: {
          ...r.puzzle,
          ch12DualHoldProgress: 0
        }
      }));
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(serializable, null, 2), 'utf8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      console.error('Failed to persist rooms:', err);
    }
  }, 150);
}

function loadRoomsFromDisk() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as RoomState[];
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    for (const r of parsed) {
      if (r.createdAt >= cutoff && typeof r.currentChapter === 'number' && r.puzzle && 'ch1LightsOn' in r.puzzle) {
        rooms.set(r.code, r);
      }
    }
    console.log(`Loaded ${rooms.size} persisted room(s) from disk.`);
  } catch (err) {
    console.error('Could not load rooms from disk:', err);
  }
}

function addClueUnique(room: RoomState, clue: Omit<ClueItem, 'createdAt'>) {
  if (room.clues.some((c) => c.id === clue.id)) return;
  room.clues.push({ ...clue, createdAt: Date.now() });
}

function addItemUnique(room: RoomState, item: InventoryItem) {
  if (room.inventory.some((i) => i.id === item.id)) return;
  room.inventory.push(item);
}

function setBanner(room: RoomState, text: string, targetRole?: PlayerRole) {
  room.lastEventBanner = {
    id: generateId(),
    text,
    targetRole
  };
}

function completeCurrentChapter(room: RoomState) {
  const ch = room.currentChapter;
  if (!room.completedChapters.includes(ch)) {
    room.completedChapters.push(ch);
  }
  const split = Math.max(1, room.elapsedSeconds - room.chapterStartedElapsed);
  room.chapterSplits[ch] = split;

  const meta = CHAPTER_CATALOG.find((c) => c.chapter === ch);
  if (meta) {
    addClueUnique(room, {
      id: `clue-ch${ch}-complete`,
      title: `Chapter ${String(ch).padStart(2, '0')} Cleared · ${meta.title}`,
      detail: meta.completionStory,
      authorRole: 'SYSTEM',
      chapter: ch
    });
  }

  if (ch < 12) {
    room.status = 'CHAPTER_TRANSITION';
    setBanner(room, `Chapter ${String(ch).padStart(2, '0')} cleared! Review your split and advance.`);
  } else {
    room.status = 'ESCAPED';
    room.escapedAt = Date.now();
    setBanner(room, 'Grand Lobby Airlock opened! You escaped Marina Towers!');
  }
}

function seedItemsForChapter(room: RoomState, ch: ChapterNumber) {
  if (ch === 5) {
    addItemUnique(room, {
      id: 'rusty_veranda_key',
      name: 'Rusty Veranda Key',
      description: 'Salt-corroded brass key found beside Sundaram’s vintage radio.',
      inspectNote: 'Teeth are seized with monsoon rust—needs machine oil before forcing into a lock.',
      holder: 'P1_SECURITY',
      category: 'KEY',
      combinable: true
    });
  } else if (ch === 10) {
    addItemUnique(room, {
      id: 'neodymium_magnet',
      name: 'Neodymium Recovery Magnet',
      description: 'Heavy-duty industrial magnet from the cistern tool shelf.',
      inspectNote: 'Eyelet ring at top accepts braided cord for vertical grate retrieval.',
      holder: 'P2_STUDY',
      category: 'PART',
      combinable: true
    });
    addItemUnique(room, {
      id: 'nylon_cord',
      name: '6m Nylon Survey Cord',
      description: 'Marked every 0.5 meters in bright yellow surveyor ink.',
      inspectNote: 'Can be tied to a heavy magnet to fish objects from deep flooded grates.',
      holder: 'P2_STUDY',
      category: 'PART',
      combinable: true
    });
  }
}

function broadcastRoom(room: RoomState) {
  const sockets = roomSockets.get(room.code);
  if (!sockets) return;
  const payload = JSON.stringify({ type: 'room:state', room });
  for (const [ws] of sockets.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

interface PlayerSlotInfo {
  role: PlayerRole;
  slot: NonNullable<RoomState['players']['P1_SECURITY']>;
}

function findPlayerInRoom(room: RoomState, playerId: string): PlayerSlotInfo | null {
  if (room.players.P1_SECURITY?.playerId === playerId) return { role: 'P1_SECURITY', slot: room.players.P1_SECURITY };
  if (room.players.P2_STUDY?.playerId === playerId) return { role: 'P2_STUDY', slot: room.players.P2_STUDY };
  return null;
}

function handleAction(room: RoomState, role: PlayerRole, action: { type: string; payload?: Record<string, unknown> }) {
  const p = room.puzzle;
  const playerSlot = room.players[role];
  if (!playerSlot) return;

  switch (action.type) {
    // ── LOBBY & SESSION ────────────────────────────────────────────────────────
    case 'lobby:swap_roles': {
      if (room.status !== 'LOBBY') return;
      const p1 = room.players.P1_SECURITY;
      const p2 = room.players.P2_STUDY;
      room.players.P1_SECURITY = p2 ? { ...p2, role: 'P1_SECURITY' } : null;
      room.players.P2_STUDY = p1 ? { ...p1, role: 'P2_STUDY' } : null;
      const sockets = roomSockets.get(room.code);
      if (sockets) {
        for (const [ws, meta] of sockets.entries()) {
          meta.role = meta.role === 'P1_SECURITY' ? 'P2_STUDY' : 'P1_SECURITY';
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'session:role_updated', role: meta.role }));
          }
        }
      }
      break;
    }

    case 'lobby:start_game': {
      if (room.status !== 'LOBBY') return;
      if (!room.players.P1_SECURITY || !room.players.P2_STUDY) return;
      room.status = 'PLAYING';
      room.startedAt = Date.now();
      room.chapterStartedElapsed = 0;
      setBanner(room, 'Chapter 01 started. Explore both rooms and communicate over radio!');
      break;
    }

    case 'chapter:advance': {
      if (room.status !== 'CHAPTER_TRANSITION') return;
      if (room.currentChapter >= 12) return;
      const next = (room.currentChapter + 1) as ChapterNumber;
      room.currentChapter = next;
      room.chapterStartedElapsed = room.elapsedSeconds;
      room.status = 'PLAYING';
      seedItemsForChapter(room, next);
      const meta = CHAPTER_CATALOG.find((c) => c.chapter === next);
      setBanner(room, `Entered Chapter ${String(next).padStart(2, '0')} · ${meta?.title || ''}`);
      break;
    }

    case 'game:reset': {
      room.status = 'PLAYING';
      room.startedAt = Date.now();
      room.escapedAt = null;
      room.currentChapter = 1;
      room.completedChapters = [];
      room.chapterSplits = {};
      room.chapterStartedElapsed = 0;
      room.elapsedSeconds = 0;
      room.hintsUsed = 0;
      room.unlockedHints = {};
      room.equipped = { P1_SECURITY: null, P2_STUDY: null };
      room.puzzle = createInitialPuzzleState();
      room.inventory = [];
      room.clues = [
        {
          id: 'clue-intro',
          title: 'Monsoon Blackout · 21:40 IST',
          detail:
            'Security Booth CAM 01 shows the 4th-floor hallway outside Flat 4B with a timestamp +05:00 ahead (21:45). Work across all 12 wings of Marina Towers to uncover why.',
          authorRole: 'SYSTEM',
          chapter: 1,
          createdAt: Date.now()
        }
      ];
      if (room.players.P1_SECURITY) {
        room.players.P1_SECURITY.holdingLatch = false;
        room.players.P1_SECURITY.holdingSince = null;
      }
      if (room.players.P2_STUDY) {
        room.players.P2_STUDY.holdingLatch = false;
        room.players.P2_STUDY.holdingSince = null;
      }
      setBanner(room, 'Campaign reset to Chapter 01. Speedrun clock restarted.');
      break;
    }

    // ── INVENTORY EQUIP & COMBINE ─────────────────────────────────────────────
    case 'item:equip': {
      const itemId = String(action.payload?.itemId || '');
      if (!itemId) {
        room.equipped[role] = null;
        break;
      }
      const item = room.inventory.find((i) => i.id === itemId && !i.consumed);
      if (!item) return;
      if (item.holder !== 'SHARED' && item.holder !== role) return;
      room.equipped[role] = room.equipped[role] === itemId ? null : itemId;
      break;
    }

    case 'item:combine': {
      const idA = String(action.payload?.itemA || '');
      const idB = String(action.payload?.itemB || '');
      if (!idA || !idB || idA === idB) return;

      const recipe = COMBINE_RECIPES.find(
        (r) => (r.itemA === idA && r.itemB === idB) || (r.itemA === idB && r.itemB === idA)
      );
      if (!recipe) return;

      const itemA = room.inventory.find((i) => i.id === idA && !i.consumed);
      const itemB = room.inventory.find((i) => i.id === idB && !i.consumed);
      if (!itemA || !itemB) return;

      const holderA = itemA.holder === 'SHARED' || itemA.holder === role;
      const holderB = itemB.holder === 'SHARED' || itemB.holder === role;
      if (!holderA || !holderB) return;

      itemA.consumed = true;
      itemB.consumed = true;

      const sharedCrafted =
        recipe.result.id === 'uv_torch' ||
        recipe.result.id === 'reassembled_invoice' ||
        recipe.result.id === 'master_bypass_rig';

      addItemUnique(room, {
        ...recipe.result,
        holder: sharedCrafted ? 'SHARED' : role
      });
      room.equipped[role] = recipe.result.id;
      addClueUnique(room, {
        id: `clue-craft-${recipe.result.id}`,
        title: `Crafted: ${recipe.result.name}`,
        detail: recipe.result.inspectNote,
        authorRole: role,
        chapter: room.currentChapter
      });
      setBanner(room, recipe.bannerText);
      break;
    }

    // ── CHAPTER 1: BLACKOUT ON FLOOR 4 ─────────────────────────────────────────
    case 'ch1:toggle_lights': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 1 || room.status !== 'PLAYING') return;
      p.ch1LightsOn = !p.ch1LightsOn;
      setBanner(
        room,
        p.ch1LightsOn
          ? 'Security restored Flat 4B ceiling light.'
          : 'Security cut Flat 4B ceiling light — inspect the dark plaster wall!',
        'P2_STUDY'
      );
      break;
    }

    case 'ch1:scan_mural': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 1 || p.ch1LightsOn) return;
      p.ch1MuralScanned = true;
      break;
    }

    case 'ch1:slide_blotter': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 1) return;
      if (!p.ch1BlotterSlid) {
        p.ch1BlotterSlid = true;
        addItemUnique(room, {
          id: 'screwdriver_handle',
          name: 'Insulated Grip Handle',
          description: 'Rubberized electrician handle hidden beneath the desk blotter.',
          inspectNote: 'Has a hex socket waiting for a steel flathead shaft.',
          holder: 'P2_STUDY',
          category: 'PART',
          combinable: true
        });
        setBanner(room, 'Slid desk blotter aside — found Insulated Grip Handle!');
      }
      break;
    }

    case 'ch1:unlock_drawer': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 1 || p.ch1DrawerOpen) return;
      const code = String(action.payload?.code || '').trim();
      if (code === '4816') {
        p.ch1DrawerOpen = true;
        addItemUnique(room, {
          id: 'fuse_15a',
          name: '15A Ceramic Fuse',
          description: 'Brass-capped cartridge fuse for Flat 4B’s wall junction box.',
          inspectNote: 'Rated 240V 15A. Fits inside the Junction Box cartridge clip.',
          holder: 'P2_STUDY',
          category: 'PART'
        });
        addItemUnique(room, {
          id: 'flathead_bit',
          name: '6mm Brass Flathead Shaft',
          description: 'Machined screwdriver blade found inside the brass drawer.',
          inspectNote: 'Combine with the Insulated Grip Handle in your Bag to assemble a working screwdriver.',
          holder: 'P2_STUDY',
          category: 'PART',
          combinable: true
        });
        addClueUnique(room, {
          id: 'clue-ch1-drawer',
          title: 'Brass Desk Drawer Unlocked (4816)',
          detail: 'Found 15A Ceramic Fuse & 6mm Flathead Shaft. Combine screwdriver parts to open the Junction Box.',
          authorRole: 'P2_STUDY',
          chapter: 1
        });
        setBanner(room, 'Desk Drawer opened (4816)! Found 15A Fuse & Flathead Shaft.');
      }
      break;
    }

    case 'ch1:unscrew_bolt': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 1) return;
      if (room.equipped.P2_STUDY !== 'brass_screwdriver') return;
      const idx = Number(action.payload?.index);
      if (idx >= 0 && idx <= 3 && !p.ch1ScrewsRemoved[idx]) {
        p.ch1ScrewsRemoved[idx] = true;
        if (p.ch1ScrewsRemoved.every(Boolean)) {
          setBanner(room, 'All 4 cover screws removed! Junction Box interior exposed.');
        }
      }
      break;
    }

    case 'ch1:insert_fuse': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 1) return;
      if (!p.ch1ScrewsRemoved.every(Boolean) || !p.ch1DrawerOpen || p.ch1FuseInserted) return;
      p.ch1FuseInserted = true;
      room.inventory = room.inventory.map((i) => (i.id === 'fuse_15a' ? { ...i, consumed: true } : i));
      setBanner(room, '15A Fuse seated! CAM 02, CAM 03 & CAM 04 are now online.', 'P1_SECURITY');
      break;
    }

    case 'ch1:select_cctv': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 1) return;
      const ch = Number(action.payload?.channel);
      if (ch === 1 || ch === 2 || ch === 3 || ch === 4) {
        p.ch1CctvChannel = ch;
      }
      break;
    }

    case 'ch1:toggle_ir': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 1) return;
      p.ch1CctvIR = !p.ch1CctvIR;
      break;
    }

    case 'ch1:toggle_switch': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 1 || !p.ch1FuseInserted || p.ch1Solved) return;
      const idx = Number(action.payload?.index);
      if (idx >= 0 && idx <= 3) {
        p.ch1Switches[idx] = !p.ch1Switches[idx];
      }
      break;
    }

    case 'ch1:swap_wires': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 1 || !p.ch1FuseInserted || p.ch1Solved) return;
      const a = Number(action.payload?.indexA);
      const b = Number(action.payload?.indexB);
      if (a >= 0 && a <= 2 && b >= 0 && b <= 2 && a !== b) {
        const next: [WireColor, WireColor, WireColor] = [...p.ch1Wires];
        const tmp = next[a];
        next[a] = next[b];
        next[b] = tmp;
        p.ch1Wires = next;
      }
      break;
    }

    case 'ch1:engage_relay': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 1 || !p.ch1FuseInserted || p.ch1Solved) return;
      const swOk = p.ch1Switches[0] && !p.ch1Switches[1] && p.ch1Switches[2] && p.ch1Switches[3];
      const wireOk = p.ch1Wires[0] === 'TEAL' && p.ch1Wires[1] === 'AMBER' && p.ch1Wires[2] === 'CRIMSON';
      if (swOk && wireOk) {
        p.ch1Solved = true;
        completeCurrentChapter(room);
      }
      break;
    }

    // ── CHAPTER 2: LOCKED CORRIDOR & RECEPTION ─────────────────────────────────
    case 'ch2:slide_chute': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 2 || p.ch2ChuteSlid) return;
      p.ch2ChuteSlid = true;
      addItemUnique(room, {
        id: 'torch_housing',
        name: 'Anodized Torch Barrel',
        description: 'Empty 2xAA flashlight body jammed inside the corridor mail chute.',
        inspectNote: 'Missing its emitter bulb module. Check for an LED capsule.',
        holder: 'P2_STUDY',
        category: 'PART',
        combinable: true
      });
      addItemUnique(room, {
        id: 'uv_bulb',
        name: '365nm UV Emitter Bulb',
        description: 'Ultraviolet inspection bulb wrapped in a yellow guard slip.',
        inspectNote: 'Combine with Anodized Torch Barrel to build a working UV Torch.',
        holder: 'P2_STUDY',
        category: 'PART',
        combinable: true
      });
      setBanner(room, 'Slid mail chute open! Found Torch Barrel & 365nm UV Bulb.');
      break;
    }

    case 'ch2:uv_scan': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 2) return;
      if (room.equipped.P2_STUDY !== 'uv_torch') return;
      const target = String(action.payload?.target || '');
      if (target === 'notice' && !p.ch2UvFoundNotice) {
        p.ch2UvFoundNotice = true;
        addClueUnique(room, {
          id: 'clue-ch2-notice',
          title: 'UV Ink · Noticeboard (4F)',
          detail: 'Invisible ink reads: "KEYBOX RING 1 = 7 · RING 2 = 3 · Supervisor Shift 21:41–21:45"',
          authorRole: 'P2_STUDY',
          chapter: 2
        });
        setBanner(room, 'UV beam revealed invisible audit ink on the Noticeboard!');
      } else if (target === 'frame' && !p.ch2UvFoundFrame) {
        p.ch2UvFoundFrame = true;
        addClueUnique(room, {
          id: 'clue-ch2-frame',
          title: 'UV Ink · Corridor Doorframe',
          detail: 'Scrawled by the deadbolt: "KEYBOX RING 3 = 9 · Remap 4B Calendar stays 9527"',
          authorRole: 'P2_STUDY',
          chapter: 2
        });
        setBanner(room, 'UV beam uncovered hidden ink on the Corridor Frame!');
      }
      break;
    }

    case 'ch2:unlock_padlock': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 2 || p.ch2PadlockOpen) return;
      const code = String(action.payload?.code || '');
      if (code === '739') {
        p.ch2PadlockOpen = true;
        addItemUnique(room, {
          id: 'service_lift_key',
          name: 'Service Lift Master Key',
          description: 'Heavy triangular steel elevator key. Pass through the Mail Chute to your partner.',
          inspectNote: 'Stamped "LIFT LOBBY 4F · OVERRIDE". Required on the Corridor Lift Gate.',
          holder: 'P1_SECURITY',
          category: 'KEY'
        });
        setBanner(room, '3-Ring Padlock opened (739)! Pass the Service Lift Key through the Mail Chute.');
      }
      break;
    }

    case 'ch2:scrub_dvr': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 2) return;
      const min = Number(action.payload?.minute);
      if (min === 41 || min === 42 || min === 43 || min === 44 || min === 45) {
        p.ch2DvrMinute = min;
      }
      break;
    }

    case 'ch2:pass_key': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 2 || !p.ch2PadlockOpen || p.ch2KeyPassed) return;
      p.ch2KeyPassed = true;
      room.inventory = room.inventory.map((i) =>
        i.id === 'service_lift_key' ? { ...i, holder: 'P2_STUDY' } : i
      );
      setBanner(room, 'Service Lift Master Key slid through the Mail Chute!', 'P2_STUDY');
      break;
    }

    case 'ch2:unlock_gate': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 2 || !p.ch2KeyPassed || p.ch2CorridorGateOpen) return;
      if (room.equipped.P2_STUDY !== 'service_lift_key') return;
      const code = String(action.payload?.code || '').trim();
      if (code === '9527') {
        p.ch2CorridorGateOpen = true;
        room.inventory = room.inventory.map((i) =>
          i.id === 'service_lift_key' ? { ...i, consumed: true } : i
        );
        completeCurrentChapter(room);
      }
      break;
    }

    // ── CHAPTER 3: SERVICE LIFT SHAFT ──────────────────────────────────────────
    case 'ch3:toggle_weight': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 3 || p.ch3BrakeReleased) return;
      const w = Number(action.payload?.weight);
      if (![200, 150, 100, 75, 50, 20].includes(w)) return;
      if (p.ch3WeightsOnTray.includes(w)) {
        p.ch3WeightsOnTray = p.ch3WeightsOnTray.filter((x) => x !== w);
      } else {
        p.ch3WeightsOnTray = [...p.ch3WeightsOnTray, w];
      }
      break;
    }

    case 'ch3:pull_brake': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 3 || p.ch3BrakeReleased) return;
      const total = p.ch3WeightsOnTray.reduce((sum, w) => sum + w, 0);
      if (total === 520) {
        p.ch3BrakeReleased = true;
        setBanner(room, '520 kg balanced! Brake Tension Lever released — check Lift Car ceiling!', 'P1_SECURITY');
      }
      break;
    }

    case 'ch3:unscrew_wingnut': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 3) return;
      const idx = Number(action.payload?.index);
      if (idx >= 0 && idx <= 2 && !p.ch3TrapScrews[idx]) {
        p.ch3TrapScrews[idx] = true;
      }
      break;
    }

    case 'ch3:send_morse_ack': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 3 || p.ch3MorseAcked) return;
      p.ch3MorseAcked = true;
      addClueUnique(room, {
        id: 'clue-ch3-morse',
        title: 'Shaft Voltmeter Signal Synced',
        detail: '5F Machine Room Terminal Order confirmed: GOLD → RED → GREEN → BLUE.',
        authorRole: 'P2_STUDY',
        chapter: 3
      });
      setBanner(room, 'Buzzer pulse confirmed! Splice ceiling lugs: GOLD · RED · GREEN · BLUE.');
      break;
    }

    case 'ch3:swap_loom': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 3 || !p.ch3BrakeReleased) return;
      const a = Number(action.payload?.indexA);
      const b = Number(action.payload?.indexB);
      if (a >= 0 && a <= 3 && b >= 0 && b <= 3 && a !== b) {
        const next = [...p.ch3LoomOrder];
        const tmp = next[a];
        next[a] = next[b];
        next[b] = tmp;
        p.ch3LoomOrder = next;
      }
      break;
    }

    case 'ch3:engage_lift': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 3 || !p.ch3BrakeReleased || !p.ch3MorseAcked) return;
      if (!p.ch3TrapScrews.every(Boolean)) return;
      if (
        p.ch3LoomOrder[0] === 'GOLD' &&
        p.ch3LoomOrder[1] === 'RED' &&
        p.ch3LoomOrder[2] === 'GREEN' &&
        p.ch3LoomOrder[3] === 'BLUE'
      ) {
        completeCurrentChapter(room);
      }
      break;
    }

    // ── CHAPTER 4: MEZZANINE METER VAULT ───────────────────────────────────────
    case 'ch4:uv_scan_oil': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 4) return;
      if (room.equipped.P2_STUDY !== 'uv_torch') return;
      p.ch4UvOilScanned = true;
      addClueUnique(room, {
        id: 'clue-ch4-oil',
        title: 'UV Coolant Targets (Mezzanine)',
        detail: 'Valve I = 45 PSI · Valve II = 70 PSI · Valve III = 30 PSI. Firing Order: L2 → L1 → L3.',
        authorRole: 'P2_STUDY',
        chapter: 4
      });
      setBanner(room, 'UV light exposed Valve PSI targets & L2 → L1 → L3 switch order!');
      break;
    }

    case 'ch4:set_valve': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 4) return;
      const idx = Number(action.payload?.index);
      const val = Number(action.payload?.value);
      if (idx >= 0 && idx <= 2 && Number.isFinite(val)) {
        const clamped = Math.max(0, Math.min(100, Math.round(val / 5) * 5));
        p.ch4Valves[idx] = clamped;
        if (p.ch4Valves[0] === 45 && p.ch4Valves[1] === 70 && p.ch4Valves[2] === 30) {
          setBanner(room, 'Coolant steady! CRT Oscilloscope powered up in Oscilloscope Bay!', 'P1_SECURITY');
        }
      }
      break;
    }

    case 'ch4:set_osc': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 4 || p.ch4OscLocked) return;
      const valvesOk = p.ch4Valves[0] === 45 && p.ch4Valves[1] === 70 && p.ch4Valves[2] === 30;
      if (!valvesOk) return;
      const freq = Number(action.payload?.freq);
      const phase = Number(action.payload?.phase);
      if (Number.isFinite(freq)) p.ch4OscFreq = Math.max(20, Math.min(100, Math.round(freq)));
      if (Number.isFinite(phase)) p.ch4OscPhase = Math.max(0, Math.min(180, Math.round(phase / 5) * 5));
      if (p.ch4OscFreq === 60 && p.ch4OscPhase === 120) {
        p.ch4OscLocked = true;
        setBanner(room, 'Sine wave phase locked (60 Hz · 120°)! Fire Knife Switches: L2 → L1 → L3.');
      }
      break;
    }

    case 'ch4:pull_knife': {
      if (room.currentChapter !== 4 || !p.ch4OscLocked) return;
      const label = String(action.payload?.label || '');
      if (!['L1', 'L2', 'L3'].includes(label)) return;
      if (p.ch4KnifeOrder.includes(label)) {
        p.ch4KnifeOrder = [];
        break;
      }
      const next = [...p.ch4KnifeOrder, label];
      const expected = ['L2', 'L1', 'L3'];
      if (next[next.length - 1] !== expected[next.length - 1]) {
        p.ch4KnifeOrder = [];
        setBanner(room, 'Breaker tripped — follow stamped order L2 → L1 → L3!');
      } else {
        p.ch4KnifeOrder = next;
        if (next.length === 3) {
          completeCurrentChapter(room);
        }
      }
      break;
    }

    // ── CHAPTER 5: CARETAKER SUNDARAM'S QUARTERS ───────────────────────────────
    case 'ch5:slide_tile': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 5 || p.ch5SlidingSolved) return;
      const idx = Number(action.payload?.index);
      if (idx < 0 || idx > 8) return;
      const blankIdx = p.ch5SlidingTiles.indexOf(0);
      const r1 = Math.floor(idx / 3);
      const c1 = idx % 3;
      const r2 = Math.floor(blankIdx / 3);
      const c2 = blankIdx % 3;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;

      const next = [...p.ch5SlidingTiles];
      next[blankIdx] = next[idx];
      next[idx] = 0;
      p.ch5SlidingTiles = next;

      if (next.every((v, i) => v === (i === 8 ? 0 : i + 1))) {
        p.ch5SlidingSolved = true;
        addItemUnique(room, {
          id: 'machine_oil',
          name: 'Singer Machine Oil Dropper',
          description: 'Small brass spout oiler from Sundaram’s secret teak drawer.',
          inspectNote: 'Note beside oiler reads: "Tune monsoon radio to 104.4 MHz".',
          holder: 'P2_STUDY',
          category: 'PART',
          combinable: true
        });
        addClueUnique(room, {
          id: 'clue-ch5-teak',
          title: 'Teak Puzzle Drawer Opened',
          detail: 'Recovered Machine Oil Dropper and frequency slip: 104.4 MHz.',
          authorRole: 'P2_STUDY',
          chapter: 5
        });
        setBanner(room, 'Teak Box opened! Found Machine Oil & frequency slip: 104.4 MHz.');
      }
      break;
    }

    case 'ch5:tune_radio': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 5) return;
      const freq = Number(action.payload?.freq);
      if (!Number.isFinite(freq)) return;
      p.ch5RadioFreq = Math.max(880, Math.min(1080, Math.round(freq)));
      if (p.ch5RadioFreq === 1044 && !p.ch5RadioLocked) {
        p.ch5RadioLocked = true;
        addClueUnique(room, {
          id: 'clue-ch5-radio',
          title: '104.4 MHz Monsoon Bulletin',
          detail: 'Broadcast loop: "Kaveri 6, Marina 2, Adyar 9, Mylapore 4" -> Tool Chest Code 6294.',
          authorRole: 'P1_SECURITY',
          chapter: 5
        });
        setBanner(room, '104.4 MHz locked! Coded bulletin reveals: 6294.');
      }
      break;
    }

    case 'ch5:pass_key': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 5 || p.ch5KeyPassed) return;
      p.ch5KeyPassed = true;
      room.inventory = room.inventory.map((i) =>
        i.id === 'rusty_veranda_key' ? { ...i, holder: 'P2_STUDY' } : i
      );
      setBanner(room, 'Slid Rusty Veranda Key through veranda shutter! Oil it before using.', 'P2_STUDY');
      break;
    }

    case 'ch5:unlock_chest': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 5 || p.ch5ChestUnlocked) return;
      if (room.equipped.P2_STUDY !== 'oiled_veranda_key') return;
      const code = String(action.payload?.code || '').trim();
      if (code === '6294') {
        p.ch5ChestUnlocked = true;
        room.inventory = room.inventory.map((i) =>
          i.id === 'oiled_veranda_key' ? { ...i, consumed: true } : i
        );
        addItemUnique(room, {
          id: 'roof_crank',
          name: 'Steel Roof-Hatch Crank',
          description: 'Heavy square-drive crank used to unbolt the monsoon terrace access hatch.',
          inspectNote: 'Engraved: "EAST PARAPET ROOF RELAY".',
          holder: 'SHARED',
          category: 'KEY'
        });
        completeCurrentChapter(room);
      }
      break;
    }

    // ── CHAPTER 6: MONSOON ROOF RELAY ──────────────────────────────────────────
    case 'ch6:rotate_pipe': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 6 || p.ch6PipesDrained) return;
      const idx = Number(action.payload?.index);
      if (idx < 0 || idx > 15) return;
      const next = [...p.ch6PipeRotations];
      next[idx] = (next[idx] + 1) % 4;
      p.ch6PipeRotations = next;

      const { drained } = evaluatePipeFlow(next);
      if (drained) {
        p.ch6PipesDrained = true;
        addItemUnique(room, {
          id: 'copper_shunt',
          name: 'Heavy Copper Shunt Bar',
          description: 'Conductive busbar recovered from the drained rooftop junction pit.',
          inspectNote: 'Keep safe—used both on the Roof Relay and Marina Towers’ final Master Bypass Rig.',
          holder: 'P2_STUDY',
          category: 'PART',
          combinable: true
        });
        setBanner(room, 'Roof pit drained! Retrieved Heavy Copper Shunt Bar.');
      }
      break;
    }

    case 'ch6:uv_scan_parapet': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 6) return;
      if (room.equipped.P2_STUDY !== 'uv_torch') return;
      p.ch6UvBearingFound = true;
      addClueUnique(room, {
        id: 'clue-ch6-bearing',
        title: 'Rooftop Storm Bearing (UV)',
        detail: 'UV markings by the parapet wind-vane read: "RELAY AZIMUTH 215° SW".',
        authorRole: 'P2_STUDY',
        chapter: 6
      });
      setBanner(room, 'UV beam exposed storm bearing: 215° SW!');
      break;
    }

    case 'ch6:set_azimuth': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 6) return;
      const deg = Number(action.payload?.azimuth);
      if (!Number.isFinite(deg)) return;
      p.ch6DishAzimuth = ((Math.round(deg / 5) * 5) % 360 + 360) % 360;
      if (p.ch6DishAzimuth === 215 && p.ch6ShuntSeated) {
        completeCurrentChapter(room);
      }
      break;
    }

    case 'ch6:seat_shunt': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 6 || !p.ch6PipesDrained || p.ch6ShuntSeated) return;
      if (room.equipped.P2_STUDY !== 'copper_shunt') return;
      p.ch6ShuntSeated = true;
      // Keep copper_shunt marked SHARED for Chapter 12's Master Bypass Rig
      room.inventory = room.inventory.map((i) =>
        i.id === 'copper_shunt' ? { ...i, holder: 'SHARED' } : i
      );
      if (p.ch6DishAzimuth === 215) {
        completeCurrentChapter(room);
      } else {
        setBanner(room, 'Copper Shunt seated! Security must aim Roof Dish to 215°.', 'P1_SECURITY');
      }
      break;
    }

    // ── CHAPTER 7: DISPENSARY DARKROOM ─────────────────────────────────────────
    case 'ch7:set_safelight': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 7) return;
      const color = String(action.payload?.color) as SafelightColor;
      if (['WHITE', 'RED', 'AMBER', 'UV'].includes(color)) {
        p.ch7Safelight = color;
      }
      break;
    }

    case 'ch7:set_chemicals': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 7 || p.ch7FilmDeveloped) return;
      if (p.ch7Safelight !== 'RED') return;
      const dev = Number(action.payload?.dev);
      const stop = Number(action.payload?.stop);
      const fix = Number(action.payload?.fix);
      if (Number.isFinite(dev)) p.ch7Chemicals.dev = Math.max(0, Math.min(80, Math.round(dev / 5) * 5));
      if (Number.isFinite(stop)) p.ch7Chemicals.stop = Math.max(0, Math.min(80, Math.round(stop / 5) * 5));
      if (Number.isFinite(fix)) p.ch7Chemicals.fix = Math.max(0, Math.min(80, Math.round(fix / 5) * 5));
      if (p.ch7Chemicals.dev === 40 && p.ch7Chemicals.stop === 25 && p.ch7Chemicals.fix === 60) {
        p.ch7FilmDeveloped = true;
        setBanner(room, '35mm Film developed! Switch Safelight to AMBER to inspect with Loupe.');
      }
      break;
    }

    case 'ch7:read_loupe': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 7 || !p.ch7FilmDeveloped) return;
      if (p.ch7Safelight !== 'AMBER') return;
      p.ch7FilmLoupeRead = true;
      addClueUnique(room, {
        id: 'clue-ch7-frame14',
        title: '35mm Negative · Frame 14',
        detail: 'Magnifier reveals supervisor’s dispensary locker stamp: 3-8-9-2.',
        authorRole: 'P2_STUDY',
        chapter: 7
      });
      setBanner(room, 'Loupe uncovered Frame 14 Locker Code: 3892!', 'P1_SECURITY');
      break;
    }

    case 'ch7:unlock_apothecary': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 7 || !p.ch7FilmLoupeRead || p.ch7ApothecaryOpen) return;
      const code = String(action.payload?.code || '').trim();
      if (code === '3892') {
        p.ch7ApothecaryOpen = true;
        addItemUnique(room, {
          id: 'microfiche_reel_04',
          name: 'Microfiche Reel #04',
          description: 'Archival contractor audit reel hidden in the dispensary locker.',
          inspectNote: 'Load into the Basement Accounting Microfiche Projector.',
          holder: 'P1_SECURITY',
          category: 'DOCUMENT'
        });
        addItemUnique(room, {
          id: 'ledger_frag_a',
          name: 'Torn Ledger Fragment A',
          description: 'Left half of a shredded generator invoice.',
          inspectNote: 'Combine with Fragment B in the Accounting Archives.',
          holder: 'SHARED',
          category: 'DOCUMENT',
          combinable: true
        });
        completeCurrentChapter(room);
      }
      break;
    }

    // ── CHAPTER 8: ACCOUNTING ARCHIVES ─────────────────────────────────────────
    case 'ch8:align_scrap': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 8) return;
      const idx = Number(action.payload?.index);
      if (idx >= 0 && idx <= 3 && !p.ch8ScrapsAligned[idx]) {
        p.ch8ScrapsAligned[idx] = true;
        if (p.ch8ScrapsAligned.every(Boolean)) {
          addItemUnique(room, {
            id: 'ledger_frag_b',
            name: 'Torn Ledger Fragment B',
            description: 'Right half of the generator invoice recovered from the corkboard.',
            inspectNote: 'Combine with Torn Ledger Fragment A in your Bag!',
            holder: 'P2_STUDY',
            category: 'DOCUMENT',
            combinable: true
          });
          setBanner(room, 'Corkboard scraps aligned! Found Ledger Fragment B — combine with Fragment A!');
        }
      }
      break;
    }

    case 'ch8:scroll_microfiche': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 8) return;
      const pos = Number(action.payload?.scroll);
      if (!Number.isFinite(pos)) return;
      p.ch8MicroficheScroll = Math.max(0, Math.min(100, Math.round(pos / 5) * 5));
      if (p.ch8MicroficheScroll === 65 && !p.ch8MicroficheAligned) {
        p.ch8MicroficheAligned = true;
        addClueUnique(room, {
          id: 'clue-ch8-microfiche',
          title: 'Microfiche Reel #04 (65%)',
          detail: 'Overlapping transparencies reveal Contractor Chute PIN: 4821.',
          authorRole: 'P1_SECURITY',
          chapter: 8
        });
        setBanner(room, 'Microfiche aligned at 65%! Dumbwaiter Chute PIN: 4821.');
      }
      break;
    }

    case 'ch8:spin_cryptex': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 8 || p.ch8DumbwaiterOpen) return;
      const idx = Number(action.payload?.index);
      const val = String(action.payload?.value || '').toUpperCase().slice(0, 1);
      if (idx >= 0 && idx <= 3 && val) {
        p.ch8CryptexLetters[idx] = val;
      }
      break;
    }

    case 'ch8:open_dumbwaiter': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 8 || !p.ch8MicroficheAligned || p.ch8DumbwaiterOpen) return;
      const hasInvoice = room.inventory.some((i) => i.id === 'reassembled_invoice');
      if (!hasInvoice) return;
      const cryptexOk =
        p.ch8CryptexLetters[0] === 'M' &&
        p.ch8CryptexLetters[1] === 'Y' &&
        p.ch8CryptexLetters[2] === 'L' &&
        p.ch8CryptexLetters[3] === '4';
      const code = String(action.payload?.code || '').trim();
      if (cryptexOk && code === '4821') {
        p.ch8DumbwaiterOpen = true;
        completeCurrentChapter(room);
      }
      break;
    }

    // ── CHAPTER 9: BASEMENT DIESEL BAY ─────────────────────────────────────────
    case 'ch9:place_gear': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 9 || p.ch9GeneratorRunning) return;
      const slot = Number(action.payload?.slot);
      const teeth = action.payload?.teeth === null ? null : Number(action.payload?.teeth);
      if (slot < 0 || slot > 3) return;
      if (teeth !== null) {
        // Remove same gear from any other slot first
        p.ch9GearSlots = p.ch9GearSlots.map((g, i) => (i === slot ? teeth : g === teeth ? null : g));
      } else {
        p.ch9GearSlots[slot] = null;
      }
      break;
    }

    case 'ch9:pump_primer': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 9 || p.ch9GeneratorRunning) return;
      const pressure = Number(action.payload?.pressure);
      if (!Number.isFinite(pressure)) return;
      p.ch9FuelPressure = Math.max(0, Math.min(100, Math.round(pressure)));
      p.ch9Primed = p.ch9FuelPressure >= 65 && p.ch9FuelPressure <= 80;
      break;
    }

    case 'ch9:toggle_load': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 9 || p.ch9GeneratorRunning) return;
      const idx = Number(action.payload?.index);
      if (idx >= 0 && idx <= 3) {
        p.ch9LoadBreakers[idx] = !p.ch9LoadBreakers[idx];
      }
      break;
    }

    case 'ch9:crank_ignition': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 9 || p.ch9GeneratorRunning) return;
      const gearsOk =
        p.ch9GearSlots[0] === 12 &&
        p.ch9GearSlots[1] === 24 &&
        p.ch9GearSlots[2] === 16 &&
        p.ch9GearSlots[3] === 32;
      const loadOk =
        p.ch9LoadBreakers[0] === true &&
        p.ch9LoadBreakers[1] === false &&
        p.ch9LoadBreakers[2] === true &&
        p.ch9LoadBreakers[3] === false;
      if (gearsOk && p.ch9Primed && loadOk) {
        p.ch9GeneratorRunning = true;
        completeCurrentChapter(room);
      }
      break;
    }

    // ── CHAPTER 10: FLOODED SUB-CISTERN ────────────────────────────────────────
    case 'ch10:reel_depth': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 10 || p.ch10KeyFished) return;
      if (room.equipped.P2_STUDY !== 'magnetic_line') return;
      const depth = Number(action.payload?.depth);
      if (!Number.isFinite(depth)) return;
      p.ch10ReelDepth = Math.max(0, Math.min(50, Math.round(depth)));
      if (p.ch10ReelDepth === 45) {
        p.ch10KeyFished = true;
        addItemUnique(room, {
          id: 'vault_brass_key',
          name: 'Sub-Basement Vault Key',
          description: 'Solid brass warded key fished from 4.5m beneath the cistern grate.',
          inspectNote: 'Keep equipped for the NTP Time-Lock Vault Door in Chapter 11.',
          holder: 'P2_STUDY',
          category: 'KEY'
        });
        setBanner(room, 'Fished up Sub-Basement Vault Key at 4.5m! Now align both Sluice Wheels.');
      }
      break;
    }

    case 'ch10:rotate_sluice': {
      if (room.currentChapter !== 10 || p.ch10CisternDrained) return;
      const deg = Number(action.payload?.angle);
      if (!Number.isFinite(deg)) return;
      const snapped = ((Math.round(deg / 15) * 15) % 360 + 360) % 360;
      if (role === 'P1_SECURITY') {
        p.ch10SluiceWheelA = snapped;
      } else {
        p.ch10SluiceWheelB = snapped;
      }
      if (p.ch10KeyFished && p.ch10SluiceWheelA === 135 && p.ch10SluiceWheelB === 270) {
        p.ch10CisternDrained = true;
        completeCurrentChapter(room);
      }
      break;
    }

    // ── CHAPTER 11: SUB-BASEMENT NTP VAULT ─────────────────────────────────────
    case 'ch11:set_fiber': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 11 || p.ch11FiberSolved) return;
      const port = String(action.payload?.port || '');
      const target = String(action.payload?.target || '');
      if (['P1', 'P2', 'P3', 'P4'].includes(port) && ['A', 'B', 'C', 'D'].includes(target)) {
        p.ch11FiberPairs[port] = target;
        if (
          p.ch11FiberPairs.P1 === 'B' &&
          p.ch11FiberPairs.P2 === 'D' &&
          p.ch11FiberPairs.P3 === 'A' &&
          p.ch11FiberPairs.P4 === 'C'
        ) {
          p.ch11FiberSolved = true;
          setBanner(room, 'Fiber loop severed! P1 can now zero the +05:00 NTP Drift Clock!', 'P1_SECURITY');
        }
      }
      break;
    }

    case 'ch11:set_ntp_drift': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 11 || !p.ch11FiberSolved || p.ch11NtpSynced) return;
      const h = Number(action.payload?.h);
      const m = Number(action.payload?.m);
      const s = Number(action.payload?.s);
      if (Number.isFinite(h)) p.ch11NtpOffset.h = ((Math.round(h) % 12) + 12) % 12;
      if (Number.isFinite(m)) p.ch11NtpOffset.m = ((Math.round(m) % 60) + 60) % 60;
      if (Number.isFinite(s)) p.ch11NtpOffset.s = ((Math.round(s) % 60) + 60) % 60;

      if (p.ch11NtpOffset.h === 0 && p.ch11NtpOffset.m === 0 && p.ch11NtpOffset.s === 0) {
        p.ch11NtpSynced = true;
        setBanner(room, 'NTP Clock synced to 00:00:00 LIVE! Pick the 3 Vault Tumbler Pins!', 'P2_STUDY');
      }
      break;
    }

    case 'ch11:set_pin': {
      if (role !== 'P2_STUDY' || room.currentChapter !== 11 || !p.ch11NtpSynced) return;
      if (room.equipped.P2_STUDY !== 'vault_brass_key') return;
      const idx = Number(action.payload?.index);
      if (idx >= 0 && idx <= 2 && !p.ch11LockPins[idx]) {
        p.ch11LockPins[idx] = true;
        if (p.ch11LockPins.every(Boolean)) {
          addItemUnique(room, {
            id: 'ntp_override_token',
            name: 'NTP Supervisor Override Token',
            description: 'Cryptographic hardware dongle pulled from the sub-basement NTP rack.',
            inspectNote: 'Combine with Heavy Copper Shunt Bar → Master Lobby Bypass Rig.',
            holder: 'SHARED',
            category: 'PART',
            combinable: true
          });
          completeCurrentChapter(room);
        }
      }
      break;
    }

    // ── CHAPTER 12: MAIN LOBBY AIRLOCK & FINAL ESCAPE ──────────────────────────
    case 'ch12:plug_bypass': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 12 || p.ch12BypassPlugged) return;
      if (room.equipped.P1_SECURITY !== 'master_bypass_rig') return;
      p.ch12BypassPlugged = true;
      setBanner(room, 'Master Bypass Rig plugged in! Enter the 6-digit building cipher (489512).');
      break;
    }

    case 'ch12:submit_cipher': {
      if (role !== 'P1_SECURITY' || room.currentChapter !== 12 || !p.ch12BypassPlugged || p.ch12MasterCipherOpen) return;
      const code = String(action.payload?.code || '').trim();
      if (code === '489512') {
        p.ch12MasterCipherOpen = true;
        setBanner(room, 'Cipher accepted! Turn both Art Deco Wheels (Left 240° · Right 060°) & hold Crash Bars!');
      }
      break;
    }

    case 'ch12:rotate_wheel': {
      if (room.currentChapter !== 12 || !p.ch12MasterCipherOpen) return;
      const deg = Number(action.payload?.angle);
      if (!Number.isFinite(deg)) return;
      const snapped = ((Math.round(deg / 15) * 15) % 360 + 360) % 360;
      if (role === 'P1_SECURITY') {
        p.ch12WheelLeft = snapped;
      } else {
        p.ch12WheelRight = snapped;
      }
      if (p.ch12WheelLeft === 240 && p.ch12WheelRight === 60) {
        setBanner(room, 'Both Art Deco Wheels locked! Hold both Crash Bars simultaneously for 2.8s!');
      }
      break;
    }

    case 'latch:hold': {
      if (room.status !== 'PLAYING' || room.currentChapter !== 12) return;
      if (!p.ch12MasterCipherOpen || p.ch12WheelLeft !== 240 || p.ch12WheelRight !== 60) return;
      const holding = Boolean(action.payload?.holding);
      playerSlot.holdingLatch = holding;
      playerSlot.holdingSince = holding ? Date.now() : null;
      if (!holding) {
        p.ch12DualHoldProgress = 0;
      }
      break;
    }

    // ── CLUES, HINTS & RADIO CHAT ──────────────────────────────────────────────
    case 'clue:add': {
      const title = String(action.payload?.title || '').trim().slice(0, 80);
      const detail = String(action.payload?.detail || '').trim().slice(0, 280);
      if (!title || !detail) return;
      const id = String(action.payload?.id || `clue-${generateId()}`);
      addClueUnique(room, {
        id,
        title,
        detail,
        authorRole: role,
        chapter: room.currentChapter
      });
      break;
    }

    case 'hint:unlock': {
      if (room.status !== 'PLAYING') return;
      const hintDef = getActiveHintForRoom(room);
      const currentTier = room.unlockedHints[hintDef.key] || 0;
      if (currentTier >= 3) return;
      const nextTier = currentTier + 1;
      room.unlockedHints[hintDef.key] = nextTier;
      room.hintsUsed += 1;
      addClueUnique(room, {
        id: `hint-${hintDef.key}-t${nextTier}`,
        title: `Hint · ${hintDef.title} (Tier ${nextTier}/3)`,
        detail: hintDef.tiers[nextTier - 1],
        authorRole: 'SYSTEM',
        chapter: room.currentChapter
      });
      break;
    }

    case 'chat:send': {
      const text = String(action.payload?.text || '').trim().slice(0, 280);
      if (!text) return;
      room.chat.push({
        id: generateId(),
        senderName: playerSlot.name,
        senderRole: role,
        text,
        timestamp: Date.now()
      });
      if (room.chat.length > 100) {
        room.chat = room.chat.slice(-100);
      }
      break;
    }
  }

  persistRoomsSoon();
  broadcastRoom(room);
}

async function startServer() {
  loadRoomsFromDisk();

  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  app.post('/api/rooms', (req, res) => {
    const name = String(req.body?.name || '').trim().slice(0, 24) || 'Player 1';
    const preferredRole: PlayerRole =
      req.body?.role === 'P2_STUDY' ? 'P2_STUDY' : 'P1_SECURITY';
    const { room, playerId } = createRoom(name, preferredRole);
    res.json({ code: room.code, playerId, role: preferredRole, room });
  });

  app.post('/api/rooms/:code/join', (req, res) => {
    const code = String(req.params.code || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Room not found. Check the 6-character code.' });
      return;
    }

    const existingPlayerId = String(req.body?.playerId || '').trim();
    if (existingPlayerId) {
      const found = findPlayerInRoom(room, existingPlayerId);
      if (found) {
        res.json({ code: room.code, playerId: existingPlayerId, role: found.role, room });
        return;
      }
    }

    const name = String(req.body?.name || '').trim().slice(0, 24) || 'Player 2';
    let assignedRole: PlayerRole | null = null;
    if (!room.players.P2_STUDY) {
      assignedRole = 'P2_STUDY';
    } else if (!room.players.P1_SECURITY) {
      assignedRole = 'P1_SECURITY';
    } else {
      res.status(409).json({ error: 'This room already has two players.' });
      return;
    }

    const playerId = generateId();
    room.players[assignedRole] = {
      playerId,
      name,
      role: assignedRole,
      connected: false,
      holdingLatch: false,
      holdingSince: null
    };
    persistRoomsSoon();
    broadcastRoom(room);
    res.json({ code: room.code, playerId, role: assignedRole, room });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const code = String(req.params.code || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Room not found.' });
      return;
    }
    res.json({ room });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const code = String(url.searchParams.get('room') || '').trim().toUpperCase();
    const playerId = String(url.searchParams.get('playerId') || '').trim();

    const room = rooms.get(code);
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room expired or not found.' }));
      ws.close();
      return;
    }

    const found = findPlayerInRoom(room, playerId);
    if (!found) {
      ws.send(JSON.stringify({ type: 'error', message: 'Session not recognized in this room.' }));
      ws.close();
      return;
    }

    found.slot.connected = true;
    if (!roomSockets.has(code)) {
      roomSockets.set(code, new Map());
    }
    roomSockets.get(code)!.set(ws, { playerId, role: found.role });

    ws.send(JSON.stringify({ type: 'session:ready', role: found.role, room }));
    broadcastRoom(room);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        const meta = roomSockets.get(code)?.get(ws);
        if (!meta) return;
        handleAction(room, meta.role, msg);
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    });

    ws.on('close', () => {
      const map = roomSockets.get(code);
      const meta = map?.get(ws);
      map?.delete(ws);
      if (meta) {
        const stillConnected = Array.from(map?.values() || []).some((m) => m.playerId === meta.playerId);
        if (!stillConnected) {
          const slot = findPlayerInRoom(room, meta.playerId)?.slot;
          if (slot) {
            slot.connected = false;
            slot.holdingLatch = false;
            slot.holdingSince = null;
            room.puzzle.ch12DualHoldProgress = 0;
            broadcastRoom(room);
          }
        }
      }
    });
  });

  // 1-second untimed speedrun clock
  setInterval(() => {
    let anyChanged = false;
    for (const room of rooms.values()) {
      if (room.status === 'PLAYING') {
        room.elapsedSeconds += 1;
        broadcastRoom(room);
        anyChanged = true;
      }
    }
    if (anyChanged) persistRoomsSoon();
  }, 1000);

  // 150ms fast dual-hold synchronization tick for Chapter 12 finale
  setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (room.status !== 'PLAYING' || room.currentChapter !== 12) continue;
      const p = room.puzzle;
      if (!p.ch12MasterCipherOpen || p.ch12WheelLeft !== 240 || p.ch12WheelRight !== 60) continue;
      const p1 = room.players.P1_SECURITY;
      const p2 = room.players.P2_STUDY;
      if (p1?.holdingLatch && p2?.holdingLatch && p1.holdingSince && p2.holdingSince) {
        const bothSince = Math.max(p1.holdingSince, p2.holdingSince);
        const progress = Math.min(1, (now - bothSince) / DUAL_HOLD_DURATION_MS);
        p.ch12DualHoldProgress = progress;
        if (progress >= 1) {
          p1.holdingLatch = false;
          p2.holdingLatch = false;
          completeCurrentChapter(room);
          persistRoomsSoon();
        }
        broadcastRoom(room);
      } else if (p.ch12DualHoldProgress !== 0) {
        p.ch12DualHoldProgress = 0;
        broadcastRoom(room);
      }
    }
  }, 150);

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`The Room Next Door running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
