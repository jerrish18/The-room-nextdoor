export type PlayerRole = 'P1_SECURITY' | 'P2_STUDY';

export type GameStatus = 'LOBBY' | 'PLAYING' | 'CHAPTER_TRANSITION' | 'ESCAPED';

export type WireColor = 'AMBER' | 'TEAL' | 'CRIMSON';

export type SafelightColor = 'WHITE' | 'RED' | 'AMBER' | 'UV';

export type ChapterNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

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
  chapter: number;
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
  id: string;
  name: string;
  description: string;
  inspectNote: string;
  holder: PlayerRole | 'SHARED';
  category: 'TOOL' | 'KEY' | 'DOCUMENT' | 'PART';
  combinable?: boolean;
  consumed?: boolean;
}

export interface CombineRecipe {
  itemA: string;
  itemB: string;
  result: Omit<InventoryItem, 'holder'>;
  bannerText: string;
}

export const COMBINE_RECIPES: CombineRecipe[] = [
  {
    itemA: 'screwdriver_handle',
    itemB: 'flathead_bit',
    result: {
      id: 'brass_screwdriver',
      name: 'Brass Flathead Screwdriver',
      description: 'Assembled insulated electrician screwdriver. Equip to unscrew bolted junction panels.',
      inspectNote: 'Insulated Bakelite grip locked onto a 6mm brass flathead shaft. Fits 4B junction cover screws.',
      category: 'TOOL'
    },
    bannerText: 'Assembled Brass Flathead Screwdriver! Equip it to unscrew the Junction Box plate.'
  },
  {
    itemA: 'torch_housing',
    itemB: 'uv_bulb',
    result: {
      id: 'uv_torch',
      name: 'UV Blacklight Torch',
      description: '365nm ultraviolet inspection torch. Equip to sweep dark surfaces for invisible ink.',
      inspectNote: 'Emits 365nm UV beam. Reveals hidden audit ink, oil notes, and storm-wall markings.',
      category: 'TOOL'
    },
    bannerText: 'Crafted working UV Blacklight Torch! Equip it to inspect darkened walls.'
  },
  {
    itemA: 'rusty_veranda_key',
    itemB: 'machine_oil',
    result: {
      id: 'oiled_veranda_key',
      name: 'Oiled Brass Veranda Key',
      description: 'Cleaned and lubricated brass key for Caretaker Sundaram’s veranda tool chest.',
      inspectNote: 'Stamped "VERANDA TOOL CHEST · 4B". Smooth brass teeth free of monsoon corrosion.',
      category: 'KEY'
    },
    bannerText: 'Oiled the Veranda Key! It will now turn smoothly inside the veranda chest lock.'
  },
  {
    itemA: 'ledger_frag_a',
    itemB: 'ledger_frag_b',
    result: {
      id: 'reassembled_invoice',
      name: 'Reassembled Audit Invoice',
      description: 'Taped contractor invoice showing Marina Towers generator billing discrepancy.',
      inspectNote: 'STAMPED CRYPTEX LETTERS: M - Y - L - 4. Contractor: Kaveri Backup Systems (Fake).',
      category: 'DOCUMENT'
    },
    bannerText: 'Reassembled the Audit Invoice! Inspect it closely for the Cryptex seal.'
  },
  {
    itemA: 'neodymium_magnet',
    itemB: 'nylon_cord',
    result: {
      id: 'magnetic_line',
      name: 'Magnetic Retrieval Line',
      description: 'Weighted magnet tied to 6m nylon survey cord. Equip to fish items through flooded grates.',
      inspectNote: 'Knotted bowline loop rated for 8kg pull. Ideal for recovering dropped keys underwater.',
      category: 'TOOL'
    },
    bannerText: 'Tied Magnetic Retrieval Line! Lower it down the flooded cistern grate.'
  },
  {
    itemA: 'ntp_override_token',
    itemB: 'copper_shunt',
    result: {
      id: 'master_bypass_rig',
      name: 'Master Lobby Bypass Rig',
      description: 'Hardware-bridged NTP security dongle for Marina Towers’ main Art Deco airlock.',
      inspectNote: 'Combines the Sub-Basement NTP Token with the Rooftop Copper Shunt for full lobby override.',
      category: 'TOOL'
    },
    bannerText: 'Built Master Lobby Bypass Rig! Plug it into the Lobby Airlock Console.'
  }
];

export interface ChapterPuzzleState {
  // Chapter 1: Floor 4 Blackout
  ch1LightsOn: boolean;
  ch1MuralScanned: boolean;
  ch1BlotterSlid: boolean;
  ch1DrawerOpen: boolean;
  ch1ScrewsRemoved: [boolean, boolean, boolean, boolean];
  ch1FuseInserted: boolean;
  ch1CctvChannel: 1 | 2 | 3 | 4;
  ch1CctvIR: boolean;
  ch1Switches: [boolean, boolean, boolean, boolean];
  ch1Wires: [WireColor, WireColor, WireColor];
  ch1Solved: boolean;

  // Chapter 2: Locked Corridor & Reception
  ch2ChuteSlid: boolean;
  ch2UvFoundNotice: boolean;
  ch2UvFoundFrame: boolean;
  ch2PadlockOpen: boolean;
  ch2DvrMinute: 41 | 42 | 43 | 44 | 45;
  ch2KeyPassed: boolean;
  ch2CorridorGateOpen: boolean;

  // Chapter 3: Service Lift Shaft
  ch3WeightsOnTray: number[]; // e.g. [200, 150, 100, 50, 20] -> sum 520
  ch3BrakeReleased: boolean;
  ch3TrapScrews: [boolean, boolean, boolean];
  ch3LoomOrder: string[]; // target ['GOLD', 'RED', 'GREEN', 'BLUE']
  ch3MorseAcked: boolean;

  // Chapter 4: Mezzanine Meter Vault
  ch4Valves: [number, number, number]; // PSI targets [45, 70, 30]
  ch4UvOilScanned: boolean;
  ch4OscFreq: number; // target 60
  ch4OscPhase: number; // target 120
  ch4OscLocked: boolean;
  ch4KnifeOrder: string[]; // target ['L2', 'L1', 'L3']

  // Chapter 5: Caretaker Sundaram's Quarters
  ch5SlidingTiles: number[]; // 0..8 where 0 is blank, target [1,2,3,4,5,6,7,8,0]
  ch5SlidingSolved: boolean;
  ch5RadioFreq: number; // 880..1080 (tenths of MHz), target 1044
  ch5RadioLocked: boolean;
  ch5KeyPassed: boolean;
  ch5ChestUnlocked: boolean;

  // Chapter 6: Monsoon Roof Relay
  ch6PipeRotations: number[]; // 16 tiles (4x4 grid), rotations 0..3
  ch6PipesDrained: boolean;
  ch6UvBearingFound: boolean;
  ch6DishAzimuth: number; // 0..355 step 5, target 215
  ch6ShuntSeated: boolean;

  // Chapter 7: Dispensary Darkroom
  ch7Safelight: SafelightColor;
  ch7Chemicals: { dev: number; stop: number; fix: number }; // target 40, 25, 60
  ch7FilmDeveloped: boolean;
  ch7FilmLoupeRead: boolean;
  ch7ApothecaryOpen: boolean;

  // Chapter 8: Accounting Archives
  ch8ScrapsAligned: [boolean, boolean, boolean, boolean];
  ch8MicroficheScroll: number; // 0..100, target 65
  ch8MicroficheAligned: boolean;
  ch8CryptexLetters: [string, string, string, string]; // target ['M','Y','L','4']
  ch8DumbwaiterOpen: boolean;

  // Chapter 9: Basement Diesel Bay
  ch9GearSlots: (number | null)[]; // 4 slots, target [12, 24, 16, 32]
  ch9FuelPressure: number; // 0..100, target 65..80
  ch9Primed: boolean;
  ch9LoadBreakers: [boolean, boolean, boolean, boolean]; // target [true, false, true, false]
  ch9GeneratorRunning: boolean;

  // Chapter 10: Flooded Sub-Cistern
  ch10ReelDepth: number; // 0..50 (decimeters), target 45 (4.5m)
  ch10KeyFished: boolean;
  ch10SluiceWheelA: number; // 0..330 step 30, target 135 (or 150 -> let's use step 15: 135)
  ch10SluiceWheelB: number; // 0..345 step 15, target 270
  ch10CisternDrained: boolean;

  // Chapter 11: Sub-Basement NTP Vault
  ch11FiberPairs: Record<string, string>; // P1->B, P2->D, P3->A, P4->C
  ch11FiberSolved: boolean;
  ch11NtpOffset: { h: number; m: number; s: number }; // target 0, 0, 0
  ch11NtpSynced: boolean;
  ch11LockPins: [boolean, boolean, boolean]; // 3 tumbler pins set

  // Chapter 12: Main Lobby Airlock
  ch12BypassPlugged: boolean;
  ch12MasterCipherOpen: boolean;
  ch12WheelLeft: number; // target 240
  ch12WheelRight: number; // target 60
  ch12DualHoldProgress: number; // 0..1
}

export interface RoomState {
  code: string;
  status: GameStatus;
  createdAt: number;
  startedAt: number | null;
  escapedAt: number | null;
  currentChapter: ChapterNumber;
  completedChapters: number[];
  chapterSplits: Record<number, number>;
  chapterStartedElapsed: number;
  elapsedSeconds: number;
  hintsUsed: number;
  unlockedHints: Record<string, number>; // `${chapter}-${stage}` -> tier 1..3
  players: {
    P1_SECURITY: PlayerSlot | null;
    P2_STUDY: PlayerSlot | null;
  };
  equipped: {
    P1_SECURITY: string | null;
    P2_STUDY: string | null;
  };
  puzzle: ChapterPuzzleState;
  inventory: InventoryItem[];
  clues: ClueItem[];
  chat: ChatMessage[];
  lastEventBanner: { id: string; text: string; targetRole?: PlayerRole } | null;
}

export interface ChapterMeta {
  chapter: ChapterNumber;
  title: string;
  subtitle: string;
  p1RoomName: string;
  p2RoomName: string;
  p1Summary: string;
  p2Summary: string;
  briefing: string;
  completionStory: string;
}

export const CHAPTER_CATALOG: ChapterMeta[] = [
  {
    chapter: 1,
    title: 'Blackout on Floor 4',
    subtitle: 'Chapter 01 · Security Booth & Flat 4B',
    p1RoomName: 'Security & Power Booth',
    p2RoomName: 'Flat 4B Study',
    p1Summary: 'Master breaker, maintenance chart & CCTV',
    p2Summary: 'Glow plaster wall, brass desk & junction box',
    briefing: 'The 21:40 monsoon blackout locked both doors on Floor 4. Cut Flat 4B’s ceiling circuit, assemble a screwdriver, and restore the 240V relay.',
    completionStory: 'With the 240V relay balanced, the crawlspace hatch clicks open into the locked 4th-floor corridor.'
  },
  {
    chapter: 2,
    title: 'The Locked Corridor',
    subtitle: 'Chapter 02 · Reception Kiosk & 4F Hallway',
    p1RoomName: 'Reception Kiosk',
    p2RoomName: 'East Corridor 4F',
    p1Summary: '3-ring keybox, DVR timestamp log & mail chute',
    p2Summary: 'Jammed mail chute, UV parts & hallway gate',
    briefing: 'Assemble the UV Blacklight Torch from parts in the mail chute, sweep the dark corridor for invisible audit ink, and unlock the Service Lift.',
    completionStory: 'The elevator lobby gate slides free—leading both of you toward the stalled freight lift shaft.'
  },
  {
    chapter: 3,
    title: 'Service Lift Shaft',
    subtitle: 'Chapter 03 · Stalled Lift Car & 5F Machine Room',
    p1RoomName: 'Stalled Lift Car',
    p2RoomName: '5F Lift Machine Room',
    p1Summary: 'Cab weight placard, Morse buzzer & ceiling loom',
    p2Summary: 'Counterweight scale, brake lever & shaft chart',
    briefing: 'Balance the 520 kg counterweight pan, release the tension brake, and splice the four ceiling terminal lugs to drop the lift car down to Mezzanine.',
    completionStory: 'Steel cables groan as the lift brakes release cleanly, dropping you into the humming Mezzanine Meter Vault.'
  },
  {
    chapter: 4,
    title: 'Mezzanine Meter Vault',
    subtitle: 'Chapter 04 · Oscilloscope Bay & Transformer Closet',
    p1RoomName: 'Oscilloscope Bay',
    p2RoomName: 'Transformer Closet',
    p1Summary: 'CRT Hz/Phase rotary tuners & knife switch L2/L1/L3',
    p2Summary: 'UV oil schematic, 3 coolant valves & 3-phase rack',
    briefing: 'Sweep UV light across oil-stained pipework to dial the three coolant valves, then tune the CRT oscilloscope to match the live phase wave.',
    completionStory: 'Voltage steadies across the mezzanine bus, releasing the stairwell maglock down to Caretaker Sundaram’s quarters.'
  },
  {
    chapter: 5,
    title: 'Caretaker’s Quarters',
    subtitle: 'Chapter 05 · Sundaram’s Desk & Monsoon Veranda',
    p1RoomName: 'Broadcast Study Desk',
    p2RoomName: 'Shuttered Veranda',
    p1Summary: 'Vintage radio tuner, rusted key & shutter slot',
    p2Summary: '3×3 sliding teak box, machine oil & tool chest',
    briefing: 'Solve the sliding teak puzzle box for machine oil, tune the antique radio to 104.4 MHz for the monsoon code, and oil the rusted veranda key.',
    completionStory: 'Inside Sundaram’s tool chest lies the heavy steel roof-hatch crank—and proof someone paid him to stay quiet.'
  },
  {
    chapter: 6,
    title: 'Monsoon Roof Relay',
    subtitle: 'Chapter 06 · East Parapet & Water Tank Shed',
    p1RoomName: 'Parapet Relay Dish',
    p2RoomName: 'Water Tank Manifold',
    p1Summary: '360° dish azimuth wheel & repeater monitor',
    p2Summary: '4×4 brass pipe drain grid, UV wall & copper shunt',
    briefing: 'Rotate the rooftop brass pipes to drain the flooded junction pit, spot the UV storm bearing (215°), and aim the dish through the gale.',
    completionStory: 'The rooftop shunt restores power to the ground-floor dispensary darkroom where surveillance film was hidden.'
  },
  {
    chapter: 7,
    title: 'Dispensary Darkroom',
    subtitle: 'Chapter 07 · Safelight Panel & Developing Sink',
    p1RoomName: 'Safelight & Locker Bay',
    p2RoomName: 'Chemical Darkroom Sink',
    p1Summary: 'Safelight filter bank & apothecary padlock',
    p2Summary: 'Chemical pour sliders & 35mm magnifier loupe',
    briefing: 'Switch safelights in sequence so your partner can pour exact chemical ratios without fogging the film, then inspect the negative with the loupe.',
    completionStory: 'Frame 14 reveals the supervisor slipping audit folders into the basement archives—and yields Microfiche Reel #04.'
  },
  {
    chapter: 8,
    title: 'Accounting Archives',
    subtitle: 'Chapter 08 · Microfiche Desk & Ledgers Room',
    p1RoomName: 'Microfiche Terminal',
    p2RoomName: 'Ledgers & Cryptex Desk',
    p1Summary: 'Reel #04 loader & rotary microfiche wheel',
    p2Summary: 'Torn invoice puzzle, 4-ring cryptex & dumbwaiter',
    briefing: 'Reassemble the torn contractor invoices, scroll the microfiche transparency wheel into alignment, and spin the brass cryptex to open the basement chute.',
    completionStory: 'The dumbwaiter shaft opens down to the diesel garage, exposing fake generator repair invoices.'
  },
  {
    chapter: 9,
    title: 'Basement Diesel Bay',
    subtitle: 'Chapter 09 · Load Console & Generator Pit',
    p1RoomName: 'Load Shedding Console',
    p2RoomName: 'Diesel Generator Pit',
    p1Summary: '4 load breakers & ignition interlock',
    p2Summary: '4 brass spur gears & draggable fuel primer',
    briefing: 'Snap all four spur gears onto the starter shaft by tooth ratio, pump the fuel primer into the green pressure band, and balance building load.',
    completionStory: 'The backup diesel engine roars to life, illuminating the flooded cistern catwalk beneath the garage.'
  },
  {
    chapter: 10,
    title: 'Flooded Sub-Cistern',
    subtitle: 'Chapter 10 · Sonar Console & Pump Catwalk',
    p1RoomName: 'Sonar & Sluice Panel A',
    p2RoomName: 'Flooded Cistern Catwalk',
    p1Summary: 'Live sonar depth feed & Spoked Wheel A',
    p2Summary: 'Magnetic retrieval reel & Spoked Wheel B',
    briefing: 'Combine Magnet + Nylon Cord, lower the depth reel to 4.5m to recover the dropped Vault Key, and rotate both spoked sluice wheels to drain the floor.',
    completionStory: 'As cistern water drops below the sub-basement threshold, the steel door to the NTP Server Vault is exposed.'
  },
  {
    chapter: 11,
    title: 'Sub-Basement NTP Vault',
    subtitle: 'Chapter 11 · Fiber Server Rack & Time-Lock Door',
    p1RoomName: 'Fiber Packet Terminal',
    p2RoomName: 'Time-Lock Vault Door',
    p1Summary: 'Packet trace map & concentric NTP drift rings',
    p2Summary: '4 fiber SFP patch cables & 3-pin tumbler lock',
    briefing: 'Repatch the four fiber optic cables to kill the DVR replay spoof, dial out the +05:00 time drift, and pick the three spring tumbler pins.',
    completionStory: 'Marina Towers’ clock snaps back to true live IST—leaving only the Grand Brass Lobby Airlock between you and the street.'
  },
  {
    chapter: 12,
    title: 'Main Lobby Airlock',
    subtitle: 'Chapter 12 · Turnstile Override & Grand Doors',
    p1RoomName: 'Lobby Turnstile Desk',
    p2RoomName: 'Main Brass Airlock Doors',
    p1Summary: 'Bypass rig dock, 6-digit cipher & Left Wheel (240°)',
    p2Summary: 'Evidence log, Right Wheel (060°) & Crash Bar',
    briefing: 'Assemble the Master Bypass Rig, enter the 6-digit building cipher, set both Art Deco wheels (240° / 060°), and hold the crash bars together.',
    completionStory: 'Both brass vault doors swing wide onto the rain-washed Chennai street. The +05:00 conspiracy is exposed.'
  }
];

export interface HintDefinition {
  key: string; // `${chapter}-${stage}`
  chapter: ChapterNumber;
  title: string;
  tiers: [string, string, string];
}

export const PROGRESSIVE_HINTS: HintDefinition[] = [
  // Chapter 1
  {
    key: '1-1',
    chapter: 1,
    title: 'Ch 01 · Darkness Mural & Desk Dial',
    tiers: [
      'Subtle: Security must cut Study 4B’s ceiling lights so the plaster wall glows, then check the Maintenance Chart.',
      'Clear: With lights OFF, P2 inspects the Glow Wall (Trident ↑, Crescent →, Lotus ←, Surge ↓). P1 adds each base value + arrow offset.',
      'Exact: Trident(4+0=4), Crescent(6+2=8), Lotus(3-2=1), Surge(2+4=6). Spin Brass Desk Dial to 4-8-1-6 and pull the drawer open.'
    ]
  },
  {
    key: '1-2',
    chapter: 1,
    title: 'Ch 01 · Screwdriver, Screws & Junction Relay',
    tiers: [
      'Subtle: Combine the two tool pieces from the drawer in your Bag, equip the Screwdriver, and unscrew all 4 bolts on the Junction Box.',
      'Clear: Insert the 15A Fuse so Security can read CAM 02’s mirrored note and CAM 03 with IR Night Vision ON.',
      'Exact: Combine Handle + Bit → Screwdriver, unscrew 4 bolts, insert 15A Fuse, set switches A↑ B↓ C↑ D↑ and wires TEAL · AMBER · CRIMSON.'
    ]
  },
  // Chapter 2
  {
    key: '2-1',
    chapter: 2,
    title: 'Ch 02 · UV Torch & Corridor Ink',
    tiers: [
      'Subtle: P2 should drag open the jammed mail chute, collect both parts, and combine them into a UV Blacklight Torch.',
      'Clear: Equip the UV Torch and sweep your beam across both the dark Noticeboard and Corridor Frame to uncover the 3-ring padlock digits.',
      'Exact: Combine Torch Housing + UV Bulb → UV Torch. Sweep Noticeboard + Door Frame to reveal 7-3-9 for P1’s Reception Padlock.'
    ]
  },
  {
    key: '2-2',
    chapter: 2,
    title: 'Ch 02 · DVR Log & Corridor Gate',
    tiers: [
      'Subtle: After P1 unlocks the Reception Keybox (7-3-9), pass the Service Key through the mail chute and scrub the DVR log.',
      'Clear: Scrub 21:41–21:45 on Reception DVR (Top-Left, Center, Bottom-Right, Top-Right) and map onto Flat 4B’s 9-5-2-7 keypad remap.',
      'Exact: P1 passes Service Lift Key through chute; P2 equips key + enters 9527 on the Corridor Gate.'
    ]
  },
  // Chapter 3
  {
    key: '3-1',
    chapter: 3,
    title: 'Ch 03 · Counterweight & Brake Lever',
    tiers: [
      'Subtle: P1 inspects the Lift Car load placard; P2 must stack matching brass weights onto the 5F counterweight pan.',
      'Clear: Cab (380 kg) + 2 friends (140 kg) = 520 kg total. Load weights summing to 520 kg, then pull the Brake Lever.',
      'Exact: Place 200 + 150 + 100 + 50 + 20 kg on the pan (= 520 kg) and drag the Brake Tension Lever to RELEASE.'
    ]
  },
  {
    key: '3-2',
    chapter: 3,
    title: 'Ch 03 · Ceiling Loom Splicing',
    tiers: [
      'Subtle: P1 must unscrew the 3 ceiling trap wingnuts (use your Screwdriver!) and match P2’s machine-room terminal diagram.',
      'Clear: Tap the Morse Buzzer in Lift Car to confirm signal, then order the 4 ceiling lugs exactly as shown on P2’s shaft chart.',
      'Exact: Unscrew 3 wingnuts, tap Morse Ack, and order lugs left-to-right: GOLD · RED · GREEN · BLUE.'
    ]
  },
  // Chapter 4
  {
    key: '4-1',
    chapter: 4,
    title: 'Ch 04 · UV Schematic & Coolant Valves',
    tiers: [
      'Subtle: P2 equips the UV Torch to inspect the oil-stained coolant pipework and read target PSI values for the 3 valves.',
      'Clear: Turn the 3 rotary coolant valves on the manifold to match the UV targets: Valve I = 45, Valve II = 70, Valve III = 30.',
      'Exact: Scan Oil Schematic with UV Torch, then rotate Valves to 45 PSI, 70 PSI, and 30 PSI.'
    ]
  },
  {
    key: '4-2',
    chapter: 4,
    title: 'Ch 04 · CRT Oscilloscope & Knife Switches',
    tiers: [
      'Subtle: Once coolant stabilizes, P1 tunes Frequency (Hz) and Phase (°) knobs until the live green wave matches the reference.',
      'Clear: Match 60 Hz and 120° on the oscilloscope, then throw the 3-phase knife switches in P2’s stamped order.',
      'Exact: Tune CRT to 60 Hz · 120° Phase, then pull knife switches in order: L2 → L1 → L3.'
    ]
  },
  // Chapter 5
  {
    key: '5-1',
    chapter: 5,
    title: 'Ch 05 · Sliding Teak Box & Radio Broadcast',
    tiers: [
      'Subtle: P2 slides the 3×3 teak tiles in sequence 1–8 to unlock the machine oil and frequency note.',
      'Clear: Relay 104.4 MHz to P1 so they tune the brass radio dial to hear the 4-digit Chennai river bulletin.',
      'Exact: Solve 3×3 tiles (1–8), P1 tunes Radio to 104.4 MHz (reveals 6294) and passes Rusty Key to P2.'
    ]
  },
  {
    key: '5-2',
    chapter: 5,
    title: 'Ch 05 · Oiled Key & Veranda Chest',
    tiers: [
      'Subtle: The rusted key won’t turn dry. Combine it with Machine Oil in your Field Bag first.',
      'Clear: Combine Rusty Veranda Key + Machine Oil Dropper → Oiled Brass Key, equip it, and enter 6294 on the Veranda Chest.',
      'Exact: Equip Oiled Brass Key + enter 6294 on Veranda Tool Chest to claim the Roof Hatch Crank.'
    ]
  },
  // Chapter 6
  {
    key: '6-1',
    chapter: 6,
    title: 'Ch 06 · Roof Pipe Drain Grid',
    tiers: [
      'Subtle: P2 must rotate the brass elbows on the Water Tank Manifold to connect Top-Left INLET to Bottom-Right DRAIN.',
      'Clear: Form a sealed path along the manifold without dead ends so monsoon water drains out of the junction pit.',
      'Exact: Rotate tiles so water flows continuously from Top-Left (row 0, col 0) to Bottom-Right (row 3, col 3), then collect Copper Shunt.'
    ]
  },
  {
    key: '6-2',
    chapter: 6,
    title: 'Ch 06 · Storm UV Bearing & Dish Azimuth',
    tiers: [
      'Subtle: P2 sweeps UV Torch on the wet parapet wall to uncover the faded compass bearing.',
      'Clear: Relay the 215° SW bearing to P1, who rotates the 360° Roof Dish Wheel to 215° while P2 seats the Copper Shunt.',
      'Exact: Scan Parapet with UV (215°), P1 dials Roof Dish to 215°, P2 seats Copper Shunt in the drained pit.'
    ]
  },
  // Chapter 7
  {
    key: '7-1',
    chapter: 7,
    title: 'Ch 07 · Darkroom Safelight & Chemical Pour',
    tiers: [
      'Subtle: Developing film requires RED safelight first! P1 switches the filter to RED so P2 can pour exact ml ratios.',
      'Clear: Under RED safelight, slide Developer=40ml, Stop Bath=25ml, Fixer=60ml, then switch to AMBER so P2 can inspect with the Loupe.',
      'Exact: P1 sets RED → P2 pours 40 / 25 / 60 ml → P1 sets AMBER → P2 sweeps Loupe over Frame 14 (3892) → P1 unlocks Locker (3892).'
    ]
  },
  // Chapter 8
  {
    key: '8-1',
    chapter: 8,
    title: 'Ch 08 · Torn Invoices, Microfiche & Cryptex',
    tiers: [
      'Subtle: P2 aligns all 4 torn scraps on the corkboard and combines Ledger A + Ledger B in the Bag.',
      'Clear: P1 scrolls the Microfiche Reel #04 to position 65% to read 4821; P2 dials the Cryptex letters from the Reassembled Invoice.',
      'Exact: Combine Ledger A+B (reveals MYL4), P1 scrolls Microfiche to 65% (4821), P2 sets Cryptex M-Y-L-4 & enters 4821.'
    ]
  },
  // Chapter 9
  {
    key: '9-1',
    chapter: 9,
    title: 'Ch 09 · Spur Gears, Primer & Load Balancing',
    tiers: [
      'Subtle: P2 snaps the 4 spur gears onto the diesel shaft in alternating ratio order and pumps the fuel primer.',
      'Clear: Gear sequence is 12T → 24T → 16T → 32T. Pump fuel pressure between 65–80 PSI while P1 flips Load Breakers.',
      'Exact: Gears: 12, 24, 16, 32. Pump Primer to 65–80 PSI. P1 sets Load Breakers: Essential ON, HVAC OFF, Lift ON, Neon OFF.'
    ]
  },
  // Chapter 10
  {
    key: '10-1',
    chapter: 10,
    title: 'Ch 10 · Magnetic Retrieval & Sluice Wheels',
    tiers: [
      'Subtle: P2 combines Magnet + Nylon Cord and uses P1’s Sonar depth readout to lower the reel to the exact meter mark.',
      'Clear: Lower Magnetic Retrieval Line to 4.5m to snag the Vault Brass Key, then align both Sluice Wheels (A: 135°, B: 270°).',
      'Exact: Combine Magnet + Cord → reel depth 4.5m → P1 sets Wheel A to 135°, P2 sets Wheel B to 270°.'
    ]
  },
  // Chapter 11
  {
    key: '11-1',
    chapter: 11,
    title: 'Ch 11 · Fiber Patch, NTP Drift & Lockpick',
    tiers: [
      'Subtle: P2 patches SFP ports 1–4 matching P1’s trace chart; P1 zeros out the +05:00 NTP drift clock.',
      'Clear: Fiber map: P1→B, P2→D, P3→A, P4→C. P1 dials NTP clock offset to 00:00:00. P2 picks all 3 pins to the shear line.',
      'Exact: Set SFP routes (1→B, 2→D, 3→A, 4→C), zero NTP rings (00h 00m 00s), equip Vault Key & pick Pins 1, 2, 3 to green line.'
    ]
  },
  // Chapter 12
  {
    key: '12-1',
    chapter: 12,
    title: 'Ch 12 · Master Bypass, Dual Wheels & Escape',
    tiers: [
      'Subtle: Combine the NTP Override Token + Copper Shunt Bar into the Master Bypass Rig, then enter the 6-digit building cipher.',
      'Clear: Six digits come from key chapter milestones (48 · 95 · 12 -> 489512). Turn Left Wheel to 240° and Right Wheel to 060°.',
      'Exact: Plug Master Bypass Rig, enter 489512, P1 turns Wheel to 240°, P2 turns Wheel to 060°, then BOTH hold Crash Bars for 3.0s!'
    ]
  }
];

export function getActiveHintForRoom(room: RoomState): HintDefinition {
  const ch = room.currentChapter;
  const p = room.puzzle;

  if (ch === 1) {
    return PROGRESSIVE_HINTS.find((h) => h.key === (!p.ch1DrawerOpen ? '1-1' : '1-2'))!;
  }
  if (ch === 2) {
    return PROGRESSIVE_HINTS.find((h) => h.key === (!p.ch2PadlockOpen ? '2-1' : '2-2'))!;
  }
  if (ch === 3) {
    return PROGRESSIVE_HINTS.find((h) => h.key === (!p.ch3BrakeReleased ? '3-1' : '3-2'))!;
  }
  if (ch === 4) {
    const valvesDone = p.ch4Valves[0] === 45 && p.ch4Valves[1] === 70 && p.ch4Valves[2] === 30;
    return PROGRESSIVE_HINTS.find((h) => h.key === (!valvesDone ? '4-1' : '4-2'))!;
  }
  if (ch === 5) {
    return PROGRESSIVE_HINTS.find((h) => h.key === (!p.ch5RadioLocked || !p.ch5SlidingSolved ? '5-1' : '5-2'))!;
  }
  if (ch === 6) {
    return PROGRESSIVE_HINTS.find((h) => h.key === (!p.ch6PipesDrained ? '6-1' : '6-2'))!;
  }
  return PROGRESSIVE_HINTS.find((h) => h.chapter === ch) || PROGRESSIVE_HINTS[0];
}

export function getChapterObjective(room: RoomState): string {
  const ch = room.currentChapter;
  const p = room.puzzle;
  switch (ch) {
    case 1:
      if (!p.ch1DrawerOpen) return 'Ch 01 · Cut Flat 4B lights, scan glow symbols & dial Brass Drawer (4816)';
      if (!p.ch1FuseInserted) return 'Ch 01 · Combine Screwdriver, unscrew Junction Box & insert 15A Fuse';
      return 'Ch 01 · Read CAM 02/03 feeds & balance 240V Junction switches/wires';
    case 2:
      if (!p.ch2PadlockOpen) return 'Ch 02 · Assemble UV Torch, sweep Corridor Wall & unlock Reception Keybox';
      return 'Ch 02 · Pass Service Lift Key through chute & unlock Corridor Gate';
    case 3:
      if (!p.ch3BrakeReleased) return 'Ch 03 · Balance 520 kg Counterweight Pan & pull Lift Brake Lever';
      return 'Ch 03 · Unscrew ceiling trap, tap Morse & splice 4 terminal lugs';
    case 4:
      if (!(p.ch4Valves[0] === 45 && p.ch4Valves[1] === 70 && p.ch4Valves[2] === 30)) {
        return 'Ch 04 · Scan coolant manifold with UV & dial 3 Pressure Valves';
      }
      return 'Ch 04 · Sync CRT Oscilloscope (60 Hz / 120°) & fire Knife Switches';
    case 5:
      if (!p.ch5SlidingSolved || !p.ch5RadioLocked) {
        return 'Ch 05 · Solve 3×3 Teak Box & tune Brass Radio to 104.4 MHz';
      }
      return 'Ch 05 · Oil the rusted Veranda Key & unlock Sundaram’s Tool Chest';
    case 6:
      if (!p.ch6PipesDrained) return 'Ch 06 · Rotate rooftop pipe elbows to drain the flooded junction pit';
      return 'Ch 06 · Spot UV storm bearing (215°), aim Dish & seat Copper Shunt';
    case 7:
      return 'Ch 07 · Match Safelight filters, mix 40/25/60ml chemicals & inspect Frame 14';
    case 8:
      return 'Ch 08 · Reassemble Invoice A+B, scroll Microfiche (65%) & dial Cryptex';
    case 9:
      return 'Ch 09 · Snap 4 Spur Gears (12-24-16-32), prime Diesel & balance Loads';
    case 10:
      return 'Ch 10 · Tie Magnet Line, fish Vault Key at 4.5m & turn Sluice Wheels';
    case 11:
      return 'Ch 11 · Patch Fiber SFPs, zero +05:00 NTP Drift & pick 3 Vault Pins';
    case 12:
      return 'Ch 12 · Plug Master Bypass Rig, enter 489512, align Wheels & Hold Crash Bars';
  }
}

export const QUICK_RADIO_CALLOUTS: Record<PlayerRole, string[]> = {
  P1_SECURITY: [
    'Toggling your circuit / filter now',
    'Check the Clue Board — pinned my reading',
    'Sending item through the chute/slot',
    'Gauge / monitor matches target!',
    'Ready for synchronized action!'
  ],
  P2_STUDY: [
    'Need lights / filter switched!',
    'Pinned wall / UV scan to Clue Board',
    'Passing recovered item through slot',
    'Mechanisms set on my side!',
    'Holding release bar — ready!'
  ]
};

export function formatSpeedrunClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
