import React, { useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  Clock,
  DoorClosed,
  Lightbulb,
  Map,
  Package,
  Radio,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRoomSocket } from './hooks/useRoomSocket';
import { LobbyScreen } from './components/LobbyScreen';
import { RoomStage } from './components/RoomStage';
import { InspectionModal } from './components/InspectionModal';
import { InventoryWorkbench } from './components/InventoryWorkbench';
import {
  ChapterMapModal,
  ClueBoardPanel,
  HintDrawerModal,
  RadioChatPanel
} from './components/ClueAndChatPanels';
import { ChapterTransitionOverlay, EscapedOverlay } from './components/OutcomeOverlays';
import { CHAPTER_CATALOG, formatSpeedrunClock, getChapterObjective } from './shared/gameTypes';
import { soundFx } from './utils/soundFx';

type MobileTab = 'ROOM' | 'BAG' | 'CLUES' | 'RADIO';

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
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [dismissedBannerId, setDismissedBannerId] = useState<string | null>(null);

  const prevChatCountRef = useRef<number>(0);

  // Close open inspection sheets cleanly when chapter or status transitions
  useEffect(() => {
    setActiveHotspot(null);
  }, [room?.currentChapter, room?.status]);

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
  const chMeta = CHAPTER_CATALOG.find((c) => c.chapter === room.currentChapter)!;
  const objective = getChapterObjective(room);
  const activeItemCount = room.inventory.filter((i) => !i.consumed).length;
  const showBanner =
    room.lastEventBanner &&
    room.lastEventBanner.id !== dismissedBannerId &&
    (!room.lastEventBanner.targetRole || room.lastEventBanner.targetRole === myRole);

  return (
    <div className="min-h-screen bg-[#0E1014] text-zinc-100 flex flex-col">
      {/* Compact Sticky Top HUD (52px height) */}
      <header className="sticky top-0 z-30 h-[52px] bg-[#161A22]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Zone 1: Active Chapter & Wing */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-bold text-amber-400 shrink-0">
            CH {String(room.currentChapter).padStart(2, '0')}/12
          </span>
          <span className="text-xs text-zinc-500">·</span>
          <span className="text-xs sm:text-sm font-semibold text-white truncate">
            {myRole === 'P1_SECURITY' ? chMeta.p1RoomName : chMeta.p2RoomName}
          </span>
        </div>

        {/* Zone 2: Untimed Elapsed Speedrun Clock */}
        <div
          className="flex items-center gap-1.5 font-mono text-sm font-semibold text-emerald-400 shrink-0"
          title="Elapsed Speedrun Clock"
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>{formatSpeedrunClock(room.elapsedSeconds)}</span>
        </div>

        {/* Zone 3: Partner Presence + Map + Mute + Hints */}
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
            onClick={() => {
              soundFx.click();
              setMapOpen(true);
            }}
            aria-label="Open chapter map"
            className="min-w-[40px] min-h-[40px] rounded-lg bg-[#1E2430] hover:bg-zinc-700 text-zinc-300 flex items-center justify-center cursor-pointer"
          >
            <Map className="w-4 h-4" />
          </button>

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
            className="min-h-[40px] px-2.5 sm:px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Hints</span>
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
        {/* Current Chapter Objective + Event Banner */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 px-1">
            <span className="truncate">{objective}</span>
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

        {/* Desktop 2-Column Layout + Mobile 4-Tab Switch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Room Stage + Field Bag */}
          <div className="lg:col-span-7 space-y-4">
            <div className={mobileTab !== 'ROOM' ? 'hidden lg:block' : ''}>
              <RoomStage
                room={room}
                role={myRole}
                onSelectHotspot={(id) => setActiveHotspot(id)}
              />
            </div>

            <div className={mobileTab !== 'BAG' ? 'hidden lg:block' : ''}>
              <InventoryWorkbench
                room={room}
                role={myRole}
                compact={mobileTab !== 'BAG'}
                onAction={sendAction}
              />
            </div>
          </div>

          {/* Right Column: Clue Board & Radio Chat */}
          <div
            className={`lg:col-span-5 bg-[#161A22] border border-white/10 rounded-2xl p-4 sm:p-5 ${
              mobileTab !== 'CLUES' && mobileTab !== 'RADIO' ? 'hidden lg:block' : ''
            }`}
          >
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

      {/* Fixed Mobile Bottom Thumb Bar (64px height, 4 tabs) */}
      <nav
        aria-label="Primary mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-[#161A22]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-4 items-center px-1"
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
            setMobileTab('BAG');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
            mobileTab === 'BAG' ? 'text-amber-400' : 'text-zinc-400'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[11px] font-medium">Bag ({activeItemCount})</span>
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
            <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </nav>

      {/* Modals & Overlays */}
      <InspectionModal
        hotspot={activeHotspot}
        room={room}
        role={myRole}
        onClose={() => setActiveHotspot(null)}
        onAction={sendAction}
      />

      <HintDrawerModal
        open={hintsOpen}
        room={room}
        onClose={() => setHintsOpen(false)}
        onUnlockHint={() => sendAction('hint:unlock')}
      />

      <ChapterMapModal
        open={mapOpen}
        room={room}
        onClose={() => setMapOpen(false)}
      />

      <ChapterTransitionOverlay
        room={room}
        onAdvance={() => sendAction('chapter:advance')}
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
