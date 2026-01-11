'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Tag, Percent, Calendar, TrendingUp, Package, Users, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'scheduled';
}

export default function VendorMarketingPage() {
  const { userId } = useAuth();
  const [showNewCouponModal, setShowNewCouponModal] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchCoupons();
    }
  }, [userId]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        setLoading(false);
        return;
      }

      // Fetch coupons
      const { data: couponsData, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // تحديث الحالة بناءً على التواريخ
      const updatedCoupons = (couponsData || []).map(coupon => {
        const now = new Date();
        const startDate = new Date(coupon.start_date);
        const endDate = new Date(coupon.end_date);
        
        let status: 'active' | 'expired' | 'scheduled' = 'active';
        if (endDate < now) {
          status = 'expired';
        } else if (startDate > now) {
          status = 'scheduled';
        }

        return {
          ...coupon,
          status,
          type: coupon.discount_type,
          value: coupon.discount_value,
        };
      });

      setCoupons(updatedCoupons);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching coupons', { error: errorMessage, component: 'VendorMarketingPage' });
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const totalUsage = coupons.reduce((acc, c) => acc + c.used_count, 0);
  const totalLimit = coupons.reduce((acc, c) => acc + c.usage_limit, 0);
  const usageRate = totalLimit > 0 ? ((totalUsage / totalLimit) * 100).toFixed(0) : 0;

  const stats = [
    { label: 'إجمالي الكوبونات', value: coupons.length, color: '#6236FF', icon: Tag },
    { label: 'كوبونات نشطة', value: coupons.filter(c => c.status === 'active').length, color: '#10B981', icon: TrendingUp },
    { label: 'إجمالي الاستخدامات', value: totalUsage, color: '#FF9500', icon: Users },
    { label: 'معدل الاستخدام', value: `${usageRate}%`, color: '#FF219D', icon: Percent },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'expired': return '#EF4444';
      case 'scheduled': return '#FF9500';
      default: return '#6236FF';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'scheduled': return 'مجدول';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-white transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-800 dark:text-white text-xl">جاري تحميل أدوات التسويق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="بائع" userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">أدوات التسويق</h1>
              <p className="text-purple-300 text-lg">إدارة الكوبونات والعروض الترويجية</p>
            </div>
            <button
              onClick={() => setShowNewCouponModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
            >
              <Plus className="w-5 h-5" />
              <span>كوبون جديد</span>
            </button>
          </motion.div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${stat.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-purple-300 text-sm">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* قائمة الكوبونات */}
          <div className="space-y-4">
            {coupons.map((coupon, index) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${getStatusColor(coupon.status)}20` }}
                    >
                      <Tag className="w-8 h-8" style={{ color: getStatusColor(coupon.status) }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-white">{coupon.code}</h3>
                        <span
                          className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                          style={{ background: getStatusColor(coupon.status) }}
                        >
                          {getStatusText(coupon.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xs text-purple-300 mb-1">قيمة الخصم</p>
                          <p className="text-white font-bold">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ₪`}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xs text-purple-300 mb-1">الحد الأدنى للشراء</p>
                          <p className="text-white font-bold">{coupon.min_purchase} ₪</p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xs text-purple-300 mb-1">الاستخدامات</p>
                          <p className="text-white font-bold">{coupon.used_count} / {coupon.usage_limit}</p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xs text-purple-300 mb-1">الصلاحية</p>
                          <p className="text-white font-bold text-sm">
                            {coupon.start_date} - {coupon.end_date}
                          </p>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(coupon.used_count / coupon.usage_limit) * 100}%`,
                            background: 'linear-gradient(90deg, #6236FF, #FF219D)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mr-4">
                    <button
                      className="p-2 rounded-xl text-white transition-all hover:shadow-lg"
                      style={{ background: 'rgba(98, 54, 255, 0.3)' }}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 rounded-xl text-white transition-all hover:shadow-lg"
                      style={{ background: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
