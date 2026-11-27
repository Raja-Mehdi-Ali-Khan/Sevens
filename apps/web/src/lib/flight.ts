export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FlightGeometry {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  scale: number;
}

export function flightGeometry(fromRect: RectLike, toRect: RectLike): FlightGeometry {
  const fromX = fromRect.left + fromRect.width / 2;
  const fromY = fromRect.top + fromRect.height / 2;
  const toX = toRect.left + toRect.width / 2;
  const toY = toRect.top + toRect.height / 2;
  const scale =
    fromRect.width > 0 && toRect.width > 0
      ? toRect.width / fromRect.width
      : 1;

  return { fromX, fromY, toX, toY, scale };
}

export function capFlights<T>(list: readonly T[], max: number): T[] {
  if (max <= 0) return [];
  if (list.length <= max) return [...list];
  return list.slice(list.length - max);
}
