import React, { useState } from 'react';
import { Lightbulb, Plus, Radio, Send } from 'lucide-react';
import {
  PROGRESSIVE_HINTS,
  PlayerRole,
  QUICK_RADIO_CALLOUTS,
  RoomState,
  getActiveStage
} from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';

export const ClueBoardPanel: React.FC<{
  room: RoomState;
  role: PlayerRole;
  onAction: (type: string, payload?: Record<string, unknown>) => void;
}> = ({ room, onAction }) => {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Shared Clue Board</h3>
          <p className="text-xs text-zinc-400">Synced live across both phones</p>
        </div>
        <button
          type="button"
          onClick={() => {
            soundFx.click();
            setShowAdd((v) => !v);
          }}
          className="min-h-[40px] px-3 rounded-xl bg-[#1E2430] hover:bg-zinc-700 border border-white/10 text-xs font-medium text-amber-300 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Note</span>
        </button>
      </div>

      {showAdd && (
        <form
          className="p-3.5 rounded-xl bg-[#12161E] border border-amber-500/35 space-y-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !detail.trim()) return;
            soundFx.click();
            onAction('clue:add', { title: title.trim(), detail: detail.trim() });
            setTitle('');
            setDetail('');
            setShowAdd(false);
          }}
        >
          <input
            type="text"
            maxLength={60}
            placeholder="Clue heading (e.g. Wall Symbols)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full min-h-[40px] px-3 rounded-lg bg-[#0E1014] border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <textarea
            rows={2}
            maxLength={200}
            placeholder="Details for your partner…"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#0E1014] border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="min-h-[38px] px-3 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[38px] px-4 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-xs cursor-pointer"
            >
              Pin Note
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {[...room.clues].reverse().map((clue) => (
          <div
            key={clue.id}
            className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-300">{clue.title}</span>
              <span className="text-[11px] text-zinc-500 shrink-0">
                {clue.authorRole === 'P1_SECURITY'
                  ? 'Security'
                  : clue.authorRole === 'P2_STUDY'
                  ? 'Flat 4B'
                  : 'Case Log'}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{clue.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RadioChatPanel: React.FC<{
  room: RoomState;
  role: PlayerRole;
  onAction: (type: string, payload?: Record<string, unknown>) => void;
}> = ({ room, role, onAction }) => {
  const [text, setText] = useState('');

  const sendMessage = (msg: string) => {
    const clean = msg.trim();
    if (!clean) return;
    soundFx.radio();
    onAction('chat:send', { text: clean });
    setText('');
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Walkie-Talkie Radio</h3>
        </div>
        <span className="text-[11px] text-zinc-400">Ch 04 · Floor 4</span>
      </div>

      {/* Quick Callouts */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_RADIO_CALLOUTS[role].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => sendMessage(preset)}
            className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#1E2430] hover:bg-zinc-700 border border-white/10 text-xs text-zinc-200 transition-colors cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div className="flex-1 min-h-[190px] max-h-[320px] overflow-y-auto space-y-2 pr-1">
        {room.chat.map((msg) => {
          const isMe = msg.senderRole === role;
          const isSys = msg.senderRole === 'SYSTEM';
          return (
            <div
              key={msg.id}
              className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                isSys
                  ? 'bg-[#12161E] border border-white/10 text-zinc-400'
                  : isMe
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-50 ml-6'
                  : 'bg-[#1E2430] border border-white/10 text-zinc-100 mr-6'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5 text-[10px] text-zinc-400">
                <span className="font-semibold">
                  {msg.senderName} {isMe ? '(You)' : ''}
                </span>
              </div>
              <div>{msg.text}</div>
            </div>
          );
        })}
      </div>

      {/* Text Input */}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(text);
        }}
      >
        <input
          type="text"
          maxLength={240}
          placeholder="Message partner…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#0E1014] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          aria-label="Send radio message"
          className="min-w-[44px] min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export const HintDrawerModal: React.FC<{
  open: boolean;
  room: RoomState;
  onClose: () => void;
  onUnlockHint: () => void;
}> = ({ open, room, onClose, onUnlockHint }) => {
  if (!open) return null;
  const activeStage = getActiveStage(room.puzzle);
  const stageDef = PROGRESSIVE_HINTS.find((h) => h.stage === activeStage)!;
  const unlockedTier = room.unlockedHints[activeStage] || 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-[#161A22] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Case Hints</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-3 rounded-lg bg-[#1E2430] text-xs text-zinc-300 cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          Active Objective: <strong className="text-zinc-200">{stageDef.title}</strong>
        </div>

        <div className="space-y-2.5">
          {[0, 1, 2].map((idx) => {
            const tierNum = idx + 1;
            const isUnlocked = unlockedTier >= tierNum;
            return (
              <div
                key={tierNum}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isUnlocked
                    ? 'bg-[#12161E] border-amber-500/35 text-zinc-200'
                    : 'bg-[#0E1014] border-white/10 text-zinc-500'
                }`}
              >
                {isUnlocked ? stageDef.tiers[idx] : `Tier ${tierNum} Hint locked`}
              </div>
            );
          })}
        </div>

        {unlockedTier < 3 ? (
          <button
            type="button"
            onClick={() => {
              soundFx.click();
              onUnlockHint();
            }}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
          >
            Reveal Tier {unlockedTier + 1} Hint ({unlockedTier === 0 ? 'Subtle' : unlockedTier === 1 ? 'Clear' : 'Exact Solution'})
          </button>
        ) : (
          <p className="text-xs text-center text-zinc-400">
            All hints for this stage are unlocked and pinned to your Clue Board.
          </p>
        )}
      </div>
    </div>
  );
};
