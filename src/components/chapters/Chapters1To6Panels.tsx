import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  Droplets,
  Eye,
  Flame,
  KeyRound,
  Lock,
  Monitor,
  Power,
  Radio,
  Scale,
  Sparkles,
  Unlock,
  Wind,
  Zap
} from 'lucide-react';
import { PlayerRole, RoomState, WireColor } from '../../shared/gameTypes';
import { ROOF_PIPE_GRID, evaluatePipeFlow, getPipeOpenings } from '../../shared/pipeGrid';
import { soundFx } from '../../utils/soundFx';
import { ROOM_ASSETS } from '../../utils/roomAssets';
import {
  DialRingTumbler,
  DraggableSliderTrack,
  NumericKeypad,
  RotaryDialWheel,
  ScrewPlateCover,
  UVSpotlightSurface
} from '../TactileWidgets';

function SymbolGlyph({
  kind,
  className = 'w-8 h-8'
}: {
  kind: 'trident' | 'crescent' | 'lotus' | 'surge';
  className?: string;
}) {
  if (kind === 'trident') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <path
          d="M18 5v26M10 8v7a8 8 0 0 0 16 0V8M10 8l-2.5 3M10 8l2.5 3M26 8l-2.5 3M26 8l2.5 3M18 5l-2.5 3M18 5l2.5 3"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'crescent') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <path
          d="M23.5 7.5A11 11 0 1 0 28.5 23.5A9 9 0 0 1 23.5 7.5Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'lotus') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <path
          d="M18 7c3.5 5 4.5 9.5 4.5 14a4.5 4.5 0 0 1-9 0c0-4.5 1-9 4.5-14Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 21C9.5 20.5 6.5 17 6 12c4 .5 7 3 8.5 6.5M22.5 21c4-.5 7-4 7.5-9-4 .5-7 3-8.5 6.5M9 26.5h18"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 5 10 19h8l-2 12 10-14h-8l2-12Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PanelProps {
  hotspot: string;
  room: RoomState;
  role: PlayerRole;
  onAction: (type: string, payload?: Record<string, unknown>) => void;
}

export const Chapters1To6Panels: React.FC<PanelProps> = ({ hotspot, room, role, onAction }) => {
  const p = room.puzzle;
  const equipped = room.equipped[role];

  // Local tactile states for dials/sliders before lock
  const [ch1Dial, setCh1Dial] = useState(['0', '0', '0', '0']);
  const [ch1DialErr, setCh1DialErr] = useState<string | null>(null);
  const [blotterSlide, setBlotterSlide] = useState(p.ch1BlotterSlid ? 100 : 0);
  const [selectedWire, setSelectedWire] = useState<number | null>(null);
  const [relayError, setRelayError] = useState<string | null>(null);

  const [ch2ChuteVal, setCh2ChuteVal] = useState(p.ch2ChuteSlid ? 100 : 0);
  const [ch2Padlock, setCh2Padlock] = useState(['0', '0', '0']);
  const [ch2PadErr, setCh2PadErr] = useState<string | null>(null);
  const [ch2GateErr, setCh2GateErr] = useState<string | null>(null);

  const [brakeSlide, setBrakeSlide] = useState(p.ch3BrakeReleased ? 100 : 0);
  const [selectedLoom, setSelectedLoom] = useState<number | null>(null);
  const [loomErr, setLoomErr] = useState<string | null>(null);

  const [chestErr, setChestErr] = useState<string | null>(null);
  const [pinnedLocal, setPinnedLocal] = useState<string | null>(null);

  const pinClue = (id: string, title: string, detail: string) => {
    soundFx.click();
    onAction('clue:add', { id, title, detail });
    setPinnedLocal('Pinned to Shared Clue Board!');
    setTimeout(() => setPinnedLocal(null), 2000);
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 1
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch1_breaker') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-300 leading-relaxed">
          Controls Floor 4 lighting power. Plunge Flat 4B into darkness so faint phosphor utility symbols become visible on your partner’s plaster wall.
        </p>
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Flat 4B Ceiling Light</div>
            <div className="text-xs text-zinc-400 mt-0.5">
              State:{' '}
              <strong className={p.ch1LightsOn ? 'text-amber-400' : 'text-emerald-400'}>
                {p.ch1LightsOn ? 'ENERGIZED (ON)' : 'CUT (BLACKOUT)'}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.breaker();
              onAction('ch1:toggle_lights');
            }}
            className={`min-h-[48px] px-5 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer ${
              p.ch1LightsOn
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{p.ch1LightsOn ? 'Cut Lights' : 'Restore Lights'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (hotspot === 'ch1_chart') {
    return (
      <div className="space-y-4">
        <div className="bg-[#F3EFE6] text-zinc-900 rounded-xl p-4 border border-amber-900/20">
          <div className="flex items-center justify-between border-b border-zinc-900/15 pb-2">
            <div>
              <div className="text-[11px] font-semibold text-zinc-600">MARINA TOWERS · TNEB ARCHIVE</div>
              <div className="text-base font-bold">Utility Phosphor Symbol Key</div>
            </div>
            <span className="font-mono text-xs font-bold">REV 04</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { kind: 'trident' as const, name: 'Pump Trident', val: 4 },
              { kind: 'crescent' as const, name: 'Vent Crescent', val: 6 },
              { kind: 'lotus' as const, name: 'Cistern Lotus', val: 3 },
              { kind: 'surge' as const, name: 'Surge Bolt', val: 2 }
            ].map((item) => (
              <div key={item.name} className="p-2 rounded-lg bg-white/80 border border-zinc-900/10 flex items-center gap-2">
                <SymbolGlyph kind={item.kind} className="w-6 h-6 text-zinc-900 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">{item.name}</div>
                  <div className="font-mono text-xs font-bold text-amber-800">Base = {item.val}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-900/15 grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
            <div className="p-1.5 rounded bg-white/80">↑ +0</div>
            <div className="p-1.5 rounded bg-white/80">→ +2</div>
            <div className="p-1.5 rounded bg-white/80">↓ +4</div>
            <div className="p-1.5 rounded bg-white/80">← -2</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            pinClue(
              'clue-ch1-chart',
              'Maintenance Chart Key',
              'Trident=4, Crescent=6, Lotus=3, Surge=2. Offsets: ↑(+0), →(+2), ↓(+4), ←(-2).'
            )
          }
          className="w-full min-h-[46px] rounded-xl bg-[#1E2430] border border-white/10 text-sm font-medium text-amber-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{pinnedLocal || 'Share Chart Key to Clue Board'}</span>
        </button>
      </div>
    );
  }

  if (hotspot === 'ch1_cctv') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#0E1014] border border-white/10">
          {([1, 2, 3, 4] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => {
                soundFx.click();
                onAction('ch1:select_cctv', { channel: ch });
              }}
              className={`min-h-[42px] rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                p.ch1CctvChannel === ch ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              CAM 0{ch}
            </button>
          ))}
        </div>

        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/15 bg-black">
          {p.ch1CctvChannel === 1 && (
            <>
              <img
                src={ROOM_ASSETS.cctvHallway}
                alt="CAM 01 Hallway"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="crt-scanlines pointer-events-none absolute inset-0" />
              <div className="absolute top-2.5 left-3 right-3 flex justify-between font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-black/75 text-white">CAM 01 · HALLWAY 4F</span>
                <span className="px-2 py-0.5 rounded bg-black/75 text-amber-400">21:45:00 (+05:00)</span>
              </div>
            </>
          )}
          {p.ch1CctvChannel === 2 && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative bg-[#0B0D11]">
              <div className="crt-scanlines pointer-events-none absolute inset-0" />
              {!p.ch1FuseInserted ? (
                <div className="font-mono text-xs text-zinc-400">NO SIGNAL · 15A FUSE MISSING IN 4B</div>
              ) : (
                <div className="relative z-10 space-y-2">
                  <div className="font-mono text-[11px] text-zinc-400">CAM 02 · HALLWAY MIRROR STICKY NOTE</div>
                  <div className="p-3.5 rounded-xl bg-amber-100 text-zinc-900 border-2 border-amber-400">
                    <div className="-scale-x-100 font-mono text-base font-bold tracking-wider">
                      SWAP AMBER ↔ TEAL
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {p.ch1CctvChannel === 3 && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative bg-[#07090C]">
              <div className="crt-scanlines pointer-events-none absolute inset-0" />
              {!p.ch1FuseInserted ? (
                <div className="font-mono text-xs text-zinc-400">NO SIGNAL · 15A FUSE MISSING IN 4B</div>
              ) : !p.ch1CctvIR ? (
                <div className="font-mono text-xs text-zinc-400">PITCH DARK · TOGGLE IR NIGHT VISION</div>
              ) : (
                <div className="relative z-10 w-full max-w-xs p-3 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 font-mono">
                  <div className="text-[11px] text-emerald-400 mb-2">IR ACTIVE · 240V SWITCH TARGET</div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      { k: 'A', v: 'UP' },
                      { k: 'B', v: 'DOWN' },
                      { k: 'C', v: 'UP' },
                      { k: 'D', v: 'UP' }
                    ].map((s) => (
                      <div key={s.k} className="p-1.5 rounded bg-black/50 border border-emerald-500/40">
                        <div className="font-bold">{s.k}</div>
                        <div className="text-[10px]">{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {p.ch1CctvChannel === 4 && (
            <div className="w-full h-full flex items-center justify-center p-4 font-mono text-xs text-zinc-300 bg-[#0B0D11]">
              {!p.ch1FuseInserted
                ? 'NO SIGNAL · 15A FUSE MISSING IN 4B'
                : 'CAM 04 · CRAWLSPACE LOCK: BALANCE 240V RELAY TO RELEASE'}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.click();
            onAction('ch1:toggle_ir');
          }}
          className={`w-full min-h-[44px] px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
            p.ch1CctvIR
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
              : 'bg-[#1E2430] border-white/10 text-zinc-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>IR Night Vision: {p.ch1CctvIR ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    );
  }

  if (hotspot === 'ch1_mural') {
    return (
      <div className="space-y-4">
        {p.ch1LightsOn ? (
          <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-sm text-zinc-400 leading-relaxed">
            Faint chalk markings cover the plaster wall, but the overhead emergency light washes them out. Ask Security to cut Study 4B’s ceiling circuit!
          </div>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-[#070A0D] border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>PHOSPHOR WALL SYMBOLS (LEFT → RIGHT)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { num: '1', kind: 'trident' as const, name: 'Trident', arrow: <ArrowUp className="w-4 h-4" />, dir: '↑' },
                  { num: '2', kind: 'crescent' as const, name: 'Crescent', arrow: <ArrowRight className="w-4 h-4" />, dir: '→' },
                  { num: '3', kind: 'lotus' as const, name: 'Lotus', arrow: <ArrowLeft className="w-4 h-4" />, dir: '←' },
                  { num: '4', kind: 'surge' as const, name: 'Surge', arrow: <ArrowDown className="w-4 h-4" />, dir: '↓' }
                ].map((item) => (
                  <div
                    key={item.num}
                    className="p-3 rounded-xl bg-emerald-950/35 border border-emerald-400/30 flex flex-col items-center text-emerald-300 phosphor-glow"
                  >
                    <span className="font-mono text-[10px]">#{item.num}</span>
                    <SymbolGlyph kind={item.kind} className="w-8 h-8" />
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold">
                      {item.arrow}
                      <span>{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onAction('ch1:scan_mural');
                pinClue('clue-ch1-symbols', '4B Glow Wall Symbols', '1. Trident ↑ · 2. Crescent → · 3. Lotus ← · 4. Surge ↓');
              }}
              className="w-full min-h-[46px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{pinnedLocal || 'Pin Glowing Symbols to Clue Board'}</span>
            </button>
          </>
        )}
      </div>
    );
  }

  if (hotspot === 'ch1_blotter_drawer') {
    return (
      <div className="space-y-4">
        <DraggableSliderTrack
          label="Leather Desk Blotter"
          hint="Slide the heavy leather blotter right to check underneath."
          value={p.ch1BlotterSlid ? 100 : blotterSlide}
          threshold={85}
          completed={p.ch1BlotterSlid}
          onChange={(v) => {
            setBlotterSlide(v);
            if (v >= 85 && !p.ch1BlotterSlid) {
              soundFx.unlock();
              onAction('ch1:slide_blotter');
            }
          }}
        />

        {!p.ch1DrawerOpen ? (
          <div className="space-y-2">
            <div className="text-xs text-zinc-300">
              Spin the 4 brass combination rings using the decoded Glow Wall symbols:
            </div>
            <DialRingTumbler
              rings={['#1', '#2', '#3', '#4']}
              values={ch1Dial}
              onChange={(vals) => {
                setCh1Dial(vals);
                setCh1DialErr(null);
              }}
              unlockLabel="Pull Brass Desk Drawer"
              errorText={ch1DialErr}
              onUnlock={(code) => {
                if (code === '4816') {
                  soundFx.unlock();
                  onAction('ch1:unlock_drawer', { code });
                } else {
                  soundFx.error();
                  setCh1DialErr('Brass latch didn’t budge — check Base + Arrow offsets.');
                }
              }}
            />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300 space-y-1">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Unlock className="w-4 h-4" /> Drawer Unlocked (4816)
            </div>
            <p className="text-zinc-300">
              Collected 15A Ceramic Fuse and 6mm Brass Flathead Shaft. Combine Screwdriver Handle + Flathead Shaft in your Field Bag!
            </p>
          </div>
        )}
      </div>
    );
  }

  if (hotspot === 'ch1_junction') {
    const wireStyles: Record<WireColor, { label: string; bg: string; border: string; text: string }> = {
      AMBER: { label: 'Amber', bg: 'bg-amber-500/20', border: 'border-amber-400', text: 'text-amber-300' },
      TEAL: { label: 'Teal', bg: 'bg-teal-500/20', border: 'border-teal-400', text: 'text-teal-300' },
      CRIMSON: { label: 'Crimson', bg: 'bg-rose-500/20', border: 'border-rose-400', text: 'text-rose-300' }
    };

    if (!p.ch1ScrewsRemoved.every(Boolean)) {
      return (
        <ScrewPlateCover
          title="Bolted Junction Steel Plate"
          screwsRemoved={p.ch1ScrewsRemoved}
          requiresToolName="Brass Flathead Screwdriver"
          hasToolEquipped={equipped === 'brass_screwdriver'}
          onUnscrew={(idx) => onAction('ch1:unscrew_bolt', { index: idx })}
        />
      );
    }

    if (!p.ch1FuseInserted) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Cover removed! The 15A fuse clip inside is empty, keeping CAM 02–04 dark.
          </p>
          {p.ch1DrawerOpen ? (
            <button
              type="button"
              onClick={() => {
                soundFx.unlock();
                onAction('ch1:insert_fuse');
              }}
              className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Insert 15A Ceramic Fuse</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
              Unlock the Brass Desk Drawer to retrieve a 15A Fuse first.
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <div className="text-xs font-medium text-zinc-300 mb-2">
            Conduit Switches (Target on CAM 03 IR)
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['A', 'B', 'C', 'D'] as const).map((lbl, idx) => (
              <button
                key={lbl}
                type="button"
                onClick={() => {
                  soundFx.breaker();
                  onAction('ch1:toggle_switch', { index: idx });
                }}
                className={`min-h-[64px] rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  p.ch1Switches[idx]
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-[#12161E] border-white/15 text-zinc-400'
                }`}
              >
                <span className="font-mono text-xs font-bold">{lbl}</span>
                <span className="font-mono text-[11px]">{p.ch1Switches[idx] ? '▲ UP' : '▼ DOWN'}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-zinc-300 mb-2">
            Jumper Wires (Tap two slots to swap · Check CAM 02 Mirror)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {p.ch1Wires.map((color, idx) => {
              const st = wireStyles[color];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundFx.click();
                    if (selectedWire === null) setSelectedWire(idx);
                    else if (selectedWire === idx) setSelectedWire(null);
                    else {
                      onAction('ch1:swap_wires', { indexA: selectedWire, indexB: idx });
                      setSelectedWire(null);
                    }
                  }}
                  className={`min-h-[52px] rounded-xl border flex flex-col items-center justify-center cursor-pointer ${st.bg} ${st.border} ${
                    selectedWire === idx ? 'ring-2 ring-white' : ''
                  }`}
                >
                  <span className="font-mono text-[10px] text-zinc-300">PORT {idx + 1}</span>
                  <span className={`text-xs font-bold ${st.text}`}>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {relayError && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-xs text-red-300 text-center">
            {relayError}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            const ok =
              p.ch1Switches[0] &&
              !p.ch1Switches[1] &&
              p.ch1Switches[2] &&
              p.ch1Switches[3] &&
              p.ch1Wires[0] === 'TEAL' &&
              p.ch1Wires[1] === 'AMBER' &&
              p.ch1Wires[2] === 'CRIMSON';
            if (ok) {
              soundFx.chapterClear();
              setRelayError(null);
              onAction('ch1:engage_relay');
            } else {
              soundFx.error();
              setRelayError('Relay sparked — check CAM 03 IR switch positions & CAM 02 wire swap.');
            }
          }}
          className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
        >
          Engage 240V Relay & Unlock Corridor Hatch
        </button>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 2
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch2_chute_p2') {
    return (
      <div className="space-y-4">
        <DraggableSliderTrack
          label="Jammed Brass Mail Chute"
          hint="Drag the jammed brass cover all the way right to inspect inside."
          value={p.ch2ChuteSlid ? 100 : ch2ChuteVal}
          threshold={85}
          completed={p.ch2ChuteSlid}
          onChange={(v) => {
            setCh2ChuteVal(v);
            if (v >= 85 && !p.ch2ChuteSlid) {
              soundFx.unlock();
              onAction('ch2:slide_chute');
            }
          }}
        />
        {p.ch2ChuteSlid && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
            Recovered <strong>Anodized Torch Barrel</strong> & <strong>365nm UV Emitter Bulb</strong>. Combine both in your Field Bag!
          </div>
        )}
      </div>
    );
  }

  if (hotspot === 'ch2_uv_wall') {
    return (
      <UVSpotlightSurface
        activeToolName="UV Blacklight Torch"
        hasToolEquipped={equipped === 'uv_torch'}
        mode="UV"
        surfaceCaption="4F Corridor Noticeboard & Doorframe"
        zones={[
          {
            id: 'notice',
            label: 'Noticeboard Ink',
            xPercent: 28,
            yPercent: 38,
            revealText: 'RINGS: 7 - 3 · SHIFT 21:41-45',
            found: p.ch2UvFoundNotice
          },
          {
            id: 'frame',
            label: 'Doorframe Scrawl',
            xPercent: 74,
            yPercent: 68,
            revealText: 'RING 3: 9 · GATE 9527',
            found: p.ch2UvFoundFrame
          }
        ]}
        onDiscoverZone={(id) => onAction('ch2:uv_scan', { target: id })}
      />
    );
  }

  if (hotspot === 'ch2_padlock_box') {
    return p.ch2PadlockOpen ? (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
        Reception Keybox opened (739)! Service Lift Master Key retrieved — pass it through the Mail Chute.
      </div>
    ) : (
      <div className="space-y-3">
        <p className="text-xs text-zinc-300">
          3-ring brass padlock securing the Reception Keybox. Ask your corridor partner to sweep the dark noticeboard & doorframe with UV light.
        </p>
        <DialRingTumbler
          rings={['Ring 1', 'Ring 2', 'Ring 3']}
          values={ch2Padlock}
          onChange={(vals) => {
            setCh2Padlock(vals);
            setCh2PadErr(null);
          }}
          unlockLabel="Open Reception Keybox"
          errorText={ch2PadErr}
          onUnlock={(code) => {
            if (code === '739') {
              soundFx.unlock();
              onAction('ch2:unlock_padlock', { code });
            } else {
              soundFx.error();
              setCh2PadErr('Padlock shackle stays shut — double check all 3 UV ink digits.');
            }
          }}
        />
      </div>
    );
  }

  if (hotspot === 'ch2_dvr_console') {
    const map: Record<number, { idx: number; lbl: string } | null> = {
      41: { idx: 0, lbl: 'Top-Left (9)' },
      42: { idx: 4, lbl: 'Center (5)' },
      43: { idx: 8, lbl: 'Bottom-Right (2)' },
      44: null,
      45: { idx: 2, lbl: 'Top-Right (7)' }
    };
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#0B0D11] border border-white/15 space-y-3">
          <div className="flex justify-between font-mono text-xs text-amber-300">
            <span>RECEPTION DVR REPLAY</span>
            <span>21:{p.ch2DvrMinute}:00</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 w-28 mx-auto">
            {Array.from({ length: 9 }).map((_, idx) => {
              const active = map[p.ch2DvrMinute]?.idx === idx;
              return (
                <div
                  key={idx}
                  className={`h-7 rounded border ${
                    active ? 'bg-emerald-400 border-emerald-200' : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              );
            })}
          </div>
          <div className="font-mono text-xs text-center text-emerald-300">
            {map[p.ch2DvrMinute]?.lbl || 'No keypad press at 21:44'}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {([41, 42, 43, 44, 45] as const).map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => {
                  soundFx.click();
                  onAction('ch2:scrub_dvr', { minute: min });
                }}
                className={`min-h-[42px] rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                  p.ch2DvrMinute === min ? 'bg-emerald-500 text-zinc-950' : 'bg-[#1E2430] text-zinc-300'
                }`}
              >
                :{min}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            pinClue('clue-ch2-dvr', 'Reception DVR Guard Sequence', '21:41(9) → 21:42(5) → 21:43(2) → 21:45(7) => 9527')
          }
          className="w-full min-h-[44px] rounded-xl bg-[#1E2430] text-amber-300 text-xs font-semibold cursor-pointer"
        >
          {pinnedLocal || 'Pin 9527 Sequence to Clue Board'}
        </button>
      </div>
    );
  }

  if (hotspot === 'ch2_chute_p1') {
    return (
      <div className="space-y-3">
        {!p.ch2PadlockOpen ? (
          <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
            Unlock the Reception Brass Keybox first to get the Service Lift Master Key.
          </div>
        ) : p.ch2KeyPassed ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
            Service Lift Master Key slid through the mail chute to East Corridor 4F!
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              soundFx.unlock();
              onAction('ch2:pass_key');
            }}
            className="w-full min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Wind className="w-4 h-4" />
            <span>Slide Service Lift Key Through Mail Chute</span>
          </button>
        )}
      </div>
    );
  }

  if (hotspot === 'ch2_corridor_gate') {
    if (!p.ch2KeyPassed) {
      return (
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
          Requires the Service Lift Master Key from Reception’s mail chute AND the 4-digit gate PIN.
        </div>
      );
    }
    if (equipped !== 'service_lift_key') {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200">
          Equip <strong>Service Lift Master Key</strong> in your Field Bag below, then enter the 4-digit DVR Gate PIN.
        </div>
      );
    }
    return (
      <NumericKeypad
        label="Service Lift Lobby Gate PIN"
        errorText={ch2GateErr}
        onSubmit={(code) => {
          if (code === '9527') {
            soundFx.chapterClear();
            setCh2GateErr(null);
            onAction('ch2:unlock_gate', { code });
          } else {
            soundFx.error();
            setCh2GateErr('Wrong PIN — ask Reception to scrub DVR timestamps 21:41–21:45.');
          }
        }}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 3
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch3_placard_morse') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#F3EFE6] text-zinc-900 border border-amber-900/20 space-y-1.5">
          <div className="text-[11px] font-bold text-zinc-600">OTIS-CHENNAI SERVICE CAB #2</div>
          <div className="font-mono text-sm font-bold">Empty Cab Mass: 380 kg</div>
          <div className="font-mono text-sm font-bold">Two Occupants: +140 kg</div>
          <div className="font-mono text-base font-bold text-amber-800 pt-1 border-t border-zinc-900/15">
            Required Counterweight = 520 kg
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.morse(true);
            onAction('ch3:send_morse_ack');
          }}
          className={`w-full min-h-[50px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer ${
            p.ch3MorseAcked
              ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{p.ch3MorseAcked ? 'Morse Buzzer Synced with 5F!' : 'Tap Emergency Morse Buzzer'}</span>
        </button>
      </div>
    );
  }

  if (hotspot === 'ch3_counterweight') {
    const total = p.ch3WeightsOnTray.reduce((s, w) => s + w, 0);
    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 flex items-center justify-between">
          <span className="text-xs text-zinc-300">Counterweight Pan Total</span>
          <span className={`font-mono text-lg font-bold ${total === 520 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {total} kg
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[200, 150, 100, 75, 50, 20].map((w) => {
            const onTray = p.ch3WeightsOnTray.includes(w);
            return (
              <button
                key={w}
                type="button"
                disabled={p.ch3BrakeReleased}
                onClick={() => {
                  soundFx.gearClunk();
                  onAction('ch3:toggle_weight', { weight: w });
                }}
                className={`min-h-[52px] rounded-xl border font-mono text-xs font-bold flex flex-col items-center justify-center cursor-pointer ${
                  onTray
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-[#1E2430] border-white/10 text-zinc-300'
                }`}
              >
                <Scale className="w-3.5 h-3.5 mb-0.5" />
                <span>{w} kg</span>
              </button>
            );
          })}
        </div>

        <DraggableSliderTrack
          label="Mechanical Brake Tension Lever"
          hint={
            total === 520
              ? 'Balanced at 520 kg! Drag lever right to release lift brake.'
              : 'Balance the counterweight tray to exact Cab + Occupants mass first.'
          }
          value={p.ch3BrakeReleased ? 100 : brakeSlide}
          threshold={90}
          completed={p.ch3BrakeReleased}
          onChange={(v) => {
            setBrakeSlide(v);
            if (v >= 90 && total === 520 && !p.ch3BrakeReleased) {
              soundFx.unlock();
              onAction('ch3:pull_brake');
            }
          }}
        />
      </div>
    );
  }

  if (hotspot === 'ch3_shaft_chart') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#F3EFE6] text-zinc-900 border border-amber-900/20 space-y-2">
          <div className="text-xs font-bold text-zinc-700">5F MACHINE ROOM · CEILING LOOM SPEC</div>
          <div className="text-xs text-zinc-700">
            Voltmeter Status:{' '}
            <strong className={p.ch3MorseAcked ? 'text-emerald-700' : 'text-amber-800'}>
              {p.ch3MorseAcked ? 'LIVE BUZZER RECEIVED' : 'WAITING FOR CAB MORSE PULSE'}
            </strong>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 text-center font-mono text-xs font-bold">
            <div className="p-2 rounded bg-amber-300">1. GOLD</div>
            <div className="p-2 rounded bg-rose-300">2. RED</div>
            <div className="p-2 rounded bg-emerald-300">3. GREEN</div>
            <div className="p-2 rounded bg-sky-300">4. BLUE</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => pinClue('clue-ch3-loom', '5F Ceiling Loom Order', 'GOLD → RED → GREEN → BLUE')}
          className="w-full min-h-[44px] rounded-xl bg-[#1E2430] text-amber-300 text-xs font-semibold cursor-pointer"
        >
          {pinnedLocal || 'Pin Loom Order to Clue Board'}
        </button>
      </div>
    );
  }

  if (hotspot === 'ch3_ceiling_trap') {
    if (!p.ch3TrapScrews.every(Boolean)) {
      return (
        <ScrewPlateCover
          title="Lift Car Ceiling Escape Hatch (3 Wingnuts)"
          screwsRemoved={p.ch3TrapScrews}
          hasToolEquipped={true}
          onUnscrew={(idx) => onAction('ch3:unscrew_wingnut', { index: idx })}
        />
      );
    }

    const lugColors: Record<string, string> = {
      GOLD: 'bg-amber-500/20 border-amber-400 text-amber-200',
      RED: 'bg-rose-500/20 border-rose-400 text-rose-200',
      GREEN: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
      BLUE: 'bg-sky-500/20 border-sky-400 text-sky-200'
    };

    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-300">
          Tap two ceiling terminal lugs to swap until left-to-right matches the 5F Machine Room diagram.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {p.ch3LoomOrder.map((c, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                soundFx.click();
                if (selectedLoom === null) setSelectedLoom(idx);
                else if (selectedLoom === idx) setSelectedLoom(null);
                else {
                  onAction('ch3:swap_loom', { indexA: selectedLoom, indexB: idx });
                  setSelectedLoom(null);
                }
              }}
              className={`min-h-[56px] rounded-xl border font-mono text-xs font-bold cursor-pointer ${
                lugColors[c] || ''
              } ${selectedLoom === idx ? 'ring-2 ring-white' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
        {loomErr && <div className="text-xs text-red-300 text-center">{loomErr}</div>}
        <button
          type="button"
          onClick={() => {
            const ok =
              p.ch3BrakeReleased &&
              p.ch3MorseAcked &&
              p.ch3LoomOrder[0] === 'GOLD' &&
              p.ch3LoomOrder[1] === 'RED' &&
              p.ch3LoomOrder[2] === 'GREEN' &&
              p.ch3LoomOrder[3] === 'BLUE';
            if (ok) {
              soundFx.chapterClear();
              onAction('ch3:engage_lift');
            } else {
              soundFx.error();
              setLoomErr('Needs 5F Brake Released, Morse Acked, and Lugs: GOLD · RED · GREEN · BLUE.');
            }
          }}
          className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
        >
          Engage Descent to Mezzanine Vault
        </button>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 4
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch4_uv_oil') {
    return (
      <UVSpotlightSurface
        activeToolName="UV Blacklight Torch"
        hasToolEquipped={equipped === 'uv_torch'}
        mode="UV"
        surfaceCaption="Oil-Stained Transformer Coolant Plaque"
        zones={[
          {
            id: 'psi',
            label: 'Coolant PSI Spec',
            xPercent: 30,
            yPercent: 45,
            revealText: 'V1:45 · V2:70 · V3:30',
            found: p.ch4UvOilScanned
          },
          {
            id: 'knife',
            label: 'Knife Firing Order',
            xPercent: 72,
            yPercent: 55,
            revealText: 'FIRE: L2 → L1 → L3',
            found: p.ch4UvOilScanned
          }
        ]}
        onDiscoverZone={() => onAction('ch4:uv_scan_oil')}
      />
    );
  }

  if (hotspot === 'ch4_valves') {
    const targets = [45, 70, 30];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((idx) => (
          <RotaryDialWheel
            key={idx}
            label={`Coolant Valve ${idx + 1}`}
            value={p.ch4Valves[idx]}
            min={0}
            max={100}
            step={5}
            unit=" PSI"
            solved={p.ch4Valves[idx] === targets[idx]}
            onChange={(val) => onAction('ch4:set_valve', { index: idx, value: val })}
          />
        ))}
      </div>
    );
  }

  if (hotspot === 'ch4_oscilloscope') {
    const valvesOk = p.ch4Valves[0] === 45 && p.ch4Valves[1] === 70 && p.ch4Valves[2] === 30;
    if (!valvesOk) {
      return (
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
          Oscilloscope CRT stays thermal-locked until Transformer Closet stabilizes all 3 Coolant Valves.
        </div>
      );
    }

    // Build SVG sine wave points
    const buildPath = (freq: number, phase: number) => {
      const pts: string[] = [];
      for (let x = 0; x <= 240; x += 6) {
        const t = (x / 240) * Math.PI * (freq / 20);
        const y = 45 + Math.sin(t + (phase * Math.PI) / 180) * 30;
        pts.push(`${x === 0 ? 'M' : 'L'}${x},${y.toFixed(1)}`);
      }
      return pts.join(' ');
    };

    return (
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-[#040B08] border border-emerald-500/35">
          <div className="flex justify-between font-mono text-[11px] text-emerald-400 mb-1">
            <span>TARGET WAVE: 60 Hz · 120°</span>
            <span>LIVE: {p.ch4OscFreq} Hz · {p.ch4OscPhase}°</span>
          </div>
          <svg viewBox="0 0 240 90" className="w-full h-24">
            <path d={buildPath(60, 120)} fill="none" stroke="rgba(245,158,11,0.45)" strokeWidth="2" strokeDasharray="4 4" />
            <path d={buildPath(p.ch4OscFreq, p.ch4OscPhase)} fill="none" stroke="#34D399" strokeWidth="2.5" />
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <RotaryDialWheel
            label="Frequency"
            value={p.ch4OscFreq}
            min={20}
            max={100}
            step={5}
            unit=" Hz"
            solved={p.ch4OscFreq === 60}
            onChange={(v) => onAction('ch4:set_osc', { freq: v, phase: p.ch4OscPhase })}
          />
          <RotaryDialWheel
            label="Phase Shift"
            value={p.ch4OscPhase}
            min={0}
            max={180}
            step={10}
            unit="°"
            solved={p.ch4OscPhase === 120}
            onChange={(v) => onAction('ch4:set_osc', { freq: p.ch4OscFreq, phase: v })}
          />
        </div>
      </div>
    );
  }

  if (hotspot === 'ch4_knife_p1' || hotspot === 'ch4_knife_p2') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-300">
          {p.ch4OscLocked
            ? 'CRT Phase Locked! Throw the 3-Phase Knife Switches in stamped sequence (check UV Coolant Plaque).'
            : 'Sync the CRT Oscilloscope to 60 Hz · 120° first to arm the 3-phase knife switches.'}
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {(['L1', 'L2', 'L3'] as const).map((lbl) => {
            const engaged = p.ch4KnifeOrder.includes(lbl);
            return (
              <button
                key={lbl}
                type="button"
                disabled={!p.ch4OscLocked}
                onClick={() => {
                  soundFx.breaker();
                  onAction('ch4:pull_knife', { label: lbl });
                }}
                className={`min-h-[64px] rounded-xl border font-mono text-sm font-bold cursor-pointer ${
                  engaged
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-[#12161E] border-white/15 text-zinc-200 disabled:opacity-40'
                }`}
              >
                {lbl} {engaged ? '✓' : ''}
              </button>
            );
          })}
        </div>
        <div className="font-mono text-xs text-center text-zinc-400">
          Current Sequence: {p.ch4KnifeOrder.length ? p.ch4KnifeOrder.join(' → ') : 'None'}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 5
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch5_teak_box') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-300">
          Slide the carved teak tiles into order 1 through 8 (blank bottom-right) to pop open Caretaker Sundaram’s secret drawer.
        </p>
        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto p-3 rounded-2xl bg-[#271C13] border border-amber-700/40">
          {p.ch5SlidingTiles.map((tile, idx) => (
            <button
              key={idx}
              type="button"
              disabled={tile === 0 || p.ch5SlidingSolved}
              onClick={() => {
                soundFx.click();
                onAction('ch5:slide_tile', { index: idx });
              }}
              className={`h-16 rounded-xl font-mono text-xl font-bold transition-transform cursor-pointer ${
                tile === 0
                  ? 'bg-[#120D08] border border-dashed border-amber-800/40 cursor-default'
                  : 'bg-[#C89B3C] text-zinc-950 border border-amber-200/50 shadow active:scale-95'
              }`}
            >
              {tile === 0 ? '' : tile}
            </button>
          ))}
        </div>
        {p.ch5SlidingSolved && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300 text-center">
            Teak Box Opened! Recovered Machine Oil Dropper + Note: <strong>104.4 MHz</strong>.
          </div>
        )}
      </div>
    );
  }

  if (hotspot === 'ch5_radio') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 space-y-2 text-center">
          <div className="font-mono text-2xl font-bold text-amber-400">
            {(p.ch5RadioFreq / 10).toFixed(1)} MHz
          </div>
          <div className="text-xs text-zinc-300">
            {p.ch5RadioLocked
              ? 'CLEAR BROADCAST: "Kaveri 6, Marina 2, Adyar 9, Mylapore 4" → Chest Code 6294'
              : 'Static hiss… Turn dial to the monsoon frequency hidden in the Veranda Teak Box.'}
          </div>
        </div>
        <RotaryDialWheel
          label="Radio Frequency Tuner"
          value={p.ch5RadioFreq}
          min={880}
          max={1080}
          step={2}
          solved={p.ch5RadioLocked}
          onChange={(v) => onAction('ch5:tune_radio', { freq: v })}
        />
      </div>
    );
  }

  if (hotspot === 'ch5_shutter_key') {
    return p.ch5KeyPassed ? (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
        Rusty Veranda Key passed through the shutter to your partner! Tell them to oil it in their Field Bag.
      </div>
    ) : (
      <button
        type="button"
        onClick={() => {
          soundFx.unlock();
          onAction('ch5:pass_key');
        }}
        className="w-full min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <KeyRound className="w-4 h-4" />
        <span>Pass Rusty Veranda Key Through Shutter</span>
      </button>
    );
  }

  if (hotspot === 'ch5_veranda_chest') {
    if (equipped !== 'oiled_veranda_key') {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200 leading-relaxed">
          The chest keyhole is crusted with salt. Combine <strong>Rusty Veranda Key + Machine Oil Dropper</strong> in your Field Bag and equip the <strong>Oiled Brass Veranda Key</strong> first!
        </div>
      );
    }
    return (
      <NumericKeypad
        label="Veranda Tool Chest Code (Radio Bulletin)"
        errorText={chestErr}
        onSubmit={(code) => {
          if (code === '6294') {
            soundFx.chapterClear();
            setChestErr(null);
            onAction('ch5:unlock_chest', { code });
          } else {
            soundFx.error();
            setChestErr('Wrong 4-digit bulletin code — check 104.4 MHz.');
          }
        }}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 6
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch6_pipe_grid') {
    const { powered, drained } = evaluatePipeFlow(p.ch6PipeRotations);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <span>INLET (Top-Left ←) → DRAIN (Bottom-Right →)</span>
          <span className={drained ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
            {drained ? 'PIT DRAINED!' : 'TAP PIPES TO ROTATE'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 max-w-[280px] mx-auto p-2.5 rounded-2xl bg-[#0B0E14] border border-white/15">
          {ROOF_PIPE_GRID.map((cell, idx) => {
            const rot = p.ch6PipeRotations[idx] ?? 0;
            const open = getPipeOpenings(cell.kind, rot);
            const wet = powered[idx];
            return (
              <button
                key={idx}
                type="button"
                disabled={p.ch6PipesDrained}
                onClick={() => {
                  soundFx.ratchet();
                  onAction('ch6:rotate_pipe', { index: idx });
                }}
                aria-label={`Pipe cell ${idx + 1}`}
                className={`relative h-14 rounded-lg border flex items-center justify-center cursor-pointer ${
                  wet ? 'bg-sky-950/70 border-sky-400' : 'bg-[#161A22] border-white/10'
                }`}
              >
                <svg viewBox="0 0 40 40" className="w-10 h-10">
                  {open[0] && <line x1="20" y1="20" x2="20" y2="0" stroke={wet ? '#38BDF8' : '#C89B3C'} strokeWidth="6" strokeLinecap="round" />}
                  {open[1] && <line x1="20" y1="20" x2="40" y2="20" stroke={wet ? '#38BDF8' : '#C89B3C'} strokeWidth="6" strokeLinecap="round" />}
                  {open[2] && <line x1="20" y1="20" x2="20" y2="40" stroke={wet ? '#38BDF8' : '#C89B3C'} strokeWidth="6" strokeLinecap="round" />}
                  {open[3] && <line x1="20" y1="20" x2="0" y2="20" stroke={wet ? '#38BDF8' : '#C89B3C'} strokeWidth="6" strokeLinecap="round" />}
                  <circle cx="20" cy="20" r="4.5" fill={wet ? '#7DD3FC' : '#EAB308'} />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (hotspot === 'ch6_uv_parapet') {
    return (
      <UVSpotlightSurface
        activeToolName="UV Blacklight Torch"
        hasToolEquipped={equipped === 'uv_torch'}
        mode="UV"
        surfaceCaption="Rain-Washed East Parapet Wall"
        zones={[
          {
            id: 'bearing',
            label: 'Dish Storm Bearing',
            xPercent: 52,
            yPercent: 48,
            revealText: 'AZIMUTH: 215° SW',
            found: p.ch6UvBearingFound
          }
        ]}
        onDiscoverZone={() => onAction('ch6:uv_scan_parapet')}
      />
    );
  }

  if (hotspot === 'ch6_dish_wheel') {
    return (
      <RotaryDialWheel
        label="Rooftop Relay Dish Azimuth"
        value={p.ch6DishAzimuth}
        min={0}
        max={355}
        step={5}
        unit="°"
        wrap360={true}
        solved={p.ch6DishAzimuth === 215}
        onChange={(deg) => onAction('ch6:set_azimuth', { azimuth: deg })}
      />
    );
  }

  if (hotspot === 'ch6_repeater_log') {
    return (
      <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-400">Dish Bearing</span>
          <span className="font-mono text-amber-400">{p.ch6DishAzimuth}° (Needs UV Storm Bearing)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Parapet Copper Shunt</span>
          <span className="font-mono text-emerald-400">{p.ch6ShuntSeated ? 'SEATED' : 'MISSING'}</span>
        </div>
      </div>
    );
  }

  if (hotspot === 'ch6_shunt_pit') {
    if (!p.ch6PipesDrained) {
      return (
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
          This junction pit is submerged in rainwater. Rotate the 4×4 Pipe Manifold first to drain it!
        </div>
      );
    }
    if (p.ch6ShuntSeated) {
      return (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
          Copper Shunt seated! Security must align the Parapet Dish to 215° SW.
        </div>
      );
    }
    return equipped === 'copper_shunt' ? (
      <button
        type="button"
        onClick={() => {
          soundFx.unlock();
          onAction('ch6:seat_shunt');
        }}
        className="w-full min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
      >
        Seat Heavy Copper Shunt Bar
      </button>
    ) : (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200">
        Equip <strong>Heavy Copper Shunt Bar</strong> in your Field Bag to seat it into the drained relay pit.
      </div>
    );
  }

  return null;
};
