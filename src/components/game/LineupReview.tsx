'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lineup, STAT_LABELS } from '@/lib/types';
import { getPlayerId } from '@/lib/player-identity';
import { fetchMyLineup } from '@/lib/supabase-service';
import { calcLineupScore } from '@/lib/game-logic';
import Card from './Card';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import QRCode from 'qrcode';

interface Props {
  onBack: () => void;
}

const STAT_KEYS = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY'] as const;

const STAT_DISPLAY: Record<string, string> = {
  SHO: '投射',
  SLA: '突破',
  DEF: '防守',
  ATH: '运动',
  PLM: '组织',
  PHY: '对抗',
};

export default function LineupReview({ onBack }: Props) {
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const nickname = typeof window !== 'undefined' ? localStorage.getItem('nickname') || '' : '';
  const pageUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  useEffect(() => {
    const playerId = getPlayerId();
    fetchMyLineup(playerId)
      .then(data => { setLineup(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (pageUrl) {
      QRCode.toDataURL(pageUrl, { width: 120, margin: 1, color: { dark: '#ffffff', light: '#00000000' } })
        .then(url => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [pageUrl]);

  const totalOvr = lineup ? Math.round(Object.values(lineup).reduce((sum, p) => sum + (p?.ovr || 0), 0) / 5 * 100) / 100 : 0;
  const score = lineup ? calcLineupScore(lineup) : 0;

  const players = lineup ? Object.values(lineup).filter(Boolean) : [];

  const avgStats = useMemo(() => {
    if (players.length === 0) return [];
    return STAT_KEYS.map(key => {
      const sum = players.reduce((s, p) => s + (p ? p.stats[key] : 0), 0);
      return { subject: STAT_DISPLAY[key], A: Math.round(sum / 5 * 10) / 10, fullMark: 100 };
    });
  }, [players]);

  const allBadges = useMemo(() => {
    return Array.from(new Set(players.flatMap(p => p?.badges?.map((b: {name: string}) => b.name) || [] as string[])));
  }, [players]);

  const handleGenerateImage = async () => {
    if (!lineup || generating) return;
    setGenerating(true);
    try {
      const { generateLineupPoster } = await import('@/lib/screenshot');
      const dataUrl = await generateLineupPoster({
        nickname,
        lineup,
        score,
        qrDataUrl,
      });
      const link = document.createElement('a');
      link.download = `NBA_Lineup_${nickname || 'lineup'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert('生成图片失败，请截图保存');
    }
    setGenerating(false);
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
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          {lineup && (
            <button
              onClick={handleGenerateImage}
              disabled={generating}
              className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
            >
              <Share2 className="w-6 h-6" />
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
            {/* 截图区域 */}
            <div className="bg-gray-900 rounded-2xl py-8 px-6">
              <div className="text-center mb-8">
                <h1
                  className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tighter"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #facc15, #f97316, #ef4444)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  我的阵容
                </h1>
                {nickname && (
                  <p className="text-gray-400 font-bold text-lg mb-2">🏀 {nickname}</p>
                )}
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">战力</span>
                    <div className="bg-black text-white text-3xl font-black px-4 py-1 rounded-xl" style={{ border: '4px solid #a855f7' }}>
                      {score}
                    </div>
                  </div>
                </div>
              </div>

              {/* 球星卡钻石排列 */}
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

              {/* 雷达图 + 徽章 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">阵容属性</h3>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={avgStats}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="属性" dataKey="A" stroke="#3B82F6" strokeWidth={3} fill="#3B82F6" fillOpacity={0.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">激活徽章</h3>
                  <div className="flex flex-wrap gap-2">
                    {allBadges.slice(0, 8).map(b => (
                      <span key={b} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(30,58,138,0.5)', color: '#93c5fd', border: '1px solid rgba(29,78,216,0.5)' }}>
                        {b}
                      </span>
                    ))}
                    {allBadges.length === 0 && (
                      <span className="text-gray-600 text-sm">暂无徽章</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 底部 QR 码和水印 */}
              <div className="flex items-center justify-between mt-8 px-4">
                <div>
                  <p className="text-white font-black text-lg">NBA 最佳阵容对战</p>
                  <p className="text-gray-500 text-xs">虎扑JRS · 开包抽卡 · 组建阵容 · 统治赛场</p>
                </div>
                {qrDataUrl && (
                  <div className="flex flex-col items-center">
                    <img src={qrDataUrl} alt="QR Code" width={80} height={80} className="rounded" />
                    <p className="text-gray-500 text-[10px] mt-1">扫码参与</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
