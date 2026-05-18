import { Player, PackCard, Rarity, Lineup } from './types';

// 加载球员数据
const playerCache: Player[] | null = null;

export async function loadPlayers(): Promise<Player[]> {
  if (playerCache && Array.isArray(playerCache)) return playerCache;
  
  const res = await fetch('/api/players');
  const data = await res.json();
  return data.players || data;
}

// 从球员中随机抽50张形成5包
export function drawPacks(players: Player[]): PackCard[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 50);
  
  // 分配稀有度 (模拟抽卡概率)
  const packs: PackCard[] = [];
  selected.forEach((player, i) => {
    const packIndex = Math.floor(i / 10);
    const cardIndex = i % 10;
    
    let rarity: Rarity;
    const roll = Math.random();
    if (roll < 0.005) rarity = 'UR';      // 0.5%
    else if (roll < 0.02) rarity = 'SSR';  // 1.5%
    else if (roll < 0.08) rarity = 'SR';   // 6%
    else if (roll < 0.30) rarity = 'R';    // 22%
    else rarity = 'N';                      // 70%
    
    packs.push({
      ...player,
      packSlot: packIndex,
      cardIndex,
      revealOrder: i,
    });
  });
  
  return packs;
}

// 按位置过滤可用卡
export function getAvailableCards(cards: PackCard[], position: string): PackCard[] {
  return cards.filter(c => c.position.includes(position));
}

// 判断卡牌稀有度 (基于card_tier和ovr)
export function getRarity(player: Player): Rarity {
  const ct = player.card_tier || '';
  if (ct.includes('UR')) return 'UR';
  if (ct.includes('SSR')) return 'SSR';
  if (ct.includes('SR')) return 'SR';
  if (ct.includes('R')) return 'R';
  return 'N';
}

// 阵容总评分
export function calcLineupScore(lineup: Lineup): number {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  if (players.length === 0) return 0;
  
  const baseOvr = players.reduce((sum, p) => sum + p.ovr, 0);
  
  // 化学反应加成
  const teams = players.map(p => p.team);
  const uniqueTeams = new Set(teams);
  let chemBonus = 0;
  
  // 同队加成 (2人同队+3%，3人+5%)
  const teamCounts: Record<string, number> = {};
  teams.forEach(t => { teamCounts[t] = (teamCounts[t] || 0) + 1; });
  Object.values(teamCounts).forEach(count => {
    if (count >= 3) chemBonus += 8;
    else if (count >= 2) chemBonus += 5;
  });
  
  return Math.round(baseOvr * (1 + chemBonus / 100));
}
