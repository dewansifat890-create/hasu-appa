import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface NoticeModalProps {
  onClose: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] p-5 sm:p-7 space-y-5 overflow-hidden my-auto max-h-[90vh] overflow-y-auto text-left"
      >
        {/* Decorative Top Amber Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
              📜
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                বিশেষ নোটিশ ও দাবিত্যাগ
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                  Disclaimer
                </span>
              </h2>
              <p className="text-xs text-amber-300/90 font-medium">খেলোয়াড় ও দর্শকদের জ্ঞাতার্থে প্রয়োজনীয় বার্তা</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800/80 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Core Notice Points */}
        <div className="space-y-3.5 text-slate-200 text-sm">
          {/* Card 1: Fun & Parody Only */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-black text-base flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
              🎮
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-amber-300">
                ১. শুধুই আনন্দ ও মজার উদ্দেশ্যে তৈরি (100% Fun & Parody)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                এই গেমটি সম্পূর্ণ বিনোদন, স্যাটায়ার এবং হাসিখুশি নির্মল মজার (Fun & Entertainment) উদ্দেশ্যে তৈরি করা একটি সাধারণ মোবাইল ক্যাজুয়াল গেম। গেমটির একমাত্র লক্ষ্য প্লেয়ারদের কিছু আনন্দদায়ক মুহূর্ত উপহার দেওয়া।
              </p>
            </div>
          </div>

          {/* Card 2: Neutral & Non-Political */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 font-black text-base flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
              🕊️
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-blue-300">
                ২. কোনো রাজনীতি বা রাজনৈতিক পক্ষপাতিত্ব নয়
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                এখানে কোনো রাজনৈতিক দল, মতাদর্শ বা বাস্তব জীবনের কোনো রাজনৈতিক ব্যক্তিত্বের প্রতি বিদ্বেষ, আক্রমণ, মানহানি বা কোনো রাজনৈতিক উদ্দেশ্য নেই। গেমের ক্যারেক্টার ও থিম শুধুই কাল্পনিক প্যারোডি আর্ট।
              </p>
            </div>
          </div>

          {/* Card 3: Non-Political Developer */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
              👨‍💻
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-emerald-300">
                ৩. ডেভেলপার সম্পূর্ণ অরাজনৈতিক ব্যক্তি
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                গেমটির ডেভেলপার সম্পূর্ণ নিরপেক্ষ ও অরাজনৈতিক। কোনো রাজনৈতিক দল, সংগঠন বা প্রচারণার সাথে ডেভেলপারের কোনো ধরণের সংশ্লিষ্টতা নেই।
              </p>
            </div>
          </div>

          {/* Card 4: Friendly Request to Players */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 font-black text-base flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/30">
              🤝
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-purple-300">
                ৪. অনুরোধ: ব্যক্তিগত বা রাজনৈতিকভাবে নেবেন না
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                গেমটিকে শুধুমাত্র একটি মজার খেলা হিসেবে গ্রহণ করার জন্য বিনীত অনুরোধ করা হচ্ছে। অনুগ্রহ করে এটিকে ব্যক্তিগত বা রাজনৈতিক দৃষ্টিকোণ থেকে নেবেন না এবং শুধুই আনন্দের জন্য উপভোগ করুন।
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>আমি বুঝতে পেরেছি (Play Game)</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
