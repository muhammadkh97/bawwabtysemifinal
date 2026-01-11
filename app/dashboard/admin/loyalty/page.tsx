'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Trophy, Users, Gift, TrendingUp, Settings, DollarSign, Award, Star, Zap, UserPlus, ShoppingCart, Calendar, Eye, Edit2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface LoyaltySettings {
  signup_bonus: number;
  referral_bonus: number;
  points_per_sar: number;
  points_to_sar_rate: number;
  min_points_redeem: number;
  is_active: boolean;
}

interface UserStats {
  id: string;
  full_name: string;
  email: string;
  current_points: number;
  total_earned_points: number;
  referral_code: string;
  total_referrals: number;
  points_from_purchases: number;
  points_from_referrals: number;
  points_from_signup: number;
  member_since: string;
}

interface Transaction {
  id: string;
  user_id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export default function AdminLoyaltyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    totalReferrals: 0,
    avgPointsPerUser: 0,
  });
  const [topUsers, setTopUsers] = useState<UserStats[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSettings(),
        fetchStats(),
        fetchTopUsers(),
        fetchRecentTransactions(),
      ]);
    } catch (error) {
      logger.error('Error fetching data', { error, context: 'AdminLoyaltyPage.fetchData' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('loyalty_settings')
      .select('*')
      .single();

    if (error) {
      logger.error('Error fetching settings', { error, context: 'AdminLoyaltyPage.fetchSettings' });
      return;
    }

    setSettings(data);
  };

  const fetchStats = async () => {
    // إجمالي المستخدمين
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // إجمالي النقاط
    const { data: pointsData } = await supabase
      .from('users')
      .select('loyalty_points, total_earned_points')
      .eq('role', 'customer');

    // إجمالي الإحالات
    const { count: referralsCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true });

    const totalPoints = pointsData?.reduce((sum, u) => sum + (u.loyalty_points || 0), 0) || 0;
    const avgPoints = usersCount ? Math.round(totalPoints / usersCount) : 0;

    setStats({
      totalUsers: usersCount || 0,
      totalPoints,
      totalReferrals: referralsCount || 0,
      avgPointsPerUser: avgPoints,
    });
  };

  const fetchTopUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, loyalty_points, total_earned_points, referral_code, created_at')
      .eq('role', 'customer')
      .order('loyalty_points', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Error fetching top users', { error, context: 'AdminLoyaltyPage.fetchTopUsers' });
      return;
    }

    // حساب الإحصائيات لكل مستخدم
    const usersWithStats = await Promise.all(
      (data || []).map(async (user) => {
        const { count: referralsCount } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_id', user.id);

        const { data: transactions } = await supabase
          .from('loyalty_transactions')
          .select('points, type')
          .eq('user_id', user.id);

        const pointsFromPurchases = transactions?.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.points, 0) || 0;
        const pointsFromReferrals = transactions?.filter(t => t.type === 'referral').reduce((sum, t) => sum + t.points, 0) || 0;
        const pointsFromSignup = transactions?.filter(t => t.type === 'signup').reduce((sum, t) => sum + t.points, 0) || 0;

        return {
          ...user,
          current_points: user.loyalty_points,
          total_referrals: referralsCount || 0,
          points_from_purchases: pointsFromPurchases,
          points_from_referrals: pointsFromReferrals,
          points_from_signup: pointsFromSignup,
          member_since: user.created_at,
        };
      })
    );

    setTopUsers(usersWithStats);
  };

  const fetchRecentTransactions = async () => {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select(`
        *,
        users:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('Error fetching transactions', { error, context: 'AdminLoyaltyPage.fetchRecentTransactions' });
      return;
    }

    setRecentTransactions(data || []);
  };

  const updateSettings = async () => {
    if (!settings) return;

    try {
      const { data: existingSettings } = await supabase
        .from('loyalty_settings')
        .select('id')
        .limit(1)
        .single();

      if (!existingSettings) {
        toast.error('الإعدادات غير موجودة');
        return;
      }

      const { error } = await supabase
        .from('loyalty_settings')
        .update(settings)
        .eq('id', existingSettings.id);

      if (error) throw error;

      toast.success('تم تحديث الإعدادات بنجاح');
      setEditingSettings(false);
    } catch (error: any) {
      logger.error('Error updating settings', { error, context: 'AdminLoyaltyPage.updateSettings' });
      toast.error('فشل تحديث الإعدادات');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'signup': return <UserPlus className="w-4 h-4" />;
      case 'referral': return <Users className="w-4 h-4" />;
      case 'purchase': return <ShoppingCart className="w-4 h-4" />;
      case 'redeem': return <Gift className="w-4 h-4" />;
      case 'admin_adjustment': return <Settings className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'signup': return 'text-green-400 bg-green-500/20';
      case 'referral': return 'text-blue-400 bg-blue-500/20';
      case 'purchase': return 'text-purple-400 bg-purple-500/20';
      case 'redeem': return 'text-orange-400 bg-orange-500/20';
      case 'admin_adjustment': return 'text-pink-400 bg-pink-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      signup: 'تسجيل',
      referral: 'إحالة',
      purchase: 'شراء',
      redeem: 'استبدال',
      admin_adjustment: 'تعديل إداري',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="admin" />
      
      <div className="mr-64">
        <FuturisticNavbar />
        
        <main className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              نظام نقاط الولاء
            </h1>
            <p className="text-purple-300">إدارة نقاط الولاء والمكافآت للعملاء</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: Eye },
              { id: 'users', label: 'أفضل المستخدمين', icon: Users },
              { id: 'transactions', label: 'المعاملات', icon: TrendingUp },
              { id: 'settings', label: 'الإعدادات', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg scale-105'
                    : 'bg-white/5 text-purple-300 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                  </div>
                  <div className="text-purple-300 font-medium">إجمالي المستخدمين</div>
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
                    <Award className="w-10 h-10 text-yellow-400" />
                    <div className="text-3xl font-bold text-white">{stats.totalPoints.toLocaleString()}</div>
                  </div>
                  <div className="text-yellow-300 font-medium">إجمالي النقاط</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-3xl p-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(3, 169, 244, 0.2))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(33, 150, 243, 0.3)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <UserPlus className="w-10 h-10 text-blue-400" />
                    <div className="text-3xl font-bold text-white">{stats.totalReferrals}</div>
                  </div>
                  <div className="text-blue-300 font-medium">إجمالي الإحالات</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-3xl p-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(56, 142, 60, 0.2))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-10 h-10 text-green-400" />
                    <div className="text-3xl font-bold text-white">{stats.avgPointsPerUser}</div>
                  </div>
                  <div className="text-green-300 font-medium">متوسط النقاط لكل مستخدم</div>
                </motion.div>
              </div>

              {/* Current Settings Overview */}
              {settings && (
                <div className="rounded-3xl p-8"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)'
                  }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Settings className="w-7 h-7 text-purple-400" />
                    إعدادات النقاط الحالية
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 rounded-2xl p-5">
                      <div className="text-purple-300 text-sm mb-2">مكافأة التسجيل</div>
                      <div className="text-3xl font-bold text-white">{settings.signup_bonus}</div>
                      <div className="text-purple-400 text-xs mt-1">نقطة</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-5">
                      <div className="text-purple-300 text-sm mb-2">مكافأة الإحالة</div>
                      <div className="text-3xl font-bold text-white">{settings.referral_bonus}</div>
                      <div className="text-purple-400 text-xs mt-1">نقطة</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-5">
                      <div className="text-purple-300 text-sm mb-2">نقاط لكل ريال</div>
                      <div className="text-3xl font-bold text-white">{settings.points_per_sar}</div>
                      <div className="text-purple-400 text-xs mt-1">نقطة/ريال</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)'
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-500/30">
                      <th className="text-right p-4 text-purple-300 font-semibold">المستخدم</th>
                      <th className="text-center p-4 text-purple-300 font-semibold">النقاط الحالية</th>
                      <th className="text-center p-4 text-purple-300 font-semibold">إجمالي المكتسب</th>
                      <th className="text-center p-4 text-purple-300 font-semibold">الإحالات</th>
                      <th className="text-center p-4 text-purple-300 font-semibold">كود الإحالة</th>
                      <th className="text-center p-4 text-purple-300 font-semibold">تاريخ الانضمام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map((user, index) => (
                      <tr key={user.id} className="border-b border-purple-500/10 hover:bg-white/5 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-orange-600 text-white' :
                              'bg-purple-500/30 text-purple-300'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{user.full_name}</div>
                              <div className="text-purple-300 text-sm">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                            {user.current_points}
                          </div>
                        </td>
                        <td className="p-4 text-center text-white font-semibold">
                          {user.total_earned_points}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                            {user.total_referrals}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <code className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-mono">
                            {user.referral_code}
                          </code>
                        </td>
                        <td className="p-4 text-center text-purple-300 text-sm">
                          {new Date(user.member_since).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${getTypeColor(transaction.type)}`}>
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{transaction.user?.full_name}</div>
                        <div className="text-purple-300 text-sm">{transaction.description}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`text-2xl font-bold ${transaction.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.points >= 0 ? '+' : ''}{transaction.points}
                      </div>
                      <div className="text-purple-300 text-sm">
                        {new Date(transaction.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && settings && (
            <div className="rounded-3xl p-8"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">إعدادات نظام الولاء</h2>
                {!editingSettings ? (
                  <button
                    onClick={() => setEditingSettings(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center gap-2"
                  >
                    <Edit2 className="w-5 h-5" />
                    تعديل
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={updateSettings}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-bold hover:scale-105 transition flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      حفظ
                    </button>
                    <button
                      onClick={() => {
                        setEditingSettings(false);
                        fetchSettings();
                      }}
                      className="px-6 py-3 bg-white/10 text-purple-300 rounded-xl font-bold hover:bg-white/20 transition"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-purple-300 mb-3 font-semibold">مكافأة التسجيل (نقطة)</label>
                    <input
                      type="number"
                      value={settings.signup_bonus}
                      onChange={(e) => setSettings({ ...settings, signup_bonus: Number(e.target.value) })}
                      disabled={!editingSettings}
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white text-lg font-bold focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-3 font-semibold">مكافأة الإحالة (نقطة)</label>
                    <input
                      type="number"
                      value={settings.referral_bonus}
                      onChange={(e) => setSettings({ ...settings, referral_bonus: Number(e.target.value) })}
                      disabled={!editingSettings}
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white text-lg font-bold focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-3 font-semibold">نقاط لكل ريال سعودي</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.points_per_sar}
                      onChange={(e) => setSettings({ ...settings, points_per_sar: Number(e.target.value) })}
                      disabled={!editingSettings}
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white text-lg font-bold focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-3 font-semibold">معدل تحويل النقاط (نقطة = ريال)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.points_to_sar_rate}
                      onChange={(e) => setSettings({ ...settings, points_to_sar_rate: Number(e.target.value) })}
                      disabled={!editingSettings}
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-lg font-bold focus:border-purple-500 focus:outline-none disabled:opacity-50"
                      dir="ltr"
                      placeholder="0.01 = 100 نقطة = 1 ريال"
                    />
                    <p className="text-purple-400 text-sm mt-2">
                      {settings.points_to_sar_rate === 0.01 ? 'كل 100 نقطة = 1 ريال' : `كل ${Math.round(1 / settings.points_to_sar_rate)} نقطة = 1 ريال`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-3 font-semibold">الحد الأدنى للاستبدال (نقطة)</label>
                    <input
                      type="number"
                      value={settings.min_points_redeem}
                      onChange={(e) => setSettings({ ...settings, min_points_redeem: Number(e.target.value) })}
                      disabled={!editingSettings}
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white text-lg font-bold focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={settings.is_active}
                      onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                      disabled={!editingSettings}
                      className="w-6 h-6 rounded border-purple-500/30 bg-white/5"
                    />
                    <label className="text-purple-300 font-semibold cursor-pointer">تفعيل نظام الولاء</label>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mt-8">
                  <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    كيف يعمل النظام؟
                  </h3>
                  <ul className="space-y-2 text-blue-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>يحصل المستخدم على <strong>{settings.signup_bonus} نقطة</strong> عند التسجيل في الموقع تلقائياً</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>عند دعوة صديق، يحصل المُحيل على <strong>{settings.referral_bonus} نقطة</strong> بعد تسجيل الصديق</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>مع كل عملية شراء، يحصل العميل على <strong>{settings.points_per_sar} نقاط</strong> لكل ريال سعودي</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>يمكن استبدال النقاط بقيمة نقدية: <strong>كل {Math.round(1 / settings.points_to_sar_rate)} نقطة = 1 ريال</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>الحد الأدنى للاستبدال: <strong>{settings.min_points_redeem} نقطة</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
