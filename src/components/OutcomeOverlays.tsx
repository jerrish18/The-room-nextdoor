import React, { useEffect } from 'react';
import { BatteryWarning, CheckCircle2, Clock, DoorOpen, Lightbulb, RotateCcw, Zap } from 'lucide-react';
import { RoomState, formatCountdown } from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';
import { ROOM_ASSETS } from '../utils/roomAssets';

export const OutOfPowerOverlay: React.FC<{
  room: RoomState;
  onContinueAux: () => void;
  onRestart: () => void;
}> = ({ room, onContinueAux, onRestart }) => {
  if (room.status !== 'OUT_OF_POWER') return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161A22] border border-red-500/40 rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3 text-red-400">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/35 flex items-center justify-center shrink-0">
            <BatteryWarning className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Backup Battery Depleted</h2>
            <p className="text-xs text-red-300">Main inverter offline · Emergency reserve available</p>
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          The main 30-minute UPS bank ran out during the blackout. You can switch to the building’s secondary 10-minute auxiliary cell to finish unlocking the corridor doors, or restart the case from scratch.
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              soundFx.unlock();
              onContinueAux();
            }}
            className="w-full min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Switch to Auxiliary Cell (+10:00)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.click();
              onRestart();
            }}
            className="w-full min-h-[46px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 border border-white/10 text-zinc-200 font-medium text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Case (30:00)</span>
          </button>
        </div>
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
        {/* Hallway Visual Banner */}
        <div className="relative h-44 sm:h-56 overflow-hidden">
          <img
            src={ROOM_ASSETS.cctvHallway}
            alt="Marina Towers 4th-floor hallway open and cleared"
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
                Both Corridor Maglocks Released · 21:40 LIVE
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">You Escaped Together</h2>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Mystery Explanation */}
          <div className="p-4 rounded-xl bg-[#12161E] border border-white/10 space-y-2">
            <h3 className="text-sm font-semibold text-amber-300">
              Case File Closed: Why the Timestamp Was 5 Minutes Ahead
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              The night supervisor forced the DVR’s NTP clock <strong className="text-white">+05:00 minutes ahead</strong> (`21:45:00`) to loop an empty pre-recorded corridor clip over live feeds while slipping audit ledgers out of Flat 4B. When the monsoon blackout hit Mylapore, the mismatched timestamp locked the building’s automated fire-deadbolts—trapping you both on Floor 4 until you reset the loop and engaged both latches simultaneously.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-center">
              <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="font-mono text-lg font-bold text-white">
                {formatCountdown(room.elapsedSeconds)}
              </div>
              <div className="text-[11px] text-zinc-400">Elapsed Time</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="font-mono text-lg font-bold text-white">4 / 4</div>
              <div className="text-[11px] text-zinc-400">Puzzles Solved</div>
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
              <span>Play Again</span>
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
