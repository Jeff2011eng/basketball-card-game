'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PackCard, Lineup } from '@/lib/types';
import { getRarity } from '@/lib/game-logic';
import Card from './Card';
import { Search, ChevronRight } from 'lucide-react';

type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

interface Props {
  pool: PackCard[];
  onComplete: (lineup: Lineup) => void;
}

export default function DraftBoard({ pool, onComplete }: Props) {
  const [filter, setFilter] = useState<Position | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [lineup, setLineup] = useState<Lineup>({
    PG: null, SG: null, SF: null, PF: null, C: null,
  });

  const filteredPool = useMemo(() => {
    return pool.filter(p => {
      if (filter !== 'ALL' && !p.position.includes(filter)) return false;
      if (search && !p.name_en.toLowerCase().includes(search.toLowerCase()) && !p.name_cn.includes(search)) return false;
      return true;
    }).sort((a, b) => b.ovr - a.ovr);
  }, [pool, filter, search]);

  const handleSelect = (player: PackCard) => {
    // Find matching position slot
    const pos = POSITIONS.find(p => player.position.includes(p));
    if (!pos) return;
    setLineup(prev => ({ ...prev, [pos]: player }));
  };

  const isComplete = Object.values(lineup).every(p => p !== null);
  const lineupCardIds = useMemo(() => {
    const ids = new Set<number>();
    Object.values(lineup).forEach(p => { if (p) ids.add(p.id); });
    return ids;
  }, [lineup]);

  const renderSlot = (pos: Position) => {
    const player = lineup[pos];
    return (
      <div
        key={pos}
        onClick={() => setFilter(pos)}
        className={`w-20 h-32 md:w-24 md:h-36 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${
          player
            ? 'border-transparent'
            : 'border-dashed border-gray-600 hover:border-gray-400 bg-gray-800'
        } ${filter === pos && !player ? 'border-blue-500 bg-blue-500/10' : ''}`}
      >
        {player ? (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-4xl font-black text-white/20">{player.jersey_number}</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-2">
              <span className="text-xs font-bold text-white leading-tight truncate">{player.name_en}</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-gray-300 font-black">{player.position}</span>
                <span className="text-sm font-black text-yellow-400">{player.ovr}</span>
              </div>
            </div>
            <div
              className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setLineup(prev => ({ ...prev, [pos]: null }));
              }}
            >
              <span className="text-white font-bold text-xs">REMOVE</span>
            </div>
          </div>
        ) : (
          <span className="text-xl font-black text-gray-500">{pos}</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header & Lineup Slots */}
      <div className="bg-gray-950 p-6 sticky top-0 z-30 shadow-2xl border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <h2 className="text-2xl font-black text-white tracking-wider uppercase">Build Your Lineup</h2>
            <div className="flex gap-4">
              {POSITIONS.map(renderSlot)}
            </div>
          </div>

          <button
            disabled={!isComplete}
            onClick={() => onComplete(lineup)}
            className={`px-8 py-4 rounded-xl font-black text-lg flex items-center gap-2 transition-all w-full md:w-auto justify-center ${
              isComplete
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 shadow-lg shadow-purple-500/30'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            CONFIRM LINEUP <ChevronRight />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-6xl mx-auto w-full p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
          {(['ALL', ...POSITIONS] as const).map(pos => (
            <button
              key={pos}
              onClick={() => setFilter(pos)}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${
                filter === pos ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Pool Grid */}
      <div className="max-w-6xl mx-auto w-full p-6 flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-20">
          {filteredPool.map(player => {
            const isSelected = lineupCardIds.has(player.id);
            return (
              <motion.div
                key={player.id}
                layoutId={`pool-${player.id}`}
                className="relative flex justify-center"
              >
                <div className="transform scale-[0.5] sm:scale-[0.6] md:scale-[0.7] lg:scale-[0.75] origin-top h-[320px] sm:h-[380px] md:h-[420px] lg:h-[460px]">
                  <Card
                    player={player}
                    isFlipped={true}
                    onClick={() => handleSelect(player)}
                    className={`hover:-translate-y-4 transition-transform shadow-lg ${
                      isSelected ? 'ring-4 ring-blue-500 scale-95 opacity-50' : ''
                    }`}
                  />
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-black px-2 py-1 rounded-full z-10 shadow-lg">
                    SELECTED
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        {filteredPool.length === 0 && (
          <div className="text-center text-gray-500 py-20 font-bold text-xl">
            No players found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
