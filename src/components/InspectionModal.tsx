import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  CreditCard,
  Delete,
  Eye,
  KeyRound,
  Lock,
  Monitor,
  Power,
  ShieldCheck,
  Sparkles,
  Unlock,
  Wind,
  X,
  Zap
} from 'lucide-react';
import { PlayerRole, RoomState, WireColor } from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';
import { ROOM_ASSETS } from '../utils/roomAssets';
import { HotspotId } from './RoomStage';

interface InspectionModalProps {
  hotspot: HotspotId | null;
  room: RoomState;
  role: PlayerRole;
  onClose: () => void;
  onSwitchHotspot: (id: HotspotId) => void;
  onAction: (type: string, payload?: Record<string, unknown>) => void;
}

function SymbolGlyph({ kind, className = 'w-8 h-8' }: { kind: 'trident' | 'crescent' | 'lotus' | 'surge'; className?: string }) {
  if (kind === 'trident') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <path d="M18 5v26M10 8v7a8 8 0 0 0 16 0V8M10 8l-2.5 3M10 8l2.5 3M26 8l-2.5 3M26 8l2.5 3M18 5l-2.5 3M18 5l2.5 3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'crescent') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <path d="M23.5 7.5A11 11 0 1 0 28.5 23.5A9 9 0 0 1 23.5 7.5Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'lotus') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <path d="M18 7c3.5 5 4.5 9.5 4.5 14a4.5 4.5 0 0 1-9 0c0-4.5 1-9 4.5-14Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M13.5 21C9.5 20.5 6.5 17 6 12c4 .5 7 3 8.5 6.5M22.5 21c4-.5 7-4 7.5-9-4 .5-7 3-8.5 6.5M9 26.5h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path d="M20 5 10 19h8l-2 12 10-14h-8l2-12Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NumericKeypad: React.FC<{
  expectedLength?: number;
  label: string;
  errorText: string | null;
  onSubmit: (code: string) => void;
}> = ({ expectedLength = 4, label, errorText, onSubmit }) => {
  const [digits, setDigits] = useState('');

  const press = (d: string) => {
    soundFx.click();
    if (digits.length < expectedLength) {
      setDigits((prev) => prev + d);
    }
  };

  const backspace = () => {
    soundFx.click();
    setDigits((prev) => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (digits.length < expectedLength) {
      soundFx.error();
      return;
    }
    onSubmit(digits);
    setDigits('');
  };

  return (
    <div className="bg-[#12161E] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
        <span>{label}</span>
        <span className="font-mono">{digits.length}/{expectedLength}</span>
      </div>
      <div className="h-12 rounded-xl bg-[#0E1014] border border-white/15 flex items-center justify-center gap-4 mb-3">
        {Array.from({ length: expectedLength }).map((_, idx) => (
          <span
            key={idx}
            className={`font-mono text-2xl font-bold w-6 text-center ${
              digits[idx] ? 'text-amber-400' : 'text-zinc-600'
            }`}
          >
            {digits[idx] || '·'}
          </span>
        ))}
      </div>

      {errorText && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-xs text-red-300 text-center">
          {errorText}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => press(n)}
            className="min-h-[48px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 active:scale-95 font-mono text-lg font-semibold text-white border border-white/10 transition-transform cursor-pointer"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          aria-label="Backspace"
          className="min-h-[48px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 active:scale-95 text-zinc-300 border border-white/10 flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => press('0')}
          className="min-h-[48px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 active:scale-95 font-mono text-lg font-semibold text-white border border-white/10 cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleEnter}
          disabled={digits.length < expectedLength}
          className="min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 active:scale-95 text-zinc-950 font-semibold text-sm flex items-center justify-center cursor-pointer"
        >
          Enter
        </button>
      </div>
    </div>
  );
};

export const InspectionModal: React.FC<InspectionModalProps> = ({
  hotspot,
  room,
  role,
  onClose,
  onSwitchHotspot,
  onAction
}) => {
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [safeError, setSafeError] = useState<string | null>(null);
  const [junctionFeedback, setJunctionFeedback] = useState<string | null>(null);
  const [selectedWireSlot, setSelectedWireSlot] = useState<number | null>(null);
  const [pinnedLocal, setPinnedLocal] = useState<string | null>(null);

  if (!hotspot) return null;

  const p = room.puzzle;
  const partnerSlot = role === 'P1_SECURITY' ? room.players.P2_STUDY : room.players.P1_SECURITY;
  const mySlot = room.players[role];

  const wireStyles: Record<WireColor, { label: string; bg: string; border: string; text: string }> = {
    AMBER: { label: 'Amber', bg: 'bg-amber-500/20', border: 'border-amber-400', text: 'text-amber-300' },
    TEAL: { label: 'Teal', bg: 'bg-teal-500/20', border: 'border-teal-400', text: 'text-teal-300' },
    CRIMSON: { label: 'Crimson', bg: 'bg-rose-500/20', border: 'border-rose-400', text: 'text-rose-300' }
  };

  const dvrActiveCellMap: Record<number, { cellIndex: number; label: string } | null> = {
    41: { cellIndex: 0, label: 'Top-Left' },
    42: { cellIndex: 4, label: 'Center' },
    43: { cellIndex: 8, label: 'Bottom-Right' },
    44: null,
    45: { cellIndex: 2, label: 'Top-Right' }
  };

  const titles: Record<HotspotId, string> = {
    breaker_panel: 'Master Breaker Panel',
    maintenance_chart: 'Building Maintenance Chart',
    cctv_console: 'CCTV & DVR Override Console',
    security_vent: 'Inter-Room Air Vent Slot',
    security_door: 'Security Booth Exit Door',
    glow_mural: p.studyLightsOn ? 'Flat 4B Plaster Wall' : 'Phosphor Glow Symbols',
    desk_drawer: 'Brass Desk Drawer',
    junction_box: 'Wall Electrical Junction Box',
    calendar_safe: p.calendarTilted ? 'Hidden Wall Safe & Remap' : 'Kapaleeshwarar Temple Calendar',
    study_vent: 'Inter-Room Air Vent Slot',
    study_door: 'Flat 4B Hallway Door'
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[88vh] bg-[#161A22] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Drag Handle (mobile) + Header */}
        <div className="pt-2.5 sm:pt-0 px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-2 sm:hidden" />
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
              {titles[hotspot]}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.click();
              onClose();
            }}
            aria-label="Close inspection"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* 1. BREAKER PANEL (P1) */}
          {hotspot === 'breaker_panel' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Controls emergency power circuits for Floor 4. Cutting Study 4B’s ceiling circuit will plunge your partner’s room into darkness.
              </p>

              <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">4B Study Ceiling Light</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Current State: <strong className={p.studyLightsOn ? 'text-amber-400' : 'text-emerald-400'}>{p.studyLightsOn ? 'ENERGIZED (ON)' : 'CUT (DARKNESS)'}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.breaker();
                    onAction('breaker:toggle_study_lights');
                  }}
                  className={`min-h-[48px] px-5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                    p.studyLightsOn
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{p.studyLightsOn ? 'Cut Lights' : 'Restore Lights'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>4A Corridor Emergency</span>
                <span className="font-mono text-zinc-500">LOCKED ON AUX</span>
              </div>
            </div>
          )}

          {/* 2. MAINTENANCE CHART (P1) */}
          {hotspot === 'maintenance_chart' && (
            <div className="space-y-4">
              <div className="bg-[#F3EFE6] text-zinc-900 rounded-xl p-4 sm:p-5 border border-amber-900/20 shadow-inner">
                <div className="flex items-center justify-between border-b border-zinc-900/15 pb-2.5">
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-zinc-600">MARINA TOWERS · TNEB ARCHIVE</div>
                    <div className="text-base font-bold text-zinc-900">Utility Phosphor Symbol Key</div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-zinc-700">REV 04</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                  {[
                    { kind: 'trident' as const, name: 'Pump Trident', val: 4 },
                    { kind: 'crescent' as const, name: 'Vent Crescent', val: 6 },
                    { kind: 'lotus' as const, name: 'Cistern Lotus', val: 3 },
                    { kind: 'surge' as const, name: 'Surge Bolt', val: 2 }
                  ].map((item) => (
                    <div key={item.name} className="p-2.5 rounded-lg bg-white/75 border border-zinc-900/10 flex items-center gap-2.5">
                      <SymbolGlyph kind={item.kind} className="w-7 h-7 text-zinc-900 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-zinc-900">{item.name}</div>
                        <div className="font-mono text-sm font-bold text-amber-800">Base = {item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900/15">
                  <div className="text-xs font-bold text-zinc-800 mb-2">Directional Arrow Offset</div>
                  <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
                    <div className="p-2 rounded bg-white/75 border border-zinc-900/10">↑ +0</div>
                    <div className="p-2 rounded bg-white/75 border border-zinc-900/10">→ +2</div>
                    <div className="p-2 rounded bg-white/75 border border-zinc-900/10">↓ +4</div>
                    <div className="p-2 rounded bg-white/75 border border-zinc-900/10">← -2</div>
                  </div>
                  <p className="text-xs text-zinc-700 mt-2.5">
                    Digit = Base Value + Arrow Offset. Ask Flat 4B which 4 symbols glow when their lights are off.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFx.click();
                  onAction('clue:add', {
                    id: 'clue-maint-chart',
                    title: 'Maintenance Chart Key',
                    detail: 'Trident=4, Crescent=6, Lotus=3, Surge=2. Offsets: ↑(+0), →(+2), ↓(+4), ←(-2).'
                  });
                  setPinnedLocal('Pinned Maintenance Key to shared Clue Board!');
                  setTimeout(() => setPinnedLocal(null), 2500);
                }}
                className="w-full min-h-[46px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 border border-white/10 text-sm font-medium text-amber-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{pinnedLocal || 'Share Chart Key to Clue Board'}</span>
              </button>
            </div>
          )}

          {/* 3. CCTV & DVR CONSOLE (P1) */}
          {hotspot === 'cctv_console' && (
            <div className="space-y-4">
              {/* Channel Tabs */}
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#0E1014] border border-white/10">
                {([1, 2, 3, 4] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      onAction('cctv:select_channel', { channel: ch });
                    }}
                    className={`min-h-[44px] rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                      p.cctvChannel === ch
                        ? 'bg-amber-500 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    CAM 0{ch}
                  </button>
                ))}
              </div>

              {/* Monitor Screen */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/15 bg-black">
                {p.cctvChannel === 1 && (
                  <>
                    <img
                      src={ROOM_ASSETS.cctvHallway}
                      alt="CAM 01 Hallway Feed"
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-all ${
                        p.cctvNightVision ? 'sepia brightness-110 contrast-125 hue-rotate-90' : 'brightness-90'
                      }`}
                    />
                    <div className="crt-scanlines pointer-events-none absolute inset-0" />
                    <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-black/75 text-white">
                        CAM 01 · HALLWAY 4F
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded bg-black/75 font-semibold ${
                          p.dvrOffsetFixed ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {p.dvrOffsetFixed
                          ? '21:40:00 · LIVE'
                          : p.puzzle2Solved
                          ? `21:${p.dvrMinute}:00 · DVR (+05:00)`
                          : '21:45:00 · +05:00 OFFSET'}
                      </span>
                    </div>

                    {/* DVR Guard Keypad Replay Overlay when Puzzle 2 Solved */}
                    {p.puzzle2Solved && !p.dvrOffsetFixed && (
                      <div className="absolute bottom-2.5 right-3 bg-black/85 border border-amber-500/40 rounded-lg p-2.5">
                        <div className="font-mono text-[10px] text-amber-300 mb-1.5">
                          GUARD KEYPAD TAP · 21:{p.dvrMinute}
                        </div>
                        <div className="grid grid-cols-3 gap-1 w-20 mx-auto">
                          {Array.from({ length: 9 }).map((_, idx) => {
                            const active = dvrActiveCellMap[p.dvrMinute]?.cellIndex === idx;
                            return (
                              <div
                                key={idx}
                                className={`h-5 rounded border ${
                                  active
                                    ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                                    : 'bg-zinc-900 border-zinc-700'
                                }`}
                              />
                            );
                          })}
                        </div>
                        <div className="font-mono text-[10px] text-center text-zinc-300 mt-1">
                          {dvrActiveCellMap[p.dvrMinute]?.label || 'No tap'}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {p.cctvChannel === 2 && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative bg-[#0B0D11]">
                    <div className="crt-scanlines pointer-events-none absolute inset-0" />
                    {!p.fuseInserted ? (
                      <div className="text-xs font-mono text-zinc-400">
                        NO SIGNAL · 4B JUNCTION FUSE MISSING
                      </div>
                    ) : (
                      <div className="relative z-10 w-full max-w-xs">
                        <div className="font-mono text-[11px] text-zinc-400 mb-2">
                          CAM 02 · CORRIDOR MIRROR REFLECTION
                        </div>
                        <div className="p-4 rounded-xl bg-amber-100/95 text-zinc-900 border-2 border-amber-400 shadow-lg">
                          <div className="-scale-x-100 font-mono text-base font-bold tracking-wider">
                            SWAP AMBER ↔ TEAL
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 mt-2.5">
                          Sticky note outside Flat 4B viewed through the angled hallway mirror.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {p.cctvChannel === 3 && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative bg-[#07090C]">
                    <div className="crt-scanlines pointer-events-none absolute inset-0" />
                    {!p.fuseInserted ? (
                      <div className="text-xs font-mono text-zinc-400">
                        NO SIGNAL · 4B JUNCTION FUSE MISSING
                      </div>
                    ) : !p.cctvNightVision ? (
                      <div className="relative z-10 space-y-2">
                        <div className="font-mono text-xs text-zinc-300">
                          CAM 03 · METER CLOSET (PITCH DARK)
                        </div>
                        <p className="text-xs text-zinc-400 max-w-xs">
                          Conduit gauge plate is unlit. Toggle IR Night Vision below to read the markings.
                        </p>
                      </div>
                    ) : (
                      <div className="relative z-10 w-full max-w-xs p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 font-mono">
                        <div className="text-[11px] text-emerald-400 mb-2">
                          IR ACTIVE · 240V CONDUIT TARGET
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { id: 'A', dir: 'UP' },
                            { id: 'B', dir: 'DOWN' },
                            { id: 'C', dir: 'UP' },
                            { id: 'D', dir: 'UP' }
                          ].map((sw) => (
                            <div key={sw.id} className="p-2 rounded bg-black/50 border border-emerald-500/40">
                              <div className="text-xs font-bold">{sw.id}</div>
                              <div className="text-[11px] text-emerald-300 mt-0.5">{sw.dir}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {p.cctvChannel === 4 && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative bg-[#0B0D11]">
                    <div className="crt-scanlines pointer-events-none absolute inset-0" />
                    {!p.fuseInserted ? (
                      <div className="text-xs font-mono text-zinc-400">
                        NO SIGNAL · 4B JUNCTION FUSE MISSING
                      </div>
                    ) : (
                      <div className="relative z-10 space-y-1.5 font-mono">
                        <div className="text-xs text-zinc-400">CAM 04 · DOOR 4B MAGLOCK SENSOR</div>
                        <div className={`text-lg font-bold ${p.dvrOffsetFixed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {p.dvrOffsetFixed ? 'ARMED — READY FOR DUAL HOLD' : 'LOCKED — AUX LOOP ACTIVE'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* IR Toggle */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.click();
                    onAction('cctv:toggle_ir');
                  }}
                  className={`min-h-[44px] px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    p.cctvNightVision
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-[#1E2430] border-white/10 text-zinc-200 hover:border-white/25'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>IR Night Vision: {p.cctvNightVision ? 'ON' : 'OFF'}</span>
                </button>

                {p.puzzle2Solved && !p.dvrOffsetFixed && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      onAction('clue:add', {
                        id: 'clue-dvr-sequence',
                        title: 'DVR Guard Keypad Sequence',
                        detail: '21:41 Top-Left → 21:42 Center → 21:43 Bottom-Right → 21:45 Top-Right.'
                      });
                      setPinnedLocal('Pinned DVR Sequence!');
                      setTimeout(() => setPinnedLocal(null), 2000);
                    }}
                    className="min-h-[44px] px-3.5 rounded-xl bg-[#1E2430] border border-white/10 text-xs font-medium text-amber-300 cursor-pointer"
                  >
                    {pinnedLocal || 'Pin DVR Pattern'}
                  </button>
                )}
              </div>

              {/* DVR Replay Scrubber (Unlocked after Puzzle 2) */}
              {p.puzzle2Solved && !p.dvrOffsetFixed && (
                <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">CAM 01 DVR Replay Scrubber</span>
                    <span className="font-mono text-amber-400">21:{p.dvrMinute}:00</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([41, 42, 43, 44, 45] as const).map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => {
                          soundFx.click();
                          onAction('cctv:scrub_dvr', { minute: min });
                        }}
                        className={`min-h-[44px] rounded-lg font-mono text-xs font-semibold border transition-colors cursor-pointer ${
                          p.dvrMinute === min
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-300'
                            : 'bg-[#1E2430] text-zinc-300 border-white/10 hover:border-white/25'
                        }`}
                      >
                        21:{min}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Scrub across 21:41–21:45 on CAM 01 to watch which 4 keypad positions the night guard pressed.
                  </p>
                </div>
              )}

              {/* Keycard & Clock Offset Override (Stage 4) */}
              {(p.keycardLocation === 'SECURITY_DESK' || p.keycardLocation === 'INSERTED') && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                    <CreditCard className="w-4 h-4" />
                    <span>DVR Override Terminal</span>
                  </div>

                  {p.keycardLocation === 'SECURITY_DESK' ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.unlock();
                        onAction('override:insert_keycard');
                      }}
                      className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
                    >
                      Insert Security Override Keycard
                    </button>
                  ) : !p.dvrOffsetFixed ? (
                    <div className="space-y-2.5">
                      <p className="text-xs text-zinc-300">
                        Keycard verified. The supervisor forced the DVR clock +05:00 ahead to loop an empty hallway. Reset to LIVE time to arm both corridor maglocks.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.unlock();
                          onAction('override:reset_clock');
                        }}
                        className="w-full min-h-[48px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer"
                      >
                        Reset Clock Offset (-05:00 → 21:40 LIVE)
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-emerald-300 font-medium">
                        Clock restored to LIVE · Maglocks ARMED!
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.click();
                          onSwitchHotspot('security_door');
                        }}
                        className="min-h-[44px] px-4 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-xs cursor-pointer"
                      >
                        Go to Exit Door
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. AIR VENTS (P1 & P2) */}
          {(hotspot === 'security_vent' || hotspot === 'study_vent') && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                A narrow steel air-return slot linking Flat 4B directly with the Security Booth next door. Small flat items can slide through.
              </p>

              {role === 'P2_STUDY' ? (
                p.keycardLocation === 'SAFE' && p.wallSafeOpen ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.unlock();
                      onAction('vent:pass_keycard');
                    }}
                    className="w-full min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wind className="w-4 h-4" />
                    <span>Slide Security Override Keycard Through Vent</span>
                  </button>
                ) : p.keycardLocation === 'SECURITY_DESK' || p.keycardLocation === 'INSERTED' ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-sm text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Keycard delivered to Security Booth! Tell your partner to check their CCTV Console.</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
                    You don’t have anything thin enough to pass through the vent yet.
                  </div>
                )
              ) : p.keycardLocation === 'SECURITY_DESK' ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-3">
                  <div className="text-sm font-semibold text-amber-300">
                    Security Override Keycard Arrived!
                  </div>
                  <p className="text-xs text-zinc-300">
                    Your partner slid the magnetic card through from Flat 4B. Take it to your CCTV & DVR Console.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      onSwitchHotspot('cctv_console');
                    }}
                    className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Open CCTV & DVR Console</span>
                  </button>
                </div>
              ) : p.keycardLocation === 'INSERTED' ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-sm text-emerald-300">
                  Keycard already collected and inserted into the DVR Override Console.
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
                  Air vent tray is empty. If Flat 4B finds a keycard or slim pass, they can slide it here.
                </div>
              )}
            </div>
          )}

          {/* 5. GLOW MURAL (P2) */}
          {hotspot === 'glow_mural' && (
            <div className="space-y-4">
              {p.studyLightsOn ? (
                <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 space-y-2">
                  <div className="text-sm font-semibold text-white">Too Bright to Read</div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Faint luminescent chalk marks cover the plaster wall, but the flickering emergency tube washes them out. Ask Security to cut Study 4B’s ceiling circuit!
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-[#070A0D] border border-emerald-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span>PHOSPHOR WALL MARKINGS (LEFT TO RIGHT)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { num: '1', kind: 'trident' as const, name: 'Trident', arrow: <ArrowUp className="w-5 h-5" />, dir: 'UP (↑)' },
                        { num: '2', kind: 'crescent' as const, name: 'Crescent', arrow: <ArrowRight className="w-5 h-5" />, dir: 'RIGHT (→)' },
                        { num: '3', kind: 'lotus' as const, name: 'Lotus', arrow: <ArrowLeft className="w-5 h-5" />, dir: 'LEFT (←)' },
                        { num: '4', kind: 'surge' as const, name: 'Surge', arrow: <ArrowDown className="w-5 h-5" />, dir: 'DOWN (↓)' }
                      ].map((item) => (
                        <div
                          key={item.num}
                          className="p-3 rounded-xl bg-emerald-950/35 border border-emerald-400/30 flex flex-col items-center text-center text-emerald-300 phosphor-glow"
                        >
                          <span className="font-mono text-[10px] text-emerald-400/80 mb-1">#{item.num}</span>
                          <SymbolGlyph kind={item.kind} className="w-9 h-9" />
                          <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold">
                            {item.arrow}
                          </div>
                          <div className="text-[11px] mt-0.5 text-emerald-200">{item.name} · {item.dir}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      onAction('clue:add', {
                        id: 'clue-glow-symbols',
                        title: 'Flat 4B Glow Wall Symbols',
                        detail: '1. Trident ↑ · 2. Crescent → · 3. Lotus ← · 4. Surge ↓'
                      });
                      setPinnedLocal('Pinned symbols to shared Clue Board!');
                      setTimeout(() => setPinnedLocal(null), 2500);
                    }}
                    className="w-full min-h-[48px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{pinnedLocal || 'Pin Symbols to Clue Board'}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* 6. BRASS DESK DRAWER (P2) */}
          {hotspot === 'desk_drawer' && (
            <div className="space-y-4">
              {!p.deskDrawerOpen ? (
                <>
                  <p className="text-sm text-zinc-300">
                    Locked with a 4-digit brass keypad. Security’s Maintenance Chart decodes the glowing wall symbols into these 4 digits.
                  </p>
                  <NumericKeypad
                    label="Desk Drawer Code"
                    errorText={drawerError}
                    onSubmit={(code) => {
                      if (code === '4816') {
                        soundFx.unlock();
                        setDrawerError(null);
                        onAction('drawer:submit_code', { code });
                      } else {
                        soundFx.error();
                        setDrawerError('Incorrect code — double check symbol base values and arrow offsets.');
                      }
                    }}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 flex items-center gap-3">
                    <Unlock className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-emerald-300">Drawer Open (4816)</div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Collected 15A Reserve Fuse and Corridor Mirror Polaroid.
                      </p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-300 leading-relaxed">
                    <strong>Polaroid Note:</strong> “Insert 15A fuse in Wall Junction Box. Security must check CAM 02 mirror & CAM 03 IR mode to balance 240V.”
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. WALL JUNCTION BOX (P2) */}
          {hotspot === 'junction_box' && (
            <div className="space-y-4">
              {!p.fuseInserted ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">
                    The main 15A cartridge slot is empty, cutting power to the corridor cameras and wall safe.
                  </p>
                  {p.deskDrawerOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.unlock();
                        onAction('junction:insert_fuse');
                      }}
                      className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Insert 15A Reserve Fuse</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
                      Unlock the Brass Desk Drawer first to find a 15A Reserve Fuse.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                    <span>15A Reserve Fuse Seated</span>
                    <span className="font-mono font-semibold">{p.puzzle2Solved ? '240V BALANCED' : 'RELAY STANDBY'}</span>
                  </div>

                  {/* 4 Toggle Switches */}
                  <div>
                    <div className="text-xs font-medium text-zinc-300 mb-2">
                      Conduit Switches (Read target on CAM 03 IR)
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((label, idx) => {
                        const isUp = p.junctionSwitches[idx];
                        return (
                          <button
                            key={label}
                            type="button"
                            disabled={p.puzzle2Solved}
                            onClick={() => {
                              soundFx.breaker();
                              onAction('junction:toggle_switch', { index: idx });
                            }}
                            className={`min-h-[68px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              isUp
                                ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                                : 'bg-[#12161E] border-white/15 text-zinc-400'
                            }`}
                          >
                            <span className="font-mono text-xs font-bold">{label}</span>
                            <span className="font-mono text-[11px] font-semibold">
                              {isUp ? '▲ UP' : '▼ DOWN'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3 Jumper Wires */}
                  <div>
                    <div className="text-xs font-medium text-zinc-300 mb-2">
                      Jumper Wires (Tap two slots to swap · Check CAM 02 Mirror)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {p.wireOrder.map((color, idx) => {
                        const st = wireStyles[color];
                        const isSelected = selectedWireSlot === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={p.puzzle2Solved}
                            onClick={() => {
                              soundFx.click();
                              if (selectedWireSlot === null) {
                                setSelectedWireSlot(idx);
                              } else if (selectedWireSlot === idx) {
                                setSelectedWireSlot(null);
                              } else {
                                onAction('junction:swap_wires', { indexA: selectedWireSlot, indexB: idx });
                                setSelectedWireSlot(null);
                              }
                            }}
                            className={`min-h-[54px] rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${st.bg} ${st.border} ${
                              isSelected ? 'ring-2 ring-white scale-[1.03]' : ''
                            }`}
                          >
                            <span className="font-mono text-[10px] text-zinc-300">PORT {idx + 1}</span>
                            <span className={`text-xs font-bold ${st.text}`}>{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {junctionFeedback && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-xs text-red-300 text-center">
                      {junctionFeedback}
                    </div>
                  )}

                  {!p.puzzle2Solved ? (
                    <button
                      type="button"
                      onClick={() => {
                        const okSwitches =
                          p.junctionSwitches[0] === true &&
                          p.junctionSwitches[1] === false &&
                          p.junctionSwitches[2] === true &&
                          p.junctionSwitches[3] === true;
                        const okWires =
                          p.wireOrder[0] === 'TEAL' &&
                          p.wireOrder[1] === 'AMBER' &&
                          p.wireOrder[2] === 'CRIMSON';
                        if (okSwitches && okWires) {
                          soundFx.unlock();
                          setJunctionFeedback(null);
                          onAction('junction:engage');
                        } else {
                          soundFx.error();
                          setJunctionFeedback('Relay tripped! Verify switches on CAM 03 (IR ON) and wire swap on CAM 02 Mirror.');
                        }
                      }}
                      className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
                    >
                      Engage 240V Relay
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 font-medium text-center">
                      Relay engaged! A heavy bolt clicked behind the Mylapore Calendar.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 8. MYLAPORE CALENDAR & WALL SAFE (P2) */}
          {hotspot === 'calendar_safe' && (
            <div className="space-y-4">
              {!p.calendarTilted ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    A vintage Kapaleeshwarar Temple, Mylapore wall calendar hangs slightly crooked over an indentation in the plaster.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      onAction('calendar:tilt');
                    }}
                    className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
                  >
                    Tilt Calendar Aside
                  </button>
                </div>
              ) : !p.puzzle2Solved ? (
                <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-sm text-zinc-300">
                  Behind the calendar is a recessed Brass Wall Safe, currently unpowered. Balance the 240V Wall Junction Box first!
                </div>
              ) : !p.wallSafeOpen ? (
                <div className="space-y-4">
                  {/* Scrambled Keypad Remap Diagram */}
                  <div className="bg-[#F3EFE6] text-zinc-900 rounded-xl p-4 border border-amber-900/20">
                    <div className="text-xs font-bold uppercase tracking-wide text-zinc-700 mb-1">
                      Scrambled Hallway Keypad Map
                    </div>
                    <p className="text-xs text-zinc-700 mb-3">
                      Match the 4 positions Security sees on CAM 01’s DVR replay onto this 3×3 map:
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-w-[190px] mx-auto">
                      {[9, 3, 7, 4, 5, 1, 8, 6, 2].map((num) => (
                        <div
                          key={num}
                          className="h-11 rounded-lg bg-white border border-zinc-900/20 font-mono text-base font-bold flex items-center justify-center shadow-sm"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  <NumericKeypad
                    label="Wall Safe Combination"
                    errorText={safeError}
                    onSubmit={(code) => {
                      if (code === '9527') {
                        soundFx.unlock();
                        setSafeError(null);
                        onAction('safe:submit_code', { code });
                      } else {
                        soundFx.error();
                        setSafeError('Safe remained locked. Match DVR tap positions (21:41 → 21:45) to this 3×3 grid.');
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                      <ShieldCheck className="w-5 h-5" />
                      <span>Wall Safe Open (9527)</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <strong>Supervisor Memo:</strong> “Set DVR clock +05:00 ahead to loop empty hallway 21:40–21:45 during transfer. Insert Override Keycard at Security Desk and reset clock to release maglocks.”
                    </p>
                  </div>
                  {p.keycardLocation === 'SAFE' && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.click();
                        onSwitchHotspot('study_vent');
                      }}
                      className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wind className="w-4 h-4" />
                      <span>Go to Air Vent to Pass Keycard</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 9. EXIT DOORS (COORDINATED FINALE) */}
          {(hotspot === 'security_door' || hotspot === 'study_door') && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {p.dvrOffsetFixed ? (
                    <Unlock className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {role === 'P1_SECURITY' ? 'Security Booth Steel Door' : 'Flat 4B Corridor Door'}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Maglock Status:{' '}
                      <strong className={p.dvrOffsetFixed ? 'text-emerald-400' : 'text-amber-400'}>
                        {p.dvrOffsetFixed ? 'ARMED — READY FOR DUAL HOLD' : 'LOCKED BY +05:00 LOOP'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {!p.dvrOffsetFixed ? (
                <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-300 leading-relaxed space-y-2">
                  <p>
                    Both doors are held by synchronized magnetic fire-locks until the Security Override Keycard is inserted and the DVR +05:00 loop is reset to LIVE.
                  </p>
                  {role === 'P1_SECURITY' && p.keycardLocation === 'SECURITY_DESK' && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.click();
                        onSwitchHotspot('cctv_console');
                      }}
                      className="w-full min-h-[44px] mt-2 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-xs cursor-pointer"
                    >
                      Open CCTV Console to Insert Keycard
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span>Your Latch ({role === 'P1_SECURITY' ? 'Lock A' : 'Lock B'})</span>
                      <span className="font-mono font-semibold">
                        {mySlot?.holdingLatch ? 'HOLDING' : 'IDLE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Partner ({partnerSlot?.name || 'Partner'})</span>
                      <span className="font-mono font-semibold">
                        {partnerSlot?.holdingLatch ? 'HOLDING' : 'WAITING'}
                      </span>
                    </div>
                  </div>

                  {/* Live Dual Hold Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Synchronized Release Progress</span>
                      <span className="font-mono text-emerald-400">
                        {Math.round(p.dualHoldProgress * 100)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-[#0E1014] border border-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-150"
                        style={{ width: `${Math.round(p.dualHoldProgress * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Large Touch-Safe Hold Button */}
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      soundFx.click();
                      onAction('latch:hold', { holding: true });
                    }}
                    onPointerUp={() => onAction('latch:hold', { holding: false })}
                    onPointerLeave={() => {
                      if (mySlot?.holdingLatch) onAction('latch:hold', { holding: false });
                    }}
                    onPointerCancel={() => onAction('latch:hold', { holding: false })}
                    className={`w-full min-h-[72px] rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 touch-none select-none transition-all cursor-pointer ${
                      mySlot?.holdingLatch
                        ? 'bg-emerald-500 text-zinc-950 scale-[0.98] ring-4 ring-emerald-400/40'
                        : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                    }`}
                  >
                    <KeyRound className="w-5 h-5" />
                    <span>
                      {mySlot?.holdingLatch
                        ? partnerSlot?.holdingLatch
                          ? 'BOTH HOLDING — KEEP PRESSING!'
                          : 'HOLDING — WAITING FOR PARTNER…'
                        : 'PRESS & HOLD TO RELEASE MAGLOCK'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
