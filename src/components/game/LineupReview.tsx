'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lineup } from '@/lib/types';
import { getPlayerId } from '@/lib/player-identity';
import { fetchMyLineup } from '@/lib/supabase-service';
import { calcLineupScore } from '@/lib/game-logic';
import Card from './Card';
import { ArrowLeft, Users, Download } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function LineupReview({ onBack }: Props) {
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const nickname = typeof window !== 'undefined' ? localStorage.getItem('nickname') || '' : '';

  useEffect(() => {
    const playerId = getPlayerId();
    fetchMyLineup(playerId)
      .then(data => { setLineup(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalOvr = lineup ? Math.round(Object.values(lineup).reduce((sum, p) => sum + (p?.ovr || 0), 0) / 5 * 100) / 100 : 0;
  const score = lineup ? calcLineupScore(lineup) : 0;

  const handleSaveImage = async () => {
    if (!captureRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#111827',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `NBA_Draft_Battle_${nickname || 'lineup'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('保存失败，请截图保存');
    }
    setSaving(false);
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
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Users className="w-6 h-6 text-green-400" />
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">我的阵容</h1>
          </div>
          {lineup && (
            <button
              onClick={handleSaveImage}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              <Download className="w-4 h-4" />
              {saving ? '保存中...' : '保存图片'}
            </button>
          )}
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
          <>
            {/* Capturable area */}
            <div ref={captureRef} className="bg-gray-900 rounded-2xl py-8 px-6">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2 uppercase tracking-tighter">
                  我的阵容
                </h1>
                {nickname && (
                  <p className="text-gray-400 font-bold text-lg mb-2">🏀 {nickname}</p>
                )}
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">阵容评分</span>
                    <div className="bg-black text-white text-3xl font-black px-4 py-1 rounded-xl border-4 border-yellow-500">
                      {totalOvr}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">战力</span>
                    <div className="bg-black text-white text-3xl font-black px-4 py-1 rounded-xl border-4 border-purple-500">
                      {score}
                    </div>
                  </div>
                </div>
              </div>

              {/* PF SF / C / PG SG */}
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

              <p className="text-center text-gray-600 text-xs mt-8">NBA 选秀对战 · 虎扑JRS</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
