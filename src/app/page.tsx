'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Lineup, PackCard } from '@/lib/types';
import { BattleResult as BattleResultType } from '@/lib/battle-logic';
import { Play, Trophy, History, Share2 } from 'lucide-react';

import PackOpener from '@/components/game/PackOpener';
import DraftBoard from '@/components/game/DraftBoard';
import LineupResult from '@/components/game/LineupResult';
import NicknameModal from '@/components/game/NicknameModal';
import BattleResult from '@/components/game/BattleResult';

const Leaderboard = dynamic(() => import('@/components/game/Leaderboard'));
const BattleHistory = dynamic(() => import('@/components/game/BattleHistory'));
const LineupReview = dynamic(() => import('@/components/game/LineupReview'));

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
  const [playerCount, setPlayerCount] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const sb = getSupabase();
        const { count } = await sb.from('player_stats').select('*', { count: 'exact', head: true }).gt('total_battles', 0);
        if (count) setPlayerCount(count);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nickname');
    if (saved) setNickname(saved);
  }, []);

  const handleStartDraft = () => {
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
      const { getPlayerId } = await import('@/lib/player-identity');
      const { uploadLineup, matchmake } = await import('@/lib/supabase-service');
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
      if (err.message === '该昵称已被使用') {
        setPhase('ENTER_NICKNAME');
      } else {
        alert(err.message || '出错了，请重试');
      }
    }
  };

  const handleBattleAgain = async () => {
    setIsLoading(true);
    setLoadingMsg('寻找新对手...');

    try {
      const { getPlayerId } = await import('@/lib/player-identity');
      const { matchmake } = await import('@/lib/supabase-service');
      const playerId = getPlayerId();
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
        <div
          className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: "url('/bg-court.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          <div className="relative z-10 flex flex-col items-center text-center p-6 animate-[fadeScale_0.5s_ease-out]">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 uppercase tracking-tighter mb-4 leading-none">
              <span className="block">NBA</span>
              <span className="block text-4xl md:text-6xl mt-1">最佳阵容对战</span>
            </h1>
            <p className="text-base md:text-2xl font-bold text-gray-300 uppercase tracking-wide md:tracking-widest mb-12 whitespace-nowrap">
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

            {nickname && (
              <button
                onClick={() => setPhase('LINEUP_REVIEW')}
                className="group relative px-10 py-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full font-black text-lg whitespace-nowrap overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(34,197,94,0.4)] mt-4"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <div className="flex items-center gap-3">
                  <Share2 className="w-8 h-8" />
                  去虎扑分享我的阵容
                </div>
              </button>
            )}

            {playerCount > 0 && (
              <p className="text-sm md:text-base font-bold text-purple-300/80 mt-5">
                已有 <span className="text-yellow-400">{playerCount}</span> 位虎扑JRs组建阵容下场开战，你还不来？
              </p>
            )}

            {/* Quick access links */}
            {nickname && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPhase('LEADERBOARD')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-xs whitespace-nowrap transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  虎扑JRs排行榜
                </button>
                <button
                  onClick={() => setPhase('BATTLE_HISTORY')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-xs whitespace-nowrap transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  我的战绩
                </button>
              </div>
            )}

            <a
              href="huputiyu://bbs/topic/639570451"
              className="mt-10 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 hover:border-white/40 text-white/70 hover:text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
            >
              有建议？来虎扑帖子聊聊，<span className="text-blue-400 hover:text-blue-300 underline">点击此处反馈</span>
            </a>
          </div>
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
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-4 animate-spin" />
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
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-4 animate-spin" />
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
