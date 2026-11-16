import React, { useState } from 'react';
import { CheckCircle2, Eye, Hammer, KeyRound, Package, Sparkles, Wrench, X } from 'lucide-react';
import { COMBINE_RECIPES, InventoryItem, PlayerRole, RoomState } from '../shared/gameTypes';
import { soundFx } from '../utils/soundFx';

interface InventoryWorkbenchProps {
  room: RoomState;
  role: PlayerRole;
  compact?: boolean;
  onAction: (type: string, payload?: Record<string, unknown>) => void;
}

export const InventoryWorkbench: React.FC<InventoryWorkbenchProps> = ({
  room,
  role,
  compact = false,
  onAction
}) => {
  const [inspectItem, setInspectItem] = useState<InventoryItem | null>(null);
  const [combineMode, setCombineMode] = useState(false);
  const [combineSlots, setCombineSlots] = useState<string[]>([]);
  const [combineFeedback, setCombineFeedback] = useState<string | null>(null);

  const visibleItems = room.inventory.filter((item) => !item.consumed);
  const myItems = visibleItems.filter((item) => item.holder === 'SHARED' || item.holder === role);
  const equippedId = room.equipped[role];

  const handleCardTap = (item: InventoryItem) => {
    const canHold = item.holder === 'SHARED' || item.holder === role;
    if (combineMode) {
      if (!canHold) {
        soundFx.error();
        setCombineFeedback('Your partner holds that item — ask them to combine or pass it!');
        return;
      }
      soundFx.click();
      setCombineFeedback(null);
      setCombineSlots((prev) => {
        if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
        if (prev.length >= 2) return [prev[1], item.id];
        return [...prev, item.id];
      });
      return;
    }

    soundFx.click();
    if (canHold) {
      onAction('item:equip', { itemId: item.id });
    } else {
      setInspectItem(item);
    }
  };

  const handleCombineAttempt = () => {
    if (combineSlots.length !== 2) return;
    const [a, b] = combineSlots;
    const match = COMBINE_RECIPES.find(
      (r) => (r.itemA === a && r.itemB === b) || (r.itemA === b && r.itemB === a)
    );
    if (match) {
      soundFx.unlock();
      onAction('item:combine', { itemA: a, itemB: b });
      setCombineSlots([]);
      setCombineMode(false);
      setCombineFeedback(null);
    } else {
      soundFx.error();
      setCombineFeedback('Those two items don’t fit together.');
    }
  };

  return (
    <div className="bg-[#161A22] border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-white truncate">
            Field Bag ({visibleItems.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.click();
            setCombineMode((v) => !v);
            setCombineSlots([]);
            setCombineFeedback(null);
          }}
          className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            combineMode
              ? 'bg-amber-500 text-zinc-950 border-amber-300'
              : 'bg-[#1E2430] hover:bg-zinc-700 text-amber-300 border-white/10'
          }`}
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>{combineMode ? 'Cancel Combine' : 'Combine Items'}</span>
        </button>
      </div>

      {/* Combine Workbench Banner */}
      {combineMode && (
        <div className="p-3 rounded-xl bg-[#12161E] border border-amber-500/40 space-y-2.5">
          <div className="text-xs text-zinc-300">
            Select two compatible items from your bag to assemble a tool or clue:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((slotIdx) => {
              const id = combineSlots[slotIdx];
              const item = myItems.find((i) => i.id === id);
              return (
                <div
                  key={slotIdx}
                  className="min-h-[42px] px-3 py-2 rounded-lg bg-[#0B0E14] border border-white/10 flex items-center justify-center text-xs text-center"
                >
                  {item ? (
                    <span className="font-semibold text-amber-300 truncate">{item.name}</span>
                  ) : (
                    <span className="text-zinc-500">Slot {slotIdx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
          {combineFeedback && (
            <div className="text-xs text-red-300 text-center">{combineFeedback}</div>
          )}
          <button
            type="button"
            disabled={combineSlots.length !== 2}
            onClick={handleCombineAttempt}
            className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Assemble Selected Items</span>
          </button>
        </div>
      )}

      {/* Inventory Grid */}
      {visibleItems.length === 0 ? (
        <div className="text-xs text-zinc-500 py-2">
          Your field bag is empty. Search drawers, chutes, and hidden panels to recover tools.
        </div>
      ) : (
        <div className={`grid gap-2 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {visibleItems.map((item) => {
            const isMine = item.holder === 'SHARED' || item.holder === role;
            const isEquipped = equippedId === item.id;
            const isCombinePicked = combineSlots.includes(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 transition-colors ${
                  isCombinePicked
                    ? 'bg-amber-500/20 border-amber-400'
                    : isEquipped
                    ? 'bg-emerald-500/15 border-emerald-400'
                    : 'bg-[#12161E] border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleCardTap(item)}
                  className="flex-1 min-w-0 text-left flex items-center gap-2.5 min-h-[40px] cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isEquipped
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-[#1E2430] text-amber-400'
                    }`}
                  >
                    {item.category === 'KEY' ? (
                      <KeyRound className="w-4 h-4" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-100 truncate">{item.name}</div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <span>
                        {item.holder === 'SHARED'
                          ? 'Shared'
                          : isMine
                          ? 'In Your Bag'
                          : 'Partner Holds'}
                      </span>
                      {isEquipped && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-300 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Equipped
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.click();
                    setInspectItem(item);
                  }}
                  aria-label={`Inspect ${item.name}`}
                  className="min-w-[40px] min-h-[40px] rounded-lg bg-[#1E2430] hover:bg-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Close-Up Inspection Sheet */}
      {inspectItem && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectItem(null);
          }}
        >
          <div className="w-full sm:max-w-md bg-[#161A22] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-white">{inspectItem.name}</h3>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                aria-label="Close item inspection"
                className="min-w-[40px] min-h-[40px] rounded-xl bg-[#1E2430] text-zinc-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{inspectItem.description}</p>
            <div className="p-3.5 rounded-xl bg-[#F3EFE6] text-zinc-900 text-xs leading-relaxed border border-amber-900/20">
              <strong className="block text-[11px] uppercase tracking-wider text-zinc-600 mb-1">
                Close-Up Field Inspection
              </strong>
              {inspectItem.inspectNote}
            </div>
            {(inspectItem.holder === 'SHARED' || inspectItem.holder === role) && (
              <button
                type="button"
                onClick={() => {
                  soundFx.click();
                  onAction('item:equip', { itemId: inspectItem.id });
                  setInspectItem(null);
                }}
                className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer"
              >
                {equippedId === inspectItem.id ? 'Unequip Item' : 'Equip Active Item'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
