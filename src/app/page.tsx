'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lineup, PackCard } from '@/lib/types';
import { calcLineupScore } from '@/lib/game-logic';
import { BattleResult as BattleResultType } from '@/lib/battle-logic';
import { getPlayerId } from '@/lib/player-identity';
import PackOpener from '@/components/game/PackOpener';
import DraftBoard from '@/components/game/DraftBoard';
import LineupResult from '@/components/game/LineupResult';
import Leaderboard from '@/components/game/Leaderboard';
import NicknameModal from '@/components/game/NicknameModal';
import BattleResult from '@/components/game/BattleResult';
import BattleHistory from '@/components/game/BattleHistory';
import { Play } from 'lucide-react';

type GamePhase = 'INTRO' | 'OPENING' | 'DRAFTING' | 'RESULT' | 'ENTER_NICKNAME' | 'BATTLE' | 'LEADERBOARD' | 'BATTLE_HISTORY';

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [packPool, setPackPool] = useState<PackCard[]>([]);
  const [finalLineup, setFinalLineup] = useState<Lineup>({ PG: null, SG: null, SF: null, PF: null, C: null });
  const [isLoading, setIsLoading] = useState(false);
  const [lineupId, setLineupId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [battleData, setBattleData] = useState<BattleResultType | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  const startOpening = () => {
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

  const handleUpload = () => {
    setPhase('ENTER_NICKNAME');
  };

  const handleNicknameSubmit = async (nick: string) => {
    setNickname(nick);
    setIsLoading(true);
    setLoadingMsg('Uploading lineup...');
    setPhase('RESULT');

    try {
      const playerId = getPlayerId();
      const score = calcLineupScore(finalLineup);
      const players = Object.values(finalLineup).filter(Boolean);
      const STAT_KEYS = ['SHO', 'SLA', 'DEF', 'ATH', 'PLM', 'PHY', 'REB', 'CLU'] as const;
      const avgStats: Record<string, number> = {};
      for (const key of STAT_KEYS) {
        avgStats[key] = Math.round(players.reduce((s, p) => s + (p!.stats[key]), 0) / players.length * 10) / 10;
      }

      // Upload lineup
      const uploadRes = await fetch('/api/battle/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          nickname: nick,
          pg: finalLineup.PG,
          sg: finalLineup.SG,
          sf: finalLineup.SF,
          pf: finalLineup.PF,
          c: finalLineup.C,
          score,
          avgStats,
        }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        alert(uploadData.error || 'Upload failed');
        setIsLoading(false);
        return;
      }

      setLineupId(uploadData.lineupId);

      // Matchmake
      setLoadingMsg('Finding opponent...');
      const matchRes = await fetch('/api/battle/matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupId: uploadData.lineupId, playerId }),
      });

      const matchData = await matchRes.json();
      setIsLoading(false);

      if (!matchRes.ok) {
        alert(matchData.error || 'Matchmaking failed');
        setPhase('LEADERBOARD');
        return;
      }

      setBattleData(matchData);
      setPhase('BATTLE');
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleBattleAgain = async () => {
    const playerId = getPlayerId();
    setIsLoading(true);
    setLoadingMsg('Finding new opponent...');
    setPhase('BATTLE');

    try {
      const matchRes = await fetch('/api/battle/matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupId, playerId }),
      });

      const matchData = await matchRes.json();
      setIsLoading(false);

      if (!matchRes.ok) {
        alert(matchData.error || 'Matchmaking failed');
        setPhase('LEADERBOARD');
        return;
      }

      setBattleData(matchData);
    } catch {
      setIsLoading(false);
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
              onClick={startOpening}
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

      {phase === 'ENTER_NICKNAME' && (
        <NicknameModal
          onSubmit={handleNicknameSubmit}
          onCancel={() => setPhase('RESULT')}
        />
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
        <BattleHistory
          onBack={() => setPhase('LEADERBOARD')}
        />
      )}
    </div>
  );
}
