'use client';

import { useState, useCallback, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Lineup, PackCard } from '@/lib/types';
import { BattleResult as BattleResultType } from '@/lib/battle-logic';
import { getPlayerId } from '@/lib/player-identity';
import { uploadLineup, matchmake } from '@/lib/supabase-service';
import PackOpener from '@/components/game/PackOpener';
import DraftBoard from '@/components/game/DraftBoard';
import LineupResult from '@/components/game/LineupResult';
import Leaderboard from '@/components/game/Leaderboard';
import NicknameModal from '@/components/game/NicknameModal';
import BattleResult from '@/components/game/BattleResult';
import BattleHistory from '@/components/game/BattleHistory';
import LineupReview from '@/components/game/LineupReview';
import { Play, Trophy, History, Users } from 'lucide-react';

type GamePhase = 'INTRO' | 'ENTER_NICKNAME' | 'OPENING' | 'DRAFTING' | 'RESULT' | 'BATTLE' | 'LEADERBOARD' | 'BATTLE_HISTORY' | 'LINEUP_REVIEW';

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [packPool, setPackPool] = useState<PackCard[]>([]);
  const [finalLineup, setFinalLineup] = useState<Lineup>({ PG: null, SG: null, SF: null, PF: null, C: null });
  const [isLoading, setIsLoading] = useState(false);
  const [lineupId, setLineupId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [battleData, setBattleData] = useState<BattleResultType | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [playCount, setPlayCount] = useState<number>(-1); // -1 = unknown

  useEffect(() => {
    const saved = localStorage.getItem('nickname');
    if (saved) setNickname(saved);
  }, []);

  useEffect(() => {
    if (!nickname) return;
    const playerId = getPlayerId();
    const checkCount = async () => {
      try {
        const sb = getSupabase();
        const { data } = await sb.from('player_stats').select('total_battles').eq('player_id', playerId).maybeSingle();
        setPlayCount(data?.total_battles ?? 0);
      } catch {
        // ignore
      }
    };
    checkCount();
  }, [nickname, phase]);

  const remaining = playCount === -1 ? -1 : 3 - playCount;
  const isExhausted = remaining === 0;

  const handleStartDraft = () => {
    if (isExhausted) {
      alert('你已用完 3 次游戏机会');
      return;
    }
    if (nickname) {
      setPhase('OPENING');
    } else {
      setPhase('ENTER_NICKNAME');
    }
  };

  const handleNicknameSubmit = (nick: string) => {
    setNickname(nick);
    localStorage.setItem('nickname', nick);
    setPhase('OPENING');
  };

  const handleOpeningComplete = useCallback((revealedCards: PackCard[]) => {
    setPackPool(revealedCards);
    setPhase('DRAFTING');
  }, []);

  const handleDraftComplete = useCallback((lineup: Lineup) => {
    setFinalLineup(lineup);
    setPhase('RESULT');
  }, []);

  const handleUpload = async () => {
    setIsLoading(true);
    setLoadingMsg('上传阵容中...');

    try {
      const playerId = getPlayerId();
      const { lineupId: lid } = await uploadLineup(playerId, nickname, finalLineup);
      setLineupId(lid);

      setLoadingMsg('匹配对手中...');
      const result = await matchmake(playerId, lid);
      setIsLoading(false);
      setBattleData(result);
      setPhase('BATTLE');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err: any) {
      setIsLoading(false);
      alert(err.message || '出错了，请重试');
    }
  };

  const handleBattleAgain = async () => {
    const playerId = getPlayerId();
    setIsLoading(true);
    setLoadingMsg('寻找新对手...');

    try {
      const result = await matchmake(playerId, lineupId);
      setIsLoading(false);
      setBattleData(result);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err: any) {
      setIsLoading(false);
      alert(err.message || '匹配失败');
      setPhase('LEADERBOARD');
    }
  };

  const handleRestart = () => {
    setPhase('INTRO');
    setPackPool([]);
    setFinalLineup({ PG: null, SG: null, SF: null, PF: null, C: null });
    setLineupId('');
    setBattleData(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {phase === 'INTRO' && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[url('/bg-court.jpg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center text-center p-6"
          >
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 uppercase tracking-tighter mb-4 leading-none">
              <span className="block">NBA</span>
              <span className="block text-4xl md:text-6xl mt-1">最佳阵容对战</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-gray-300 uppercase tracking-widest mb-12">
              开包抽卡 &bull; 组建阵容 &bull; 统治赛场
            </p>

            <button
              onClick={handleStartDraft}
              className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-black text-2xl uppercase tracking-wider overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(59,130,246,0.6)]"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <div className="flex items-center gap-3">
                <Play className="w-8 h-8 fill-current" />
                开始抽卡
              </div>
            </button>

            {nickname && remaining >= 0 && (
              <p className="text-gray-400 text-sm font-bold mt-4">
                剩余次数：{remaining}/3
              </p>
            )}

            {/* Quick access links */}
            {nickname && (
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <button
                  onClick={() => setPhase('LEADERBOARD')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors"
                >
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  排行榜
                </button>
                <button
                  onClick={() => setPhase('BATTLE_HISTORY')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors"
                >
                  <History className="w-4 h-4 text-blue-400" />
                  战绩
                </button>
                <button
                  onClick={() => setPhase('LINEUP_REVIEW')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors"
                >
                  <Users className="w-4 h-4 text-green-400" />
                  我的阵容
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {phase === 'ENTER_NICKNAME' && (
        <NicknameModal
          onSubmit={handleNicknameSubmit}
          onCancel={() => setPhase('INTRO')}
        />
      )}

      {phase === 'OPENING' && (
        <PackOpener onComplete={handleOpeningComplete} />
      )}

      {phase === 'DRAFTING' && (
        <DraftBoard pool={packPool} onComplete={handleDraftComplete} />
      )}

      {phase === 'RESULT' && (
        <div className="relative">
          <LineupResult lineup={finalLineup} onUpload={handleUpload} />
          {isLoading && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
              />
              <h2 className="text-2xl font-black text-blue-400 uppercase tracking-widest">{loadingMsg}</h2>
            </div>
          )}
        </div>
      )}

      {phase === 'BATTLE' && battleData && (
        <div className="relative">
          <BattleResult
            result={battleData}
            onRestart={handleRestart}
          />
          {isLoading && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
              />
              <h2 className="text-2xl font-black text-purple-400 uppercase tracking-widest">{loadingMsg}</h2>
            </div>
          )}
        </div>
      )}

      {phase === 'LEADERBOARD' && (
        <Leaderboard
          onRestart={handleRestart}
          onHistory={() => setPhase('BATTLE_HISTORY')}
        />
      )}

      {phase === 'BATTLE_HISTORY' && (
        <BattleHistory onBack={() => setPhase('INTRO')} />
      )}

      {phase === 'LINEUP_REVIEW' && (
        <LineupReview onBack={() => setPhase('INTRO')} />
      )}
    </div>
  );
}
