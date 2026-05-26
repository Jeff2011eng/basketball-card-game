'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BattleResult as BattleResultType } from '@/lib/battle-logic';
import { STAT_LABELS } from '@/lib/types';
import { Trophy, Swords, ArrowRight, History } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Card from './Card';

interface Props {
  result: BattleResultType;
  onLeaderboard: () => void;
  onBattleAgain: () => void;
  onHistory: () => void;
}

export default function BattleResult({ result, onLeaderboard, onBattleAgain, onHistory }: Props) {
  const isWin = result.winner === 'challenger';
  const isDraw = result.winner === 'draw';

  const radarData = useMemo(() => {
    return result.statComparison.map(s => ({
      subject: STAT_LABELS[s.stat] || s.stat,
      challenger: s.challenger,
      defender: s.defender,
      fullMark: 100,
    }));
  }, [result.statComparison]);

  const SCALE = 0.35;
  const CW = 320 * SCALE;
  const CH = 480 * SCALE;

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      {/* Winner announcement */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-center mb-8"
      >
        {isWin ? (
          <>
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-tighter">
              VICTORY!
            </h1>
          </>
        ) : isDraw ? (
          <>
            <Swords className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <h1 className="text-4xl md:text-5xl font-black text-gray-300 uppercase tracking-tighter">
              DRAW
            </h1>
          </>
        ) : (
          <>
            <Swords className="w-16 h-16 text-red-400 mx-auto mb-3" />
            <h1 className="text-4xl md:text-5xl font-black text-red-400 uppercase tracking-tighter">
              DEFEAT
            </h1>
          </>
        )}
      </motion.div>

      {/* Score comparison */}
      <div className="flex items-center justify-center gap-6 mb-10">
        <div className="text-center">
          <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">You</div>
          <div className="text-sm text-blue-400 font-bold">{result.challengerNickname}</div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className={`text-4xl font-black mt-2 ${isWin ? 'text-yellow-400' : 'text-white'}`}
          >
            {result.challengerScore}
          </motion.div>
        </div>
        <div className="text-gray-600 font-black text-2xl">VS</div>
        <div className="text-center">
          <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Opponent</div>
          <div className="text-sm text-red-400 font-bold">{result.defenderNickname}</div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className={`text-4xl font-black mt-2 ${!isWin && !isDraw ? 'text-yellow-400' : 'text-white'}`}
          >
            {result.defenderScore}
          </motion.div>
        </div>
      </div>

      {/* Position matchups */}
      <div className="max-w-2xl mx-auto mb-10">
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 text-center">Position Matchups</h3>
        <div className="flex flex-col gap-3">
          {result.positionMatchups.map((m, i) => (
            <motion.div
              key={m.position}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 border ${
                m.winner === 'challenger' ? 'border-blue-500/50' : m.winner === 'defender' ? 'border-red-500/50' : 'border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="overflow-hidden" style={{ width: CW, height: CH }}>
                  <div className="origin-top-left" style={{ transform: `scale(${SCALE})`, width: 320, height: 480 }}>
                    <Card player={m.challenger} isFlipped={true} />
                  </div>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{m.challenger.name_en}</div>
                  <div className="text-blue-300 font-black text-xs">{m.challengerScore}</div>
                </div>
              </div>

              <div className="text-center px-2">
                <div className="text-gray-400 font-black text-xs">{m.position}</div>
                <div className={`text-lg font-black ${
                  m.winner === 'challenger' ? 'text-blue-400' : m.winner === 'defender' ? 'text-red-400' : 'text-gray-500'
                }`}>
                  {m.winner === 'challenger' ? '<' : m.winner === 'defender' ? '>' : '='}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="text-right">
                  <div className="text-white font-bold text-sm">{m.defender.name_en}</div>
                  <div className="text-red-300 font-black text-xs">{m.defenderScore}</div>
                </div>
                <div className="overflow-hidden" style={{ width: CW, height: CH }}>
                  <div className="origin-top-left" style={{ transform: `scale(${SCALE})`, width: 320, height: 480 }}>
                    <Card player={m.defender} isFlipped={true} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Radar chart comparison */}
      <div className="max-w-xl mx-auto mb-10 bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 text-center">Stat Comparison</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="You" dataKey="challenger" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.3} />
              <Radar name="Opponent" dataKey="defender" stroke="#EF4444" strokeWidth={2} fill="#EF4444" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-sm text-gray-400 font-bold">You</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm text-gray-400 font-bold">Opponent</span></div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="max-w-md mx-auto flex flex-col gap-3">
        <button
          onClick={onBattleAgain}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-lg py-4 rounded-xl uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
        >
          <Swords className="w-5 h-5" />
          Battle Again
        </button>
        <div className="flex gap-3">
          <button
            onClick={onLeaderboard}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button
            onClick={onHistory}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>
    </div>
  );
}
