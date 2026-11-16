import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Delete, Eye, Minus, Plus, RotateCw, Search } from 'lucide-react';
import { soundFx } from '../utils/soundFx';

// 1. Continuous Circular Rotary Wheel / Valve / Azimuth Dial
export const RotaryDialWheel: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  wrap360?: boolean;
  targetHint?: string;
  solved?: boolean;
  onChange: (val: number) => void;
}> = ({
  label,
  value,
  min,
  max,
  step = 5,
  unit = '',
  wrap360 = false,
  targetHint,
  solved = false,
  onChange
}) => {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const lastStepRef = useRef(value);

  const ratio = wrap360 ? (value % 360) / 360 : (value - min) / Math.max(1, max - min);
  const displayDeg = wrap360 ? value : -135 + ratio * 270;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    let nextVal: number;
    if (wrap360) {
      nextVal = (Math.round(deg / step) * step) % 360;
    } else {
      // Map [-135, +135] around top (0deg)
      const signed = deg > 180 ? deg - 360 : deg;
      const clampedSigned = Math.max(-135, Math.min(135, signed));
      const norm = (clampedSigned + 135) / 270;
      nextVal = min + Math.round((norm * (max - min)) / step) * step;
      nextVal = Math.max(min, Math.min(max, nextVal));
    }

    if (nextVal !== lastStepRef.current) {
      lastStepRef.current = nextVal;
      soundFx.ratchet();
      onChange(nextVal);
    }
  };

  const nudge = (delta: number) => {
    soundFx.ratchet();
    if (wrap360) {
      const next = (((value + delta) % 360) + 360) % 360;
      lastStepRef.current = next;
      onChange(next);
    } else {
      const next = Math.max(min, Math.min(max, value + delta));
      lastStepRef.current = next;
      onChange(next);
    }
  };

  return (
    <div
      className={`p-3.5 rounded-xl border flex flex-col items-center gap-2.5 ${
        solved ? 'bg-emerald-500/10 border-emerald-500/45' : 'bg-[#12161E] border-white/10'
      }`}
    >
      <div className="w-full flex items-center justify-between text-xs">
        <span className="font-semibold text-zinc-200">{label}</span>
        {targetHint && <span className="font-mono text-[11px] text-zinc-400">{targetHint}</span>}
      </div>

      {/* Physical Spoked Rotary Dial */}
      <div
        ref={wheelRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={(e) => {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          updateFromPointer(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
        className="relative w-28 h-28 rounded-full bg-[#0B0E14] border-4 border-zinc-700 shadow-inner flex items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing"
      >
        <div
          style={{ transform: `rotate(${displayDeg}deg)` }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600/35 to-zinc-800 border-2 border-amber-400/60 flex items-start justify-center transition-transform duration-75"
        >
          <div className="w-2 h-5 rounded-full bg-amber-400 mt-1 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-2 py-0.5 rounded bg-black/80 border border-white/10 font-mono text-xs font-bold text-white">
            {value}{unit}
          </div>
        </div>
      </div>

      {/* Fine Step Nudge Controls */}
      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          onClick={() => nudge(-step)}
          aria-label={`Decrease ${label}`}
          className="flex-1 min-h-[40px] rounded-lg bg-[#1E2430] hover:bg-zinc-700 border border-white/10 text-zinc-200 flex items-center justify-center cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => nudge(step)}
          aria-label={`Increase ${label}`}
          className="flex-1 min-h-[40px] rounded-lg bg-[#1E2430] hover:bg-zinc-700 border border-white/10 text-zinc-200 flex items-center justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// 2. Physical Combination Tumbler Rings (Padlocks, Desk Dials, Cryptex)
export const DialRingTumbler: React.FC<{
  rings: string[];
  values: string[];
  charset?: string[];
  onChange: (nextValues: string[]) => void;
  onUnlock?: (combined: string) => void;
  unlockLabel?: string;
  errorText?: string | null;
}> = ({
  rings,
  values,
  charset = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  onChange,
  onUnlock,
  unlockLabel = 'Pull Shackle',
  errorText
}) => {
  const stepRing = (ringIdx: number, dir: 1 | -1) => {
    soundFx.ratchet();
    const cur = values[ringIdx] ?? charset[0];
    const pos = Math.max(0, charset.indexOf(cur));
    const nextChar = charset[(pos + dir + charset.length) % charset.length];
    const next = [...values];
    next[ringIdx] = nextChar;
    onChange(next);
  };

  return (
    <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 space-y-3">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${rings.length}, minmax(0, 1fr))` }}>
        {rings.map((label, idx) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400">{label}</span>
            <button
              type="button"
              onClick={() => stepRing(idx, 1)}
              aria-label={`Spin ${label} up`}
              className="w-full min-h-[40px] rounded-lg bg-[#1E2430] hover:bg-zinc-700 border border-white/10 flex items-center justify-center text-zinc-300 cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="w-full h-12 rounded-xl bg-[#090B10] border-2 border-amber-500/40 flex items-center justify-center font-mono text-2xl font-bold text-amber-300 shadow-inner select-none">
              {values[idx] ?? charset[0]}
            </div>
            <button
              type="button"
              onClick={() => stepRing(idx, -1)}
              aria-label={`Spin ${label} down`}
              className="w-full min-h-[40px] rounded-lg bg-[#1E2430] hover:bg-zinc-700 border border-white/10 flex items-center justify-center text-zinc-300 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {errorText && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-xs text-red-300 text-center">
          {errorText}
        </div>
      )}

      {onUnlock && (
        <button
          type="button"
          onClick={() => onUnlock(values.join(''))}
          className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
        >
          {unlockLabel}
        </button>
      )}
    </div>
  );
};

// 3. Draggable Track / Lever / Reel Slider
export const DraggableSliderTrack: React.FC<{
  label: string;
  hint: string;
  value: number; // 0..100
  threshold?: number; // auto-complete threshold if latch-type
  completed?: boolean;
  unitLabel?: string;
  onChange: (val: number) => void;
}> = ({ label, hint, value, threshold, completed = false, unitLabel = '%', onChange }) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = (clientX: number) => {
    if (completed) return;
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
    if (pct !== value) {
      if (pct % 10 === 0) soundFx.ratchet();
      onChange(pct);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border space-y-2.5 ${
        completed ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-[#12161E] border-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-white">{label}</span>
        <span className="font-mono text-amber-400">
          {completed ? 'ENGAGED' : `${value}${unitLabel}`}
        </span>
      </div>
      <p className="text-xs text-zinc-400">{hint}</p>

      <div
        ref={trackRef}
        onPointerDown={(e) => {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          updateFromClientX(e.clientX);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
        className="relative h-12 rounded-xl bg-[#090B10] border border-white/15 overflow-hidden touch-none select-none cursor-ew-resize flex items-center"
      >
        <div
          style={{ width: `${value}%` }}
          className={`h-full transition-all duration-75 ${
            completed ? 'bg-emerald-500/35' : 'bg-amber-500/30'
          }`}
        />
        {threshold && !completed && (
          <div
            style={{ left: `${threshold}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/70"
          />
        )}
        <div
          style={{ left: `calc(${Math.min(92, Math.max(4, value))}% - 18px)` }}
          className={`absolute w-9 h-9 rounded-lg border flex items-center justify-center shadow-lg ${
            completed
              ? 'bg-emerald-400 border-emerald-200 text-zinc-950'
              : 'bg-amber-500 border-amber-200 text-zinc-950'
          }`}
        >
          <span className="font-mono text-xs font-bold">≡</span>
        </div>
      </div>
    </div>
  );
};

// 4. Pointer-Tracked Live UV Blacklight / Magnifier Loupe Surface
export interface UVHotzone {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  revealText: string;
  found: boolean;
}

export const UVSpotlightSurface: React.FC<{
  activeToolName: string;
  hasToolEquipped: boolean;
  mode: 'UV' | 'LOUPE';
  surfaceCaption: string;
  zones: UVHotzone[];
  onDiscoverZone: (zoneId: string) => void;
}> = ({ activeToolName, hasToolEquipped, mode, surfaceCaption, zones, onDiscoverZone }) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [beam, setBeam] = useState<{ x: number; y: number } | null>({ x: 50, y: 50 });

  const handleMove = (clientX: number, clientY: number) => {
    if (!hasToolEquipped) return;
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setBeam({ x, y });

    for (const z of zones) {
      if (!z.found && Math.hypot(x - z.xPercent, y - z.yPercent) < 16) {
        soundFx.unlock();
        onDiscoverZone(z.id);
      }
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-300 font-medium">{surfaceCaption}</span>
        <span className={hasToolEquipped ? 'text-violet-300 font-mono' : 'text-amber-300'}>
          {hasToolEquipped
            ? `Drag ${mode === 'UV' ? 'UV Beam' : 'Loupe'} across surface`
            : `Equip ${activeToolName} in Bag`}
        </span>
      </div>

      <div
        ref={boxRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handleMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === 'mouse') {
            handleMove(e.clientX, e.clientY);
          }
        }}
        className="relative h-48 rounded-xl border border-white/15 bg-[#06080C] overflow-hidden touch-none select-none cursor-crosshair"
      >
        {/* Dynamic UV or Amber Loupe Beam */}
        {hasToolEquipped && beam && (
          <div
            style={{
              background:
                mode === 'UV'
                  ? `radial-gradient(circle 82px at ${beam.x}% ${beam.y}%, rgba(167,139,250,0.38) 0%, rgba(109,40,217,0.16) 55%, transparent 80%)`
                  : `radial-gradient(circle 78px at ${beam.x}% ${beam.y}%, rgba(251,191,36,0.32) 0%, rgba(217,119,6,0.12) 55%, transparent 80%)`
            }}
            className="absolute inset-0 pointer-events-none"
          />
        )}

        {/* Hidden Zones Revealed Inside Beam or Already Found */}
        {zones.map((z) => {
          const dist = beam ? Math.hypot(beam.x - z.xPercent, beam.y - z.yPercent) : 999;
          const visible = z.found || (hasToolEquipped && dist < 24);
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => {
                if (hasToolEquipped && !z.found) {
                  soundFx.unlock();
                  onDiscoverZone(z.id);
                }
              }}
              style={{ left: `${z.xPercent}%`, top: `${z.yPercent}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-lg border text-center transition-opacity duration-200 cursor-pointer ${
                visible
                  ? mode === 'UV'
                    ? 'opacity-100 bg-violet-950/80 border-violet-400/60 text-violet-200'
                    : 'opacity-100 bg-amber-950/85 border-amber-400/60 text-amber-200'
                  : 'opacity-10 bg-zinc-900/40 border-white/5 text-transparent'
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-wide">{z.label}</div>
              <div className="font-mono text-xs font-bold mt-0.5">{visible ? z.revealText : '???'}</div>
            </button>
          );
        })}

        {!hasToolEquipped && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 p-4 text-center">
            {mode === 'UV' ? <Eye className="w-6 h-6 text-violet-400 mb-1.5" /> : <Search className="w-6 h-6 text-amber-400 mb-1.5" />}
            <div className="text-xs font-medium text-zinc-200">
              Too dark / tiny to inspect bare-handed
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Tap <strong>{activeToolName}</strong> in your Bag below to equip it first.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. Physical Unscrewing Cover Plate
export const ScrewPlateCover: React.FC<{
  title: string;
  screwsRemoved: boolean[];
  requiresToolName?: string;
  hasToolEquipped: boolean;
  onUnscrew: (index: number) => void;
}> = ({ title, screwsRemoved, requiresToolName, hasToolEquipped, onUnscrew }) => {
  return (
    <div className="p-5 rounded-xl bg-[#12161E] border border-zinc-700/70 space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-zinc-200">{title}</span>
        <span className="font-mono text-amber-400">
          {screwsRemoved.filter(Boolean).length}/{screwsRemoved.length} Bolts Removed
        </span>
      </div>

      <p className="text-xs text-zinc-400">
        {hasToolEquipped
          ? 'Tap each brass corner bolt to turn and unscrew the steel access cover.'
          : requiresToolName
          ? `Requires ${requiresToolName} equipped in your Bag (combine parts if needed).`
          : 'Tap each wingnut to unscrew the access cover by hand.'}
      </p>

      <div
        className={`grid gap-3 ${
          screwsRemoved.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {screwsRemoved.map((removed, idx) => (
          <button
            key={idx}
            type="button"
            disabled={removed || !hasToolEquipped}
            onClick={() => {
              soundFx.screwTurn();
              onUnscrew(idx);
            }}
            className={`min-h-[54px] rounded-xl border flex items-center justify-center gap-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
              removed
                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300'
                : hasToolEquipped
                ? 'bg-[#1E2430] hover:bg-zinc-700 border-amber-500/45 text-amber-200 active:scale-95'
                : 'bg-[#0E1014] border-white/10 text-zinc-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${removed ? 'opacity-30' : ''}`} />
            <span>{removed ? `Bolt ${idx + 1} Off` : `Unscrew #${idx + 1}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 6. Tactile Brass Numeric Keypad
export const NumericKeypad: React.FC<{
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
        <span className="font-mono">
          {digits.length}/{expectedLength}
        </span>
      </div>
      <div className="h-12 rounded-xl bg-[#0E1014] border border-white/15 flex items-center justify-center gap-3 mb-3">
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
            className="min-h-[46px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 active:scale-95 font-mono text-lg font-semibold text-white border border-white/10 transition-transform cursor-pointer"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          aria-label="Backspace"
          className="min-h-[46px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 active:scale-95 text-zinc-300 border border-white/10 flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => press('0')}
          className="min-h-[46px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 active:scale-95 font-mono text-lg font-semibold text-white border border-white/10 cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleEnter}
          disabled={digits.length < expectedLength}
          className="min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 active:scale-95 text-zinc-950 font-semibold text-sm flex items-center justify-center cursor-pointer"
        >
          Enter
        </button>
      </div>
    </div>
  );
};
