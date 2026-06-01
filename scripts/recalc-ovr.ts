/**
 * 一次性脚本：更新7位巅峰期球员的OVR和属性，并重算所有受影响阵容的分数
 *
 * 用法：npx tsx scripts/recalc-ovr.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ydmaxgdlnnuhtsxutppj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkbWF4Z2Rsbm51aHRzeHV0cHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTg3NzEsImV4cCI6MjA5NDY5NDc3MX0.1Z1YmgqVs24_SbBgdbDAoyyMJ5yyqlFrj7MZzqub0Qk';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// OVR + 属性变更映射
const OVR_CHANGES: Record<number, { ovr: number; stats: Record<string, number> }> = {
  // Phase 1: Dream team members
  40:  { ovr: 90.5, stats: { SHO: 90, SLA: 85, DEF: 88, ATH: 88, PLM: 99, PHY: 70, REB: 60, CLU: 92 } },   // CP3
  286: { ovr: 93.5, stats: { SHO: 54, SLA: 85, DEF: 99, ATH: 88, PLM: 55, PHY: 99, REB: 99, CLU: 82 } },   // Howard
  295: { ovr: 86.5, stats: { SHO: 88, SLA: 82, DEF: 75, ATH: 85, PLM: 99, PHY: 72, REB: 52, CLU: 85 } },   // Deron
  356: { ovr: 82.5, stats: { SHO: 97, SLA: 80, DEF: 58, ATH: 80, PLM: 68, PHY: 62, REB: 45, CLU: 78 } },   // Redd
  298: { ovr: 88.5, stats: { SHO: 99, SLA: 94, DEF: 65, ATH: 82, PLM: 80, PHY: 68, REB: 55, CLU: 88 } },   // Mullin
  276: { ovr: 87.5, stats: { SHO: 99, SLA: 68, DEF: 90, ATH: 72, PLM: 72, PHY: 99, REB: 99, CLU: 78 } },   // Love
  307: { ovr: 83,   stats: { SHO: 83, SLA: 87, DEF: 92, ATH: 88, PLM: 72, PHY: 72, REB: 75, CLU: 85 } },   // Iguodala
  // Phase 2: Peak era corrections
  252: { ovr: 91.5, stats: { SHO: 92, SLA: 90, DEF: 99, ATH: 92, PLM: 92, PHY: 65, REB: 52, CLU: 92 } },   // Payton
  259: { ovr: 93.5, stats: { SHO: 92, SLA: 99, DEF: 75, ATH: 99, PLM: 95, PHY: 78, REB: 58, CLU: 95 } },   // Rose
  260: { ovr: 90.5, stats: { SHO: 99, SLA: 92, DEF: 72, ATH: 88, PLM: 85, PHY: 55, REB: 48, CLU: 95 } },   // Ray Allen
  262: { ovr: 91.5, stats: { SHO: 99, SLA: 95, DEF: 72, ATH: 95, PLM: 82, PHY: 70, REB: 58, CLU: 95 } },   // McGrady
  266: { ovr: 89.5, stats: { SHO: 99, SLA: 78, DEF: 95, ATH: 90, PLM: 68, PHY: 78, REB: 68, CLU: 85 } },   // Klay
  267: { ovr: 89.0, stats: { SHO: 95, SLA: 95, DEF: 80, ATH: 92, PLM: 82, PHY: 78, REB: 72, CLU: 90 } },   // Worthy
  270: { ovr: 90.5, stats: { SHO: 96, SLA: 98, DEF: 92, ATH: 99, PLM: 82, PHY: 80, REB: 52, CLU: 90 } },   // Grant Hill
  271: { ovr: 87.5, stats: { SHO: 82, SLA: 88, DEF: 88, ATH: 88, PLM: 95, PHY: 82, REB: 85, CLU: 85 } },   // Webber
  274: { ovr: 88.5, stats: { SHO: 92, SLA: 78, DEF: 92, ATH: 70, PLM: 75, PHY: 90, REB: 92, CLU: 82 } },   // Gasol
  283: { ovr: 89.5, stats: { SHO: 45, SLA: 78, DEF: 99, ATH: 82, PLM: 55, PHY: 99, REB: 99, CLU: 75 } },   // Mutombo
  285: { ovr: 89.5, stats: { SHO: 42, SLA: 72, DEF: 99, ATH: 92, PLM: 55, PHY: 99, REB: 99, CLU: 75 } },   // Ben Wallace
  297: { ovr: 85.5, stats: { SHO: 99, SLA: 90, DEF: 68, ATH: 82, PLM: 72, PHY: 65, REB: 50, CLU: 85 } },   // Richmond
};

// ---- 评分逻辑（与 game-logic.ts 一致）----

const LEGEND_BONUSES: Record<number, number> = {
  227: 6, 244: 4, 1: 3, 8: 4, 228: 4, 7: 2,
  243: 3, 237: 3, 221: 4, 245: 3, 251: 2, 233: 3,
};

const COMBO_EXCLUSIONS: Record<string, string> = { '有乔有鲨加成': 'OK组合' };

const COMBO_BONUSES: { name: string; bonus: number; playerIds: number[] }[] = [
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

const DREAM_TEAM_CONFIG: { playerIds: number[]; tiers: Record<number, number> }[] = [
  { playerIds: [227, 221, 233, 241, 240, 223, 234, 248, 249, 231, 298, 351], tiers: { 4: 10, 5: 15 } },
  { playerIds: [228, 8, 229, 225, 534, 40, 286, 311, 295, 356], tiers: { 4: 9, 5: 12 } },
  { playerIds: [7, 8, 228, 534, 40, 226, 265, 276, 13, 322, 307, 275], tiers: { 4: 9, 5: 12 } },
];

function calcDreamTeamBonus(ids: Set<number>): number {
  let total = 0;
  for (const dt of DREAM_TEAM_CONFIG) {
    const count = dt.playerIds.filter(id => ids.has(id)).length;
    const tiers = Object.keys(dt.tiers).map(Number).sort((a, b) => b - a);
    for (const t of tiers) { if (count >= t) { total += dt.tiers[t]; break; } }
  }
  return total;
}

function calcScore(players: any[]): number {
  if (players.length === 0) return 0;
  const baseOvr = players.reduce((sum: number, p: any) => sum + p.ovr, 0);

  const teamCounts: Record<string, number> = {};
  players.forEach((p: any) => { teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
  let chemBonus = 0;
  Object.values(teamCounts).forEach(count => {
    if (count >= 5) chemBonus += 10;
    else if (count >= 4) chemBonus += 7;
    else if (count >= 3) chemBonus += 4;
    else if (count >= 2) chemBonus += 2;
  });

  let legendBonus = 0;
  players.forEach((p: any) => { if (LEGEND_BONUSES[p.id]) legendBonus += LEGEND_BONUSES[p.id]; });

  const ids = new Set(players.map((p: any) => p.id));
  const excludedCombos = new Set<string>();
  COMBO_BONUSES.forEach(combo => {
    if (combo.playerIds.every(id => ids.has(id))) {
      const excluded = COMBO_EXCLUSIONS[combo.name];
      if (excluded) excludedCombos.add(excluded);
    }
  });
  COMBO_BONUSES.forEach(combo => {
    if (combo.playerIds.every(id => ids.has(id)) && !excludedCombos.has(combo.name)) legendBonus += combo.bonus;
  });

  const dreamBonus = calcDreamTeamBonus(ids);
  return parseFloat((baseOvr * (1 + (chemBonus + legendBonus + dreamBonus) / 100)).toFixed(2));
}

// ---- 主流程 ----

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? '=== DRY RUN ===\n' : '=== 正式执行 ===\n');

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
  console.log(`共 ${allLineups.length} 条活跃阵容\n`);

  // 2. 处理每条阵容：更新球员属性 + 重算分数
  type Change = { id: string; playerId: string; nickname: string; oldScore: number; newScore: number; delta: number; updatedFields: string[] };
  const changes: Change[] = [];
  let unchanged = 0;

  for (const lineup of allLineups) {
    const positions = ['pg_data', 'sg_data', 'sf_data', 'pf_data', 'c_data'] as const;
    let modified = false;
    const updatedFields: string[] = [];

    // 更新存储的球员数据
    for (const pos of positions) {
      const player = lineup[pos];
      if (!player) continue;
      const change = OVR_CHANGES[player.id];
      if (!change) continue;

      // 更新 OVR
      player.ovr = change.ovr;
      // 更新 stats
      player.stats = { ...player.stats, ...change.stats };
      modified = true;
      updatedFields.push(`${player.name_cn}(${pos.split('_')[0].toUpperCase()})`);
    }

    // 提取球员列表并重算分数
    const players = positions.map(pos => lineup[pos]).filter(Boolean);
    const newScore = calcScore(players);
    const delta = parseFloat((newScore - lineup.score).toFixed(2));

    if (Math.abs(delta) > 0.01) {
      changes.push({ id: lineup.id, playerId: lineup.player_id, nickname: lineup.nickname, oldScore: lineup.score, newScore, delta, updatedFields });
    } else {
      unchanged++;
    }
  }

  console.log(`分数有变化: ${changes.length} 条`);
  console.log(`分数无变化: ${unchanged} 条\n`);

  if (changes.length > 0) {
    console.log(`分数变化范围: ${Math.min(...changes.map(c => c.delta)).toFixed(2)} ~ +${Math.max(...changes.map(c => c.delta)).toFixed(2)}`);
    console.log(`平均变化: ${(changes.reduce((s, c) => s + c.delta, 0) / changes.length).toFixed(2)}\n`);

    // 显示变化最大的10条
    changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    console.log('变化最大的10条:');
    for (const c of changes.slice(0, 10)) {
      console.log(`  ${c.nickname.padEnd(12)} ${c.oldScore} → ${c.newScore} (${c.delta > 0 ? '+' : ''}${c.delta}) [${c.updatedFields.join(', ')}]`);
    }

    // 统计每个球员影响多少条阵容
    const playerImpact: Record<string, number> = {};
    for (const c of changes) {
      for (const f of c.updatedFields) {
        const name = f.split('(')[0];
        playerImpact[name] = (playerImpact[name] || 0) + 1;
      }
    }
    console.log('\n各球员影响阵容数:');
    Object.entries(playerImpact).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
      console.log(`  ${name.padEnd(12)} ${count} 条`);
    });
  }

  if (dryRun) {
    console.log('\n--- DRY RUN 结束 ---');
    return;
  }

  // 3. 批量更新数据库
  console.log('\n开始更新数据库...');
  const BATCH_SIZE = 100;
  let updated = 0;

  for (let i = 0; i < changes.length; i += BATCH_SIZE) {
    const batch = changes.slice(i, i + BATCH_SIZE);
    for (const c of batch) {
      // 重新找到原始阵容并构建更新对象
      const lineup = allLineups.find(l => l.id === c.id)!;
      const positions = ['pg_data', 'sg_data', 'sf_data', 'pf_data', 'c_data'] as const;
      const updateData: any = { score: c.newScore };
      for (const pos of positions) {
        if (lineup[pos]) updateData[pos] = lineup[pos];
      }

      const { error: updateError } = await sb
        .from('lineups')
        .update(updateData)
        .eq('id', c.id);
      if (updateError) {
        console.error(`更新失败 [${c.id}]:`, updateError.message);
      } else {
        updated++;
      }
    }
    console.log(`  进度: ${Math.min(i + BATCH_SIZE, changes.length)} / ${changes.length}`);
  }
  console.log(`\n阵容更新完成: ${updated} / ${changes.length} 条`);

  // 4. 更新 player_stats.best_score
  console.log('\n更新 best_score...');
  const playerBestScores: Record<string, number> = {};
  for (const lineup of allLineups) {
    const positions = ['pg_data', 'sg_data', 'sf_data', 'pf_data', 'c_data'] as const;
    const players = positions.map(pos => lineup[pos]).filter(Boolean);
    const score = calcScore(players);
    if (!playerBestScores[lineup.player_id] || score > playerBestScores[lineup.player_id]) {
      playerBestScores[lineup.player_id] = score;
    }
  }

  let statsUpdated = 0;
  for (const [playerId, bestScore] of Object.entries(playerBestScores)) {
    const { error } = await sb
      .from('player_stats')
      .update({ best_score: bestScore })
      .eq('player_id', playerId);
    if (!error) statsUpdated++;
  }
  console.log(`best_score 更新完成: ${statsUpdated} / ${Object.keys(playerBestScores).length} 条`);
  console.log('\n全部完成!');
}

main().catch(err => { console.error('执行出错:', err); process.exit(1); });
