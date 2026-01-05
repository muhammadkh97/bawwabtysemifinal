'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Users, Copy, CheckCircle, Gift, Star, Trophy, Share2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalEarned: number;
  referralBonus: number;
}

interface Referral {
  id: string;
  referred_name: string;
  referred_email: string;
  reward_points: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export default function ReferralPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarned: 0,
    referralBonus: 50,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    if (authUser) {
      loadData(authUser);
    } else {
      router.push('/login');
    }
  }, [authUser]);

  const loadData = async (currentUser: any) => {
    try {
      setUser(currentUser);
      setReferralCode(currentUser.referral_code || '');

      await Promise.all([
        fetchStats(currentUser.id),
        fetchReferrals(currentUser.id),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (userId: string) => {
    // جلب إعدادات النظام
    const { data: settings } = await supabase
      .from('loyalty_settings')
      .select('referral_bonus')
      .single();

    // جلب الإحالات
    const { data: referralsData } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    const total = referralsData?.length || 0;
    const pending = referralsData?.filter(r => r.status === 'pending').length || 0;
    const completed = referralsData?.filter(r => r.status === 'completed').length || 0;
    const earned = referralsData?.reduce((sum, r) => sum + (r.reward_points || 0), 0) || 0;

    setStats({
      totalReferrals: total,
      pendingReferrals: pending,
      completedReferrals: completed,
      totalEarned: earned,
      referralBonus: settings?.referral_bonus || 50,
    });
  };

  const fetchReferrals = async (userId: string) => {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        id,
        reward_points,
        status,
        created_at,
        completed_at,
        referred:referred_id (
          full_name,
          email
        )
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return;
    }

    const formattedReferrals = (data || []).map((r: any) => ({
      id: r.id,
      referred_name: r.referred?.full_name || r.referred?.[0]?.full_name || 'مستخدم جديد',
      referred_email: r.referred?.email || r.referred?.[0]?.email || '',
      reward_points: r.reward_points,
      status: r.status,
      created_at: r.created_at,
      completed_at: r.completed_at,
    }));

    setReferrals(formattedReferrals);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('تم نسخ رابط الدعوة!');
    setTimeout(() => setCopied(false), 3000);
  };

  const shareViaWhatsApp = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    const message = `انضم إلى بوابتي واحصل على ${stats.referralBonus} نقطة مجاناً! استخدم كود الإحالة: ${referralCode}\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0515' }}>
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0515' }}>
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">🎁</div>
          <h1 className="text-5xl font-bold mb-4"
            style={{
              background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
            ادعُ أصدقاءك واربح معاً
          </h1>
          <p className="text-purple-300 text-lg">
            احصل على {stats.referralBonus} نقطة لكل صديق تدعوه للتسجيل
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.2), rgba(182, 33, 254, 0.2))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 text-purple-400" />
              <div className="text-4xl font-bold text-white">{stats.totalReferrals}</div>
            </div>
            <div className="text-purple-300 font-medium">إجمالي الإحالات</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 193, 7, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-10 h-10 text-yellow-400" />
              <div className="text-4xl font-bold text-white">{stats.totalEarned}</div>
            </div>
            <div className="text-yellow-300 font-medium">النقاط المكتسبة</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(56, 142, 60, 0.2))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <div className="text-4xl font-bold text-white">{stats.completedReferrals}</div>
            </div>
            <div className="text-green-300 font-medium">إحالات مكتملة</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.2), rgba(244, 67, 54, 0.2))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 87, 34, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Gift className="w-10 h-10 text-orange-400" />
              <div className="text-4xl font-bold text-white">{stats.referralBonus}</div>
            </div>
            <div className="text-orange-300 font-medium">نقاط لكل إحالة</div>
          </motion.div>
        </div>

        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-8 mb-12"
          style={{
            background: 'rgba(15, 10, 30, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(98, 54, 255, 0.3)'
          }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Share2 className="w-7 h-7 text-purple-400" />
            رابط الدعوة الخاص بك
          </h2>

          <div className="space-y-4">
            {/* Referral Code */}
            <div>
              <label className="block text-purple-300 mb-2 font-medium">كود الإحالة</label>
              <div className="flex gap-3">
                <div className="flex-1 px-6 py-4 bg-white/5 border border-purple-500/30 rounded-2xl">
                  <code className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    {referralCode}
                  </code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    toast.success('تم نسخ الكود!');
                  }}
                  className="px-6 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="block text-purple-300 mb-2 font-medium">رابط الدعوة</label>
              <div className="flex gap-3">
                <div className="flex-1 px-6 py-4 bg-white/5 border border-purple-500/30 rounded-2xl">
                  <div className="text-white truncate" dir="ltr">
                    {window.location.origin}/register?ref={referralCode}
                  </div>
                </div>
                <button
                  onClick={copyReferralLink}
                  className={`px-6 py-4 rounded-2xl font-bold transition ${
                    copied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:scale-105'
                  }`}
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Share Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={shareViaWhatsApp}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-2xl font-bold hover:scale-105 transition flex items-center justify-center gap-3 text-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                مشاركة عبر واتساب
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-8 bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
            <h3 className="text-purple-300 font-bold mb-4 text-lg">كيف يعمل؟</h3>
            <ol className="space-y-3 text-purple-200">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <span>شارك رابط الدعوة أو كود الإحالة مع أصدقائك</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <span>عندما يسجل صديقك باستخدام رابطك، يحصل على {stats.referralBonus} نقطة مجاناً</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <span>تحصل أنت أيضاً على {stats.referralBonus} نقطة كمكافأة على الدعوة!</span>
              </li>
            </ol>
          </div>
        </motion.div>

        {/* Referrals List */}
        {referrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)'
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <UserPlus className="w-7 h-7 text-purple-400" />
              الأصدقاء الذين دعوتهم
            </h2>

            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-purple-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold">{referral.referred_name}</div>
                      <div className="text-purple-300 text-sm">{referral.referred_email}</div>
                      <div className="text-purple-400 text-xs mt-1">
                        {new Date(referral.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-green-400">+{referral.reward_points}</div>
                    <div className={`text-sm font-medium ${
                      referral.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {referral.status === 'completed' ? '✓ مكتمل' : '⏳ قيد الانتظار'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
