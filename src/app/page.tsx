'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Lineup, PackCard } from '@/lib/types';
import { BattleResult as BattleResultType } from '@/lib/battle-logic';
import { Play, Trophy, History, Share2, Pencil } from 'lucide-react';
import { getViewTopicUrl, getFeedbackUrl } from '@/lib/hupu-links';

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
  const [nicknameChanged, setNicknameChanged] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('nickname_changed') === '1') {
      setNicknameChanged(true);
    }
  }, []);

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
    const isChange = !!nickname;
    setNickname(nick);
    localStorage.setItem('nickname', nick);
    if (isChange) {
      setNicknameChanged(true);
      localStorage.setItem('nickname_changed', '1');
    }
    // If lineup already built (came back from failed upload), return to RESULT
    if (Object.values(finalLineup).some(Boolean)) {
      setPhase('RESULT');
      // Auto-retry upload with new nickname
      setTimeout(() => handleUpload(), 100);
    } else {
      setPhase('OPENING');
    }
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative z-10 flex flex-col items-center text-center p-6 animate-[fadeScale_0.5s_ease-out]">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 uppercase tracking-tighter mb-4 leading-none">
              <span className="block">NBA</span>
              <span className="block text-4xl md:text-6xl mt-1">最佳阵容对战</span>
            </h1>
            <p className="text-base md:text-2xl font-bold text-gray-300 uppercase tracking-wide md:tracking-widest mb-8 whitespace-nowrap">
              开包抽卡 &bull; 组建阵容 &bull; 统治赛场
            </p>

            <div className="flex flex-col items-center w-full max-w-[260px]">
              <button
                onClick={handleStartDraft}
                className="group relative w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-black text-lg uppercase tracking-wider overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <div className="flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 fill-current" />
                  开始抽卡
                </div>
              </button>

              {nickname ? (
                <button
                  onClick={() => setPhase('LINEUP_REVIEW')}
                  className="group relative w-full px-4 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-black text-base overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)] mt-3"
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <div className="flex items-center justify-center gap-3">
                    <Share2 className="w-5 h-5" />
                    与JRs分享我的阵容
                  </div>
                </button>
              ) : (
                <a
                  href={getViewTopicUrl()}
                  className="group relative w-full block px-4 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-black text-base overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)] mt-3 text-center"
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <span className="relative flex items-center justify-center gap-3">
                    <Share2 className="w-5 h-5" />
                    查看JRs分享的最佳阵容
                  </span>
                </a>
              )}
            </div>

            {playerCount > 0 && (
              <p className="text-sm md:text-base font-bold text-purple-300/80 mt-5">
                已有 <span className="text-yellow-400">{playerCount}</span> 位虎扑JRs组建阵容开战，你还不来？
              </p>
            )}

            {/* Quick access links */}
            <div className="flex justify-center gap-2 mt-4">
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
              {nickname && !nicknameChanged && (
                <button
                  onClick={() => setPhase('ENTER_NICKNAME')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-xs whitespace-nowrap transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  改昵称(仅一次)
                </button>
              )}
            </div>

            <a
              href={getFeedbackUrl()}
              className="mt-6 text-white/40 hover:text-white/60 text-[11px] font-bold transition-colors"
            >
              有建议？来虎扑帖子聊聊，<span className="text-blue-400/60 hover:text-blue-300 underline">点击此处反馈</span>
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
          <LineupResult lineup={finalLineup} onUpload={handleUpload} onRestart={handleRestart} />
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
