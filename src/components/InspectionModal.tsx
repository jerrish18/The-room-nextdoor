import React from 'react';
import { X } from 'lucide-react';
import { PlayerRole, RoomState } from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';
import { getRoomSceneConfig } from './chapters/ChapterStageConfig';
import { Chapters1To6Panels } from './chapters/Chapters1To6Panels';
import { Chapters7To12Panels } from './chapters/Chapters7To12Panels';

interface InspectionModalProps {
  hotspot: string | null;
  room: RoomState;
  role: PlayerRole;
  onClose: () => void;
  onAction: (type: string, payload?: Record<string, unknown>) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  hotspot,
  room,
  role,
  onClose,
  onAction
}) => {
  if (!hotspot) return null;

  const scene = getRoomSceneConfig(room, role);
  const spotMeta = scene.hotspots.find((h) => h.id === hotspot);
  const title = spotMeta?.label || 'Inspect Object';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[88vh] bg-[#161A22] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="pt-2.5 sm:pt-0 px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-2 sm:hidden" />
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.click();
              onClose();
            }}
            aria-label="Close inspection"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#1E2430] hover:bg-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {room.currentChapter <= 6 ? (
            <Chapters1To6Panels hotspot={hotspot} room={room} role={role} onAction={onAction} />
          ) : (
            <Chapters7To12Panels hotspot={hotspot} room={room} role={role} onAction={onAction} />
          )}
        </div>
      </div>
    </div>
  );
};
