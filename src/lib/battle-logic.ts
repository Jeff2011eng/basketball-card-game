import { Player, Lineup, Badge, PlayerStats } from './types';
import { calcLineupScore } from './game-logic';

const STAT_KEYS: (keyof PlayerStats)[] = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY', 'REB', 'CLU'];

interface PositionWeights {
  [key: string]: Partial<Record<keyof PlayerStats, number>>;
}

const POSITION_WEIGHTS: PositionWeights = {
  PG: { SHO: 1.3, SLA: 1.2, PLM: 1.1 },
  SG: { SHO: 1.3, SLA: 1.2, PLM: 1.1 },
  SF: { ATH: 1.3, DEF: 1.1, SHO: 1.1 },
  PF: { PHY: 1.3, REB: 1.3, DEF: 1.1 },
  C:  { PHY: 1.3, REB: 1.3, DEF: 1.1 },
};

export interface PositionMatchup {
  position: string;
  challenger: Player;
  defender: Player;
  challengerScore: number;
  defenderScore: number;
  winner: 'challenger' | 'defender' | 'draw';
}

export interface StatComparison {
  stat: string;
  challenger: number;
  defender: number;
  winner: 'challenger' | 'defender' | 'draw';
}

export interface BattleResult {
  id: string;
  challengerNickname: string;
  defenderNickname: string;
  challengerLineup: Lineup;
  defenderLineup: Lineup;
  challengerScore: number;
  defenderScore: number;
  positionMatchups: PositionMatchup[];
  statComparison: StatComparison[];
  winner: 'challenger' | 'defender' | 'draw';
  scoreDiff: number;
}

function getPositionWeightedScore(player: Player, position: string): number {
  const weights = POSITION_WEIGHTS[position] || {};
  let base = player.ovr;
  let bonus = 0;
  for (const [stat, weight] of Object.entries(weights)) {
    bonus += player.stats[stat as keyof PlayerStats] * (weight - 1);
  }
  return base + bonus;
}

function getBadgeBonus(lineup: Lineup): number {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  return players.reduce((sum, p) => {
    return sum + (p.badges || []).reduce((s, b) => {
      if (b.level === 'purple') return s + 0.5;
      if (b.level === 'gold') return s + 0.2;
      return s;
    }, 0);
  }, 0);
}

function getAvgStats(lineup: Lineup): Record<string, number> {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  const result: Record<string, number> = {};
  for (const key of STAT_KEYS) {
    result[key] = Math.round(players.reduce((s, p) => s + p.stats[key], 0) / players.length * 10) / 10;
  }
  return result;
}

export function resolveBattle(
  challengerLineup: Lineup,
  defenderLineup: Lineup,
  challengerNickname: string,
  defenderNickname: string,
  battleId: string,
): BattleResult {
  const positions: (keyof Lineup)[] = ['PG', 'SG', 'SF', 'PF', 'C'];

  // Position matchups
  const positionMatchups: PositionMatchup[] = positions.map(pos => {
    const c = challengerLineup[pos]!;
    const d = defenderLineup[pos]!;
    const cScore = getPositionWeightedScore(c, pos);
    const dScore = getPositionWeightedScore(d, pos);
    return {
      position: pos,
      challenger: c,
      defender: d,
      challengerScore: Math.round(cScore * 100) / 100,
      defenderScore: Math.round(dScore * 100) / 100,
      winner: cScore > dScore ? 'challenger' as const : dScore > cScore ? 'defender' as const : 'draw' as const,
    };
  });

  // Position matchup bonus: win >= 3 positions → +5
  const challengerWins = positionMatchups.filter(m => m.winner === 'challenger').length;
  const defenderWins = positionMatchups.filter(m => m.winner === 'defender').length;
  const matchUpBonus = challengerWins >= 3 ? 5 : defenderWins >= 3 ? -5 : 0;

  // Badge bonus
  const challengerBadgeBonus = getBadgeBonus(challengerLineup);
  const defenderBadgeBonus = getBadgeBonus(defenderLineup);

  // Final scores
  const challengerBase = calcLineupScore(challengerLineup);
  const defenderBase = calcLineupScore(defenderLineup);
  const challengerScore = Math.round((challengerBase + matchUpBonus + challengerBadgeBonus) * 100) / 100;
  const defenderScore = Math.round((defenderBase - matchUpBonus + defenderBadgeBonus) * 100) / 100;

  // Stat comparison
  const cStats = getAvgStats(challengerLineup);
  const dStats = getAvgStats(defenderLineup);
  const statComparison: StatComparison[] = STAT_KEYS.map(key => ({
    stat: key,
    challenger: cStats[key],
    defender: dStats[key],
    winner: cStats[key] > dStats[key] ? 'challenger' as const : dStats[key] > cStats[key] ? 'defender' as const : 'draw' as const,
  }));

  const winner = challengerScore > defenderScore ? 'challenger' as const
    : defenderScore > challengerScore ? 'defender' as const
    : 'draw' as const;

  return {
    id: battleId,
    challengerNickname,
    defenderNickname,
    challengerLineup,
    defenderLineup,
    challengerScore,
    defenderScore,
    positionMatchups,
    statComparison,
    winner,
    scoreDiff: Math.abs(challengerScore - defenderScore),
  };
}
