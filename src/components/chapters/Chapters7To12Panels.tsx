import React, { useState } from 'react';
import {
  Anchor,
  Cable,
  Check,
  CheckCircle2,
  Clock,
  DoorOpen,
  Droplets,
  Flame,
  KeyRound,
  Lock,
  Settings,
  ShieldCheck,
  Sun,
  Unlock,
  Zap
} from 'lucide-react';
import { PlayerRole, RoomState, SafelightColor } from '../../shared/gameTypes';
import { soundFx } from '../../utils/soundFx';
import {
  DialRingTumbler,
  DraggableSliderTrack,
  NumericKeypad,
  RotaryDialWheel,
  UVSpotlightSurface
} from '../TactileWidgets';

interface PanelProps {
  hotspot: string;
  room: RoomState;
  role: PlayerRole;
  onAction: (type: string, payload?: Record<string, unknown>) => void;
}

export const Chapters7To12Panels: React.FC<PanelProps> = ({ hotspot, room, role, onAction }) => {
  const p = room.puzzle;
  const equipped = room.equipped[role];

  const [lockerErr, setLockerErr] = useState<string | null>(null);
  const [chuteErr, setChuteErr] = useState<string | null>(null);
  const [selectedGear, setSelectedGear] = useState<number | null>(null);
  const [ignitionErr, setIgnitionErr] = useState<string | null>(null);
  const [selectedFiberPort, setSelectedFiberPort] = useState<string>('P1');
  const [cipherErr, setCipherErr] = useState<string | null>(null);
  const [pinHeights, setPinHeights] = useState<[number, number, number]>([20, 20, 20]);
  const [pinnedLocal, setPinnedLocal] = useState<string | null>(null);

  const partnerRole = role === 'P1_SECURITY' ? 'P2_STUDY' : 'P1_SECURITY';
  const mySlot = room.players[role];
  const partnerSlot = room.players[partnerRole];

  const pinClue = (id: string, title: string, detail: string) => {
    soundFx.click();
    onAction('clue:add', { id, title, detail });
    setPinnedLocal('Pinned to Clue Board!');
    setTimeout(() => setPinnedLocal(null), 2000);
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 7: DISPENSARY DARKROOM
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch7_safelight_bank') {
    const lights: Array<{ id: SafelightColor; label: string; desc: string }> = [
      { id: 'WHITE', label: 'WHITE', desc: 'Room bulb (fogs raw film)' },
      { id: 'RED', label: 'RED', desc: 'Safe for chemical developing' },
      { id: 'AMBER', label: 'AMBER', desc: 'Illuminates developed Loupe frame' },
      { id: 'UV', label: 'UV', desc: 'Inspection filter' }
    ];
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#F3EFE6] text-zinc-900 border border-amber-900/20 text-xs space-y-1">
          <div className="font-bold">DARKROOM CHEMICAL & LIGHT SPEC</div>
          <div>1. Switch Safelight to <strong>RED</strong> during chemical pouring.</div>
          <div>2. Mix <strong>Developer 40 ml · Stop Bath 25 ml · Fixer 60 ml</strong>.</div>
          <div>3. Switch Safelight to <strong>AMBER</strong> to read dry Frame 14 under Loupe.</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {lights.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                soundFx.breaker();
                onAction('ch7:set_safelight', { color: l.id });
              }}
              className={`min-h-[54px] p-3 rounded-xl border text-left cursor-pointer ${
                p.ch7Safelight === l.id
                  ? 'bg-amber-500 text-zinc-950 border-amber-300'
                  : 'bg-[#12161E] text-zinc-200 border-white/10'
              }`}
            >
              <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" /> {l.label}
              </div>
              <div className={`text-[10px] mt-0.5 ${p.ch7Safelight === l.id ? 'text-zinc-900' : 'text-zinc-400'}`}>
                {l.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (hotspot === 'ch7_chemical_sink') {
    if (p.ch7Safelight !== 'RED' && !p.ch7FilmDeveloped) {
      return (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-200 leading-relaxed">
          Current Safelight is <strong>{p.ch7Safelight}</strong>! Uncovering raw chemical trays outside <strong>RED</strong> safelight will fog the 35mm film. Ask your partner to switch to RED.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="text-xs text-zinc-300">
          Pour exact volumes into the graduated cylinders (Target: <strong>40 / 25 / 60 ml</strong>):
        </div>
        {[
          { key: 'dev' as const, label: 'Developer Solution', val: p.ch7Chemicals.dev, target: 40 },
          { key: 'stop' as const, label: 'Acid Stop Bath', val: p.ch7Chemicals.stop, target: 25 },
          { key: 'fix' as const, label: 'Rapid Fixer', val: p.ch7Chemicals.fix, target: 60 }
        ].map((chem) => (
          <div key={chem.key} className="p-3 rounded-xl bg-[#12161E] border border-white/10 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">{chem.label}</span>
              <span className={`font-mono font-bold ${chem.val === chem.target ? 'text-emerald-400' : 'text-amber-400'}`}>
                {chem.val} ml
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              disabled={p.ch7FilmDeveloped}
              value={chem.val}
              onChange={(e) => {
                soundFx.click();
                const next = { ...p.ch7Chemicals, [chem.key]: Number(e.target.value) };
                onAction('ch7:set_chemicals', next);
              }}
              className="w-full accent-amber-500 h-8 cursor-pointer"
            />
          </div>
        ))}
        {p.ch7FilmDeveloped && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
            Film Developed! Ask your partner to switch Safelight to <strong>AMBER</strong> and inspect with the Loupe.
          </div>
        )}
      </div>
    );
  }

  if (hotspot === 'ch7_film_loupe') {
    if (!p.ch7FilmDeveloped) {
      return (
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
          Negative strip is blank—develop the roll in the Chemical Sink under RED safelight first.
        </div>
      );
    }
    if (p.ch7Safelight !== 'AMBER') {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-200">
          Film is developed! Ask your partner to switch the darkroom lamp to <strong>AMBER</strong> so the Magnifier Loupe can read Frame 14.
        </div>
      );
    }
    return (
      <UVSpotlightSurface
        activeToolName="Darkroom Magnifier Loupe"
        hasToolEquipped={true}
        mode="LOUPE"
        surfaceCaption="35mm Negative Strip · Sweep Loupe over Frame 14"
        zones={[
          {
            id: 'frame14',
            label: 'Frame 14 Stamp',
            xPercent: 56,
            yPercent: 46,
            revealText: 'LOCKER PIN: 3892',
            found: p.ch7FilmLoupeRead
          }
        ]}
        onDiscoverZone={() => onAction('ch7:read_loupe')}
      />
    );
  }

  if (hotspot === 'ch7_apothecary_locker') {
    if (!p.ch7FilmLoupeRead) {
      return (
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
          Chained 4-digit brass locker. Ask your darkroom partner to develop & loupe-scan the 35mm film negative.
        </div>
      );
    }
    return (
      <NumericKeypad
        label="Apothecary Locker Code (Frame 14)"
        errorText={lockerErr}
        onSubmit={(code) => {
          if (code === '3892') {
            soundFx.chapterClear();
            setLockerErr(null);
            onAction('ch7:unlock_apothecary', { code });
          } else {
            soundFx.error();
            setLockerErr('Wrong 4-digit locker code.');
          }
        }}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 8: ACCOUNTING ARCHIVES
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch8_corkboard') {
    const scraps = [
      'INVOICE #091: KAVERI GENSET',
      'AMOUNT: ₹14,80,000 (PAID)',
      'BAY 4B AUDIT OVERRIDE',
      'CRYPTEX SEAL: M-Y-L-4'
    ];
    return (
      <div className="space-y-3">
        <p className="text-xs text-zinc-300">
          Tap each crooked receipt scrap on the corkboard to pin and align it straight:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {scraps.map((txt, idx) => {
            const aligned = p.ch8ScrapsAligned[idx];
            return (
              <button
                key={idx}
                type="button"
                disabled={aligned}
                onClick={() => {
                  soundFx.click();
                  onAction('ch8:align_scrap', { index: idx });
                }}
                className={`min-h-[60px] p-3 rounded-xl border text-left font-mono text-xs transition-transform cursor-pointer ${
                  aligned
                    ? 'bg-[#F3EFE6] text-zinc-900 border-emerald-500 rotate-0'
                    : 'bg-[#D6CFC0] text-zinc-800 border-amber-600 -rotate-2 hover:rotate-0'
                }`}
              >
                <div className="text-[10px] text-zinc-600 mb-0.5">
                  {aligned ? 'ALIGNED ✓' : 'TAP TO ALIGN'}
                </div>
                <div className="font-bold">{txt}</div>
              </button>
            );
          })}
        </div>
        {p.ch8ScrapsAligned.every(Boolean) && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
            Found <strong>Torn Ledger Fragment B</strong>! Combine Fragment A + Fragment B in your Field Bag!
          </div>
        )}
      </div>
    );
  }

  if (hotspot === 'ch8_microfiche') {
    const offset = Math.abs(p.ch8MicroficheScroll - 65);
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#070B0E] border border-emerald-500/30 space-y-2 text-center">
          <div className="font-mono text-[11px] text-zinc-400">MICROFICHE REEL #04 OVERLAY</div>
          <div className="relative h-16 flex items-center justify-center overflow-hidden font-mono text-2xl font-bold tracking-[0.25em]">
            <span className="text-amber-400/70" style={{ transform: `translateX(${-(65 - p.ch8MicroficheScroll) * 1.4}px)` }}>
              4 · 8 · 2 · 1
            </span>
            <span className="text-emerald-400/70 absolute" style={{ transform: `translateX(${(65 - p.ch8MicroficheScroll) * 1.4}px)` }}>
              4 · 8 · 2 · 1
            </span>
          </div>
          <div className="text-xs text-zinc-400">
            {offset === 0 ? 'OVERLAP LOCKED: PIN 4821' : 'Scroll wheel until both projections overlap cleanly'}
          </div>
        </div>
        <DraggableSliderTrack
          label="Microfiche Film Scroll Wheel"
          hint="Drag wheel smoothly to focus overlapping transparencies."
          value={p.ch8MicroficheScroll}
          threshold={65}
          completed={p.ch8MicroficheAligned}
          onChange={(v) => onAction('ch8:scroll_microfiche', { scroll: v })}
        />
      </div>
    );
  }

  if (hotspot === 'ch8_audit_notes') {
    return (
      <div className="p-4 rounded-xl bg-[#F3EFE6] text-zinc-900 border border-amber-900/20 text-xs space-y-2">
        <div className="font-bold">ACCOUNTING ARCHIVE NOTE</div>
        <p>
          Combine Fragment A (Dispensary) + Fragment B (Corkboard) in the Field Bag to inspect the Cryptex seal, and align Microfiche Reel #04 to read the Dumbwaiter PIN.
        </p>
      </div>
    );
  }

  if (hotspot === 'ch8_cryptex_chute') {
    const hasInvoice = room.inventory.some((i) => i.id === 'reassembled_invoice');
    const cryptexChars = ['A', '4', 'L', 'M', 'X', 'Y', '7', '2'];
    const cryptexOk = p.ch8CryptexLetters.join('') === 'MYL4';
    return (
      <div className="space-y-4">
        {!hasInvoice && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200">
            Hint: Align all 4 Corkboard scraps and combine <strong>Ledger Fragment A + B</strong> in your Bag to reveal the 4-letter Cryptex seal.
          </div>
        )}
        <DialRingTumbler
          rings={['Ring 1', 'Ring 2', 'Ring 3', 'Ring 4']}
          values={p.ch8CryptexLetters}
          charset={cryptexChars}
          onChange={(vals) => {
            vals.forEach((v, idx) => {
              if (v !== p.ch8CryptexLetters[idx]) {
                onAction('ch8:spin_cryptex', { index: idx, value: v });
              }
            });
          }}
        />
        {cryptexOk && hasInvoice ? (
          <NumericKeypad
            label="Dumbwaiter PIN (From Microfiche)"
            errorText={chuteErr}
            onSubmit={(code) => {
              if (code === '4821') {
                soundFx.chapterClear();
                setChuteErr(null);
                onAction('ch8:open_dumbwaiter', { code });
              } else {
                soundFx.error();
                setChuteErr('Wrong PIN — check Microfiche Reel #04 at 65%.');
              }
            }}
          />
        ) : (
          <div className="text-xs text-center text-zinc-400">
            Spin Cryptex rings to match the Reassembled Audit Invoice seal first.
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 9: BASEMENT DIESEL BAY
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch9_gear_train') {
    const trayGears = [12, 16, 24, 32];
    const gearsOk =
      p.ch9GearSlots[0] === 12 &&
      p.ch9GearSlots[1] === 24 &&
      p.ch9GearSlots[2] === 16 &&
      p.ch9GearSlots[3] === 32;

    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-[#F3EFE6] text-zinc-900 text-xs">
          <strong>Meshing Spec:</strong> Input <strong>12T</strong> → Idler A (<strong>2× Input</strong>) → Idler B (<strong>16T</strong>) → Starter (<strong>2× Idler B</strong>).
        </div>

        {/* 4 Spindle Slots */}
        <div className="grid grid-cols-4 gap-2">
          {['Input', 'Idler A', 'Idler B', 'Starter'].map((lbl, idx) => {
            const mounted = p.ch9GearSlots[idx];
            return (
              <button
                key={lbl}
                type="button"
                onClick={() => {
                  soundFx.gearClunk();
                  if (selectedGear !== null) {
                    onAction('ch9:place_gear', { slot: idx, teeth: selectedGear });
                    setSelectedGear(null);
                  } else if (mounted !== null) {
                    onAction('ch9:place_gear', { slot: idx, teeth: null });
                  }
                }}
                className={`min-h-[68px] rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  mounted !== null
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-[#12161E] border-dashed border-white/25 text-zinc-400'
                }`}
              >
                <Settings className={`w-5 h-5 ${gearsOk ? 'animate-spin' : ''}`} />
                <span className="text-[10px]">{lbl}</span>
                <span className="font-mono text-xs font-bold">{mounted ? `${mounted}T` : 'EMPTY'}</span>
              </button>
            );
          })}
        </div>

        {/* Loose Gears Tray */}
        <div className="grid grid-cols-4 gap-2">
          {trayGears.map((t) => {
            const used = p.ch9GearSlots.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  soundFx.click();
                  setSelectedGear((prev) => (prev === t ? null : t));
                }}
                className={`min-h-[46px] rounded-xl border font-mono text-xs font-bold cursor-pointer ${
                  selectedGear === t
                    ? 'bg-amber-500 text-zinc-950 border-amber-300'
                    : used
                    ? 'bg-[#0E1014] text-zinc-500 border-white/5'
                    : 'bg-[#1E2430] text-zinc-100 border-white/15'
                }`}
              >
                {t}T Gear
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-center text-zinc-400">
          Tap a gear in the tray, then tap a spindle slot to mount it.
        </p>
      </div>
    );
  }

  if (hotspot === 'ch9_fuel_primer') {
    return (
      <div className="space-y-4">
        <DraggableSliderTrack
          label="Diesel Fuel Priming Plunger"
          hint="Pull plunger smoothly into the 65–80 PSI green operating band."
          value={p.ch9FuelPressure}
          threshold={70}
          completed={p.ch9Primed}
          unitLabel=" PSI"
          onChange={(v) => onAction('ch9:pump_primer', { pressure: v })}
        />
        <div className="text-xs text-center text-zinc-400">
          {p.ch9Primed
            ? 'Fuel rail primed (65–80 PSI)! Tell Load Console to balance breakers & crank ignition.'
            : `Current Pressure: ${p.ch9FuelPressure} PSI (Target: 65–80 PSI)`}
        </div>
      </div>
    );
  }

  if (hotspot === 'ch9_load_console') {
    const labels = [
      { name: 'Essential Lighting', target: 'ON' },
      { name: 'Chiller HVAC', target: 'OFF' },
      { name: 'Cistern Sump Pump', target: 'ON' },
      { name: 'Exterior Neon Sign', target: 'OFF' }
    ];
    return (
      <div className="space-y-3">
        <p className="text-xs text-zinc-300">
          Shed heavy non-essential loads before cranking the basement diesel starter:
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {labels.map((b, idx) => {
            const on = p.ch9LoadBreakers[idx];
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => {
                  soundFx.breaker();
                  onAction('ch9:toggle_load', { index: idx });
                }}
                className={`min-h-[60px] p-3 rounded-xl border text-left cursor-pointer ${
                  on ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-[#12161E] border-white/10 text-zinc-400'
                }`}
              >
                <div className="text-xs font-semibold">{b.name}</div>
                <div className="font-mono text-[11px] mt-0.5">
                  {on ? 'ON' : 'OFF'} · Target: {b.target}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (hotspot === 'ch9_ignition') {
    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span>Fuel Rail Primed (65–80 PSI)</span>
            <span className={p.ch9Primed ? 'text-emerald-400' : 'text-amber-400'}>
              {p.ch9Primed ? 'READY' : `${p.ch9FuelPressure} PSI`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Load Shedding (Essential + Sump ON)</span>
            <span className={p.ch9LoadBreakers[0] && !p.ch9LoadBreakers[1] && p.ch9LoadBreakers[2] && !p.ch9LoadBreakers[3] ? 'text-emerald-400' : 'text-amber-400'}>
              {p.ch9LoadBreakers[0] && !p.ch9LoadBreakers[1] && p.ch9LoadBreakers[2] && !p.ch9LoadBreakers[3] ? 'BALANCED' : 'CHECK BUS'}
            </span>
          </div>
        </div>
        {ignitionErr && <div className="text-xs text-red-300 text-center">{ignitionErr}</div>}
        <button
          type="button"
          onClick={() => {
            const gearsOk =
              p.ch9GearSlots[0] === 12 &&
              p.ch9GearSlots[1] === 24 &&
              p.ch9GearSlots[2] === 16 &&
              p.ch9GearSlots[3] === 32;
            const loadOk =
              p.ch9LoadBreakers[0] &&
              !p.ch9LoadBreakers[1] &&
              p.ch9LoadBreakers[2] &&
              !p.ch9LoadBreakers[3];
            if (gearsOk && p.ch9Primed && loadOk) {
              soundFx.chapterClear();
              setIgnitionErr(null);
              onAction('ch9:crank_ignition');
            } else {
              soundFx.error();
              setIgnitionErr('Starter coughed — verify Gears (12-24-16-32), Primer (65-80 PSI) & Load Breakers.');
            }
          }}
          className="w-full min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Flame className="w-4 h-4" />
          <span>Crank Diesel Starter Switch</span>
        </button>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 10: FLOODED SUB-CISTERN
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch10_sonar_feed') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-[#051014] border border-sky-500/40 font-mono text-xs space-y-2">
          <div className="text-sky-300 font-bold">SUB-CISTERN SONAR TELEMETRY</div>
          <div className="text-zinc-300">Metallic Echo Detected at Depth: <strong className="text-emerald-300">4.5 meters</strong></div>
          <div className="text-zinc-300">Sluice Wheel A Clearance Target: <strong className="text-amber-300">135°</strong></div>
          <div className="text-zinc-300">Sluice Wheel B Clearance Target: <strong className="text-amber-300">270°</strong></div>
        </div>
        <button
          type="button"
          onClick={() =>
            pinClue('clue-ch10-sonar', 'Cistern Sonar Bearings', 'Metallic Vault Key at 4.5m · Wheel A = 135° · Wheel B = 270°')
          }
          className="w-full min-h-[44px] rounded-xl bg-[#1E2430] text-amber-300 text-xs font-semibold cursor-pointer"
        >
          {pinnedLocal || 'Pin Sonar Bearings to Clue Board'}
        </button>
      </div>
    );
  }

  if (hotspot === 'ch10_flooded_grate') {
    if (p.ch10KeyFished) {
      return (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
          Recovered <strong>Sub-Basement Vault Key</strong> from 4.5m! Now rotate both Sluice Wheels (A: 135° / B: 270°).
        </div>
      );
    }
    if (equipped !== 'magnetic_line') {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200 leading-relaxed">
          Something brass glints deep beneath the grate. Combine <strong>Neodymium Magnet + 6m Nylon Survey Cord</strong> in your Field Bag and equip the <strong>Magnetic Retrieval Line</strong>!
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-[#12161E] border border-white/10 flex justify-between text-xs">
          <span className="text-zinc-300">Current Reel Depth</span>
          <span className="font-mono text-sky-300 font-bold">{(p.ch10ReelDepth / 10).toFixed(1)} meters</span>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          step={5}
          value={p.ch10ReelDepth}
          onChange={(e) => {
            soundFx.ratchet();
            onAction('ch10:reel_depth', { depth: Number(e.target.value) });
          }}
          className="w-full accent-sky-400 h-10 cursor-pointer"
        />
        <p className="text-xs text-zinc-400 text-center">
          Slide depth reel to match Sonar’s metallic echo (4.5m).
        </p>
      </div>
    );
  }

  if (hotspot === 'ch10_sluice_a' || hotspot === 'ch10_sluice_b') {
    const isA = hotspot === 'ch10_sluice_a';
    const val = isA ? p.ch10SluiceWheelA : p.ch10SluiceWheelB;
    const target = isA ? 135 : 270;
    return (
      <div className="space-y-3">
        <RotaryDialWheel
          label={isA ? 'Spoked Iron Sluice Wheel A' : 'Spoked Iron Sluice Wheel B'}
          value={val}
          min={0}
          max={345}
          step={15}
          unit="°"
          wrap360={true}
          solved={val === target}
          onChange={(deg) => onAction('ch10:rotate_sluice', { angle: deg })}
        />
        {!p.ch10KeyFished && (
          <p className="text-xs text-center text-amber-300">
            Note: Recover the Sub-Basement Vault Key from the flooded grate before draining!
          </p>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 11: SUB-BASEMENT NTP VAULT
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch11_packet_map') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-[#070B0E] border border-emerald-500/35 font-mono text-xs space-y-1.5 text-emerald-200">
          <div className="text-emerald-400 font-bold">SUB-BASEMENT FIBER TRACE</div>
          <div>To sever the +05:00 DVR replay spoof, Rack 7 must patch:</div>
          <div className="grid grid-cols-2 gap-1.5 pt-2">
            <div className="p-2 rounded bg-black/50">PORT P1 → SFP B</div>
            <div className="p-2 rounded bg-black/50">PORT P2 → SFP D</div>
            <div className="p-2 rounded bg-black/50">PORT P3 → SFP A</div>
            <div className="p-2 rounded bg-black/50">PORT P4 → SFP C</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => pinClue('clue-ch11-fiber', 'Rack 7 Fiber Patch Map', 'P1→B · P2→D · P3→A · P4→C')}
          className="w-full min-h-[44px] rounded-xl bg-[#1E2430] text-amber-300 text-xs font-semibold cursor-pointer"
        >
          {pinnedLocal || 'Pin Fiber Map to Clue Board'}
        </button>
      </div>
    );
  }

  if (hotspot === 'ch11_fiber_rack') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-300">
          Tap a source Port (P1–P4), then tap its destination SFP socket (A–D) matching Security’s Packet Trace:
        </p>
        <div className="grid grid-cols-4 gap-2">
          {['P1', 'P2', 'P3', 'P4'].map((port) => (
            <button
              key={port}
              type="button"
              disabled={p.ch11FiberSolved}
              onClick={() => {
                soundFx.click();
                setSelectedFiberPort(port);
              }}
              className={`min-h-[52px] rounded-xl border font-mono text-xs font-bold cursor-pointer ${
                selectedFiberPort === port
                  ? 'bg-amber-500 text-zinc-950 border-amber-300'
                  : 'bg-[#12161E] text-zinc-200 border-white/10'
              }`}
            >
              <div>{port}</div>
              <div className="text-[10px] opacity-80">→ {p.ch11FiberPairs[port]}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {['A', 'B', 'C', 'D'].map((target) => (
            <button
              key={target}
              type="button"
              disabled={p.ch11FiberSolved}
              onClick={() => {
                soundFx.ratchet();
                onAction('ch11:set_fiber', { port: selectedFiberPort, target });
              }}
              className="min-h-[46px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 border border-white/15 font-mono text-xs font-bold text-emerald-300 cursor-pointer"
            >
              SFP {target}
            </button>
          ))}
        </div>
        {p.ch11FiberSolved && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300 text-center">
            Fiber Loop Severed! P1 can now zero the +05:00 NTP Drift Clock.
          </div>
        )}
      </div>
    );
  }

  if (hotspot === 'ch11_ntp_rings') {
    if (!p.ch11FiberSolved) {
      return (
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
          NTP Drift Calibrator is write-protected until Rack 7’s Fiber Patch cables are rerouted.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-center">
          <div className="text-xs text-zinc-400">Active NTP Clock Offset (Zero to 00:00:00 LIVE)</div>
          <div className={`font-mono text-2xl font-bold mt-1 ${p.ch11NtpSynced ? 'text-emerald-400' : 'text-amber-400'}`}>
            +{String(p.ch11NtpOffset.h).padStart(2, '0')}:{String(p.ch11NtpOffset.m).padStart(2, '0')}:{String(p.ch11NtpOffset.s).padStart(2, '0')}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'h' as const, label: 'Hours', val: p.ch11NtpOffset.h, mod: 12 },
            { k: 'm' as const, label: 'Minutes', val: p.ch11NtpOffset.m, mod: 60 },
            { k: 's' as const, label: 'Seconds', val: p.ch11NtpOffset.s, mod: 60 }
          ].map((ring) => (
            <div key={ring.k} className="p-2.5 rounded-xl bg-[#12161E] border border-white/10 flex flex-col items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">{ring.label}</span>
              <button
                type="button"
                disabled={p.ch11NtpSynced}
                onClick={() => {
                  soundFx.ratchet();
                  onAction('ch11:set_ntp_drift', { ...p.ch11NtpOffset, [ring.k]: (ring.val + 1) % ring.mod });
                }}
                className="w-full min-h-[38px] rounded-lg bg-[#1E2430] text-xs text-white cursor-pointer"
              >
                +1
              </button>
              <span className="font-mono text-lg font-bold text-white">{String(ring.val).padStart(2, '0')}</span>
              <button
                type="button"
                disabled={p.ch11NtpSynced}
                onClick={() => {
                  soundFx.ratchet();
                  onAction('ch11:set_ntp_drift', { ...p.ch11NtpOffset, [ring.k]: (ring.val - 1 + ring.mod) % ring.mod });
                }}
                className="w-full min-h-[38px] rounded-lg bg-[#1E2430] text-xs text-white cursor-pointer"
              >
                -1
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hotspot === 'ch11_vault_tumbler') {
    if (!p.ch11NtpSynced) {
      return (
        <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-400">
          Time-lock solenoid holds the cylinder shut until the +05:00 NTP Drift Clock is synced to 00:00:00.
        </div>
      );
    }
    if (equipped !== 'vault_brass_key') {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200">
          Equip your fished <strong>Sub-Basement Vault Key</strong> in the Field Bag to tension the tumbler cylinder.
        </div>
      );
    }

    const targets: [number, number, number] = [70, 50, 80];
    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-300">
          Slide each spring tumbler pin up until it aligns at its glowing shear mark:
        </p>
        {[0, 1, 2].map((idx) => {
          const set = p.ch11LockPins[idx];
          const val = set ? targets[idx] : pinHeights[idx];
          return (
            <div key={idx} className="p-3 rounded-xl bg-[#12161E] border border-white/10 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Tumbler Pin #{idx + 1}</span>
                <span className={`font-mono font-bold ${set ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {set ? 'SET AT SHEAR ✓' : `${val}% (Shear: ${targets[idx]}%)`}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                step={5}
                disabled={set}
                value={val}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const next: [number, number, number] = [...pinHeights] as [number, number, number];
                  next[idx] = v;
                  setPinHeights(next);
                  if (v === targets[idx]) {
                    soundFx.pickClick();
                    onAction('ch11:set_pin', { index: idx });
                  }
                }}
                className="w-full accent-emerald-400 h-8 cursor-pointer"
              />
            </div>
          );
        })}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // CHAPTER 12: MAIN LOBBY AIRLOCK & FINAL ESCAPE
  // ═════════════════════════════════════════════════════════════════════════════
  if (hotspot === 'ch12_bypass_console') {
    if (!p.ch12BypassPlugged) {
      return equipped === 'master_bypass_rig' ? (
        <button
          type="button"
          onClick={() => {
            soundFx.unlock();
            onAction('ch12:plug_bypass');
          }}
          className="w-full min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Plug In Master Lobby Bypass Rig</span>
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200 leading-relaxed">
          Combine <strong>NTP Supervisor Override Token + Heavy Copper Shunt Bar</strong> in your Field Bag to craft the <strong>Master Lobby Bypass Rig</strong>, then equip and plug it in here!
        </div>
      );
    }

    if (!p.ch12MasterCipherOpen) {
      return (
        <NumericKeypad
          expectedLength={6}
          label="6-Digit Master Building Cipher"
          errorText={cipherErr}
          onSubmit={(code) => {
            if (code === '489512') {
              soundFx.unlock();
              setCipherErr(null);
              onAction('ch12:submit_cipher', { code });
            } else {
              soundFx.error();
              setCipherErr('Invalid building cipher — check your partner’s Evidence Plaque.');
            }
          }}
        />
      );
    }

    return (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-300">
        Master Cipher Accepted (489512)! Align Left Wheel (240°) & Right Wheel (060°), then hold both Crash Bars together!
      </div>
    );
  }

  if (hotspot === 'ch12_evidence_plaque') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-[#F3EFE6] text-zinc-900 border border-amber-900/20 text-xs space-y-2">
          <div className="font-bold">MARINA TOWERS · MASTER CASE SYNTHESIS</div>
          <p>
            <strong>6-Digit Building Cipher:</strong> Flat 4B Desk (<strong>48</strong>) + Corridor Gate (<strong>95</strong>) + Final Lobby Floor (<strong>12</strong>) = <strong className="font-mono text-base">489512</strong>
          </p>
          <p>
            <strong>Art Deco Dual Wheel Bearings:</strong> Left Wheel = <strong>240°</strong> · Right Wheel = <strong>060°</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            pinClue('clue-ch12-master', 'Master Lobby Cipher & Wheels', 'Cipher: 489512 · Left Wheel: 240° · Right Wheel: 060°')
          }
          className="w-full min-h-[44px] rounded-xl bg-[#1E2430] text-amber-300 text-xs font-semibold cursor-pointer"
        >
          {pinnedLocal || 'Pin Master Cipher to Clue Board'}
        </button>
      </div>
    );
  }

  if (hotspot === 'ch12_wheel_left' || hotspot === 'ch12_wheel_right') {
    const isLeft = hotspot === 'ch12_wheel_left';
    const val = isLeft ? p.ch12WheelLeft : p.ch12WheelRight;
    const target = isLeft ? 240 : 60;
    return (
      <div className="space-y-3">
        <RotaryDialWheel
          label={isLeft ? 'Left Brass Vault Wheel' : 'Right Brass Vault Wheel'}
          value={val}
          min={0}
          max={345}
          step={15}
          unit="°"
          wrap360={true}
          solved={val === target}
          onChange={(deg) => onAction('ch12:rotate_wheel', { angle: deg })}
        />
        {!p.ch12MasterCipherOpen && (
          <p className="text-xs text-center text-zinc-400">
            Wheels are engaged after Security enters the 6-digit building cipher (489512).
          </p>
        )}
      </div>
    );
  }

  if (hotspot === 'ch12_crash_bar') {
    const ready = p.ch12MasterCipherOpen && p.ch12WheelLeft === 240 && p.ch12WheelRight === 60;
    const holdPct = Math.round(p.ch12DualHoldProgress * 100);
    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Left Wheel (240°)</span>
            <span className={p.ch12WheelLeft === 240 ? 'text-emerald-400' : 'text-amber-400'}>{p.ch12WheelLeft}°</span>
          </div>
          <div className="flex justify-between">
            <span>Right Wheel (060°)</span>
            <span className={p.ch12WheelRight === 60 ? 'text-emerald-400' : 'text-amber-400'}>{p.ch12WheelRight}°</span>
          </div>
          <div className="flex justify-between">
            <span>Partner Bar State</span>
            <span className={partnerSlot?.holdingLatch ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
              {partnerSlot?.holdingLatch ? 'HOLDING NOW!' : 'Not holding'}
            </span>
          </div>
        </div>

        <div className="h-3 rounded-full bg-[#0B0E14] border border-white/15 overflow-hidden">
          <div
            style={{ width: `${holdPct}%` }}
            className="h-full bg-emerald-400 transition-all duration-100"
          />
        </div>

        <button
          type="button"
          disabled={!ready}
          onPointerDown={() => {
            if (!ready) return;
            soundFx.click();
            onAction('latch:hold', { holding: true });
          }}
          onPointerUp={() => onAction('latch:hold', { holding: false })}
          onPointerCancel={() => onAction('latch:hold', { holding: false })}
          onPointerLeave={() => {
            if (mySlot?.holdingLatch) onAction('latch:hold', { holding: false });
          }}
          className={`w-full min-h-[60px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 select-none touch-none cursor-pointer ${
            !ready
              ? 'bg-[#1E2430] text-zinc-500 cursor-not-allowed'
              : mySlot?.holdingLatch
              ? 'bg-emerald-400 text-zinc-950 scale-[0.99]'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
          }`}
        >
          <DoorOpen className="w-5 h-5" />
          <span>
            {!ready
              ? 'Complete Cipher & Dual Wheels First'
              : mySlot?.holdingLatch
              ? `Holding Crash Bar… (${holdPct}%)`
              : 'PRESS & HOLD BOTH CRASH BARS (2.8s)'}
          </span>
        </button>
      </div>
    );
  }

  return null;
};
