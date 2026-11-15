import React, { useEffect, useRef, useState } from 'react';
import {
  BatteryCharging,
  ClipboardList,
  DoorClosed,
  Lightbulb,
  Package,
  Radio,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRoomSocket } from './hooks/useRoomSocket';
import { LobbyScreen } from './components/LobbyScreen';
import { HotspotId, RoomStage } from './components/RoomStage';
import { InspectionModal } from './components/InspectionModal';
import { ClueBoardPanel, HintDrawerModal, RadioChatPanel } from './components/ClueAndChatPanels';
import { EscapedOverlay, OutOfPowerOverlay } from './components/OutcomeOverlays';
import { formatCountdown, getActiveStage } from './shared/gameTypes';
import { soundFx } from './utils/soundFx';

type MobileTab = 'ROOM' | 'CLUES' | 'RADIO';

export default function App() {
  const {
    session,
    room,
    wsConnected,
    reconnecting,
    error,
    loading,
    createPrivateRoom,
    joinPrivateRoom,
    leaveRoom,
    sendAction,
    clearError
  } = useRoomSocket();

  const [mobileTab, setMobileTab] = useState<MobileTab>('ROOM');
  const [desktopSideTab, setDesktopSideTab] = useState<'CLUES' | 'RADIO'>('CLUES');
  const [activeHotspot, setActiveHotspot] = useState<HotspotId | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [selectedItemDesc, setSelectedItemDesc] = useState<string | null>(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [dismissedBannerId, setDismissedBannerId] = useState<string | null>(null);

  const prevChatCountRef = useRef<number>(0);

  useEffect(() => {
    if (!room) return;
    const count = room.chat.length;
    if (count > prevChatCountRef.current) {
      const latest = room.chat[count - 1];
      if (latest && latest.senderRole !== session?.role && mobileTab !== 'RADIO') {
        setUnreadChat((u) => u + (count - prevChatCountRef.current));
      }
    }
    prevChatCountRef.current = count;
  }, [room?.chat.length, mobileTab, session?.role, room]);

  useEffect(() => {
    if (mobileTab === 'RADIO') {
      setUnreadChat(0);
    }
  }, [mobileTab]);

  const toggleMute = () => {
    const next = !muted;
    soundFx.muted = next;
    setMuted(next);
    if (!next) soundFx.click();
  };

  // Show Lobby when no room or room still in LOBBY
  if (!room || !session || room.status === 'LOBBY') {
    return (
      <LobbyScreen
        room={room}
        myRole={session?.role || null}
        loading={loading}
        error={error}
        onCreateRoom={createPrivateRoom}
        onJoinRoom={joinPrivateRoom}
        onSwapRoles={() => sendAction('lobby:swap_roles')}
        onStartGame={() => sendAction('lobby:start_game')}
        onLeaveRoom={leaveRoom}
        onClearError={clearError}
      />
    );
  }

  const myRole = session.role;
  const partnerRole = myRole === 'P1_SECURITY' ? 'P2_STUDY' : 'P1_SECURITY';
  const partner = room.players[partnerRole];
  const activeStage = getActiveStage(room.puzzle);
  const showBanner =
    room.lastEventBanner &&
    room.lastEventBanner.id !== dismissedBannerId &&
    (!room.lastEventBanner.targetRole || room.lastEventBanner.targetRole === myRole);

  const stageObjectives: Record<1 | 2 | 3 | 4, string> = {
    1: 'Stage 1 · Cut Flat 4B ceiling power to reveal wall symbols & unlock Desk Drawer',
    2: 'Stage 2 · Insert 15A fuse & match CAM 02/03 readings on Junction Box',
    3: 'Stage 3 · Decode CAM 01 DVR taps using Calendar map to open Wall Safe',
    4: 'Stage 4 · Pass Keycard via vent, reset +05:00 clock & hold both door latches'
  };

  return (
    <div className="min-h-screen bg-[#0E1014] text-zinc-100 flex flex-col">
      {/* Compact Sticky Top HUD (52px height) */}
      <header className="sticky top-0 z-30 h-[52px] bg-[#161A22]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Zone 1: Room Role & Code */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-white truncate">
            {myRole === 'P1_SECURITY' ? 'Security Booth' : 'Flat 4B Study'}
          </span>
          <span className="hidden sm:inline text-xs text-zinc-500">·</span>
          <span className="hidden sm:inline font-mono text-xs text-zinc-400 shrink-0">
            {room.code}
          </span>
        </div>

        {/* Zone 2: Backup Battery Countdown */}
        <div
          className={`flex items-center gap-1.5 font-mono text-sm font-semibold shrink-0 ${
            room.remainingSeconds <= 180 ? 'text-red-400' : 'text-amber-400'
          }`}
          title="Backup Battery Countdown"
        >
          <BatteryCharging className="w-4 h-4 shrink-0" />
          <span>{formatCountdown(room.remainingSeconds)}</span>
        </div>

        {/* Zone 3: Partner Presence + Mute + Hint */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12161E] border border-white/10 text-xs"
            title={partner?.connected ? 'Partner connected' : 'Partner disconnected'}
          >
            {wsConnected && partner?.connected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span className="text-zinc-300 truncate max-w-[90px]">
              {partner ? partner.name : 'Partner'}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-[#1E2430] hover:bg-zinc-700 text-zinc-300 flex items-center justify-center cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.click();
              setHintsOpen(true);
            }}
            className="min-h-[40px] px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Hints</span>
          </button>
        </div>
      </header>

      {/* Reconnecting Banner */}
      {reconnecting && (
        <div className="bg-amber-500/15 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 text-center">
          Connection interrupted — reconnecting to room {room.code}…
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 pb-24 lg:pb-8">
        {/* Current Objective + Live Event Strip */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 px-1">
            <span className="truncate">{stageObjectives[activeStage]}</span>
            <span className="font-mono text-zinc-500 shrink-0">
              {partner?.connected ? `${partner.name} online` : 'Partner reconnecting'}
            </span>
          </div>

          {showBanner && room.lastEventBanner && (
            <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-xs text-amber-200 flex items-center justify-between gap-3">
              <span>{room.lastEventBanner.text}</span>
              <button
                type="button"
                onClick={() => setDismissedBannerId(room.lastEventBanner!.id)}
                className="text-amber-300/80 hover:text-white shrink-0 font-medium cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Desktop 2-Column Layout + Mobile Tab Switch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Room Exploration + Inventory (Visible on Desktop OR Mobile ROOM tab) */}
          <div className={`lg:col-span-7 space-y-4 ${mobileTab !== 'ROOM' ? 'hidden lg:block' : ''}`}>
            <RoomStage
              room={room}
              role={myRole}
              onSelectHotspot={(id) => setActiveHotspot(id)}
            />

            {/* Compact Inventory Bar */}
            <div className="bg-[#161A22] border border-white/10 rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recovered Items ({room.inventory.length})</span>
                </span>
                <span className="text-[11px] text-zinc-500">Tap item to inspect</span>
              </div>

              {room.inventory.length === 0 ? (
                <div className="text-xs text-zinc-500 py-1">
                  No items collected yet. Search drawers, safes, and vents.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {room.inventory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        soundFx.click();
                        setSelectedItemDesc((prev) =>
                          prev === `${item.name}: ${item.description}` ? null : `${item.name}: ${item.description}`
                        );
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#1E2430] hover:bg-zinc-700 border border-white/10 text-xs font-medium text-zinc-100 flex items-center gap-2 cursor-pointer"
                    >
                      <span>{item.name}</span>
                      <span className="text-[10px] text-amber-400">
                        {item.holder === 'SHARED'
                          ? 'Shared'
                          : item.holder === myRole
                          ? 'You'
                          : 'Partner'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedItemDesc && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-[#12161E] border border-white/10 text-xs text-zinc-300">
                  {selectedItemDesc}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Clue Board & Radio Chat (Desktop Side Panel + Mobile Tab Content) */}
          <div className={`lg:col-span-5 bg-[#161A22] border border-white/10 rounded-2xl p-4 sm:p-5 ${mobileTab === 'ROOM' ? 'hidden lg:block' : ''}`}>
            {/* Desktop Segmented Toggle */}
            <div className="hidden lg:grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0E1014] border border-white/10 mb-4">
              <button
                type="button"
                onClick={() => {
                  soundFx.click();
                  setDesktopSideTab('CLUES');
                }}
                className={`min-h-[42px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  desktopSideTab === 'CLUES' ? 'bg-[#1E2430] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Clue Board ({room.clues.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.click();
                  setDesktopSideTab('RADIO');
                }}
                className={`min-h-[42px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  desktopSideTab === 'RADIO' ? 'bg-[#1E2430] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Radio Chat ({room.chat.length})
              </button>
            </div>

            {/* Mobile & Desktop Content Routing */}
            <div className="lg:hidden">
              {mobileTab === 'CLUES' && (
                <ClueBoardPanel room={room} role={myRole} onAction={sendAction} />
              )}
              {mobileTab === 'RADIO' && (
                <RadioChatPanel room={room} role={myRole} onAction={sendAction} />
              )}
            </div>

            <div className="hidden lg:block">
              {desktopSideTab === 'CLUES' ? (
                <ClueBoardPanel room={room} role={myRole} onAction={sendAction} />
              ) : (
                <RadioChatPanel room={room} role={myRole} onAction={sendAction} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Mobile Bottom Thumb Bar (64px height) */}
      <nav
        aria-label="Primary mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-[#161A22]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-3 items-center px-2"
      >
        <button
          type="button"
          onClick={() => {
            soundFx.click();
            setMobileTab('ROOM');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
            mobileTab === 'ROOM' ? 'text-amber-400' : 'text-zinc-400'
          }`}
        >
          <DoorClosed className="w-5 h-5" />
          <span className="text-[11px] font-medium">Room</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFx.click();
            setMobileTab('CLUES');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
            mobileTab === 'CLUES' ? 'text-amber-400' : 'text-zinc-400'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[11px] font-medium">Clues ({room.clues.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFx.click();
            setMobileTab('RADIO');
          }}
          className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
            mobileTab === 'RADIO' ? 'text-amber-400' : 'text-zinc-400'
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[11px] font-medium">
            Radio {unreadChat > 0 ? `(${unreadChat})` : ''}
          </span>
          {unreadChat > 0 && (
            <span className="absolute top-1.5 right-6 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </nav>

      {/* Modals & Overlays */}
      <InspectionModal
        hotspot={activeHotspot}
        room={room}
        role={myRole}
        onClose={() => setActiveHotspot(null)}
        onSwitchHotspot={(id) => setActiveHotspot(id)}
        onAction={sendAction}
      />

      <HintDrawerModal
        open={hintsOpen}
        room={room}
        onClose={() => setHintsOpen(false)}
        onUnlockHint={() => sendAction('hint:unlock')}
      />

      <OutOfPowerOverlay
        room={room}
        onContinueAux={() => sendAction('timer:continue_aux')}
        onRestart={() => sendAction('game:reset')}
      />

      <EscapedOverlay
        room={room}
        onPlayAgain={() => {
          setActiveHotspot(null);
          sendAction('game:reset');
        }}
        onLeave={leaveRoom}
      />
    </div>
  );
}
