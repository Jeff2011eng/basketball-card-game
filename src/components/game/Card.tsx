'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Player, Rarity, STAT_LABELS } from '@/lib/types';
import { getRarity } from '@/lib/game-logic';

const NBA_HEADSHOT_URL = (pid: number) =>
  `https://cdn.nba.com/headshots/nba/latest/260x190/${pid}.png`;

const RARITY_COLORS: Record<Rarity, string> = {
  N: 'from-green-400 to-green-700 border-green-400 text-white',
  R: 'from-blue-400 to-blue-700 border-blue-500 text-white',
  SR: 'from-purple-500 to-purple-800 border-purple-400 text-white',
  SSR: 'from-yellow-400 to-orange-600 border-yellow-300 text-white',
  UR: 'from-pink-500 via-red-500 to-yellow-500 border-yellow-200 text-white animate-pulse',
};

const RARITY_SHINE: Record<Rarity, string> = {
  N: '',
  R: '',
  SR: 'after:absolute after:inset-0 after:bg-gradient-to-tr after:from-transparent after:via-white/20 after:to-transparent',
  SSR: 'after:absolute after:inset-0 after:bg-gradient-to-tr after:from-transparent after:via-white/40 after:to-transparent',
  UR: 'after:absolute after:inset-0 after:bg-gradient-to-tr after:from-transparent after:via-white/60 after:to-transparent after:animate-[shine_3s_infinite_linear]',
};

interface CardProps {
  player: Player;
  isFlipped?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  drag?: boolean | "x" | "y";
  dragConstraints?: any;
  onDragEnd?: (e: any, info: any) => void;
  whileDrag?: any;
}

const DISPLAY_STATS = ['SHO', 'SLA', 'DEF', 'ATH'] as const;

export default function Card({
  player,
  isFlipped = true,
  onClick,
  className = '',
  style,
  drag,
  dragConstraints,
  onDragEnd,
  whileDrag,
}: CardProps) {
  const [imgError, setImgError] = useState(false);
  const rarity = getRarity(player);
  const hasPhoto = player.pid && !imgError;

  return (
    <div
      className={`relative w-80 h-[480px] ${className}`}
      style={{ ...style, perspective: 1000 }}
      onClick={onClick}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        drag={drag}
        dragConstraints={dragConstraints}
        onDragEnd={onDragEnd}
        whileDrag={whileDrag}
        initial={false}
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 rounded-xl border-4 shadow-xl overflow-hidden bg-gradient-to-br flex flex-col ${RARITY_COLORS[rarity]} ${RARITY_SHINE[rarity]}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start p-3 z-10">
            <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm rounded-lg p-2 min-w-16 border border-white/20">
              <span className="text-3xl font-black leading-none">{player.ovr}</span>
              <span className="text-sm font-bold">{player.position}</span>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-2 border border-white/20">
              <span className="text-sm font-black">{player.team}</span>
            </div>
          </div>

          {/* Image */}
          <div className="absolute inset-0 top-12 bottom-32 flex items-center justify-center">
            {hasPhoto ? (
              <img
                src={NBA_HEADSHOT_URL(player.pid!)}
                alt={player.name_en}
                className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <span className="font-black text-white/40 text-6xl" style={{ fontFamily: 'Arial Black, Impact, sans-serif', lineHeight: 1 }}>
                  {player.jersey_number}
                </span>
              </div>
            )}
          </div>

          {/* Content Bottom */}
          <div className="mt-auto bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 pt-12 z-10 text-white">
            <h3 className="text-xl font-black uppercase tracking-wider mb-1 truncate">
              {player.name_en}
            </h3>

            <div className="grid grid-cols-4 gap-1 text-xs font-bold text-center">
              {DISPLAY_STATS.map(key => (
                <div key={key} className="bg-white/10 rounded p-1">
                  <div className="text-white/60">{key}</div>
                  {player.stats[key]}
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-1 justify-center">
              {rarity === 'UR' && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">UR</span>}
              {rarity === 'SSR' && <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">SSR</span>}
              {rarity === 'SR' && <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded font-bold">SR</span>}
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border-4 border-gray-600 bg-gradient-to-br from-gray-800 to-black shadow-xl flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="w-24 h-24 border-4 border-gray-600 rounded-full flex items-center justify-center rotate-45">
            <div className="w-16 h-16 border-2 border-gray-500 rounded-full flex items-center justify-center -rotate-45">
              <span className="text-gray-500 font-black text-2xl">NBA</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
