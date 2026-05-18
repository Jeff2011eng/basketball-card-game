'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lineup, STAT_LABELS } from '@/lib/types';
import { getRarity } from '@/lib/game-logic';
import Card from './Card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Upload, Trophy } from 'lucide-react';

interface Props {
  lineup: Lineup;
  onUpload: () => void;
}

const STAT_KEYS = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY'] as const;

const STAT_DISPLAY: Record<string, string> = {
  SHO: 'Shooting',
  SLA: 'Slashing',
  DEF: 'Defense',
  ATH: 'Athleticism',
  PLM: 'Playmaking',
  PHY: 'Physical',
};

export default function LineupResult({ lineup, onUpload }: Props) {
  const players = Object.values(lineup);

  const totalOvr = Math.round(players.reduce((sum, p) => sum + (p?.ovr || 0), 0) / 5);

  const avgStats = useMemo(() => {
    return STAT_KEYS.map(key => {
      const sum = players.reduce((s, p) => s + (p ? p.stats[key] : 0), 0);
      return { subject: STAT_DISPLAY[key], A: Math.round(sum / 5), fullMark: 100 };
    });
  }, [players]);

  const allBadges = useMemo(() => {
    return Array.from(new Set(players.flatMap(p => p?.badges?.map((b: {name: string}) => b.name) || [] as string[])));
  }, [players]);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-6 flex flex-col items-center">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2 uppercase tracking-tighter">
          Your Ultimate Team
        </h1>
        <div className="flex items-center justify-center gap-4">
          <span className="text-gray-400 text-xl font-bold uppercase tracking-widest">Team OVR</span>
          <div className="bg-black text-white text-5xl font-black px-6 py-2 rounded-xl border-4 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
            {totalOvr}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16 w-full max-w-7xl">
        {players.map((p, i) => p && (
          <motion.div
            key={p.id}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            className="transform scale-[0.5] md:scale-[0.65] lg:scale-[0.8] origin-center h-[320px] md:h-[390px] lg:h-[480px] mx-[-30px] md:mx-[-15px] lg:mx-0"
          >
            <Card player={p} isFlipped={true} />
            <div className="text-center mt-2 font-black text-white text-xl uppercase tracking-wider">{p.position}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl">
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-wider">Team Synergy & Stats</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={avgStats}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Team Stats" dataKey="A" stroke="#3B82F6" strokeWidth={3} fill="#3B82F6" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <h4 className="text-gray-400 font-bold mb-4 uppercase text-sm tracking-wider">Top Badges Active</h4>
            <div className="flex flex-wrap gap-2">
              {allBadges.slice(0, 8).map(b => (
                <span key={b} className="bg-blue-900/50 text-blue-300 border border-blue-700/50 px-3 py-1 rounded-full text-xs font-bold">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onUpload}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-black text-xl py-6 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20"
          >
            <Trophy className="w-6 h-6" />
            UPLOAD & BATTLE (PK)
          </button>
        </div>
      </div>
    </div>
  );
}
