import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle2, Clock, DoorOpen, Lightbulb, RotateCcw } from 'lucide-react';
import { CHAPTER_CATALOG, RoomState, formatSpeedrunClock } from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';
import { ROOM_ASSETS } from '../utils/roomAssets';

export const ChapterTransitionOverlay: React.FC<{
  room: RoomState;
  onAdvance: () => void;
}> = ({ room, onAdvance }) => {
  if (room.status !== 'CHAPTER_TRANSITION') return null;

  const chMeta = CHAPTER_CATALOG.find((c) => c.chapter === room.currentChapter)!;
  const nextMeta = CHAPTER_CATALOG.find((c) => c.chapter === room.currentChapter + 1);
  const split = room.chapterSplits[room.currentChapter] || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#161A22] border border-emerald-500/45 rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-400">
              Chapter {String(room.currentChapter).padStart(2, '0')} of 12 Cleared
            </div>
            <h2 className="text-2xl font-bold text-white mt-0.5">{chMeta.title}</h2>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#12161E] border border-white/10 font-mono text-sm font-bold text-amber-400">
            Split {formatSpeedrunClock(split)}
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">{chMeta.completionStory}</p>

        {nextMeta && (
          <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 space-y-1">
            <div className="text-xs font-semibold text-amber-300">
              Up Next · Chapter {String(nextMeta.chapter).padStart(2, '0')}: {nextMeta.title}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{nextMeta.briefing}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            soundFx.unlock();
            onAdvance();
          }}
          className="w-full min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-base flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue to Chapter {String(room.currentChapter + 1).padStart(2, '0')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const EscapedOverlay: React.FC<{
  room: RoomState;
  onPlayAgain: () => void;
  onLeave: () => void;
}> = ({ room, onPlayAgain, onLeave }) => {
  useEffect(() => {
    if (room.status === 'ESCAPED') {
      soundFx.escape();
    }
  }, [room.status]);

  if (room.status !== 'ESCAPED') return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1014]/95 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#161A22] border border-emerald-500/40 rounded-2xl overflow-hidden shadow-2xl my-auto">
        <div className="relative h-44 sm:h-52 overflow-hidden">
          <img
            src={ROOM_ASSETS.ntpVaultLobby}
            alt="Marina Towers Main Brass Lobby Airlock Open"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161A22] via-[#161A22]/55 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center shrink-0">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-400">
                All 12 Chapters Complete · Marina Towers Unlocked
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">You Escaped Together</h2>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 space-y-2">
            <h3 className="text-sm font-semibold text-amber-300">
              Case File Closed: The Marina Towers +05:00 Conspiracy
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              The night supervisor and phantom contractor Kaveri Backup Systems spoofed Marina Towers’ sub-basement NTP clock <strong className="text-white">+05:00 minutes ahead</strong> (`21:45:00`) over fiber Rack 7 to loop an empty pre-recorded corridor clip while siphoning generator repair funds. When the monsoon blackout tripped the mezzanine bus, the mismatched timestamp sealed all twelve wings until you restored the diesel generator, unmasked Frame 14 in the darkroom, zeroed the NTP drift, and unlatched the grand brass airlock together.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-center">
              <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="font-mono text-lg font-bold text-white">
                {formatSpeedrunClock(room.elapsedSeconds)}
              </div>
              <div className="text-[11px] text-zinc-400">Total Speedrun</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="font-mono text-lg font-bold text-white">12 / 12</div>
              <div className="text-[11px] text-zinc-400">Chapters Solved</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-center">
              <Lightbulb className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="font-mono text-lg font-bold text-white">{room.hintsUsed}</div>
              <div className="text-[11px] text-zinc-400">Hints Used</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                soundFx.click();
                onPlayAgain();
              }}
              className="flex-1 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Campaign Again</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.click();
                onLeave();
              }}
              className="min-h-[48px] px-5 rounded-xl bg-[#1E2430] hover:bg-zinc-700 border border-white/10 text-zinc-200 font-medium text-sm cursor-pointer"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
