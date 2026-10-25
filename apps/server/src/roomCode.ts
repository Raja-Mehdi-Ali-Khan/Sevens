import { ROOM_CODE_LENGTH } from "./config";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ALPHABET_MASK = ALPHABET.length - 1;
const CODE_SPACE = ALPHABET.length ** ROOM_CODE_LENGTH;
const reservedCodes = new Set<string>();

function randomCode(): string {
  let code = "";
  while (code.length < ROOM_CODE_LENGTH) {
    const byte = new Uint8Array(1);
    globalThis.crypto.getRandomValues(byte);
    const index = (byte[0] ?? 0) & ALPHABET_MASK;
    code += ALPHABET[index]!;
  }
  return code;
}

export function generateRoomCode(): string {
  if (reservedCodes.size >= CODE_SPACE) throw new Error("No room codes are available");

  let code = randomCode();
  while (reservedCodes.has(code)) code = randomCode();
  reservedCodes.add(code);
  return code;
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

export function releaseRoomCode(code: string): void {
  reservedCodes.delete(normalizeRoomCode(code));
}
