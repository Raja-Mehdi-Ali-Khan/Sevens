export function shouldPlayDeal(
  prevRound: number | null,
  round: number,
  tableIsEmpty: boolean,
): boolean {
  if (!tableIsEmpty) return false;
  if (prevRound === null) return true;
  return round > prevRound;
}
