export type PipeKind = 'STRAIGHT' | 'ELBOW' | 'TEE';

export interface PipeCellDef {
  kind: PipeKind;
  initialRot: number; // 0..3 (each step is 90deg clockwise)
}

// 4x4 grid (indices 0..15). Water enters WEST side of cell 0, must exit EAST side of cell 15.
export const ROOF_PIPE_GRID: PipeCellDef[] = [
  // Row 0
  { kind: 'STRAIGHT', initialRot: 0 }, // 0: needs W-E (rot 1 or 3)
  { kind: 'ELBOW', initialRot: 3 },    // 1: needs W-S (rot 2)
  { kind: 'ELBOW', initialRot: 0 },    // 2
  { kind: 'STRAIGHT', initialRot: 0 }, // 3
  // Row 1
  { kind: 'ELBOW', initialRot: 1 },    // 4
  { kind: 'STRAIGHT', initialRot: 1 }, // 5: needs N-S (rot 0 or 2)
  { kind: 'TEE', initialRot: 2 },      // 6
  { kind: 'ELBOW', initialRot: 0 },    // 7
  // Row 2
  { kind: 'STRAIGHT', initialRot: 1 }, // 8
  { kind: 'ELBOW', initialRot: 0 },    // 9: needs N-E (rot 0 -> set initial 1 so player rotates!)
  { kind: 'TEE', initialRot: 1 },      // 10: needs W-E-S or W-E (rot 0/1/2/3)
  { kind: 'ELBOW', initialRot: 0 },    // 11: needs W-S (rot 2)
  // Row 3
  { kind: 'ELBOW', initialRot: 2 },    // 12
  { kind: 'STRAIGHT', initialRot: 0 }, // 13
  { kind: 'ELBOW', initialRot: 1 },    // 14
  { kind: 'ELBOW', initialRot: 1 }     // 15: needs N-E (rot 0)
];

//Wait: make sure cell 9 isn't already solved at 0 -> let's tweak initialRot of cell 9 to 2
ROOF_PIPE_GRID[9].initialRot = 2;

// Base openings at rotation 0: [N, E, S, W]
const BASE_OPENINGS: Record<PipeKind, [boolean, boolean, boolean, boolean]> = {
  STRAIGHT: [true, false, true, false], // N-S
  ELBOW: [true, true, false, false],    // N-E
  TEE: [true, true, false, true]        // N-E-W
};

export function getPipeOpenings(kind: PipeKind, rot: number): [boolean, boolean, boolean, boolean] {
  const base = BASE_OPENINGS[kind];
  const r = ((rot % 4) + 4) % 4;
  // Rotating clockwise by r shifts N(0)->E(1)->S(2)->W(3)
  const out: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  for (let i = 0; i < 4; i++) {
    out[(i + r) % 4] = base[i];
  }
  return out;
}

export function evaluatePipeFlow(rotations: number[]): { powered: boolean[]; drained: boolean } {
  const powered = Array(16).fill(false) as boolean[];
  const cell0Open = getPipeOpenings(ROOF_PIPE_GRID[0].kind, rotations[0] ?? 0);
  // Water enters cell 0 from WEST (index 3)
  if (!cell0Open[3]) {
    return { powered, drained: false };
  }

  const queue: number[] = [0];
  powered[0] = true;

  while (queue.length > 0) {
    const idx = queue.shift()!;
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    const open = getPipeOpenings(ROOF_PIPE_GRID[idx].kind, rotations[idx] ?? 0);

    // Neighbors: N(0): -4 (needs neighbor S=2), E(1): +1 (W=3), S(2): +4 (N=0), W(3): -1 (E=1)
    const dirs: Array<{ dr: number; dc: number; mySide: number; theirSide: number }> = [
      { dr: -1, dc: 0, mySide: 0, theirSide: 2 },
      { dr: 0, dc: 1, mySide: 1, theirSide: 3 },
      { dr: 1, dc: 0, mySide: 2, theirSide: 0 },
      { dr: 0, dc: -1, mySide: 3, theirSide: 1 }
    ];

    for (const d of dirs) {
      if (!open[d.mySide]) continue;
      const nr = row + d.dr;
      const nc = col + d.dc;
      if (nr < 0 || nr >= 4 || nc < 0 || nc >= 4) continue;
      const nIdx = nr * 4 + nc;
      if (powered[nIdx]) continue;
      const nOpen = getPipeOpenings(ROOF_PIPE_GRID[nIdx].kind, rotations[nIdx] ?? 0);
      if (nOpen[d.theirSide]) {
        powered[nIdx] = true;
        queue.push(nIdx);
      }
    }
  }

  const cell15Open = getPipeOpenings(ROOF_PIPE_GRID[15].kind, rotations[15] ?? 0);
  const drained = powered[15] && cell15Open[1]; // Exits EAST from cell 15
  return { powered, drained };
}
