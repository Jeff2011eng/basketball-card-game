'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaderboardEntry, LineupLeaderboardEntry, Lineup } from '@/lib/types';
import { getPlayerId } from '@/lib/player-identity';
import { calcLineupScore } from '@/lib/game-logic';
import { fetchLeaderboard, fetchLineupLeaderboard, fetchMyRecordRank, fetchMyLineupRank } from '@/lib/supabase-service';
import { Trophy, Medal, Crown, History, RotateCcw, X, Star } from 'lucide-react';
import Card from './Card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

type Tab = 'record' | 'lineup';

interface Props {
  onRestart: () => void;
  onHistory: () => void;
}

const SCALE = 0.35;
const CW = 320 * SCALE;
const CH = 480 * SCALE;

const STAT_KEYS = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY'] as const;
const STAT_DISPLAY: Record<string, string> = {
  SHO: '投射', SLA: '突破', DEF: '防守', ATH: '运动', PLM: '组织', PHY: '对抗',
};

export default function Leaderboard({ onRestart, onHistory }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('record');
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [lineupBoard, setLineupBoard] = useState<LineupLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineupLoading, setLineupLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLineup, setSelectedLineup] = useState<LineupLeaderboardEntry | null>(null);
  const [myRecord, setMyRecord] = useState<{ entry: LeaderboardEntry; rank: number } | null>(null);
  const [myLineup, setMyLineup] = useState<{ entry: LineupLeaderboardEntry; rank: number } | null>(null);
  const playerId = getPlayerId();

  useEffect(() => {
    fetchLeaderboard()
      .then(data => {
        setBoard(data);
        setLoading(false);
        if (!data.some(e => e.player_id === playerId)) {
          fetchMyRecordRank(playerId).then(r => r && setMyRecord(r));
        }
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    if (activeTab === 'lineup' && lineupBoard.length === 0 && !lineupLoading) {
      setLineupLoading(true);
      fetchLineupLeaderboard()
        .then(data => {
          setLineupBoard(data);
          setLineupLoading(false);
          if (!data.some(e => e.player_id === playerId)) {
            fetchMyLineupRank(playerId).then(r => r && setMyLineup(r));
          }
        })
        .catch(() => setLineupLoading(false));
    }
  }, [activeTab]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-400 w-5 h-5" />;
    if (rank === 2) return <Medal className="text-gray-300 w-5 h-5" />;
    if (rank === 3) return <Medal className="text-amber-600 w-5 h-5" />;
    return <span className="text-gray-500 font-black text-sm">{rank}</span>;
  };

  const renderRecordEntry = (entry: LeaderboardEntry, rank: number, isUser: boolean) => {
    const rowClass = isUser ? 'bg-blue-900/30 border-blue-500/50' : 'border-gray-700/50';
    const nameClass = isUser ? 'text-blue-400' : 'text-gray-200';

    return (
      <div className={rowClass}>
        <div className="md:hidden p-3 border-b last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getRankIcon(rank)}
              {isUser && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">我</span>}
              <span className={`font-black ${nameClass}`}>{entry.nickname}</span>
            </div>
            <span className={`font-black text-lg ${rank === 1 ? 'text-yellow-400' : 'text-white'}`}>{entry.best_score}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-green-400 font-bold">{entry.wins}胜</span>
              <span className="text-gray-600 mx-1">/</span>
              <span className="text-red-400 font-bold">{entry.losses}负</span>
            </div>
            <span className={`font-black ${entry.win_rate >= 60 ? 'text-green-400' : entry.win_rate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {entry.win_rate}%
            </span>
            <span className="text-gray-500">{entry.total_battles} 场</span>
          </div>
        </div>

        <div className={`hidden md:grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 transition-colors ${isUser ? '' : 'hover:bg-gray-700/30'}`}>
          <div className="col-span-1 flex justify-center">{getRankIcon(rank)}</div>
          <div className="col-span-3 flex items-center gap-2">
            {isUser && <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase">我</span>}
            <span className={`font-black text-lg ${nameClass}`}>{entry.nickname}</span>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-green-400 font-bold">{entry.wins}</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-red-400 font-bold">{entry.losses}</span>
          </div>
          <div className="col-span-2 text-center">
            <span className={`font-black text-lg ${entry.win_rate >= 60 ? 'text-green-400' : entry.win_rate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {entry.win_rate}%
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className={`font-black text-lg ${rank === 1 ? 'text-yellow-400' : 'text-white'}`}>{entry.best_score}</span>
          </div>
          <div className="col-span-2 text-center text-gray-400 font-bold">{entry.total_battles}</div>
        </div>
      </div>
    );
  };

  const renderLineupEntry = (entry: LineupLeaderboardEntry, rank: number, isUser: boolean) => {
    const rowClass = isUser ? 'bg-blue-900/30 border-blue-500/50' : 'border-gray-700/50';
    const nameClass = isUser ? 'text-blue-400' : 'text-gray-200';

    return (
      <div
        onClick={() => setSelectedLineup(entry)}
        className={`${rowClass} cursor-pointer hover:bg-gray-700/30 transition-colors`}
      >
        <div className="p-3 md:p-4 border-b last:border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getRankIcon(rank)}
              {isUser && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">我</span>}
              <span className={`font-black ${nameClass}`}>{entry.nickname}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              <span className={`font-black text-lg ${rank === 1 ? 'text-yellow-400' : 'text-white'}`}>{entry.score}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLineupModal = () => {
    if (!selectedLineup) return null;

    const lineup: Lineup = {
      PG: selectedLineup.pg_data,
      SG: selectedLineup.sg_data,
      SF: selectedLineup.sf_data,
      PF: selectedLineup.pf_data,
      C: selectedLineup.c_data,
    };

    const players = Object.values(lineup).filter(Boolean);
    const baseOvr = players.reduce((sum, p) => sum + (p!.ovr || 0), 0);
    const recalcScore = calcLineupScore(lineup);
    const bonus = parseFloat((recalcScore - baseOvr).toFixed(2));

    const teams = players.map(p => p!.team);
    const teamCounts: Record<string, number> = {};
    teams.forEach(t => { teamCounts[t] = (teamCounts[t] || 0) + 1; });
    const chemTeams = Object.entries(teamCounts).filter(([, count]) => count >= 2);

    const badgeCount = players.reduce((sum, p) => sum + (p?.badges?.length || 0), 0);

    const radarData = STAT_KEYS.map(key => ({
      subject: STAT_DISPLAY[key],
      A: selectedLineup.avg_stats?.[key] ?? 0,
      fullMark: 100,
    }));

    const allBadges = Array.from(new Set(
      players.flatMap(p => p?.badges?.map((b: { name: string }) => b.name) || [])
    ));

    const renderMiniCard = (pos: string) => {
      const p = lineup[pos as keyof Lineup];
      if (!p) return null;
      return (
        <div className="flex flex-col items-center">
          <div className="overflow-hidden rounded-lg" style={{ width: CW, height: CH }}>
            <div className="origin-top-left" style={{ transform: `scale(${SCALE})`, width: 320, height: 480 }}>
              <Card player={p} isFlipped={true} />
            </div>
          </div>
          <div className="text-center mt-1 font-black text-white text-xs uppercase">{p.position}</div>
        </div>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setSelectedLineup(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        >
          <button
            onClick={() => setSelectedLineup(null)}
            className="absolute top-4 right-4 text-white/50 hover:text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white mb-1">{selectedLineup.nickname}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Star className="w-5 h-5 text-purple-400" />
              <span className="bg-black text-white text-2xl font-black px-4 py-1 rounded-xl" style={{ border: '3px solid #a855f7' }}>
                {recalcScore}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              基础 {baseOvr}{bonus > 0 && <span className="text-green-400 ml-1">+{bonus} 加成</span>}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex justify-center gap-3">
              {renderMiniCard('PF')}
              {renderMiniCard('SF')}
            </div>
            <div className="flex justify-center gap-3">
              {renderMiniCard('C')}
            </div>
            <div className="flex justify-center gap-3">
              {renderMiniCard('PG')}
              {renderMiniCard('SG')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wider">阵容属性</h3>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="属性" dataKey="A" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <h4 className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider">加成明细</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-bold">基础战力</span>
                    <span className="text-white font-black">{baseOvr}</span>
                  </div>
                  {chemTeams.length > 0 ? chemTeams.map(([team, count]) => (
                    <div key={team} className="flex items-center justify-between">
                      <span className="text-gray-300 font-bold">同队 · {team} x{count}</span>
                      <span className="text-green-400 font-black">+{count >= 3 ? '8' : '5'}%</span>
                    </div>
                  )) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-bold">同队加成 · 无</span>
                      <span className="text-gray-600 font-black">+0%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-bold">徽章</span>
                    <span className="text-purple-400 font-black">{badgeCount} 个</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <h4 className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider">激活徽章</h4>
                <div className="flex flex-wrap gap-1.5">
                  {allBadges.slice(0, 8).map(b => (
                    <span key={b} className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(30,58,138,0.5)', color: '#93c5fd', border: '1px solid rgba(29,78,216,0.5)' }}>
                      {b}
                    </span>
                  ))}
                  {allBadges.length === 0 && <span className="text-gray-600 text-xs">暂无徽章</span>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 py-8 px-4 pb-24 flex flex-col items-center">
        <div className="text-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            全球排行榜
          </h1>
        </div>

        {/* Tab bar */}
        <div className="flex bg-gray-800 rounded-xl p-1 mb-6 w-full max-w-sm">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'record'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            战绩排行
          </button>
          <button
            onClick={() => setActiveTab('lineup')}
            className={`flex-1 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'lineup'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            最佳阵容
          </button>
        </div>

        {/* Record tab */}
        {activeTab === 'record' && (
          loading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400 font-bold text-lg">{error}</p>
            </div>
          ) : board.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 font-bold text-lg">暂无对战记录</p>
              <p className="text-gray-600 text-sm mt-2">成为第一个对战的人！</p>
            </div>
          ) : (
            <div className="w-full max-w-4xl bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-950 border-b border-gray-700 text-gray-400 font-bold text-sm uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-3">经理人</div>
                <div className="col-span-2 text-center">胜 / 负</div>
                <div className="col-span-2 text-center">胜率</div>
                <div className="col-span-2 text-center">最高分</div>
                <div className="col-span-2 text-center">场次</div>
              </div>
              <div className="flex flex-col">
                {board.map((entry, i) => {
                  const rank = i + 1;
                  const isUser = entry.player_id === playerId;
                  return (
                    <motion.div
                      key={entry.player_id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {renderRecordEntry(entry, rank, isUser)}
                    </motion.div>
                  );
                })}
                {myRecord && (
                  <>
                    <div className="p-2 text-center text-gray-500 text-xs font-bold">· · ·</div>
                    {renderRecordEntry(myRecord.entry, myRecord.rank, true)}
                  </>
                )}
              </div>
            </div>
          )
        )}

        {/* Lineup tab */}
        {activeTab === 'lineup' && (
          lineupLoading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : lineupBoard.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 font-bold text-lg">暂无阵容数据</p>
              <p className="text-gray-600 text-sm mt-2">开始抽卡组建你的阵容吧！</p>
            </div>
          ) : (
            <div className="w-full max-w-4xl bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
              <div className="flex flex-col">
                {lineupBoard.map((entry, i) => {
                  const rank = i + 1;
                  const isUser = entry.player_id === playerId;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {renderLineupEntry(entry, rank, isUser)}
                    </motion.div>
                  );
                })}
                {myLineup && (
                  <>
                    <div className="p-2 text-center text-gray-500 text-xs font-bold">· · ·</div>
                    {renderLineupEntry(myLineup.entry, myLineup.rank, true)}
                  </>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm p-4 z-30 flex justify-center gap-3">
        <button
          onClick={onHistory}
          className="flex-1 max-w-[200px] bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <History className="w-4 h-4" />
          对战记录
        </button>
        <button
          onClick={onRestart}
          className="flex-1 max-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3 rounded-xl uppercase tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          重新抽卡
        </button>
      </div>

      {/* Lineup detail modal */}
      <AnimatePresence>
        {selectedLineup && renderLineupModal()}
      </AnimatePresence>
    </>
  );
}
