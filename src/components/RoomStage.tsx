import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Cpu,
  DoorOpen,
  FileText,
  KeyRound,
  Lock,
  Monitor,
  Sparkles,
  Wind,
  Zap
} from 'lucide-react';
import { PlayerRole, RoomState } from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';
import { ROOM_ASSETS } from '../utils/roomAssets';

export type HotspotId =
  | 'breaker_panel'
  | 'maintenance_chart'
  | 'cctv_console'
  | 'security_vent'
  | 'security_door'
  | 'glow_mural'
  | 'desk_drawer'
  | 'junction_box'
  | 'calendar_safe'
  | 'study_vent'
  | 'study_door';

interface HotspotConfig {
  id: HotspotId;
  label: string;
  shortLabel: string;
  xPercent: number;
  yPercent: number;
  icon: React.ReactNode;
  badge?: string;
  solved?: boolean;
  attention?: boolean;
}

interface RoomStageProps {
  room: RoomState;
  role: PlayerRole;
  onSelectHotspot: (id: HotspotId) => void;
}

export const RoomStage: React.FC<RoomStageProps> = ({ room, role, onSelectHotspot }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const p = room.puzzle;

  const hotspots: HotspotConfig[] =
    role === 'P1_SECURITY'
      ? [
          {
            id: 'breaker_panel',
            label: 'Master Breaker Panel',
            shortLabel: 'Breakers',
            xPercent: 12,
            yPercent: 43,
            icon: <Zap className="w-4 h-4" />,
            badge: p.studyLightsOn ? '4B ON' : '4B OFF',
            solved: p.puzzle1Solved
          },
          {
            id: 'maintenance_chart',
            label: 'Maintenance Symbol Chart',
            shortLabel: 'Chart',
            xPercent: 25,
            yPercent: 39,
            icon: <FileText className="w-4 h-4" />,
            solved: p.puzzle1Solved
          },
          {
            id: 'cctv_console',
            label: 'CCTV & DVR Console',
            shortLabel: 'CCTV / DVR',
            xPercent: 43,
            yPercent: 52,
            icon: <Monitor className="w-4 h-4" />,
            badge: p.dvrOffsetFixed ? 'LIVE' : '+05:00',
            solved: p.dvrOffsetFixed,
            attention: p.fuseInserted && !p.puzzle2Solved
          },
          {
            id: 'security_vent',
            label: 'Inter-Room Air Vent',
            shortLabel: 'Air Vent',
            xPercent: 72,
            yPercent: 45,
            icon: <Wind className="w-4 h-4" />,
            badge: p.keycardLocation === 'SECURITY_DESK' ? 'KEYCARD' : undefined,
            attention: p.keycardLocation === 'SECURITY_DESK',
            solved: p.keycardLocation === 'INSERTED'
          },
          {
            id: 'security_door',
            label: 'Security Exit Door',
            shortLabel: 'Exit Door',
            xPercent: 86,
            yPercent: 58,
            icon: p.dvrOffsetFixed ? <DoorOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
            badge: p.dvrOffsetFixed ? 'ARMED' : 'LOCKED',
            attention: p.dvrOffsetFixed
          }
        ]
      : [
          {
            id: 'study_door',
            label: 'Flat 4B Exit Door',
            shortLabel: 'Exit Door',
            xPercent: 46,
            yPercent: 50,
            icon: p.dvrOffsetFixed ? <DoorOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
            badge: p.dvrOffsetFixed ? 'ARMED' : 'LOCKED',
            attention: p.dvrOffsetFixed
          },
          {
            id: 'junction_box',
            label: 'Wall Junction Box',
            shortLabel: 'Junction Box',
            xPercent: 62,
            yPercent: 37,
            icon: <Cpu className="w-4 h-4" />,
            badge: p.puzzle2Solved ? '240V' : p.fuseInserted ? 'FUSED' : undefined,
            solved: p.puzzle2Solved,
            attention: p.deskDrawerOpen && !p.puzzle2Solved
          },
          {
            id: 'glow_mural',
            label: p.studyLightsOn ? 'Plaster Wall (Dim)' : 'Phosphor Glow Wall',
            shortLabel: p.studyLightsOn ? 'Wall' : 'Glow Wall',
            xPercent: 77,
            yPercent: 25,
            icon: <Sparkles className="w-4 h-4" />,
            badge: !p.studyLightsOn ? 'GLOWING' : undefined,
            attention: !p.studyLightsOn && !p.puzzle1Solved,
            solved: p.puzzle1Solved
          },
          {
            id: 'calendar_safe',
            label: p.calendarTilted ? 'Hidden Wall Safe' : 'Mylapore Calendar',
            shortLabel: p.calendarTilted ? 'Wall Safe' : 'Calendar',
            xPercent: 81,
            yPercent: 42,
            icon: p.calendarTilted ? <KeyRound className="w-4 h-4" /> : <Calendar className="w-4 h-4" />,
            badge: p.wallSafeOpen ? 'OPEN' : p.calendarTilted ? 'SAFE' : undefined,
            solved: p.wallSafeOpen,
            attention: p.puzzle2Solved && !p.wallSafeOpen
          },
          {
            id: 'desk_drawer',
            label: 'Brass Desk Drawer',
            shortLabel: 'Desk Drawer',
            xPercent: 57,
            yPercent: 84,
            icon: <KeyRound className="w-4 h-4" />,
            badge: p.deskDrawerOpen ? 'OPEN' : 'LOCKED',
            solved: p.deskDrawerOpen
          },
          {
            id: 'study_vent',
            label: 'Inter-Room Air Vent',
            shortLabel: 'Air Vent',
            xPercent: 22,
            yPercent: 72,
            icon: <Wind className="w-4 h-4" />,
            badge: p.wallSafeOpen && p.keycardLocation === 'SAFE' ? 'PASS CARD' : undefined,
            attention: p.wallSafeOpen && p.keycardLocation === 'SAFE',
            solved: p.keycardLocation === 'SECURITY_DESK' || p.keycardLocation === 'INSERTED'
          }
        ];

  const handleTap = (id: HotspotId) => {
    soundFx.click();
    onSelectHotspot(id);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Illustrated Room Frame */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[#12161E] shadow-xl select-none">
        {!imgFailed ? (
          role === 'P1_SECURITY' ? (
            <img
              src={ROOM_ASSETS.securityBooth}
              alt="Security and Power Control Booth in Marina Towers"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <img
                src={ROOM_ASSETS.studyLit}
                alt="Flat 4B Study illuminated by emergency wall light"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  p.studyLightsOn ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <img
                src={ROOM_ASSETS.studyDark}
                alt="Flat 4B Study in blackout darkness revealing glowing wall symbols"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  p.studyLightsOn ? 'opacity-0' : 'opacity-100'
                }`}
              />
            </>
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#161A22] to-[#0E1014] flex flex-col items-center justify-center p-6 text-center">
            <DoorOpen className="w-10 h-10 text-amber-400 mb-2" />
            <div className="text-sm font-semibold text-zinc-200">
              {role === 'P1_SECURITY' ? 'Security & Power Booth' : 'Flat 4B Study'}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Tap any object pin below to inspect.</p>
          </div>
        )}

        {/* Subtle gradient vignette for legible pins */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

        {/* Room Environment State Caption */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-sm text-zinc-200 border border-white/10 font-medium">
            {role === 'P1_SECURITY'
              ? 'Room A · Security Booth'
              : p.studyLightsOn
              ? 'Room B · Flat 4B (Emergency Light ON)'
              : 'Room B · Flat 4B (Blackout — UV Glow Active)'}
          </span>
        </div>

        {/* Interactive Hotspot Pins */}
        {hotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => handleTap(spot.id)}
            aria-label={spot.label}
            style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] px-2.5 py-1.5 rounded-xl border backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold shadow-lg transition-transform active:scale-95 cursor-pointer ${
              spot.attention
                ? 'bg-amber-500 text-zinc-950 border-amber-300 ring-4 ring-amber-400/35'
                : spot.solved
                ? 'bg-[#161A22]/90 text-emerald-300 border-emerald-500/45'
                : 'bg-[#161A22]/90 text-zinc-100 border-white/25 hover:border-amber-400'
            }`}
          >
            {spot.solved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : spot.icon}
            <span className="hidden sm:inline whitespace-nowrap">{spot.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Thumb-Friendly Quick-Inspect Object Grid (guarantees zero missed hotspots on small phones) */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 px-0.5">
          <span>Tap an object in the room or select below to inspect</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {hotspots.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => handleTap(spot.id)}
              className={`min-h-[48px] px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors active:scale-[0.98] cursor-pointer ${
                spot.attention
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-100'
                  : spot.solved
                  ? 'bg-[#161A22] border-emerald-500/30 text-zinc-200'
                  : 'bg-[#161A22] border-white/10 text-zinc-200 hover:border-white/25'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className={spot.attention ? 'text-amber-400' : spot.solved ? 'text-emerald-400' : 'text-zinc-400'}>
                  {spot.icon}
                </span>
                <span className="text-xs font-medium truncate">{spot.shortLabel}</span>
              </span>
              {spot.badge && (
                <span
                  className={`font-mono text-[10px] shrink-0 ${
                    spot.attention ? 'text-amber-300' : spot.solved ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  {spot.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
