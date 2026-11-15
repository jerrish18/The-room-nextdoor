import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Check, Copy, DoorClosed, KeyRound, Play, Shield, Users } from 'lucide-react';
import { PlayerRole, RoomState } from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';
import { ROOM_ASSETS } from '../utils/roomAssets';

interface LobbyScreenProps {
  room: RoomState | null;
  myRole: PlayerRole | null;
  loading: boolean;
  error: string | null;
  onCreateRoom: (name: string, role: PlayerRole) => void;
  onJoinRoom: (code: string, name: string) => void;
  onSwapRoles: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onClearError: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  myRole,
  loading,
  error,
  onCreateRoom,
  onJoinRoom,
  onSwapRoles,
  onStartGame,
  onLeaveRoom,
  onClearError
}) => {
  const [guestName, setGuestName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [preferredRole, setPreferredRole] = useState<PlayerRole>('P1_SECURITY');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) {
      setJoinCode(urlRoom.toUpperCase());
      setMode('JOIN');
    }
  }, []);

  const shareUrl = room ? `${window.location.origin}/?room=${room.code}` : '';

  const copyInvite = async () => {
    if (!shareUrl) return;
    soundFx.click();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback select
    }
  };

  if (room) {
    const p1 = room.players.P1_SECURITY;
    const p2 = room.players.P2_STUDY;
    const bothPresent = Boolean(p1 && p2);

    return (
      <div className="min-h-screen bg-[#0E1014] text-zinc-100 flex flex-col justify-center px-4 py-8">
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Case Dossier Card */}
          <div className="lg:col-span-5 bg-[#161A22] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs text-amber-400 font-medium tracking-wide">
                Case 01 · Marina Towers, Mylapore
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-white mt-2">
                The Room Next Door
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed mt-3">
                A monsoon blackout traps two friends in adjoining rooms on the 4th floor. Outside, the hallway CCTV monitor displays a timestamp five minutes in the future.
              </p>

              <div className="mt-6 pt-5 border-t border-white/10">
                <span className="text-xs text-zinc-400 block">Private Room Code</span>
                <div className="flex items-center justify-between mt-1.5 gap-3">
                  <span className="font-mono text-3xl font-semibold tracking-[0.18em] text-amber-400">
                    {room.code}
                  </span>
                  <button
                    type="button"
                    onClick={copyInvite}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E2430] hover:bg-zinc-800 border border-white/10 text-sm font-medium text-zinc-100 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2 break-all">{shareUrl}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <span>20–30 min co-op · 4 linked puzzles</span>
              <button
                type="button"
                onClick={() => {
                  soundFx.click();
                  onLeaveRoom();
                }}
                className="min-h-[44px] px-2 text-zinc-400 hover:text-zinc-200 underline underline-offset-4 cursor-pointer"
              >
                Leave Room
              </button>
            </div>
          </div>

          {/* Player Slots & Start Controls */}
          <div className="lg:col-span-7 bg-[#161A22] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Room Assignments</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Each player sees different clues and physical controls.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.click();
                    onSwapRoles();
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1E2430] hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                  <span>Swap Rooms</span>
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {/* Slot 1: Security Booth */}
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    myRole === 'P1_SECURITY'
                      ? 'bg-[#1E2430] border-amber-500/50'
                      : 'bg-[#12161E] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          <span className="truncate">Security & Power Booth</span>
                          {myRole === 'P1_SECURITY' && (
                            <span className="text-xs font-medium text-amber-400 shrink-0">· You</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          Breakers, CCTV feeds, DVR scrubber & maintenance chart
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {p1 ? (
                        <div>
                          <div className="text-sm font-medium text-zinc-100">{p1.name}</div>
                          <div className="text-xs text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${p1.connected ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                            <span>{p1.connected ? 'Connected' : 'Joining…'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500">Waiting for player…</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slot 2: Flat 4B Study */}
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    myRole === 'P2_STUDY'
                      ? 'bg-[#1E2430] border-amber-500/50'
                      : 'bg-[#12161E] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <DoorClosed className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          <span className="truncate">Flat 4B Study</span>
                          {myRole === 'P2_STUDY' && (
                            <span className="text-xs font-medium text-amber-400 shrink-0">· You</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          Desk drawer, junction box, wall safe & air vent slot
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {p2 ? (
                        <div>
                          <div className="text-sm font-medium text-zinc-100">{p2.name}</div>
                          <div className="text-xs text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${p2.connected ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                            <span>{p2.connected ? 'Connected' : 'Joining…'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500">Waiting for friend…</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10">
              {!bothPresent ? (
                <div className="p-3.5 rounded-xl bg-[#12161E] border border-white/10 text-xs text-zinc-300 flex items-center gap-3">
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Share code <strong className="font-mono text-amber-400">{room.code}</strong> or copy the invite link above so your partner can join on their phone.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.unlock();
                    onStartGame();
                  }}
                  className="w-full min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-zinc-950 font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Enter Locked Rooms · Start 30:00 Timer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1014] text-zinc-100 flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Illustrated Noir Intro Panel */}
        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/10 bg-[#161A22] min-h-[320px] flex flex-col justify-end">
          <img
            src={ROOM_ASSETS.cctvHallway}
            alt="Dimly lit Chennai apartment corridor under surveillance during a blackout"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1014] via-[#0E1014]/70 to-transparent" />
          <div className="relative p-6 sm:p-8">
            <div className="text-xs font-medium text-amber-400 tracking-wide">
              Two-Player Online Escape Room · Chennai Blackout
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
              The Room Next Door
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mt-3 max-w-lg">
              Locked in adjoining rooms on Floor 4 during a power cut. Only one thing makes less sense than the deadbolts: your security monitor shows the hallway five minutes in the future.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-5">
              <span>2 phones in portrait or desktop</span>
              <span aria-hidden="true">·</span>
              <span>Real-time puzzle sync</span>
              <span aria-hidden="true">·</span>
              <span>30 min backup battery</span>
            </div>
          </div>
        </div>

        {/* Create / Join Form */}
        <div className="lg:col-span-6 bg-[#161A22] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-center">
          {/* Segmented Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0E1014] border border-white/10">
            <button
              type="button"
              onClick={() => {
                soundFx.click();
                setMode('CREATE');
                onClearError();
              }}
              className={`min-h-[44px] rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === 'CREATE'
                  ? 'bg-[#1E2430] text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.click();
                setMode('JOIN');
                onClearError();
              }}
              className={`min-h-[44px] rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === 'JOIN'
                  ? 'bg-[#1E2430] text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Join with Code
            </button>
          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              soundFx.click();
              const cleanName = guestName.trim() || (mode === 'CREATE' ? 'Player 1' : 'Player 2');
              if (mode === 'CREATE') {
                onCreateRoom(cleanName, preferredRole);
              } else {
                onJoinRoom(joinCode, cleanName);
              }
            }}
          >
            <div>
              <label htmlFor="guest-name" className="block text-xs font-medium text-zinc-300 mb-2">
                Your Guest Name
              </label>
              <input
                id="guest-name"
                type="text"
                maxLength={24}
                placeholder={mode === 'CREATE' ? 'e.g. Arjun' : 'e.g. Kavya'}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl bg-[#0E1014] border border-white/15 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {mode === 'CREATE' ? (
              <div>
                <span className="block text-xs font-medium text-zinc-300 mb-2">
                  Starting Room
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      setPreferredRole('P1_SECURITY');
                    }}
                    className={`min-h-[56px] p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      preferredRole === 'P1_SECURITY'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-[#0E1014] border-white/10 text-zinc-300 hover:border-white/25'
                    }`}
                  >
                    <div className="text-sm font-semibold">Security Booth</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Cameras & power</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      setPreferredRole('P2_STUDY');
                    }}
                    className={`min-h-[56px] p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      preferredRole === 'P2_STUDY'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-[#0E1014] border-white/10 text-zinc-300 hover:border-white/25'
                    }`}
                  >
                    <div className="text-sm font-semibold">Flat 4B Study</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Drawers & wiring</div>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="room-code" className="block text-xs font-medium text-zinc-300 mb-2">
                  6-Character Room Code
                </label>
                <input
                  id="room-code"
                  type="text"
                  maxLength={8}
                  required
                  placeholder="MYL402"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-[#0E1014] border border-white/15 font-mono text-lg tracking-widest uppercase text-amber-400 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'JOIN' && joinCode.trim().length < 4)}
              className="w-full min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <KeyRound className="w-5 h-5" />
              <span>
                {loading
                  ? 'Connecting…'
                  : mode === 'CREATE'
                  ? 'Create Private Room'
                  : 'Join Partner’s Room'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
