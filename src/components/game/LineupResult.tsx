'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lineup, STAT_LABELS } from '@/lib/types';
import { calcLineupScore, getLegendBonuses, hasJordan, hasYaoMing, hasJordanAndShaq, getActiveCombos, COMBO_BONUSES, LEGEND_BONUSES } from '@/lib/game-logic';
import Card from './Card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Trophy, MessageSquarePlus } from 'lucide-react';
import { openHupuLink } from '@/lib/hupu-links';
import HupuPrompt from '@/components/common/HupuPrompt';

interface Props {
  lineup: Lineup;
  onUpload: () => void;
  onRestart: () => void;
}

const STAT_KEYS = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY'] as const;

const STAT_DISPLAY: Record<string, string> = {
  SHO: '投射',
  SLA: '突破',
  DEF: '防守',
  ATH: '运动',
  PLM: '组织',
  PHY: '对抗',
};

const HUPU_POST_URL = 'huputiyu://bbs/postImg?tagName=NBA梦幻1阵&tagId=37312&topicName=湿乎乎的话题&topicId=177';

export default function LineupResult({ lineup, onUpload, onRestart }: Props) {
  const players = Object.values(lineup).filter(Boolean);

  const baseOvr = players.reduce((sum, p) => sum + (p!.ovr || 0), 0);
  const score = calcLineupScore(lineup);
  const bonus = parseFloat((score - baseOvr).toFixed(2));
  const legendBonusList = getLegendBonuses(lineup);
  const isGodLineup = hasJordan(lineup);
  const isYaoMingLineup = hasYaoMing(lineup);
  const isJordanAndShaq = hasJordanAndShaq(lineup);
  const activeCombos = getActiveCombos(lineup);

  // Chemistry info
  const teams = players.map(p => p!.team);
  const teamCounts: Record<string, number> = {};
  teams.forEach(t => { teamCounts[t] = (teamCounts[t] || 0) + 1; });
  const chemTeams = Object.entries(teamCounts).filter(([, count]) => count >= 2);

  const avgStats = useMemo(() => {
    return STAT_KEYS.map(key => {
      const sum = players.reduce((s, p) => s + (p ? p.stats[key] : 0), 0);
      return { subject: STAT_DISPLAY[key], A: Math.round(sum / players.length * 10) / 10, fullMark: 100 };
    });
  }, [players]);

  const allBadges = useMemo(() => {
    return Array.from(new Set(players.flatMap(p => p?.badges?.map((b: {name: string}) => b.name) || [] as string[])));
  }, [players]);

  const badgeCount = players.reduce((sum, p) => sum + (p?.badges?.length || 0), 0);

  const [showHupuPrompt, setShowHupuPrompt] = useState(false);

  const handleShareClick = async () => {
    const shareText = `我在【AI广场】-【NBA最佳阵容对战】#NBA梦幻1阵# 我的阵容战力 ${score} 分！快来抽卡组队挑战我！`;
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {}
    openHupuLink(HUPU_POST_URL, () => setShowHupuPrompt(true));
  };

  const SCALE = 0.5;
  const CW = 320 * SCALE;
  const CH = 480 * SCALE;

  const renderCard = (p: any, delay: number) => (
    <motion.div
      key={p.id}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay, type: 'spring' }}
      className="flex flex-col items-center"
    >
      <div className="overflow-hidden" style={{ width: CW, height: CH }}>
        <div className="origin-top-left" style={{ transform: `scale(${SCALE})`, width: 320, height: 480 }}>
          <Card player={p} isFlipped={true} />
        </div>
      </div>
      <div className="text-center mt-2 font-black text-white text-lg uppercase tracking-wider">{p.position}</div>
    </motion.div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-900 py-8 pb-36 px-4">
        <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tighter"
            style={{
              backgroundImage: 'linear-gradient(to right, #facc15, #f97316, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            你的终极阵容
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">战力</span>
            <div className="bg-black text-white text-3xl font-black px-4 py-1 rounded-xl" style={{ border: '4px solid #a855f7' }}>
              {score}
            </div>
          </div>
          {/* Score breakdown */}
          {isGodLineup && (
            <div className="fixed inset-0 z-50 pointer-events-none" style={{ animation: 'fadeOutUp 3s ease-out 4s forwards' }}>
              {[...Array(20)].map((_, i) => {
                const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#f97316', '#eab308', '#fcd34d', '#ffffff'];
                const color = colors[i % colors.length];
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const delay = Math.random() * 3;
                const size = 150 + Math.random() * 250;
                return (
                  <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
                    <div
                      style={{
                        width: size, height: size,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${color}cc 0%, ${color}88 25%, ${color}33 50%, transparent 70%)`,
                        animation: `fireworkBurst 3s ease-out ${delay}s both`,
                      }}
                    />
                    {[...Array(12)].map((_, j) => {
                      const angle = (j / 12) * 360 + Math.random() * 20;
                      const dist = size * 0.35 + Math.random() * size * 0.45;
                      const dx = Math.cos(angle * Math.PI / 180) * dist;
                      const dy = Math.sin(angle * Math.PI / 180) * dist;
                      const sparkSize = 4 + Math.random() * 6;
                      return (
                        <div
                          key={j}
                          className="absolute rounded-full"
                          style={{
                            width: sparkSize, height: sparkSize,
                            background: color,
                            left: size / 2, top: size / 2,
                            transform: `translate(${dx}px, ${dy}px)`,
                            animation: `sparkle 2.5s ease-out ${delay + 0.3}s both`,
                            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-5 text-center">
                  <div className="text-3xl mb-2">👑</div>
                  <h3
                    className="text-base font-black tracking-wider mb-1"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    神的加成已激活
                  </h3>
                  <p className="text-white/60 text-xs font-bold">篮球之神迈克尔·乔丹降临阵容 · 战力 +6%</p>
                  {isJordanAndShaq && (
                    <p className="text-amber-400/80 text-xs font-bold mt-1">有乔有鲨，天下无敌 · 战力 +5%</p>
                  )}
                  {isYaoMingLineup && (
                    <p className="text-blue-400/80 text-xs font-bold mt-1">小巨人加成已激活 · 战力 +2%</p>
                  )}
                  {activeCombos.filter(c => c.type === 'combo').map(c => (
                    <p key={c.name} className="text-emerald-400/80 text-xs font-bold mt-1">{c.name}已激活 · 战力 +{c.bonus}%</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Non-Jordan firework effects: Yao Ming and combos */}
          {!isGodLineup && (isYaoMingLineup || activeCombos.length > 0) && (
            <div className="fixed inset-0 z-50 pointer-events-none" style={{ animation: 'fadeOutUp 3s ease-out 4s forwards' }}>
              {[...Array(8)].map((_, i) => {
                const colors = isYaoMingLineup
                  ? ['#60a5fa', '#3b82f6', '#93c5fd', '#a78bfa', '#c4b5fd']
                  : ['#34d399', '#10b981', '#6ee7b7', '#a78bfa', '#fbbf24'];
                const color = colors[i % colors.length];
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const delay = Math.random() * 2.5;
                const size = 100 + Math.random() * 180;
                return (
                  <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
                    <div
                      style={{
                        width: size, height: size,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${color}99 0%, ${color}66 25%, ${color}22 50%, transparent 70%)`,
                        animation: `fireworkBurst 2.5s ease-out ${delay}s both`,
                      }}
                    />
                    {[...Array(8)].map((_, j) => {
                      const angle = (j / 8) * 360 + Math.random() * 30;
                      const dist = size * 0.3 + Math.random() * size * 0.35;
                      const dx = Math.cos(angle * Math.PI / 180) * dist;
                      const dy = Math.sin(angle * Math.PI / 180) * dist;
                      const sparkSize = 3 + Math.random() * 4;
                      return (
                        <div
                          key={j}
                          className="absolute rounded-full"
                          style={{
                            width: sparkSize, height: sparkSize,
                            background: color,
                            left: size / 2, top: size / 2,
                            transform: `translate(${dx}px, ${dy}px)`,
                            animation: `sparkle 2s ease-out ${delay + 0.2}s both`,
                            boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-5 text-center">
                  {isYaoMingLineup && (
                    <>
                      <div className="text-2xl mb-1">🐼</div>
                      <h3 className="text-sm font-black tracking-wider mb-0.5" style={{ animation: 'yaoMingPulse 2s ease-in-out infinite' }}>
                        小巨人加成已激活
                      </h3>
                      <p className="text-white/60 text-xs font-bold">姚明降临阵容 · 战力 +2%</p>
                    </>
                  )}
                  {activeCombos.filter(c => c.type === 'combo').map(c => (
                    <p key={c.name} className="text-emerald-400/80 text-xs font-bold mt-1">🔥 {c.name}已激活 · 战力 +{c.bonus}%</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="mt-3 text-sm text-gray-400">
            基础 {baseOvr.toFixed(2)}
            {bonus > 0 && <span className="text-green-400 ml-2">+{bonus} 加成</span>}
          </div>
        </div>

        {/* 球星卡钻石排列 */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center gap-4">
            {(() => { const p = lineup.PF; return p && renderCard(p, 0); })()}
            {(() => { const p = lineup.SF; return p && renderCard(p, 0.05); })()}
          </div>
          <div className="flex justify-center gap-4">
            {lineup.C && renderCard(lineup.C, 0.1)}
          </div>
          <div className="flex justify-center gap-4">
            {(() => { const p = lineup.PG; return p && renderCard(p, 0.15); })()}
            {(() => { const p = lineup.SG; return p && renderCard(p, 0.2); })()}
          </div>
        </div>

        {/* Bonus + Radar + Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">阵容属性</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={avgStats}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="阵容属性" dataKey="A" stroke="#3B82F6" strokeWidth={3} fill="#3B82F6" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h4 className="text-gray-400 font-bold mb-3 uppercase text-sm tracking-wider">加成明细</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-bold">基础战力</span>
                  <span className="text-white font-black">{baseOvr.toFixed(2)}</span>
                </div>
                {chemTeams.length > 0 && chemTeams.map(([team, count]) => (
                  <div key={team} className="flex items-center justify-between">
                    <span className="text-gray-300 font-bold">
                      同队加成 · {team} x{count}
                    </span>
                    <span className="text-green-400 font-black">+{count >= 5 ? '10' : count >= 4 ? '7' : count >= 3 ? '4' : '2'}%</span>
                  </div>
                ))}
                {chemTeams.length === 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-bold">同队加成 · 无</span>
                    <span className="text-gray-600 font-black">+0%</span>
                  </div>
                )}
                {legendBonusList.map(lb => (
                  <div key={lb.name} className="flex items-center justify-between">
                    <span className={`font-bold ${lb.isGod ? '' : 'text-amber-400/60'}`} style={lb.isGod ? { animation: 'godGlow 2s ease-in-out infinite' } : undefined}>{lb.name}</span>
                    <span className={`font-black ${lb.isGod ? '' : 'text-amber-300/60'}`} style={lb.isGod ? { animation: 'godGlow 2s ease-in-out infinite' } : undefined}>+{lb.bonus}%</span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-bold">激活徽章</span>
                  <span className="text-purple-400 font-black">{badgeCount} 个</span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex items-center justify-between">
                  <span className="text-white font-black">最终战力</span>
                  <span className="text-yellow-400 font-black text-lg">{score}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h4 className="text-gray-400 font-bold mb-3 uppercase text-sm tracking-wider">激活徽章</h4>
              <div className="flex flex-wrap gap-2">
                {allBadges.slice(0, 8).map(b => (
                  <span key={b} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(30,58,138,0.5)', color: '#93c5fd', border: '1px solid rgba(29,78,216,0.5)' }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 z-30">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <button
            onClick={onUpload}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-black text-lg py-3 rounded-xl uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            上传并开始对战 (PK)
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleShareClick}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              截图与JRs炫耀阵容
            </button>
            <button
              onClick={onRestart}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              重新抽卡
            </button>
          </div>
        </div>
      </div>

      <HupuPrompt show={showHupuPrompt} onClose={() => setShowHupuPrompt(false)} />
    </>
  );
}
