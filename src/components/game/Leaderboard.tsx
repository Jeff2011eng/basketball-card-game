'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LeaderboardEntry } from '@/lib/types';
import { getPlayerId } from '@/lib/player-identity';
import { fetchLeaderboard } from '@/lib/supabase-service';
import { Trophy, Medal, Crown, History, RotateCcw } from 'lucide-react';

interface Props {
  onRestart: () => void;
  onHistory: () => void;
}

export default function Leaderboard({ onRestart, onHistory }: Props) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playerId = getPlayerId();

  useEffect(() => {
    fetchLeaderboard()
      .then(data => { setBoard(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-400 w-5 h-5" />;
    if (rank === 2) return <Medal className="text-gray-300 w-5 h-5" />;
    if (rank === 3) return <Medal className="text-amber-600 w-5 h-5" />;
    return <span className="text-gray-500 font-black text-sm">{rank}</span>;
  };

  const renderEntry = (entry: LeaderboardEntry, rank: number, isUser: boolean) => {
    const rowClass = isUser ? 'bg-blue-900/30 border-blue-500/50' : 'border-gray-700/50';
    const nameClass = isUser ? 'text-blue-400' : 'text-gray-200';

    return (
      <div className={rowClass}>
        {/* Mobile card layout */}
        <div className="md:hidden p-3 border-b last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getRankIcon(rank)}
              {isUser && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">YOU</span>}
              <span className={`font-black ${nameClass}`}>{entry.nickname}</span>
            </div>
            <span className={`font-black text-lg ${rank === 1 ? 'text-yellow-400' : 'text-white'}`}>{entry.best_score}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-green-400 font-bold">{entry.wins}W</span>
              <span className="text-gray-600 mx-1">/</span>
              <span className="text-red-400 font-bold">{entry.losses}L</span>
            </div>
            <span className={`font-black ${entry.win_rate >= 60 ? 'text-green-400' : entry.win_rate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {entry.win_rate}%
            </span>
            <span className="text-gray-500">{entry.total_battles} battles</span>
          </div>
        </div>

        {/* Desktop table row */}
        <div className={`hidden md:grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 transition-colors ${isUser ? '' : 'hover:bg-gray-700/30'}`}>
          <div className="col-span-1 flex justify-center">{getRankIcon(rank)}</div>
          <div className="col-span-3 flex items-center gap-2">
            {isUser && <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase">YOU</span>}
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

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 flex flex-col items-center">
      <div className="text-center mb-8">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
          Global Leaderboard
        </h1>
        <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">
          Battle Power Rankings
        </p>
      </div>

      {loading ? (
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
          <p className="text-gray-500 font-bold text-lg">No battles yet</p>
          <p className="text-gray-600 text-sm mt-2">Be the first to battle!</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl mb-6">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-950 border-b border-gray-700 text-gray-400 font-bold text-sm uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">Manager</div>
            <div className="col-span-2 text-center">W / L</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-center">Best Score</div>
            <div className="col-span-2 text-center">Battles</div>
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
                  {renderEntry(entry, rank, isUser)}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          onClick={onHistory}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <History className="w-4 h-4" />
          Battle History
        </button>
        <button
          onClick={onRestart}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-3 rounded-xl uppercase tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Draft Another
        </button>
      </div>
    </div>
  );
}
