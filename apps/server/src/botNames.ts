import { shuffle } from "@cardgame/engine";
import type { Rng } from "@cardgame/engine";

export const BOT_NAME_POOL: readonly string[] = [
  "Aarav",
  "Vivaan",
  "Ananya",
  "Diya",
  "Kabir",
  "Isha",
  "Rohan",
  "Meera",
  "Arjun",
  "Kavya",
  "Neel",
  "Tara",
  "Zoya",
  "Dev",
  "Riya",
  "Ishaan",
  "Naina",
  "Veer",
  "Anika",
  "Sahil",
  "Mia",
  "Leo",
  "Noah",
  "Zara",
  "Omar",
  "Lina",
  "Hugo",
  "Sofia",
  "Kai",
  "Nora",
  "Theo",
  "Maya",
  "Ravi",
  "Sana",
  "Jay",
  "Ira",
  "Luca",
  "Anya",
  "Rhea",
  "Milo",
];

export function pickBotNames(
  count: number,
  takenNames: readonly string[],
  rng: Rng,
): string[] {
  if (count < 0 || !Number.isInteger(count)) {
    throw new Error(`Invalid bot count: ${count}`);
  }
  if (count === 0) return [];

  const taken = new Set(takenNames.map((name) => name.trim().toLowerCase()));
  const available = BOT_NAME_POOL.filter((name) => !taken.has(name.toLowerCase()));

  if (available.length < count) {
    throw new Error(`Not enough unique bot names available (need ${count}, have ${available.length})`);
  }

  return shuffle(available, rng).slice(0, count);
}
