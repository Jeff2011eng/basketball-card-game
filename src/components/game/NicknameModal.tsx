'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onSubmit: (nickname: string) => void;
  onCancel: () => void;
}

export default function NicknameModal({ onSubmit, onCancel }: Props) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 32) {
      setError('Nickname must be 2-32 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_一-龥]+$/.test(trimmed)) {
      setError('Only letters, numbers, Chinese characters and underscores');
      return;
    }
    setError('');
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-screen bg-black/90 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl w-full max-w-md mx-4"
      >
        <h2 className="text-2xl font-black text-white uppercase tracking-wider text-center mb-2">
          Enter Your Name
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          This name will appear on the leaderboard
        </p>

        <input
          type="text"
          value={nickname}
          onChange={e => { setNickname(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Your nickname..."
          maxLength={32}
          className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
          autoFocus
        />

        {error && (
          <p className="text-red-400 text-sm mt-2 font-bold">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-black py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20"
          >
            BATTLE!
          </button>
        </div>
      </motion.div>
    </div>
  );
}
