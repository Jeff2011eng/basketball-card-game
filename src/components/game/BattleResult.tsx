'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BattleResult as BattleResultType } from '@/lib/battle-logic';
import { STAT_LABELS } from '@/lib/types';
import { Trophy, Swords, RotateCcw, MessageSquarePlus } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Card from './Card';

interface Props {
  result: BattleResultType;
  onRestart: () => void;
}

export default function BattleResult({ result, onRestart }: Props) {
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

  const SCALE = 0.25;
  const CW = 320 * SCALE;
  const CH = 480 * SCALE;

  const [toast, setToast] = useState('');
  const [showScreenshotConfirm, setShowScreenshotConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const shareText = (() => {
    const resultText = isWin ? '胜利' : isDraw ? '平局' : '惜败';
    return `我在【AI广场】-【NBA最佳阵容对战】#NBA梦幻1阵# 我在NBA最佳阵容对战中${resultText}了！我方 ${result.challengerScore} vs ${result.defenderScore} 对方。快来抽卡组队挑战我！`;
  })();

  const HUPU_POST_URL = 'huputiyu://bbs/postImg?tagName=NBA梦幻1阵&tagId=37312&topicName=湿乎乎的话题&topicId=177';

  const handleShareClick = () => {
    setShowScreenshotConfirm(true);
  };

  const handleConfirmScreenshot = async () => {
    setShowScreenshotConfirm(false);
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {}
    window.location.href = HUPU_POST_URL;
  };

  const handleViewTopic = () => {
    window.location.href = 'huputiyu://bbs/topicTag?tagId=37312';
  };

  return (
    <>
      {showScreenshotConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-600 text-center">
            <div className="text-4xl mb-3">📸</div>
            <h3 className="text-xl font-black text-white mb-2">先截图再发帖</h3>
            <p className="text-gray-400 text-sm mb-6">请先截图保存你的战绩，发帖时可以附上截图噢！</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmScreenshot}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-lg py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                已截图，去发帖
              </button>
              <button
                onClick={() => setShowScreenshotConfirm(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white/70 font-bold py-3 rounded-xl transition-colors"
              >
                未截图，现在去
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg z-[100] border border-gray-600 animate-[fadeScale_0.3s_ease-out]">
          {toast}
        </div>
      )}
      <div className="min-h-screen bg-gray-900 py-8 pb-32 px-4">
        {/* 胜负公告 */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center mb-8"
        >
          {isWin ? (
            <>
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ color: '#facc15' }}>
                胜利!
              </h1>
            </>
          ) : isDraw ? (
            <>
              <Swords className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <h1 className="text-4xl md:text-5xl font-black text-gray-300 uppercase tracking-tighter">
                平局
              </h1>
            </>
          ) : (
            <>
              <Swords className="w-16 h-16 text-red-400 mx-auto mb-3" />
              <h1 className="text-4xl md:text-5xl font-black text-red-400 uppercase tracking-tighter">
                失败
              </h1>
            </>
          )}
        </motion.div>

        {/* 分数对比 */}
        <div className="flex items-center justify-center gap-6 mb-10">
          <div className="text-center">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">我方</div>
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
            <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">对方</div>
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

        {/* 位置对位 */}
        <div className="max-w-2xl mx-auto mb-10">
          <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 text-center">位置对位</h3>
          <div className="flex flex-col gap-3">
            {result.positionMatchups.map((m, i) => (
              <motion.div
                key={m.position}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`bg-gray-800 rounded-xl p-3 border ${
                  m.winner === 'challenger' ? 'border-blue-500/50' : m.winner === 'defender' ? 'border-red-500/50' : 'border-gray-700'
                }`}
              >
                <div className="text-center mb-2">
                  <span className="text-gray-400 font-black text-xs uppercase tracking-wider">{m.position}</span>
                  <span className={`ml-2 font-black text-sm ${
                    m.winner === 'challenger' ? 'text-blue-400' : m.winner === 'defender' ? 'text-red-400' : 'text-gray-500'
                  }`}>
                    {m.winner === 'challenger' ? '我方胜' : m.winner === 'defender' ? '对方胜' : '平局'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col items-center flex-1">
                    <div className="overflow-hidden" style={{ width: CW, height: CH }}>
                      <div className="origin-top-left" style={{ transform: `scale(${SCALE})`, width: 320, height: 480 }}>
                        <Card player={m.challenger} isFlipped={true} />
                      </div>
                    </div>
                    <div className="text-center mt-1">
                      <div className="text-white font-bold text-xs truncate max-w-[80px]">{m.challenger.name_en}</div>
                      <div className="text-blue-300 font-black text-xs">{m.challengerScore}</div>
                    </div>
                  </div>

                  <div className="text-gray-600 font-black text-lg self-center">VS</div>

                  <div className="flex flex-col items-center flex-1">
                    <div className="overflow-hidden" style={{ width: CW, height: CH }}>
                      <div className="origin-top-left" style={{ transform: `scale(${SCALE})`, width: 320, height: 480 }}>
                        <Card player={m.defender} isFlipped={true} />
                      </div>
                    </div>
                    <div className="text-center mt-1">
                      <div className="text-white font-bold text-xs truncate max-w-[80px]">{m.defender.name_en}</div>
                      <div className="text-red-300 font-black text-xs">{m.defenderScore}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 雷达图对比 */}
        <div className="max-w-xl mx-auto mb-10 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 text-center">属性对比</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="我方" dataKey="challenger" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.3} />
                <Radar name="对方" dataKey="defender" stroke="#EF4444" strokeWidth={2} fill="#EF4444" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-sm text-gray-400 font-bold">我方</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm text-gray-400 font-bold">对方</span></div>
          </div>
        </div>

      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 z-30">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <button
            onClick={handleShareClick}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-lg py-3 rounded-xl uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          >
            <MessageSquarePlus className="w-5 h-5" />
            找JRs评评理
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleViewTopic}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              看看其他JRs的对战结果
            </button>
            <button
              onClick={onRestart}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              重新抽卡
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
