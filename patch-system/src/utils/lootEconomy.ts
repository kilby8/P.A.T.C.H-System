export interface FragmentDropInput {
  spectacleScore: number;
  totalMobs: number;
  defeatedMobs: number;
}

export interface FragmentDropResult {
  base: number;
  spectacleBonus: number;
  defeatBonus: number;
  clearBonus: number;
  variance: number;
  total: number;
}

export function generateEncounterFragmentDrop(input: FragmentDropInput): FragmentDropResult {
  const score = Math.max(1, Math.floor(input.spectacleScore));
  const totalMobs = Math.max(0, Math.floor(input.totalMobs));
  const defeatedMobs = Math.max(0, Math.floor(input.defeatedMobs));

  const base = 12;
  const spectacleBonus = score * 9;
  const defeatBonus = defeatedMobs * 4;
  const clearBonus = totalMobs > 0 && defeatedMobs >= totalMobs ? 15 : 0;
  const variance = Math.floor(Math.random() * 13) - 6;

  const total = Math.max(0, base + spectacleBonus + defeatBonus + clearBonus + variance);

  return {
    base,
    spectacleBonus,
    defeatBonus,
    clearBonus,
    variance,
    total,
  };
}
