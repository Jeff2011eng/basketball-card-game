'use client';

import { useState, useCallback } from 'react';
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
import { Play } from 'lucide-react';

type GamePhase = 'INTRO' | 'ENTER_NICKNAME' | 'OPENING' | 'DRAFTING' | 'RESULT' | 'BATTLE' | 'LEADERBOARD' | 'BATTLE_HISTORY';

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [packPool, setPackPool] = useState<PackCard[]>([]);
  const [finalLineup, setFinalLineup] = useState<Lineup>({ PG: null, SG: null, SF: null, PF: null, C: null });
  const [isLoading, setIsLoading] = useState(false);
  const [lineupId, setLineupId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [battleData, setBattleData] = useState<BattleResultType | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  const handleStartDraft = () => {
    setPhase('ENTER_NICKNAME');
  };

  const handleNicknameSubmit = (nick: string) => {
    setNickname(nick);
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
    setNickname('');
    setBattleData(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {phase === 'INTRO' && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center text-center p-6"
          >
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 uppercase tracking-tighter mb-4 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              NBA DRAFT BATTLE
            </h1>
            <p className="text-xl md:text-2xl font-bold text-gray-300 uppercase tracking-widest mb-12">
              Open Packs &bull; Build Your Squad &bull; Rule The Board
            </p>

            <button
              onClick={handleStartDraft}
              className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-black text-2xl uppercase tracking-wider overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(59,130,246,0.6)]"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <div className="flex items-center gap-3">
                <Play className="w-8 h-8 fill-current" />
                START DRAFT
              </div>
            </button>
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
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
            onLeaderboard={() => setPhase('LEADERBOARD')}
            onBattleAgain={handleBattleAgain}
            onHistory={() => setPhase('BATTLE_HISTORY')}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
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
        <BattleHistory onBack={() => setPhase('LEADERBOARD')} />
      )}
    </div>
  );
}
