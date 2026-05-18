'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackCard } from '@/lib/types';
import { drawPacks } from '@/lib/game-logic';
import Card from './Card';
import { PackageOpen } from 'lucide-react';

const TOTAL_ROUNDS = 5;
const CARDS_PER_ROUND = 10;

interface Props {
  onComplete: (revealedCards: PackCard[]) => void;
}

export default function PackOpener({ onComplete }: Props) {
  const [allCards, setAllCards] = useState<PackCard[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flyingCards, setFlyingCards] = useState<number[]>([]);
  const [showRoundIntro, setShowRoundIntro] = useState(true);
  const [showRoundSummary, setShowRoundSummary] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/data/players.json');
        const data = await res.json();
        const players = data.players || data;
        if (!Array.isArray(players) || players.length < TOTAL_ROUNDS * CARDS_PER_ROUND) throw new Error('Not enough players');
        const drawn = drawPacks(players);
        setAllCards(drawn.slice(0, TOTAL_ROUNDS * CARDS_PER_ROUND));
      } catch {
        setAllCards([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (allCards.length > 0) {
      setShowRoundIntro(true);
      const timer = setTimeout(() => setShowRoundIntro(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentRound, allCards.length]);

  const roundCards = allCards.slice(
    currentRound * CARDS_PER_ROUND,
    (currentRound + 1) * CARDS_PER_ROUND
  );

  const finishRound = useCallback(() => {
    if (currentRound === TOTAL_ROUNDS - 1) {
      setTimeout(() => onComplete(allCards), 300);
    } else {
      setShowRoundSummary(true);
    }
  }, [currentRound, allCards, onComplete]);

  const handleNextRound = useCallback(() => {
    setShowRoundSummary(false);
    setCurrentRound(prev => prev + 1);
    setRoundIndex(0);
    setFlyingCards([]);
    setIsFlipped(false);
  }, []);

  const handleCardInteraction = useCallback(() => {
    if (showRoundIntro) return;
    if (!isFlipped) {
      setIsFlipped(true);
    } else {
      setFlyingCards(prev => [...prev, roundIndex]);
      setIsFlipped(false);

      if (roundIndex === roundCards.length - 1) {
        setTimeout(finishRound, 600);
      } else {
        setRoundIndex(prev => prev + 1);
      }
    }
  }, [isFlipped, roundIndex, roundCards, finishRound, showRoundIntro]);

  const handleDragEnd = useCallback((_e: any, info: any) => {
    if (showRoundIntro) return;
    if (info.offset.y < -80) {
      if (!isFlipped) {
        setIsFlipped(true);
      }
      setFlyingCards(prev => [...prev, roundIndex]);

      if (roundIndex === roundCards.length - 1) {
        setTimeout(finishRound, 600);
      } else {
        setRoundIndex(prev => prev + 1);
      }
    }
  }, [isFlipped, roundIndex, roundCards, finishRound, showRoundIntro]);

  const handleSkipRound = useCallback(() => {
    finishRound();
  }, [finishRound]);

  if (allCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="mt-4 text-white/50 font-bold">Loading...</span>
      </div>
    );
  }

  if (showRoundIntro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="text-center"
        >
          <div className="text-white/30 text-lg font-bold uppercase tracking-widest mb-2">Round</div>
          <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            {currentRound + 1}
          </div>
          <div className="text-white/40 text-sm font-bold uppercase tracking-widest mt-4">
            {CARDS_PER_ROUND} cards to reveal
          </div>
        </motion.div>
      </div>
    );
  }

  if (showRoundSummary) {
    return (
      <>
      <div className="min-h-screen bg-gray-900 pt-8 pb-24 px-4 flex flex-col items-center">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">
            Round {currentRound + 1} Complete
          </h2>
          <p className="text-white/50 font-bold uppercase tracking-widest text-sm">
            {currentRound + 1} of {TOTAL_ROUNDS} rounds done
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 w-full max-w-md mb-10">
          {roundCards.map((player, i) => (
            <div key={player.id} className="flex justify-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                className="w-[184px] h-[276px] overflow-hidden"
              >
                <div className="transform scale-[0.575] origin-top-left w-[320px] h-[480px]">
                  <Card player={player} isFlipped={true} />
                </div>
              </motion.div>
            </div>
          ))}
        </div>

      </div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={handleNextRound}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl px-10 py-4 rounded-xl uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30 z-30 whitespace-nowrap"
      >
        Next Round →
      </motion.button>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 overflow-hidden relative w-full">
      {/* Background decoration */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <PackageOpen size={400} className="text-white" />
      </div>

      {/* HUD */}
      <div className="absolute top-8 left-0 right-0 flex justify-between px-8 z-20">
        <div className="flex flex-col gap-2">
          <div className="text-white font-bold text-xl bg-black/50 px-4 py-2 rounded-lg backdrop-blur">
            Round {currentRound + 1} / {TOTAL_ROUNDS}
          </div>
          <div className="text-white/70 font-bold text-base bg-black/50 px-4 py-2 rounded-lg backdrop-blur">
            {roundCards.length - roundIndex} / {CARDS_PER_ROUND}
          </div>
        </div>
        <button
          onClick={handleSkipRound}
          className="text-white font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur transition-colors h-fit"
        >
          Skip Round
        </button>
      </div>

      {/* Round progress dots */}
      <div className="absolute top-32 flex gap-2 z-20">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentRound ? 'bg-green-400' : i === currentRound ? 'bg-blue-400 scale-125' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Card stack */}
      <div className="relative w-80 h-[480px] z-10 flex items-center justify-center">
        <AnimatePresence>
          {roundCards.map((player, index) => {
            if (index < roundIndex || index > roundIndex + 3) return null;

            const isTop = index === roundIndex;
            const isFlying = flyingCards.includes(index);
            const offset = index - roundIndex;

            return (
              <motion.div
                key={player.id}
                className="absolute"
                initial={isTop ? false : { y: -50, opacity: 0, scale: 0.8 }}
                animate={
                  isFlying
                    ? { y: -800, x: (index % 2 === 0 ? 300 : -300), rotate: (index % 2 === 0 ? 45 : -45), opacity: 0, scale: 0.5 }
                    : {
                        y: offset * 8,
                        scale: 1 - offset * 0.05,
                        opacity: 1,
                        zIndex: 100 - index,
                      }
                }
                transition={{
                  duration: isFlying ? 0.6 : 0.3,
                  type: isFlying ? 'tween' : 'spring',
                  ease: isFlying ? 'easeIn' : undefined,
                }}
                style={{ originX: 0.5, originY: 1 }}
              >
                <Card
                  player={player}
                  isFlipped={isTop ? isFlipped : false}
                  onClick={isTop ? handleCardInteraction : undefined}
                  drag={isTop}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  whileDrag={{ scale: 1.05 }}
                  className={isTop ? 'shadow-2xl' : 'shadow-none pointer-events-none'}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-12 text-white/50 text-sm font-medium flex flex-col items-center gap-2">
        {!isFlipped ? (
          <span>Tap to reveal · Swipe up to skip</span>
        ) : (
          <span>Tap again or swipe up to collect</span>
        )}
      </div>
    </div>
  );
}
