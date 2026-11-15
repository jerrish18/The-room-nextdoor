import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {
  ClueItem,
  PlayerRole,
  RoomPuzzleState,
  RoomState,
  WireColor,
  getActiveStage,
  PROGRESSIVE_HINTS
} from './src/shared/gameTypes.js';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'rooms.json');

const DUAL_HOLD_DURATION_MS = 2500;
const INITIAL_BATTERY_SECONDS = 30 * 60; // 30 minutes
const AUX_BATTERY_SECONDS = 10 * 60; // 10 minutes auxiliary cell

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

function createInitialPuzzleState(): RoomPuzzleState {
  return {
    studyLightsOn: true,
    muralInspected: false,
    deskDrawerOpen: false,
    puzzle1Solved: false,
    fuseInserted: false,
    cctvChannel: 1,
    cctvNightVision: false,
    junctionSwitches: [false, true, false, false],
    wireOrder: ['AMBER', 'TEAL', 'CRIMSON'],
    puzzle2Solved: false,
    dvrMinute: 45,
    calendarTilted: false,
    wallSafeOpen: false,
    keycardLocation: 'SAFE',
    puzzle3Solved: false,
    dvrOffsetFixed: false,
    dualHoldProgress: 0
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
    remainingSeconds: INITIAL_BATTERY_SECONDS,
    elapsedSeconds: 0,
    auxiliaryUsed: false,
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
    puzzle: createInitialPuzzleState(),
    inventory: [],
    clues: [
      {
        id: 'clue-intro',
        title: 'Monsoon Blackout · 21:40 IST',
        detail:
          'Security Booth CAM 01 shows the 4th-floor hallway outside Flat 4B with a timestamp 5 minutes ahead (21:45). Backup battery at 30:00.',
        authorRole: 'SYSTEM',
        createdAt: now
      }
    ],
    chat: [
      {
        id: 'chat-welcome',
        senderName: 'Building Intercom',
        senderRole: 'SYSTEM',
        text: 'Emergency backup active. Both rooms locked on Floor 4. Coordinate over radio to release the magnetic corridor locks.',
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
          dualHoldProgress: 0
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
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const r of parsed) {
      if (r.createdAt >= cutoff) {
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

function setBanner(room: RoomState, text: string, targetRole?: PlayerRole) {
  room.lastEventBanner = {
    id: generateId(),
    text,
    targetRole
  };
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

function findPlayerInRoom(room: RoomState, playerId: string): PlayerSlotInfo | null {
  if (room.players.P1_SECURITY?.playerId === playerId) return { role: 'P1_SECURITY', slot: room.players.P1_SECURITY };
  if (room.players.P2_STUDY?.playerId === playerId) return { role: 'P2_STUDY', slot: room.players.P2_STUDY };
  return null;
}

interface PlayerSlotInfo {
  role: PlayerRole;
  slot: NonNullable<RoomState['players']['P1_SECURITY']>;
}

function handleAction(room: RoomState, role: PlayerRole, action: { type: string; payload?: Record<string, unknown> }) {
  const p = room.puzzle;
  const playerSlot = room.players[role];
  if (!playerSlot) return;

  switch (action.type) {
    case 'lobby:swap_roles': {
      if (room.status !== 'LOBBY') return;
      const p1 = room.players.P1_SECURITY;
      const p2 = room.players.P2_STUDY;
      room.players.P1_SECURITY = p2 ? { ...p2, role: 'P1_SECURITY' } : null;
      room.players.P2_STUDY = p1 ? { ...p1, role: 'P2_STUDY' } : null;

      // Update attached websocket metadata
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
      setBanner(room, 'Blackout backup engaged. Explore your room and coordinate!');
      break;
    }

    case 'game:reset': {
      room.status = 'PLAYING';
      room.startedAt = Date.now();
      room.escapedAt = null;
      room.remainingSeconds = INITIAL_BATTERY_SECONDS;
      room.elapsedSeconds = 0;
      room.auxiliaryUsed = false;
      room.hintsUsed = 0;
      room.unlockedHints = {};
      room.puzzle = createInitialPuzzleState();
      room.inventory = [];
      room.clues = [
        {
          id: 'clue-intro',
          title: 'Monsoon Blackout · 21:40 IST',
          detail:
            'Security Booth CAM 01 shows the 4th-floor hallway outside Flat 4B with a timestamp 5 minutes ahead (21:45). Backup battery at 30:00.',
          authorRole: 'SYSTEM',
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
      setBanner(room, 'Case reset. Backup battery restored to 30:00.');
      break;
    }

    case 'timer:continue_aux': {
      if (room.status !== 'OUT_OF_POWER') return;
      room.auxiliaryUsed = true;
      room.remainingSeconds = AUX_BATTERY_SECONDS;
      room.status = 'PLAYING';
      setBanner(room, 'Auxiliary battery cell engaged (+10:00).');
      break;
    }

    case 'breaker:toggle_study_lights': {
      if (role !== 'P1_SECURITY' || room.status !== 'PLAYING') return;
      p.studyLightsOn = !p.studyLightsOn;
      setBanner(
        room,
        p.studyLightsOn ? 'Security restored Flat 4B ceiling light.' : 'Security cut Flat 4B ceiling light — check the plaster wall!',
        'P2_STUDY'
      );
      break;
    }

    case 'mural:inspect': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING') return;
      if (!p.studyLightsOn) {
        p.muralInspected = true;
      }
      break;
    }

    case 'drawer:submit_code': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING' || p.deskDrawerOpen) return;
      const code = String(action.payload?.code || '').trim();
      if (code === '4816') {
        p.deskDrawerOpen = true;
        p.puzzle1Solved = true;
        if (!room.inventory.some((i) => i.id === 'fuse_15a')) {
          room.inventory.push(
            {
              id: 'fuse_15a',
              name: '15A Reserve Fuse',
              description: 'Brass-capped ceramic cartridge fuse for Flat 4B’s wall junction box.',
              holder: 'P2_STUDY'
            },
            {
              id: 'blindspot_photo',
              name: 'Corridor Mirror Polaroid',
              description: 'Note on back: "Check CAM 02 mirror reflection & CAM 03 in IR Night Vision once Junction Relay powers up."',
              holder: 'SHARED'
            }
          );
        }
        addClueUnique(room, {
          id: 'clue-drawer-solved',
          title: 'Brass Desk Drawer Unlocked (4816)',
          detail: 'Found 15A Reserve Fuse and a Polaroid mentioning CAM 02’s hallway mirror and CAM 03 IR mode.',
          authorRole: 'P2_STUDY'
        });
        setBanner(room, 'Flat 4B Desk Drawer opened! Found 15A Reserve Fuse.');
      }
      break;
    }

    case 'junction:insert_fuse': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING') return;
      if (!p.deskDrawerOpen || p.fuseInserted) return;
      p.fuseInserted = true;
      setBanner(room, '15A Fuse inserted! CAM 02, CAM 03 & CAM 04 are now online.', 'P1_SECURITY');
      break;
    }

    case 'cctv:select_channel': {
      if (role !== 'P1_SECURITY' || room.status !== 'PLAYING') return;
      const ch = Number(action.payload?.channel);
      if (ch === 1 || ch === 2 || ch === 3 || ch === 4) {
        p.cctvChannel = ch;
      }
      break;
    }

    case 'cctv:toggle_ir': {
      if (role !== 'P1_SECURITY' || room.status !== 'PLAYING') return;
      p.cctvNightVision = !p.cctvNightVision;
      break;
    }

    case 'junction:toggle_switch': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING' || p.puzzle2Solved || !p.fuseInserted) return;
      const idx = Number(action.payload?.index);
      if (idx >= 0 && idx <= 3) {
        p.junctionSwitches[idx] = !p.junctionSwitches[idx];
      }
      break;
    }

    case 'junction:swap_wires': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING' || p.puzzle2Solved || !p.fuseInserted) return;
      const a = Number(action.payload?.indexA);
      const b = Number(action.payload?.indexB);
      if (a >= 0 && a <= 2 && b >= 0 && b <= 2 && a !== b) {
        const next: [WireColor, WireColor, WireColor] = [...p.wireOrder] as [WireColor, WireColor, WireColor];
        const tmp = next[a];
        next[a] = next[b];
        next[b] = tmp;
        p.wireOrder = next;
      }
      break;
    }

    case 'junction:engage': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING' || p.puzzle2Solved || !p.fuseInserted) return;
      const switchesMatch =
        p.junctionSwitches[0] === true &&
        p.junctionSwitches[1] === false &&
        p.junctionSwitches[2] === true &&
        p.junctionSwitches[3] === true;
      const wiresMatch =
        p.wireOrder[0] === 'TEAL' &&
        p.wireOrder[1] === 'AMBER' &&
        p.wireOrder[2] === 'CRIMSON';
      if (switchesMatch && wiresMatch) {
        p.puzzle2Solved = true;
        addClueUnique(room, {
          id: 'clue-junction-solved',
          title: '240V Conduit Relay Balanced',
          detail: 'Power restored to Flat 4B’s hidden wall safe and Security Booth’s CAM 01 DVR replay scrubber.',
          authorRole: 'P2_STUDY'
        });
        setBanner(room, 'Relay engaged! CAM 01 DVR replay unlocked & a latch clicked behind Flat 4B’s calendar.');
      }
      break;
    }

    case 'cctv:scrub_dvr': {
      if (role !== 'P1_SECURITY' || room.status !== 'PLAYING' || !p.puzzle2Solved) return;
      const min = Number(action.payload?.minute);
      if (min === 41 || min === 42 || min === 43 || min === 44 || min === 45) {
        p.dvrMinute = min;
      }
      break;
    }

    case 'calendar:tilt': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING') return;
      p.calendarTilted = true;
      break;
    }

    case 'safe:submit_code': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING' || !p.puzzle2Solved || p.wallSafeOpen) return;
      const code = String(action.payload?.code || '').trim();
      if (code === '9527') {
        p.wallSafeOpen = true;
        p.puzzle3Solved = true;
        if (!room.inventory.some((i) => i.id === 'override_keycard')) {
          room.inventory.push(
            {
              id: 'override_keycard',
              name: 'Security Override Keycard',
              description: 'Magnetic supervisor card. Must be slid through the inter-room Air Vent Slot to the Security Booth.',
              holder: 'P2_STUDY'
            },
            {
              id: 'ntp_memo',
              name: 'Supervisor NTP Memo',
              description: '"Set DVR clock +05:00 ahead to loop empty 21:40 corridor while clearing 4B. Reset clock & hold both latches to exit."',
              holder: 'SHARED'
            }
          );
        }
        addClueUnique(room, {
          id: 'clue-safe-solved',
          title: 'Wall Safe Opened (9527)',
          detail: 'Retrieved Security Override Keycard and NTP Memo explaining the +05:00 loop. Slide the Keycard through the Air Vent Slot!',
          authorRole: 'P2_STUDY'
        });
        setBanner(room, 'Wall Safe unlocked! Slide the Override Keycard through the Air Vent Slot.');
      }
      break;
    }

    case 'vent:pass_keycard': {
      if (role !== 'P2_STUDY' || room.status !== 'PLAYING') return;
      if (!p.wallSafeOpen || p.keycardLocation !== 'SAFE') return;
      p.keycardLocation = 'SECURITY_DESK';
      room.inventory = room.inventory.map((item) =>
        item.id === 'override_keycard' ? { ...item, holder: 'P1_SECURITY' } : item
      );
      setBanner(room, 'Keycard clattered through the Air Vent onto your Security Desk!', 'P1_SECURITY');
      break;
    }

    case 'override:insert_keycard': {
      if (role !== 'P1_SECURITY' || room.status !== 'PLAYING') return;
      if (p.keycardLocation !== 'SECURITY_DESK') return;
      p.keycardLocation = 'INSERTED';
      setBanner(room, 'Override Keycard inserted! Now reset the +05:00 DVR clock offset to LIVE.');
      break;
    }

    case 'override:reset_clock': {
      if (role !== 'P1_SECURITY' || room.status !== 'PLAYING') return;
      if (p.keycardLocation !== 'INSERTED' || p.dvrOffsetFixed) return;
      p.dvrOffsetFixed = true;
      addClueUnique(room, {
        id: 'clue-clock-live',
        title: 'DVR Clock Restored to LIVE (21:40)',
        detail: 'False loop cleared. Both Corridor Maglocks are ARMED — hold both door latches simultaneously for 2.5s!',
        authorRole: 'P1_SECURITY'
      });
      setBanner(room, 'Maglocks ARMED! Both players hold your Exit Door Latch together!');
      break;
    }

    case 'latch:hold': {
      if (room.status !== 'PLAYING' || !p.dvrOffsetFixed) return;
      const holding = Boolean(action.payload?.holding);
      playerSlot.holdingLatch = holding;
      playerSlot.holdingSince = holding ? Date.now() : null;
      if (!holding) {
        p.dualHoldProgress = 0;
      }
      break;
    }

    case 'clue:add': {
      const title = String(action.payload?.title || '').trim().slice(0, 80);
      const detail = String(action.payload?.detail || '').trim().slice(0, 260);
      if (!title || !detail) return;
      const id = String(action.payload?.id || `clue-${generateId()}`);
      addClueUnique(room, {
        id,
        title,
        detail,
        authorRole: role
      });
      break;
    }

    case 'hint:unlock': {
      if (room.status !== 'PLAYING') return;
      const stage = getActiveStage(p);
      const currentTier = room.unlockedHints[stage] || 0;
      if (currentTier >= 3) return;
      const nextTier = currentTier + 1;
      room.unlockedHints[stage] = nextTier;
      room.hintsUsed += 1;
      const hintDef = PROGRESSIVE_HINTS.find((h) => h.stage === stage);
      if (hintDef) {
        addClueUnique(room, {
          id: `hint-s${stage}-t${nextTier}`,
          title: `Hint · ${hintDef.title} (Tier ${nextTier}/3)`,
          detail: hintDef.tiers[nextTier - 1],
          authorRole: 'SYSTEM'
        });
      }
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
      if (room.chat.length > 80) {
        room.chat = room.chat.slice(-80);
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
            room.puzzle.dualHoldProgress = 0;
            broadcastRoom(room);
          }
        }
      }
    });
  });

  // 1-second authoritative battery countdown & elapsed timer
  setInterval(() => {
    let anyChanged = false;
    for (const room of rooms.values()) {
      if (room.status === 'PLAYING') {
        room.elapsedSeconds += 1;
        if (room.remainingSeconds > 0) {
          room.remainingSeconds -= 1;
        }
        if (room.remainingSeconds <= 0) {
          room.status = 'OUT_OF_POWER';
          if (room.players.P1_SECURITY) {
            room.players.P1_SECURITY.holdingLatch = false;
            room.players.P1_SECURITY.holdingSince = null;
          }
          if (room.players.P2_STUDY) {
            room.players.P2_STUDY.holdingLatch = false;
            room.players.P2_STUDY.holdingSince = null;
          }
          room.puzzle.dualHoldProgress = 0;
          setBanner(room, 'Backup power depleted! Switch to Auxiliary Cell to keep playing.');
        }
        broadcastRoom(room);
        anyChanged = true;
      }
    }
    if (anyChanged) persistRoomsSoon();
  }, 1000);

  // 150ms fast dual-hold synchronization tick
  setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (room.status !== 'PLAYING' || !room.puzzle.dvrOffsetFixed) continue;
      const p1 = room.players.P1_SECURITY;
      const p2 = room.players.P2_STUDY;
      if (p1?.holdingLatch && p2?.holdingLatch && p1.holdingSince && p2.holdingSince) {
        const bothSince = Math.max(p1.holdingSince, p2.holdingSince);
        const progress = Math.min(1, (now - bothSince) / DUAL_HOLD_DURATION_MS);
        room.puzzle.dualHoldProgress = progress;
        if (progress >= 1) {
          room.status = 'ESCAPED';
          room.escapedAt = now;
          p1.holdingLatch = false;
          p2.holdingLatch = false;
          setBanner(room, 'Both magnetic corridor doors unlocked!');
          persistRoomsSoon();
        }
        broadcastRoom(room);
      } else if (room.puzzle.dualHoldProgress !== 0) {
        room.puzzle.dualHoldProgress = 0;
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
