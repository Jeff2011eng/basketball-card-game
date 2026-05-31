'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lineup } from '@/lib/types';
import { getPlayerId } from '@/lib/player-identity';
import { fetchMyLineup } from '@/lib/supabase-service';
import { calcLineupScore, getLegendBonuses, hasJordan } from '@/lib/game-logic';
import Card from './Card';
import { ArrowLeft, MessageSquarePlus, RotateCcw } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { openHupuLink } from '@/lib/hupu-links';
import HupuPrompt from '@/components/common/HupuPrompt';

interface Props {
  onBack: () => void;
}

const STAT_KEYS = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY'] as const;

const STAT_DISPLAY: Record<string, string> = {
  SHO: '投射', SLA: '突破', DEF: '防守', ATH: '运动', PLM: '组织', PHY: '对抗',
};

export default function LineupReview({ onBack }: Props) {
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);

  const nickname = typeof window !== 'undefined' ? localStorage.getItem('nickname') || '' : '';

  useEffect(() => {
    const playerId = getPlayerId();
    fetchMyLineup(playerId)
      .then(data => { setLineup(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const players = lineup ? Object.values(lineup).filter(Boolean) : [];
  const baseOvr = parseFloat(players.reduce((sum, p) => sum + (p!.ovr || 0), 0).toFixed(2));
  const score = lineup ? parseFloat(calcLineupScore(lineup).toFixed(2)) : 0;
  const bonus = parseFloat((score - baseOvr).toFixed(2));

  // Chemistry info
  const teams = players.map(p => p!.team);
  const teamCounts: Record<string, number> = {};
  teams.forEach(t => { teamCounts[t] = (teamCounts[t] || 0) + 1; });
  const chemTeams = Object.entries(teamCounts).filter(([, count]) => count >= 2);

  const avgStats = useMemo(() => {
    if (players.length === 0) return [];
    return STAT_KEYS.map(key => {
      const sum = players.reduce((s, p) => s + (p ? p.stats[key] : 0), 0);
      return { subject: STAT_DISPLAY[key], A: Math.round(sum / players.length * 10) / 10, fullMark: 100 };
    });
  }, [players]);

  const allBadges = useMemo(() => {
    return Array.from(new Set(players.flatMap(p => p?.badges?.map((b: {name: string}) => b.name) || [] as string[])));
  }, [players]);

  const badgeCount = players.reduce((sum, p) => sum + (p?.badges?.length || 0), 0);

  const [toast, setToast] = useState('');
  const [showHupuPrompt, setShowHupuPrompt] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const shareText = `我在【AI广场】-【NBA最佳阵容对战】#NBA梦幻1阵# 我的阵容战力 ${score} 分！快来抽卡组队挑战我！`;
  const HUPU_POST_URL = 'huputiyu://bbs/postImg?tagName=NBA梦幻1阵&tagId=37312&topicName=湿乎乎的话题&topicId=177';

  const handleShareClick = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {}
    openHupuLink(HUPU_POST_URL, () => setShowHupuPrompt(true));
  };

  const handleViewTopic = () => {
    openHupuLink('huputiyu://bbs/topicTag?tagId=37312', () => setShowHupuPrompt(true));
  };

  const SCALE = 0.5;
  const CW = 320 * SCALE;
  const CH = 480 * SCALE;

  const renderCard = (pos: string, delay: number) => {
    const p = lineup?.[pos as keyof Lineup];
    if (!p) return null;
    return (
      <motion.div
        key={pos}
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
  };

  return (
    <>
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg z-[100] border border-gray-600 animate-[fadeScale_0.3s_ease-out]">
          {toast}
        </div>
      )}
      <div className="min-h-screen bg-gray-900 pt-2 pb-36 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        ) : !lineup ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-bold text-lg">暂无阵容</p>
            <p className="text-gray-600 text-sm mt-2">开始抽卡组建你的阵容吧！</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl px-6">
            <div className="text-center mb-6">
              {nickname && <p className="text-gray-400 font-bold text-base mb-2">🏀 {nickname}</p>}
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">战力</span>
                  <div className="bg-black text-white text-3xl font-black px-4 py-1 rounded-xl" style={{ border: '4px solid #a855f7' }}>
                    {score}
                  </div>
                </div>
              </div>
            </div>

            {/* 球星卡钻石排列 */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center gap-4">
                {renderCard('PF', 0)}
                {renderCard('SF', 0.05)}
              </div>
              <div className="flex justify-center gap-4">
                {renderCard('C', 0.1)}
              </div>
              <div className="flex justify-center gap-4">
                {renderCard('PG', 0.15)}
                {renderCard('SG', 0.2)}
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
                      <Radar name="属性" dataKey="A" stroke="#3B82F6" strokeWidth={3} fill="#3B82F6" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-4">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <h4 className="text-gray-400 font-bold mb-3 uppercase text-sm tracking-wider">加成明细</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-bold">基础战力</span>
                      <span className="text-white font-black">{baseOvr.toFixed(2)}</span>
                    </div>
                    {chemTeams.length > 0 ? chemTeams.map(([team, count]) => (
                      <div key={team} className="flex items-center justify-between">
                        <span className="text-gray-300 font-bold">同队加成 · {team} x{count}</span>
                        <span className="text-green-400 font-black">+{count >= 5 ? '10' : count >= 4 ? '7' : count >= 3 ? '4' : '2'}%</span>
                      </div>
                    )) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-bold">同队加成 · 无</span>
                        <span className="text-gray-600 font-black">+0%</span>
                      </div>
                    )}
                    {getLegendBonuses(lineup).map(lb => (
                      <div key={lb.name} className="flex items-center justify-between">
                        <span className={`font-bold ${lb.isGod ? '' : lb.excluded ? 'text-gray-600 line-through' : 'text-amber-400/60'}`} style={lb.isGod ? { animation: 'godGlow 2s ease-in-out infinite' } : undefined}>{lb.name}</span>
                        <span className={`font-black ${lb.isGod ? '' : lb.excluded ? 'text-gray-600' : 'text-amber-300/60'}`} style={lb.isGod ? { animation: 'godGlow 2s ease-in-out infinite' } : undefined}>{lb.excluded ? '不享有' : `+${lb.bonus}%`}</span>
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
                    {allBadges.length === 0 && <span className="text-gray-600 text-sm">暂无徽章</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* 底部操作栏 */}
      {lineup && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 z-30">
          <div className="max-w-md mx-auto flex flex-col gap-2">
            <button
              onClick={handleShareClick}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-lg py-3 rounded-xl uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
            >
              <MessageSquarePlus className="w-5 h-5" />
              截图与JRs比一比
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleViewTopic}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                看看其他JRs的阵容
              </button>
              <button
                onClick={onBack}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                重新抽卡
              </button>
            </div>
          </div>
        </div>
      )}

      <HupuPrompt show={showHupuPrompt} onClose={() => setShowHupuPrompt(false)} />
    </>
  );
}
