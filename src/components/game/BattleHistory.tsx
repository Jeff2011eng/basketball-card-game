'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BattleHistoryEntry } from '@/lib/types';
import { getPlayerId } from '@/lib/player-identity';
import { ArrowLeft, Trophy, Swords } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function BattleHistory({ onBack }: Props) {
  const [history, setHistory] = useState<BattleHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playerId = getPlayerId();
    fetch(`/api/battle/history?playerId=${playerId}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Battle History</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg">No battles yet</p>
            <p className="text-gray-600 text-sm mt-2">Upload a lineup and battle to see your history here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry, i) => {
              const isWin = entry.winner === 'challenger';
              const isDraw = entry.winner === 'draw';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between px-5 py-4 rounded-xl border ${
                    isWin ? 'bg-green-900/20 border-green-500/30' : isDraw ? 'bg-gray-800 border-gray-700' : 'bg-red-900/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                      isWin ? 'bg-green-500 text-white' : isDraw ? 'bg-gray-600 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {isWin ? 'W' : isDraw ? 'D' : 'L'}
                    </div>
                    <div>
                      <div className="text-white font-bold">vs {entry.defender_nickname}</div>
                      <div className="text-gray-500 text-xs">{formatDate(entry.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg">
                      <span className={isWin ? 'text-green-400' : 'text-white'}>{entry.challenger_score}</span>
                      <span className="text-gray-600 mx-1">:</span>
                      <span className={!isWin && !isDraw ? 'text-red-400' : 'text-white'}>{entry.defender_score}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
