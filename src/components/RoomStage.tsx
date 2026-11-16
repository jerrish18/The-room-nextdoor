import React, { useState } from 'react';
import { CheckCircle2, DoorOpen } from 'lucide-react';
import { PlayerRole, RoomState } from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';
import { getRoomSceneConfig } from './chapters/ChapterStageConfig';

interface RoomStageProps {
  room: RoomState;
  role: PlayerRole;
  onSelectHotspot: (id: string) => void;
}

export const RoomStage: React.FC<RoomStageProps> = ({ room, role, onSelectHotspot }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const scene = getRoomSceneConfig(room, role);

  const handleTap = (id: string) => {
    soundFx.click();
    onSelectHotspot(id);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Illustrated Room Frame */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[#12161E] shadow-xl select-none">
        {!imgFailed ? (
          <img
            key={`${room.currentChapter}-${role}-${scene.imageSrc}`}
            src={scene.imageSrc}
            alt={scene.imageAlt}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className={`w-full h-full object-cover transition-all duration-500 ${scene.overlayClass}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#161A22] to-[#0E1014] flex flex-col items-center justify-center p-6 text-center">
            <DoorOpen className="w-10 h-10 text-amber-400 mb-2" />
            <div className="text-sm font-semibold text-zinc-200">{scene.caption}</div>
            <p className="text-xs text-zinc-400 mt-1">Select any object below to inspect.</p>
          </div>
        )}

        {/* Scrim vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

        {/* Room Environment State Caption */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-sm text-zinc-200 border border-white/10 font-medium truncate">
            {scene.caption}
          </span>
        </div>

        {/* Interactive Hotspot Pins */}
        {scene.hotspots.map((spot) => (
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

      {/* Thumb-Friendly Quick-Inspect Object Grid */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 px-0.5">
          <span>Tap an object pin or card below to inspect & interact</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {scene.hotspots.map((spot) => (
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
