import React from 'react';
import {
  Activity,
  Anchor,
  Cable,
  Compass,
  Cpu,
  Disc,
  DoorOpen,
  Droplets,
  Eye,
  FileText,
  Flame,
  Gauge,
  KeyRound,
  Layers,
  Lock,
  Monitor,
  Radio,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Wind,
  Wrench,
  Zap
} from 'lucide-react';
import { ChapterNumber, PlayerRole, RoomState } from '../../shared/gameTypes';
import { ROOM_ASSETS } from '../../utils/roomAssets';

export interface HotspotConfig {
  id: string;
  label: string;
  shortLabel: string;
  xPercent: number;
  yPercent: number;
  icon: React.ReactNode;
  badge?: string;
  solved?: boolean;
  attention?: boolean;
}

export function getRoomSceneConfig(
  room: RoomState,
  role: PlayerRole
): {
  imageSrc: string;
  imageAlt: string;
  overlayClass: string;
  caption: string;
  hotspots: HotspotConfig[];
} {
  const ch: ChapterNumber = room.currentChapter;
  const p = room.puzzle;

  switch (ch) {
    case 1:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.securityBooth,
          imageAlt: 'Security and Power Control Booth in Marina Towers',
          overlayClass: '',
          caption: 'Ch 01 · Room A: Security & Power Booth',
          hotspots: [
            {
              id: 'ch1_breaker',
              label: 'Master Breaker Panel',
              shortLabel: 'Breakers',
              xPercent: 14,
              yPercent: 43,
              icon: <Zap className="w-4 h-4" />,
              badge: p.ch1LightsOn ? '4B ON' : '4B OFF',
              solved: p.ch1DrawerOpen
            },
            {
              id: 'ch1_chart',
              label: 'Maintenance Symbol Chart',
              shortLabel: 'Symbol Chart',
              xPercent: 28,
              yPercent: 39,
              icon: <FileText className="w-4 h-4" />,
              solved: p.ch1DrawerOpen
            },
            {
              id: 'ch1_cctv',
              label: 'CCTV & Mirror Feed Console',
              shortLabel: 'CCTV Feeds',
              xPercent: 52,
              yPercent: 54,
              icon: <Monitor className="w-4 h-4" />,
              badge: p.ch1FuseInserted ? 'ONLINE' : 'CAM 01',
              attention: p.ch1FuseInserted && !p.ch1Solved,
              solved: p.ch1Solved
            }
          ]
        };
      }
      return {
        imageSrc: p.ch1LightsOn ? ROOM_ASSETS.studyLit : ROOM_ASSETS.studyDark,
        imageAlt: 'Flat 4B Study illuminated by emergency light or blackout glow',
        overlayClass: '',
        caption: p.ch1LightsOn ? 'Ch 01 · Flat 4B Study (Light ON)' : 'Ch 01 · Flat 4B Study (Blackout)',
        hotspots: [
          {
            id: 'ch1_mural',
            label: p.ch1LightsOn ? 'Dim Plaster Wall' : 'Phosphor Glow Wall',
            shortLabel: 'Glow Wall',
            xPercent: 75,
            yPercent: 28,
            icon: <Sparkles className="w-4 h-4" />,
            badge: !p.ch1LightsOn ? 'GLOWING' : 'WASHED OUT',
            attention: !p.ch1LightsOn && !p.ch1DrawerOpen,
            solved: p.ch1DrawerOpen
          },
          {
            id: 'ch1_blotter_drawer',
            label: 'Teak Desk & Brass Dial Drawer',
            shortLabel: 'Desk & Dial',
            xPercent: 53,
            yPercent: 78,
            icon: <KeyRound className="w-4 h-4" />,
            badge: p.ch1DrawerOpen ? 'OPEN' : '4-DIAL',
            solved: p.ch1DrawerOpen && p.ch1BlotterSlid
          },
          {
            id: 'ch1_junction',
            label: 'Bolted Wall Junction Box',
            shortLabel: 'Junction Box',
            xPercent: 61,
            yPercent: 39,
            icon: <Cpu className="w-4 h-4" />,
            badge: p.ch1FuseInserted ? 'FUSED' : p.ch1ScrewsRemoved.every(Boolean) ? 'OPEN' : '4 BOLTS',
            attention: p.ch1DrawerOpen && !p.ch1Solved,
            solved: p.ch1Solved
          }
        ]
      };

    case 2:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.receptionKiosk,
          imageAlt: 'Floor 4 Reception Security Kiosk',
          overlayClass: '',
          caption: 'Ch 02 · Reception Kiosk',
          hotspots: [
            {
              id: 'ch2_padlock_box',
              label: '3-Ring Brass Keybox',
              shortLabel: 'Brass Keybox',
              xPercent: 64,
              yPercent: 31,
              icon: <Lock className="w-4 h-4" />,
              badge: p.ch2PadlockOpen ? 'OPEN' : '3-RING',
              attention: p.ch2UvFoundNotice && p.ch2UvFoundFrame && !p.ch2PadlockOpen,
              solved: p.ch2PadlockOpen
            },
            {
              id: 'ch2_dvr_console',
              label: 'Reception DVR Timestamp Log',
              shortLabel: 'DVR Scrubber',
              xPercent: 45,
              yPercent: 62,
              icon: <Monitor className="w-4 h-4" />,
              badge: `21:${p.ch2DvrMinute}`,
              solved: p.ch2CorridorGateOpen
            },
            {
              id: 'ch2_chute_p1',
              label: 'Mail Chute Return Tray',
              shortLabel: 'Mail Chute',
              xPercent: 86,
              yPercent: 44,
              icon: <Wind className="w-4 h-4" />,
              badge: p.ch2KeyPassed ? 'SENT' : p.ch2PadlockOpen ? 'PASS KEY' : undefined,
              attention: p.ch2PadlockOpen && !p.ch2KeyPassed,
              solved: p.ch2KeyPassed
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.cctvHallway,
        imageAlt: 'Darkened 4th Floor Apartment Corridor',
        overlayClass: 'brightness-75 contrast-125',
        caption: 'Ch 02 · East Corridor 4F (Dark Hallway)',
        hotspots: [
          {
            id: 'ch2_chute_p2',
            label: 'Jammed Brass Mail Chute',
            shortLabel: 'Mail Chute',
            xPercent: 20,
            yPercent: 52,
            icon: <Wind className="w-4 h-4" />,
            badge: p.ch2ChuteSlid ? 'OPEN' : 'SLIDE',
            attention: !p.ch2ChuteSlid,
            solved: p.ch2ChuteSlid
          },
          {
            id: 'ch2_uv_wall',
            label: 'Corridor Noticeboard & Frame',
            shortLabel: 'UV Sweep Wall',
            xPercent: 48,
            yPercent: 42,
            icon: <Eye className="w-4 h-4" />,
            badge: p.ch2UvFoundNotice && p.ch2UvFoundFrame ? 'SCANNED' : 'DARK',
            attention: p.ch2ChuteSlid && !(p.ch2UvFoundNotice && p.ch2UvFoundFrame),
            solved: p.ch2UvFoundNotice && p.ch2UvFoundFrame
          },
          {
            id: 'ch2_corridor_gate',
            label: 'Service Lift Lobby Gate',
            shortLabel: 'Lift Gate',
            xPercent: 79,
            yPercent: 55,
            icon: <DoorOpen className="w-4 h-4" />,
            badge: p.ch2KeyPassed ? 'KEY READY' : 'LOCKED',
            attention: p.ch2KeyPassed,
            solved: p.ch2CorridorGateOpen
          }
        ]
      };

    case 3:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.liftShaft,
          imageAlt: 'Stalled Service Lift Car',
          overlayClass: 'brightness-90',
          caption: 'Ch 03 · Stalled Service Lift Car',
          hotspots: [
            {
              id: 'ch3_placard_morse',
              label: 'Load Placard & Morse Buzzer',
              shortLabel: 'Load & Buzzer',
              xPercent: 86,
              yPercent: 39,
              icon: <Activity className="w-4 h-4" />,
              badge: p.ch3MorseAcked ? 'SYNCED' : '520 KG',
              attention: !p.ch3MorseAcked
            },
            {
              id: 'ch3_ceiling_trap',
              label: 'Ceiling Escape Trap & Loom',
              shortLabel: 'Ceiling Loom',
              xPercent: 42,
              yPercent: 25,
              icon: <Cable className="w-4 h-4" />,
              badge: p.ch3BrakeReleased ? 'BRAKE FREE' : 'LOCKED',
              attention: p.ch3BrakeReleased
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.liftShaft,
        imageAlt: '5th Floor Lift Machine Room',
        overlayClass: '',
        caption: 'Ch 03 · 5F Lift Machine Room',
        hotspots: [
          {
            id: 'ch3_counterweight',
            label: 'Counterweight Scale & Brake',
            shortLabel: 'Counterweight',
            xPercent: 25,
            yPercent: 60,
            icon: <Scale className="w-4 h-4" />,
            badge: p.ch3BrakeReleased ? '520 KG OK' : 'UNBALANCED',
            attention: !p.ch3BrakeReleased,
            solved: p.ch3BrakeReleased
          },
          {
            id: 'ch3_shaft_chart',
            label: 'Shaft Voltmeter & Wiring Map',
            shortLabel: 'Wiring Chart',
            xPercent: 72,
            yPercent: 32,
            icon: <FileText className="w-4 h-4" />,
            badge: p.ch3MorseAcked ? 'ACTIVE' : 'STANDBY',
            solved: p.ch3MorseAcked
          }
        ]
      };

    case 4:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.meterVault,
          imageAlt: 'Mezzanine Oscilloscope Bay',
          overlayClass: '',
          caption: 'Ch 04 · Mezzanine Oscilloscope Bay',
          hotspots: [
            {
              id: 'ch4_oscilloscope',
              label: 'Analog CRT Oscilloscope',
              shortLabel: 'Oscilloscope',
              xPercent: 84,
              yPercent: 56,
              icon: <Activity className="w-4 h-4" />,
              badge: p.ch4OscLocked ? 'SYNCED' : `${p.ch4OscFreq}Hz`,
              attention: p.ch4Valves[0] === 45 && p.ch4Valves[1] === 70 && p.ch4Valves[2] === 30 && !p.ch4OscLocked,
              solved: p.ch4OscLocked
            },
            {
              id: 'ch4_knife_p1',
              label: '3-Phase Busbar Interlock',
              shortLabel: 'Busbar Panel',
              xPercent: 64,
              yPercent: 38,
              icon: <Zap className="w-4 h-4" />,
              badge: p.ch4OscLocked ? 'ARMED' : 'WAIT SYNC',
              attention: p.ch4OscLocked
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.meterVault,
        imageAlt: 'Mezzanine Transformer Closet',
        overlayClass: '',
        caption: 'Ch 04 · Transformer Closet',
        hotspots: [
          {
            id: 'ch4_uv_oil',
            label: 'Oil-Stained Coolant Plaque',
            shortLabel: 'UV Oil Plaque',
            xPercent: 40,
            yPercent: 45,
            icon: <Eye className="w-4 h-4" />,
            badge: p.ch4UvOilScanned ? 'SCANNED' : 'USE UV',
            attention: !p.ch4UvOilScanned,
            solved: p.ch4UvOilScanned
          },
          {
            id: 'ch4_valves',
            label: 'Rotary Coolant Valve Manifold',
            shortLabel: '3 Coolant Valves',
            xPercent: 18,
            yPercent: 50,
            icon: <Gauge className="w-4 h-4" />,
            badge:
              p.ch4Valves[0] === 45 && p.ch4Valves[1] === 70 && p.ch4Valves[2] === 30 ? 'STEADY' : 'SET PSI',
            solved: p.ch4Valves[0] === 45 && p.ch4Valves[1] === 70 && p.ch4Valves[2] === 30
          },
          {
            id: 'ch4_knife_p2',
            label: '3-Phase Knife Switches',
            shortLabel: 'Knife Switches',
            xPercent: 64,
            yPercent: 38,
            icon: <Zap className="w-4 h-4" />,
            badge: p.ch4OscLocked ? 'FIRE L2-L1-L3' : 'LOCKED',
            attention: p.ch4OscLocked
          }
        ]
      };

    case 5:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.caretakerQuarters,
          imageAlt: 'Caretaker Sundaram Study Desk',
          overlayClass: '',
          caption: 'Ch 05 · Sundaram’s Broadcast Desk',
          hotspots: [
            {
              id: 'ch5_radio',
              label: 'Vintage Brass Tube Radio',
              shortLabel: 'Tube Radio',
              xPercent: 25,
              yPercent: 56,
              icon: <Radio className="w-4 h-4" />,
              badge: p.ch5RadioLocked ? '104.4 OK' : `${(p.ch5RadioFreq / 10).toFixed(1)} MHz`,
              attention: p.ch5SlidingSolved && !p.ch5RadioLocked,
              solved: p.ch5RadioLocked
            },
            {
              id: 'ch5_shutter_key',
              label: 'Veranda Shutter Key Pass',
              shortLabel: 'Shutter Pass',
              xPercent: 40,
              yPercent: 32,
              icon: <KeyRound className="w-4 h-4" />,
              badge: p.ch5KeyPassed ? 'PASSED' : 'PASS KEY',
              attention: !p.ch5KeyPassed,
              solved: p.ch5KeyPassed
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.caretakerQuarters,
        imageAlt: 'Caretaker Shuttered Veranda',
        overlayClass: 'brightness-90',
        caption: 'Ch 05 · Shuttered Monsoon Veranda',
        hotspots: [
          {
            id: 'ch5_teak_box',
            label: 'Sliding Teak Puzzle Box',
            shortLabel: 'Teak Box',
            xPercent: 48,
            yPercent: 72,
            icon: <Layers className="w-4 h-4" />,
            badge: p.ch5SlidingSolved ? 'OPEN' : '3×3 TILES',
            attention: !p.ch5SlidingSolved,
            solved: p.ch5SlidingSolved
          },
          {
            id: 'ch5_veranda_chest',
            label: 'Locked Veranda Tool Chest',
            shortLabel: 'Tool Chest',
            xPercent: 82,
            yPercent: 76,
            icon: <Lock className="w-4 h-4" />,
            badge: p.ch5KeyPassed ? 'OIL KEY' : 'WAIT KEY',
            attention: p.ch5KeyPassed && p.ch5RadioLocked,
            solved: p.ch5ChestUnlocked
          }
        ]
      };

    case 6:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.monsoonRoof,
          imageAlt: 'Rain-swept Rooftop Parapet Dish',
          overlayClass: '',
          caption: 'Ch 06 · East Parapet Relay Dish',
          hotspots: [
            {
              id: 'ch6_dish_wheel',
              label: '360° Antenna Azimuth Wheel',
              shortLabel: 'Azimuth Wheel',
              xPercent: 25,
              yPercent: 44,
              icon: <Compass className="w-4 h-4" />,
              badge: `${p.ch6DishAzimuth}°`,
              attention: p.ch6UvBearingFound && p.ch6DishAzimuth !== 215,
              solved: p.ch6DishAzimuth === 215
            },
            {
              id: 'ch6_repeater_log',
              label: 'Signal Strength Monitor',
              shortLabel: 'Signal Meter',
              xPercent: 52,
              yPercent: 58,
              icon: <Activity className="w-4 h-4" />,
              badge: p.ch6ShuntSeated ? 'SHUNTED' : 'NO SHUNT'
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.monsoonRoof,
        imageAlt: 'Rooftop Water Tank Shed',
        overlayClass: '',
        caption: 'Ch 06 · Water Tank Manifold',
        hotspots: [
          {
            id: 'ch6_pipe_grid',
            label: '4×4 Brass Pipe Drain Manifold',
            shortLabel: 'Pipe Manifold',
            xPercent: 69,
            yPercent: 52,
            icon: <Droplets className="w-4 h-4" />,
            badge: p.ch6PipesDrained ? 'DRAINED' : 'FLOODED',
            attention: !p.ch6PipesDrained,
            solved: p.ch6PipesDrained
          },
          {
            id: 'ch6_uv_parapet',
            label: 'Storm-Washed Parapet Wall',
            shortLabel: 'UV Parapet',
            xPercent: 86,
            yPercent: 42,
            icon: <Eye className="w-4 h-4" />,
            badge: p.ch6UvBearingFound ? '215° SW' : 'USE UV',
            solved: p.ch6UvBearingFound
          },
          {
            id: 'ch6_shunt_pit',
            label: 'Drained Junction Pit',
            shortLabel: 'Shunt Dock',
            xPercent: 42,
            yPercent: 78,
            icon: <Zap className="w-4 h-4" />,
            badge: p.ch6ShuntSeated ? 'SEATED' : p.ch6PipesDrained ? 'EQUIP SHUNT' : 'SUBMERGED',
            attention: p.ch6PipesDrained && !p.ch6ShuntSeated,
            solved: p.ch6ShuntSeated
          }
        ]
      };

    case 7: {
      const tint =
        p.ch7Safelight === 'RED'
          ? 'sepia hue-rotate-[-45deg] saturate-200 brightness-90'
          : p.ch7Safelight === 'AMBER'
          ? 'sepia brightness-100 saturate-150'
          : p.ch7Safelight === 'UV'
          ? 'hue-rotate-[210deg] saturate-150 brightness-75'
          : '';
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.darkroomDispensary,
          imageAlt: 'Dispensary Safelight Panel and Locker',
          overlayClass: tint,
          caption: `Ch 07 · Safelight Panel (${p.ch7Safelight})`,
          hotspots: [
            {
              id: 'ch7_safelight_bank',
              label: 'Safelight Filter Selector',
              shortLabel: 'Safelight Bank',
              xPercent: 56,
              yPercent: 20,
              icon: <Sun className="w-4 h-4" />,
              badge: p.ch7Safelight,
              attention: !p.ch7FilmLoupeRead
            },
            {
              id: 'ch7_apothecary_locker',
              label: 'Chained Apothecary Locker',
              shortLabel: 'Medicine Locker',
              xPercent: 18,
              yPercent: 42,
              icon: <Lock className="w-4 h-4" />,
              badge: p.ch7FilmLoupeRead ? 'ENTER PIN' : 'CHAINED',
              attention: p.ch7FilmLoupeRead,
              solved: p.ch7ApothecaryOpen
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.darkroomDispensary,
        imageAlt: 'Darkroom Developing Sink',
        overlayClass: tint,
        caption: `Ch 07 · Darkroom Sink (${p.ch7Safelight} Light)`,
        hotspots: [
          {
            id: 'ch7_chemical_sink',
            label: 'Graduated Chemical Trays',
            shortLabel: 'Chemical Mix',
            xPercent: 39,
            yPercent: 68,
            icon: <Droplets className="w-4 h-4" />,
            badge: p.ch7FilmDeveloped ? 'DEVELOPED' : '40/25/60ml',
            attention: p.ch7Safelight === 'RED' && !p.ch7FilmDeveloped,
            solved: p.ch7FilmDeveloped
          },
          {
            id: 'ch7_film_loupe',
            label: 'Hanging 35mm Film Strip & Loupe',
            shortLabel: 'Film & Loupe',
            xPercent: 42,
            yPercent: 25,
            icon: <Search className="w-4 h-4" />,
            badge: p.ch7FilmLoupeRead ? '3892 READ' : p.ch7FilmDeveloped ? 'USE LOUPE' : 'UNDEVELOPED',
            attention: p.ch7FilmDeveloped && p.ch7Safelight === 'AMBER' && !p.ch7FilmLoupeRead,
            solved: p.ch7FilmLoupeRead
          }
        ]
      };
    }

    case 8:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.archiveLedger,
          imageAlt: 'Accounting Microfiche Terminal',
          overlayClass: '',
          caption: 'Ch 08 · Microfiche Projector Desk',
          hotspots: [
            {
              id: 'ch8_microfiche',
              label: 'Microfiche Scroll Wheel',
              shortLabel: 'Microfiche Reel',
              xPercent: 52,
              yPercent: 54,
              icon: <Disc className="w-4 h-4" />,
              badge: p.ch8MicroficheAligned ? '65% LOCKED' : `${p.ch8MicroficheScroll}%`,
              attention: !p.ch8MicroficheAligned,
              solved: p.ch8MicroficheAligned
            },
            {
              id: 'ch8_audit_notes',
              label: 'Supervisor Ledger Memo',
              shortLabel: 'Audit Notes',
              xPercent: 22,
              yPercent: 56,
              icon: <FileText className="w-4 h-4" />
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.archiveLedger,
        imageAlt: 'Accounting Corkboard and Cryptex Desk',
        overlayClass: '',
        caption: 'Ch 08 · Ledgers & Cryptex Desk',
        hotspots: [
          {
            id: 'ch8_corkboard',
            label: 'Torn Invoices Corkboard',
            shortLabel: 'Corkboard Scraps',
            xPercent: 48,
            yPercent: 32,
            icon: <Layers className="w-4 h-4" />,
            badge: `${p.ch8ScrapsAligned.filter(Boolean).length}/4`,
            attention: !p.ch8ScrapsAligned.every(Boolean),
            solved: p.ch8ScrapsAligned.every(Boolean)
          },
          {
            id: 'ch8_cryptex_chute',
            label: '4-Ring Cryptex & Dumbwaiter',
            shortLabel: 'Cryptex Chute',
            xPercent: 80,
            yPercent: 54,
            icon: <Lock className="w-4 h-4" />,
            badge: p.ch8CryptexLetters.join(''),
            attention: p.ch8MicroficheAligned,
            solved: p.ch8DumbwaiterOpen
          }
        ]
      };

    case 9:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.generatorCistern,
          imageAlt: 'Diesel Load Shedding Console',
          overlayClass: '',
          caption: 'Ch 09 · Generator Load Console',
          hotspots: [
            {
              id: 'ch9_load_console',
              label: '4-Bus Load Shedding Breakers',
              shortLabel: 'Load Breakers',
              xPercent: 78,
              yPercent: 42,
              icon: <Zap className="w-4 h-4" />,
              badge: p.ch9Primed ? 'PRIMED' : 'WAIT PRIME',
              attention: p.ch9Primed
            },
            {
              id: 'ch9_ignition',
              label: 'Diesel Starter Ignition',
              shortLabel: 'Starter Crank',
              xPercent: 22,
              yPercent: 54,
              icon: <Flame className="w-4 h-4" />,
              badge: p.ch9GeneratorRunning ? 'ONLINE' : 'STANDBY',
              attention: p.ch9Primed
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.generatorCistern,
        imageAlt: 'Basement Diesel Generator Pit',
        overlayClass: '',
        caption: 'Ch 09 · Diesel Generator Pit',
        hotspots: [
          {
            id: 'ch9_gear_train',
            label: 'Spur Gear Spindle Train',
            shortLabel: 'Spur Gears',
            xPercent: 20,
            yPercent: 62,
            icon: <Settings className="w-4 h-4" />,
            badge: `${p.ch9GearSlots.filter((g) => g !== null).length}/4`,
            attention: !p.ch9GearSlots.every((g) => g !== null),
            solved: p.ch9GearSlots[0] === 12 && p.ch9GearSlots[1] === 24 && p.ch9GearSlots[2] === 16 && p.ch9GearSlots[3] === 32
          },
          {
            id: 'ch9_fuel_primer',
            label: 'Manual Fuel Priming Plunger',
            shortLabel: 'Fuel Primer',
            xPercent: 86,
            yPercent: 34,
            icon: <Gauge className="w-4 h-4" />,
            badge: `${p.ch9FuelPressure} PSI`,
            attention: !p.ch9Primed,
            solved: p.ch9Primed
          }
        ]
      };

    case 10:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.generatorCistern,
          imageAlt: 'Sub-Cistern Sonar & Sluice A',
          overlayClass: 'hue-rotate-[165deg] saturate-75 brightness-90',
          caption: 'Ch 10 · Cistern Sonar & Sluice Panel A',
          hotspots: [
            {
              id: 'ch10_sonar_feed',
              label: 'Sub-Surface Sonar Depth Ping',
              shortLabel: 'Sonar Feed',
              xPercent: 84,
              yPercent: 32,
              icon: <Monitor className="w-4 h-4" />,
              badge: p.ch10KeyFished ? 'KEY FOUND' : '4.5m TARGET'
            },
            {
              id: 'ch10_sluice_a',
              label: 'Spoked Iron Sluice Wheel A',
              shortLabel: 'Sluice Wheel A',
              xPercent: 72,
              yPercent: 46,
              icon: <Compass className="w-4 h-4" />,
              badge: `${p.ch10SluiceWheelA}°`,
              attention: p.ch10KeyFished && p.ch10SluiceWheelA !== 135,
              solved: p.ch10SluiceWheelA === 135
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.generatorCistern,
        imageAlt: 'Flooded Cistern Catwalk',
        overlayClass: 'hue-rotate-[165deg] saturate-75 brightness-90',
        caption: 'Ch 10 · Flooded Cistern Catwalk',
        hotspots: [
          {
            id: 'ch10_flooded_grate',
            label: 'Submerged Grate & Reel',
            shortLabel: 'Flooded Grate',
            xPercent: 44,
            yPercent: 78,
            icon: <Anchor className="w-4 h-4" />,
            badge: p.ch10KeyFished ? 'KEY RECOVERED' : `${(p.ch10ReelDepth / 10).toFixed(1)}m`,
            attention: !p.ch10KeyFished,
            solved: p.ch10KeyFished
          },
          {
            id: 'ch10_sluice_b',
            label: 'Spoked Iron Sluice Wheel B',
            shortLabel: 'Sluice Wheel B',
            xPercent: 72,
            yPercent: 46,
            icon: <Compass className="w-4 h-4" />,
            badge: `${p.ch10SluiceWheelB}°`,
            attention: p.ch10KeyFished && p.ch10SluiceWheelB !== 270,
            solved: p.ch10SluiceWheelB === 270
          }
        ]
      };

    case 11:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.ntpVaultLobby,
          imageAlt: 'Sub-Basement Fiber Packet Terminal',
          overlayClass: '',
          caption: 'Ch 11 · Fiber Packet & NTP Terminal',
          hotspots: [
            {
              id: 'ch11_packet_map',
              label: 'DVR Loop Packet Trace Map',
              shortLabel: 'Packet Trace',
              xPercent: 18,
              yPercent: 44,
              icon: <Cable className="w-4 h-4" />,
              solved: p.ch11FiberSolved
            },
            {
              id: 'ch11_ntp_rings',
              label: 'Concentric NTP Drift Calibrator',
              shortLabel: 'NTP Drift Clock',
              xPercent: 72,
              yPercent: 52,
              icon: <Cpu className="w-4 h-4" />,
              badge: p.ch11NtpSynced
                ? '00:00:00'
                : `+${String(p.ch11NtpOffset.h).padStart(2, '0')}:${String(p.ch11NtpOffset.m).padStart(2, '0')}:${String(p.ch11NtpOffset.s).padStart(2, '0')}`,
              attention: p.ch11FiberSolved && !p.ch11NtpSynced,
              solved: p.ch11NtpSynced
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.ntpVaultLobby,
        imageAlt: 'Sub-Basement Time-Lock Vault Door',
        overlayClass: '',
        caption: 'Ch 11 · Rack 7 & Time-Lock Vault Door',
        hotspots: [
          {
            id: 'ch11_fiber_rack',
            label: 'SFP Fiber Patch Matrix',
            shortLabel: 'Fiber Patch Rack',
            xPercent: 18,
            yPercent: 46,
            icon: <Cable className="w-4 h-4" />,
            badge: p.ch11FiberSolved ? 'PATCHED' : 'RE-PATCH',
            attention: !p.ch11FiberSolved,
            solved: p.ch11FiberSolved
          },
          {
            id: 'ch11_vault_tumbler',
            label: '3-Pin Spring Tumbler Lock',
            shortLabel: 'Tumbler Lock',
            xPercent: 72,
            yPercent: 52,
            icon: <KeyRound className="w-4 h-4" />,
            badge: `${p.ch11LockPins.filter(Boolean).length}/3 PINS`,
            attention: p.ch11NtpSynced,
            solved: p.ch11LockPins.every(Boolean)
          }
        ]
      };

    case 12:
    default:
      if (role === 'P1_SECURITY') {
        return {
          imageSrc: ROOM_ASSETS.ntpVaultLobby,
          imageAlt: 'Main Lobby Turnstile Security Console',
          overlayClass: 'brightness-110',
          caption: 'Ch 12 · Lobby Turnstile Override Desk',
          hotspots: [
            {
              id: 'ch12_bypass_console',
              label: 'Bypass Rig & 6-Digit Cipher',
              shortLabel: 'Bypass & Cipher',
              xPercent: 20,
              yPercent: 48,
              icon: <ShieldCheck className="w-4 h-4" />,
              badge: p.ch12MasterCipherOpen ? 'OPEN' : p.ch12BypassPlugged ? 'CIPHER' : 'PLUG RIG',
              attention: !p.ch12MasterCipherOpen,
              solved: p.ch12MasterCipherOpen
            },
            {
              id: 'ch12_wheel_left',
              label: 'Left Brass Vault Wheel (240°)',
              shortLabel: 'Left Wheel',
              xPercent: 68,
              yPercent: 50,
              icon: <Compass className="w-4 h-4" />,
              badge: `${p.ch12WheelLeft}°`,
              attention: p.ch12MasterCipherOpen && p.ch12WheelLeft !== 240,
              solved: p.ch12WheelLeft === 240
            },
            {
              id: 'ch12_crash_bar',
              label: 'Lobby Crash Bar Latch',
              shortLabel: 'Exit Crash Bar',
              xPercent: 86,
              yPercent: 68,
              icon: <DoorOpen className="w-4 h-4" />,
              badge: p.ch12WheelLeft === 240 && p.ch12WheelRight === 60 ? 'HOLD!' : 'LOCKED',
              attention: p.ch12WheelLeft === 240 && p.ch12WheelRight === 60
            }
          ]
        };
      }
      return {
        imageSrc: ROOM_ASSETS.ntpVaultLobby,
        imageAlt: 'Main Lobby Art Deco Brass Doors',
        overlayClass: 'brightness-110',
        caption: 'Ch 12 · Main Brass Airlock Doors',
        hotspots: [
          {
            id: 'ch12_evidence_plaque',
            label: 'Compiled Case Cipher Plaque',
            shortLabel: 'Cipher Plaque',
            xPercent: 20,
            yPercent: 42,
            icon: <FileText className="w-4 h-4" />,
            badge: '489512'
          },
          {
            id: 'ch12_wheel_right',
            label: 'Right Brass Vault Wheel (060°)',
            shortLabel: 'Right Wheel',
            xPercent: 72,
            yPercent: 52,
            icon: <Compass className="w-4 h-4" />,
            badge: `${p.ch12WheelRight}°`,
            attention: p.ch12MasterCipherOpen && p.ch12WheelRight !== 60,
            solved: p.ch12WheelRight === 60
          },
          {
            id: 'ch12_crash_bar',
            label: 'Lobby Crash Bar Latch',
            shortLabel: 'Exit Crash Bar',
            xPercent: 86,
            yPercent: 68,
            icon: <DoorOpen className="w-4 h-4" />,
            badge: p.ch12WheelLeft === 240 && p.ch12WheelRight === 60 ? 'HOLD!' : 'LOCKED',
            attention: p.ch12WheelLeft === 240 && p.ch12WheelRight === 60
          }
        ]
      };
  }
}
