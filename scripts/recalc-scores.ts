/**
 * 一次性脚本：用新的梦之队阶梯加成规则重算所有活跃阵容的分数
 *
 * 用法：npx tsx scripts/recalc-scores.ts [--dry-run]
 *
 * --dry-run: 只输出变更摘要，不写入数据库
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ydmaxgdlnnuhtsxutppj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkbWF4Z2Rsbm51aHRzeHV0cHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTg3NzEsImV4cCI6MjA5NDY5NDc3MX0.1Z1YmgqVs24_SbBgdbDAoyyMJ5yyqlFrj7MZzqub0Qk';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- 评分逻辑（与 game-logic.ts 保持一致）----

const LEGEND_BONUSES: Record<number, number> = {
  227: 6, 244: 4, 1: 3, 8: 4, 228: 4, 7: 2,
  243: 3, 237: 3, 221: 4, 245: 3, 251: 2, 233: 3,
};

const COMBO_EXCLUSIONS: Record<string, string> = {
  '有乔有鲨加成': 'OK组合',
};

interface ComboDef {
  name: string;
  bonus: number;
  playerIds: number[];
}

const COMBO_BONUSES: ComboDef[] = [
  { name: '有乔有鲨加成', bonus: 5, playerIds: [227, 244] },
  { name: 'OK组合', bonus: 3, playerIds: [228, 244] },
  { name: '老流氓组合', bonus: 5, playerIds: [227, 234, 242] },
  { name: '海啸组合', bonus: 5, playerIds: [1, 7, 266] },
  { name: 'GDP组合', bonus: 5, playerIds: [237, 254, 264] },
  { name: '热火三巨头', bonus: 5, playerIds: [8, 229, 311] },
  { name: '詹眉组合', bonus: 3, playerIds: [8, 13] },
  { name: '犹他双煞', bonus: 3, playerIds: [223, 240] },
  { name: '水花兄弟', bonus: 3, playerIds: [1, 266] },
  { name: '绿军三巨头', bonus: 5, playerIds: [238, 269, 260] },
  { name: '凯尔特人前场', bonus: 5, playerIds: [233, 273, 282] },
  { name: 'Showtime组合', bonus: 3, playerIds: [221, 243] },
  { name: '凯尔特人王朝', bonus: 3, playerIds: [246, 529] },
  { name: '探花组合', bonus: 3, playerIds: [10, 22] },
];

const DREAM_TEAM_CONFIG: { name: string; playerIds: number[]; tiers: Record<number, number> }[] = [
  { name: '梦一加成', playerIds: [227, 221, 233, 241, 240, 223, 234, 248, 249, 231, 298, 351], tiers: { 4: 10, 5: 15 } },
  { name: '梦八加成', playerIds: [228, 8, 229, 225, 534, 40, 286, 311, 295, 356], tiers: { 4: 9, 5: 12 } },
  { name: '梦十加成', playerIds: [7, 8, 228, 534, 40, 226, 265, 276, 13, 322, 307, 275], tiers: { 4: 9, 5: 12 } },
];

function calcDreamTeamBonus(ids: Set<number>): number {
  let total = 0;
  for (const dt of DREAM_TEAM_CONFIG) {
    const count = dt.playerIds.filter(id => ids.has(id)).length;
    const tiers = Object.keys(dt.tiers).map(Number).sort((a, b) => b - a);
    for (const t of tiers) {
      if (count >= t) { total += dt.tiers[t]; break; }
    }
  }
  return total;
}

function calcScore(lineup: any): number {
  const players = [lineup.pg_data, lineup.sg_data, lineup.sf_data, lineup.pf_data, lineup.c_data].filter(Boolean);
  if (players.length === 0) return 0;

  const baseOvr = players.reduce((sum: number, p: any) => sum + p.ovr, 0);

  // 同队加成
  const teamCounts: Record<string, number> = {};
  players.forEach((p: any) => { teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
  let chemBonus = 0;
  Object.values(teamCounts).forEach(count => {
    if (count >= 5) chemBonus += 10;
    else if (count >= 4) chemBonus += 7;
    else if (count >= 3) chemBonus += 4;
    else if (count >= 2) chemBonus += 2;
  });

  // 传奇加成
  let legendBonus = 0;
  players.forEach((p: any) => { if (LEGEND_BONUSES[p.id]) legendBonus += LEGEND_BONUSES[p.id]; });

  // 组合加成
  const ids = new Set(players.map((p: any) => p.id));
  const excludedCombos = new Set<string>();
  COMBO_BONUSES.forEach(combo => {
    if (combo.playerIds.every(id => ids.has(id))) {
      const excluded = COMBO_EXCLUSIONS[combo.name];
      if (excluded) excludedCombos.add(excluded);
    }
  });
  COMBO_BONUSES.forEach(combo => {
    if (combo.playerIds.every(id => ids.has(id)) && !excludedCombos.has(combo.name)) {
      legendBonus += combo.bonus;
    }
  });

  // 梦之队阶梯加成
  const dreamBonus = calcDreamTeamBonus(ids);

  return parseFloat((baseOvr * (1 + (chemBonus + legendBonus + dreamBonus) / 100)).toFixed(2));
}

// ---- 主流程 ----

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(dryRun ? '=== DRY RUN（不会写入数据库） ===\n' : '=== 正式执行 ===\n');

  // 1. 分页获取所有活跃阵容
  console.log('获取活跃阵容...');
  const allLineups: any[] = [];
  let page = 0;
  const PAGE_SIZE = 500;
  while (true) {
    const { data, error } = await sb
      .from('lineups')
      .select('id, player_id, nickname, score, pg_data, sg_data, sf_data, pf_data, c_data')
      .eq('is_active', true)
      .not('pg_data', 'is', null)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) { console.error('查询失败:', error); process.exit(1); }
    if (!data || data.length === 0) break;
    allLineups.push(...data);
    console.log(`  已获取 ${allLineups.length} 条...`);
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  const lineups = allLineups;
  console.log(`共 ${lineups.length} 条活跃阵容\n`);

  // 2. 计算新旧分数差异
  type Change = { id: string; playerId: string; nickname: string; oldScore: number; newScore: number; delta: number };
  const changes: Change[] = [];
  let unchanged = 0;

  for (const lineup of lineups!) {
    const newScore = calcScore(lineup);
    const oldScore = lineup.score;
    const delta = parseFloat((newScore - oldScore).toFixed(2));
    if (Math.abs(delta) > 0.01) {
      changes.push({ id: lineup.id, playerId: lineup.player_id, nickname: lineup.nickname, oldScore, newScore, delta });
    } else {
      unchanged++;
    }
  }

  console.log(`分数有变化: ${changes.length} 条`);
  console.log(`分数无变化: ${unchanged} 条\n`);

  if (changes.length > 0) {
    const up = changes.filter(c => c.delta > 0);
    const down = changes.filter(c => c.delta < 0);
    console.log(`分数上升: ${up.length} 条 (平均 +${up.length ? (up.reduce((s, c) => s + c.delta, 0) / up.length).toFixed(2) : 0})`);
    console.log(`分数下降: ${down.length} 条 (平均 ${down.length ? (down.reduce((s, c) => s + c.delta, 0) / down.length).toFixed(2) : 0})`);
    console.log(`最大变化: +${Math.max(...changes.map(c => c.delta))} / ${Math.min(...changes.map(c => c.delta))}\n`);

    // 显示前10条变化最大的
    console.log('变化最大的10条:');
    changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    for (const c of changes.slice(0, 10)) {
      console.log(`  ${c.nickname.padEnd(12)} ${c.oldScore} → ${c.newScore} (${c.delta > 0 ? '+' : ''}${c.delta})`);
    }
  }

  if (dryRun) {
    console.log('\n--- DRY RUN 结束，未写入数据库 ---');
    return;
  }

  // 3. 批量更新
  console.log('\n开始更新数据库...');
  const BATCH_SIZE = 100;
  let updated = 0;

  for (let i = 0; i < changes.length; i += BATCH_SIZE) {
    const batch = changes.slice(i, i + BATCH_SIZE);
    for (const c of batch) {
      const { error: updateError } = await sb
        .from('lineups')
        .update({ score: c.newScore })
        .eq('id', c.id);
      if (updateError) {
        console.error(`更新失败 [${c.id}]:`, updateError.message);
      } else {
        updated++;
      }
    }
    console.log(`  进度: ${Math.min(i + BATCH_SIZE, changes.length)} / ${changes.length}`);
  }
  console.log(`\n更新完成: ${updated} / ${changes.length} 条`);

  // 4. 更新 player_stats.best_score
  console.log('\n更新 best_score...');
  const playerBestScores: Record<string, number> = {};
  for (const lineup of lineups!) {
    const newScore = calcScore(lineup);
    if (!playerBestScores[lineup.player_id] || newScore > playerBestScores[lineup.player_id]) {
      playerBestScores[lineup.player_id] = newScore;
    }
  }

  let statsUpdated = 0;
  for (const [playerId, bestScore] of Object.entries(playerBestScores)) {
    const { error: statsError } = await sb
      .from('player_stats')
      .update({ best_score: bestScore })
      .eq('player_id', playerId);
    if (!statsError) statsUpdated++;
  }
  console.log(`best_score 更新完成: ${statsUpdated} / ${Object.keys(playerBestScores).length} 条`);
  console.log('\n全部完成!');
}

main().catch(err => { console.error('执行出错:', err); process.exit(1); });
