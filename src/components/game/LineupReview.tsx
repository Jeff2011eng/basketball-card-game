'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lineup } from '@/lib/types';
import { getPlayerId } from '@/lib/player-identity';
import { fetchMyLineup } from '@/lib/supabase-service';
import Card from './Card';
import { ArrowLeft, Users } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function LineupReview({ onBack }: Props) {
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playerId = getPlayerId();
    fetchMyLineup(playerId)
      .then(data => { setLineup(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const SCALE = 0.45;
  const CW = 320 * SCALE;
  const CH = 480 * SCALE;
  const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

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
        <div className="text-center mt-1">
          <span className="text-gray-400 font-black text-xs uppercase tracking-wider">{pos}</span>
          <div className="text-white font-bold text-sm">{p.name_en}</div>
          <div className="text-yellow-400 font-black text-sm">{p.ovr}</div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Users className="w-6 h-6 text-green-400" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">我的阵容</h1>
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
          <div className="flex flex-col items-center gap-4">
            {/* PF SF */}
            <div className="flex justify-center gap-4">
              {renderCard('PF', 0)}
              {renderCard('SF', 0.05)}
            </div>
            {/* C */}
            <div className="flex justify-center gap-4">
              {renderCard('C', 0.1)}
            </div>
            {/* PG SG */}
            <div className="flex justify-center gap-4">
              {renderCard('PG', 0.15)}
              {renderCard('SG', 0.2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
