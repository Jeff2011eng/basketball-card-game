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

// 传奇球员加成配置
export const LEGEND_BONUSES: Record<number, { name: string; bonus: number }> = {
  227: { name: '篮球之神的加成', bonus: 6 },       // Michael Jordan
  244: { name: '大鲨鱼加成', bonus: 4 },      // Shaquille O'Neal
  1:   { name: '历史级神射手加成', bonus: 3 }, // Stephen Curry
  8:   { name: '乐邦加成', bonus: 4 },        // LeBron James
  228: { name: '黑曼巴加成', bonus: 4 },      // Kobe Bryant
  7:   { name: '死神加成', bonus: 2 },        // Kevin Durant
  243: { name: '天勾加成', bonus: 3 },        // Kareem Abdul-Jabbar
  237: { name: '石佛加成', bonus: 3 },        // Tim Duncan
  221: { name: '魔术师加成', bonus: 4 },      // Magic Johnson
  245: { name: '梦幻脚步加成', bonus: 3 },    // Hakeem Olajuwon
  251: { name: '小巨人加成', bonus: 2 },        // Yao Ming
  233: { name: '大鸟加成', bonus: 3 },            // Larry Bird
};

// 组合加成配置
export const COMBO_BONUSES: { name: string; bonus: number; playerIds: number[]; type: 'dream' | 'combo' }[] = [
  { name: '有乔有鲨的加成', bonus: 5, playerIds: [227, 244], type: 'dream' },        // Jordan + Shaq
  { name: 'OK组合', bonus: 3, playerIds: [228, 244], type: 'combo' },                  // Kobe + Shaq
  { name: '老流氓组合', bonus: 5, playerIds: [227, 234, 242], type: 'combo' },          // Jordan + Pippen + Rodman
  { name: '海啸组合', bonus: 5, playerIds: [1, 7, 266], type: 'combo' },                // Curry + Durant + Klay
  { name: 'GDP组合', bonus: 5, playerIds: [237, 254, 264], type: 'combo' },             // Duncan + Parker + Ginobili
  { name: '热火三巨头', bonus: 5, playerIds: [8, 229, 311], type: 'combo' },             // LeBron + Wade + Bosh
  { name: '詹眉组合', bonus: 3, playerIds: [8, 13], type: 'combo' },                    // LeBron + AD
  { name: '犹他双煞', bonus: 3, playerIds: [223, 240], type: 'combo' },                 // Stockton + Malone
];

// 获取阵容中的传奇加成列表（按加成值从大到小排列）
export function getLegendBonuses(lineup: Lineup): { name: string; bonus: number; playerName: string; isGod: boolean }[] {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  const bonuses: { name: string; bonus: number; playerName: string; isGod: boolean }[] = [];
  players.forEach(p => {
    const legend = LEGEND_BONUSES[p.id];
    if (legend) {
      bonuses.push({ name: legend.name, bonus: legend.bonus, playerName: p.name_cn, isGod: p.id === 227 });
    }
  });
  // 组合加成
  const ids = new Set(players.map(p => p.id));
  COMBO_BONUSES.forEach(combo => {
    if (combo.playerIds.every(id => ids.has(id))) {
      bonuses.push({ name: combo.name, bonus: combo.bonus, playerName: combo.playerIds.map(id => players.find(p => p.id === id)?.name_cn || '').join('+'), isGod: false });
    }
  });
  return bonuses.sort((a, b) => b.bonus - a.bonus);
}

// 判断阵容是否包含姚明
export function hasYaoMing(lineup: Lineup): boolean {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  return players.some(p => p.id === 251);
}

// 判断阵容是否包含乔丹
export function hasJordan(lineup: Lineup): boolean {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  return players.some(p => p.id === 227);
}

// 判断阵容是否同时有乔丹和奥尼尔（有乔有鲨）
export function hasJordanAndShaq(lineup: Lineup): boolean {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  const ids = new Set(players.map(p => p.id));
  return ids.has(227) && ids.has(244);
}

// 获取阵容中激活的组合加成
export function getActiveCombos(lineup: Lineup): typeof COMBO_BONUSES[number][] {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  const ids = new Set(players.map(p => p.id));
  return COMBO_BONUSES.filter(combo => combo.playerIds.every(id => ids.has(id)));
}

// 阵容总评分
export function calcLineupScore(lineup: Lineup): number {
  const players = Object.values(lineup).filter(Boolean) as Player[];
  if (players.length === 0) return 0;

  const baseOvr = players.reduce((sum, p) => sum + p.ovr, 0);

  // 同队加成
  const teams = players.map(p => p.team);
  let chemBonus = 0;
  const teamCounts: Record<string, number> = {};
  teams.forEach(t => { teamCounts[t] = (teamCounts[t] || 0) + 1; });
  Object.values(teamCounts).forEach(count => {
    if (count >= 5) chemBonus += 10;
    else if (count >= 4) chemBonus += 7;
    else if (count >= 3) chemBonus += 4;
    else if (count >= 2) chemBonus += 2;
  });

  // 传奇球员加成
  let legendBonus = 0;
  players.forEach(p => {
    const legend = LEGEND_BONUSES[p.id];
    if (legend) legendBonus += legend.bonus;
  });

  // 组合加成（含梦幻加成）
  const ids = new Set(players.map(p => p.id));
  COMBO_BONUSES.forEach(combo => {
    if (combo.playerIds.every(id => ids.has(id))) {
      legendBonus += combo.bonus;
    }
  });

  return parseFloat((baseOvr * (1 + (chemBonus + legendBonus) / 100)).toFixed(2));
}
