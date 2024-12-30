// components/Referral.jsx
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Share2, AlertCircle, Users, Award } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const referralOptions = [
  { 
    title: 'Invite friend',
    reward: '100 Bear for you & Your Friend',
    premium: false,
    icon: '🐻',
    bgColor: 'from-blue-900 to-blue-800'
  },
  { 
    title: 'Invite with Telegram Premium',
    reward: '100 Bear for you & Your Friend',
    premium: true,
    icon: '🎯',
    bgColor: 'from-purple-900 to-purple-800'
  },
];

const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center gap-4"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full"
    />
    <motion.p
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="text-lg font-medium text-purple-300"
    >
      Loading referrals...
    </motion.p>
  </motion.div>
);

const ReferralStats = ({ totalReferrals, totalEarned }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="grid grid-cols-2 gap-4 mb-6"
  >
    <div className="bg-gradient-to-r from-[#2B0537] to-[#3B1547] rounded-xl p-4">
      <Users className="w-6 h-6 mb-2 text-purple-400" />
      <p className="text-sm text-gray-300">Total Referrals</p>
      <p className="text-xl font-bold">{totalReferrals}</p>
    </div>
    <div className="bg-gradient-to-r from-[#2B0537] to-[#3B1547] rounded-xl p-4">
      <Award className="w-6 h-6 mb-2 text-purple-400" />
      <p className="text-sm text-gray-300">Total Earned</p>
      <p className="text-xl font-bold">{totalEarned} 🐻</p>
    </div>
  </motion.div>
);

const ReferralCard = ({ referral }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-gradient-to-r from-[#2B0537] to-[#3B1547] rounded-xl p-4 mb-3"
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="font-medium">@{referral.username || 'Anonymous'}</p>
        <p className="text-sm text-gray-400">
          {new Date(referral.date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-lg font-bold">{referral.bonusAmount} 🐻</span>
        {referral.isPremium && (
          <span className="ml-2 px-2 py-1 bg-purple-700 rounded-full text-xs">
            Premium
          </span>
        )}
      </div>
    </div>
  
  </motion.div>
);

export default function IntegratedReferralScreen() {
  const [shareLoading, setShareLoading] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [coins, setCoins] = useState(0);
  const [telegramId, setTelegramId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const referralLink = 'http://t.me/Bear_Mining_bot/myapp';

  const formatCoins = (number) => {
    return Number(number).toFixed(1);
  };

  const initWebApp = useCallback(async () => {
    try {
      const WebAppInstance = await WebApp;
      if (WebAppInstance.initDataUnsafe && WebAppInstance.initDataUnsafe.user) {
        const user = WebAppInstance.initDataUnsafe.user;
        setTelegramId(user.id);
        setIsPremium(user.isPremium || false);
        await fetchUserData(user.id);
      }
    } catch (error) {
      setError('Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initWebApp();
  }, [initWebApp]);

  const fetchUserData = async (id) => {
    try {
      const response = await fetch(`/api/user/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const userData = await response.json();
      setCoins(userData.coins || 0);

      const referralsResponse = await fetch(`/api/referrals/${id}`);
      if (referralsResponse.ok) {
        const referralsData = await referralsResponse.json();
        setReferrals(referralsData.referrals || []);
      }
    } catch (error) {
      setError('Error fetching user data');
      console.error('Error fetching user data:', error);
    }
  };

  const handleShare = async (option) => {
    setShareLoading(true);
    try {
      const shareText = option.premium ? 
        `🎯 Join Bear App with Telegram Premium and get ${option.reward}!` : 
        `🐻 Join Bear App and get ${option.reward}!`;
      
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`${referralLink}?start=${telegramId}`)}&text=${encodeURIComponent(shareText)}`;
      window.open(shareUrl, '_blank');
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setTimeout(() => setShareLoading(false), 1000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010A43] to-[#2B0537]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010A43] to-[#2B0537]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-red-400 p-6"
        >
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-xl font-bold">{error}</p>
        </motion.div>
      </div>
    );
  }

  const totalEarned = referrals.reduce((sum, ref) => sum + ref.bonusAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010A43] to-[#2B0537] p-4 flex flex-col text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col flex-grow"
      >
        <div className="flex justify-between items-center mb-6">
          <motion.span 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-xl font-semibold"
          >
            Bear 🐻
          </motion.span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <MoreVertical className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold mb-1">Invite Friends! 👥</h1>
          <p className="text-sm text-gray-300 mb-6">Invite friends to earn more Bear.</p>
        </motion.div>

        <ReferralStats 
          totalReferrals={referrals.length} 
          totalEarned={totalEarned}
        />

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between bg-gradient-to-r from-[#2B0537] to-[#3B1547] rounded-xl p-6 mb-6 shadow-lg border border-[#FF0307]"
        >
          <span className="text-xl font-bold">Your Coins</span>
          <span className="text-2xl font-bold">{formatCoins(coins)} 🐻</span>
        </motion.div>

        <div className="space-y-4 mb-6">
          {referralOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`bg-gradient-to-r ${option.bgColor} rounded-xl p-6 relative ${
                option.premium && !isPremium ? 'opacity-50' : ''
              }`}
            >
              <h3 className="text-lg font-bold mb-2">{option.title}</h3>
              <p className="text-sm text-gray-300 mb-4">{option.reward}</p>
              <button
                onClick={() => handleShare(option)}
                disabled={option.premium && !isPremium || shareLoading}
                className={`flex items-center justify-center w-full py-2 px-4 bg-white/10 rounded-lg ${
                  (option.premium && !isPremium) || shareLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/20'
                }`}
              >
                {shareLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Share2 className="w-5 h-5 mr-2" />
                    Share Link
                  </>
                )}
              </button>
              {option.premium && !isPremium && (
                <div className="absolute top-2 right-2 bg-purple-600 text-xs px-2 py-1 rounded-full">
                  Premium Only
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Your Referrals</h2>
          {referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral, index) => (
                <ReferralCard key={index} referral={referral} />
              ))}
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 py-6"
            >
              No referrals yet. Start inviting friends!
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}