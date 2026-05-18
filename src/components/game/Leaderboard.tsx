'use client';

import React from 'react';
import { Lineup } from '@/lib/types';
import { Trophy, Medal, Crown } from 'lucide-react';

interface Props {
  userLineup: Lineup;
  userTotalOvr: number;
  onRestart: () => void;
}

export default function Leaderboard({ userLineup, userTotalOvr, onRestart }: Props) {
  const mockBoard = [
    { name: 'HoopsKing99', ovr: 98 },
    { name: 'BallIsLife', ovr: 96 },
    { name: 'DraftMaster', ovr: 95 },
    { name: 'StephBetter', ovr: 93 },
    { name: 'LeBronFan23', ovr: 91 },
    { name: 'JRS_User', ovr: 89 },
    { name: 'Your Lineup', ovr: userTotalOvr, isUser: true },
    { name: 'RookieCard', ovr: 85 },
  ].sort((a, b) => b.ovr - a.ovr);

  let currentRank = 0;
  const rankedBoard = mockBoard.map(item => ({ ...item, rank: ++currentRank }));

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-400 w-6 h-6" />;
    if (rank === 2) return <Medal className="text-gray-300 w-6 h-6" />;
    if (rank === 3) return <Medal className="text-amber-600 w-6 h-6" />;
    return <span className="text-gray-500 font-black w-6 text-center">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-6 flex flex-col items-center">
      <div className="text-center mb-12">
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
          Global Leaderboard
        </h1>
        <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-sm">
          JRS Power Rankings
        </p>
      </div>

      <div className="w-full max-w-4xl bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-950 border-b border-gray-700 text-gray-400 font-bold text-sm uppercase tracking-wider">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-8">Manager</div>
          <div className="col-span-2 text-right pr-4">Team OVR</div>
        </div>

        <div className="flex flex-col">
          {rankedBoard.map((entry) => (
            <div
              key={entry.name}
              className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-700/50 last:border-0 transition-colors ${entry.isUser ? 'bg-blue-900/30 border-blue-500/50' : 'hover:bg-gray-700/30'}`}
            >
              <div className="col-span-2 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>
              <div className="col-span-8 flex items-center gap-3">
                {entry.isUser && <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase">YOU</span>}
                <span className={`font-black text-lg ${entry.isUser ? 'text-blue-400' : 'text-gray-200'}`}>{entry.name}</span>
              </div>
              <div className="col-span-2 text-right pr-4">
                <span className={`font-black text-2xl ${entry.rank === 1 ? 'text-yellow-400' : 'text-white'}`}>{entry.ovr}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="mt-12 bg-white text-black hover:bg-gray-200 font-black text-lg px-8 py-4 rounded-xl uppercase tracking-wider transition-all hover:scale-105"
      >
        Draft Another Team
      </button>
    </div>
  );
}
