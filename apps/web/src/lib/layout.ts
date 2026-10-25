import type { Seat } from "@cardgame/engine";

export type ScreenPosition = "bottom" | "right" | "top" | "left";
export type OpponentPosition = "right" | "top" | "left";

export interface SeatLayout {
  bottom: Seat;
  right: Seat;
  top: Seat;
  left: Seat;
}

export interface OpponentSeatMapping {
  position: OpponentPosition;
  seat: Seat;
}

/**
 * Maps the local player's seat to the 4 screen positions.
 * Local player is always at the bottom.
 * Play proceeds anticlockwise: +1 is right, +2 is top, +3 is left.
 */
export function getSeatLayout(mySeat: Seat): SeatLayout {
  return {
    bottom: mySeat,
    right: ((mySeat + 1) % 4) as Seat,
    top: ((mySeat + 2) % 4) as Seat,
    left: ((mySeat + 3) % 4) as Seat,
  };
}

/**
 * Returns the relative screen position of a target seat relative to my seat.
 */
export function getScreenPosition(seat: Seat, mySeat: Seat): ScreenPosition {
  const offset = (seat - mySeat + 4) % 4;
  switch (offset) {
    case 0:
      return "bottom";
    case 1:
      return "right";
    case 2:
      return "top";
    case 3:
      return "left";
    default:
      throw new Error(`Invalid offset: ${offset}`);
  }
}

/**
 * Returns the three opponent seats in clockwise or display order (left, top, right).
 */
export function getOpponents(mySeat: Seat): OpponentSeatMapping[] {
  return [
    { position: "left", seat: ((mySeat + 3) % 4) as Seat },
    { position: "top", seat: ((mySeat + 2) % 4) as Seat },
    { position: "right", seat: ((mySeat + 1) % 4) as Seat },
  ];
}
