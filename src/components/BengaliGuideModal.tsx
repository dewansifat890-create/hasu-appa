import React from 'react';
import { X, CheckCircle2, HelpCircle, Sparkles, Image as ImageIcon, ShieldCheck } from 'lucide-react';

interface BengaliGuideModalProps {
  onClose: () => void;
  onOpenShop: () => void;
}

export const BengaliGuideModal: React.FC<BengaliGuideModalProps> = ({ onClose, onOpenShop }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
              🇧🇩
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">গেম ব্যবহারের নির্দেশাবলী (Hasu Appa)</h2>
              <p className="text-xs text-amber-400 font-bold">ধাপ-বাই-ধাপ বাংলায় গেমটি চালনার নিয়ম</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-slate-200">
          {/* Step 1 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-lg flex items-center justify-center shrink-0">
              ১
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> নতুন কার্টুন ক্যারেক্টার এবং ইমেজ URL যুক্ত করা
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার পছন্দের যে কোনো কার্টুন চরিত্র বা এনিমেশন ইমেজ গেমটিতে যুক্ত করতে পারবেন:
              </p>
              <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 pt-1">
                <li>গেমের শপ (Character Shop) এ যান।</li>
                <li><strong>"ADD CUSTOM IMAGE URL"</strong> বাটনে ক্লিক করুন।</li>
                <li>আপনার ছবির সঠিক সরাসরি লিংক (PNG, GIF, WebP) ও একটি নাম বসিয়ে <strong>Save Character</strong> দিন।</li>
                <li>সাথে সাথে সেই ক্যারেক্টারটি গেমের রানার ও পাজল উভয় মোডেই খেলার জন্য যুক্ত হয়ে যাবে!</li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-lg flex items-center justify-center shrink-0">
              ২
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> কয়েন (Coins) এবং Game ID সেভ রাখা
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার সংগৃহীত সমস্ত পয়েন্ট এবং আনলক করা ক্যারেক্টার আপনার গেম আইডিতে (Game ID) স্বয়ংক্রিয়ভাবে সেভ থাকে:
              </p>
              <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 pt-1">
                <li>হোমপেজের শীর্ষে থাকা <strong>Game ID (যেমন: HASU-89210)</strong> লিখে বা কপি করে রাখুন।</li>
                <li>পরবর্তীতে যে কোনো নতুন মোবাইল বা ব্রাউজার থেকে লগইন করার সময় উক্ত Game ID টি বসিয়ে দিলেই আপনার সমস্ত পয়েন্ট ও কার্টুন ক্যারেক্টার ফিরে আসবে!</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center shrink-0">
              ৩
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> গেম মোড ও কন্ট্রোল (Controls)
              </h3>
              <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                <li><strong>Runner Mode:</strong> বাধা ডিঙ্গাতে Space/Up Arrow বা স্ক্রিনে Tap করুন; নিচু বাধা এড়াতে Down Arrow/Slide দিন।</li>
                <li><strong>Adventure Puzzle:</strong> Arrow Keys/D-pad চেপে ক্যারেক্টার চালান, লিভার অন করুন এবং পাজল সমাধান করে পয়েন্ট জিতুন।</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenShop();
            }}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> শপে যান এবং ক্যারেক্টার দেখুন
          </button>
          <button
            onClick={onClose}
            className="py-3 px-6 bg-slate-800 text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-700 transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
