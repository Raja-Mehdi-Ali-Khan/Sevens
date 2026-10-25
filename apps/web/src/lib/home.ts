const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizePlayerName(name: string): string {
  return name.trim();
}

export function isValidPlayerName(name: string): boolean {
  const normalizedName = normalizePlayerName(name);
  return normalizedName.length >= 1 && normalizedName.length <= 20;
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidRoomCode(code: string): boolean {
  const normalizedCode = normalizeRoomCode(code);
  return normalizedCode.length === 5 && [...normalizedCode].every((character) => ROOM_CODE_CHARACTERS.includes(character));
}

export function parseInviteCode(search: string): string | null {
  const code = new URLSearchParams(search).get("code");
  if (code === null) return null;

  const normalizedCode = normalizeRoomCode(code);
  return isValidRoomCode(normalizedCode) ? normalizedCode : null;
}
