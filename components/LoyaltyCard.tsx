'use client';

import { useEffect, useState, useCallback } from 'react';
import { Gift, Star, Crown, TrendingUp, Award, Sparkles, CreditCard, User, Shield, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';

interface LoyaltyData {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  userName: string;
  memberSince: string;
}

export default function LoyaltyCard() {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoyaltyData = useCallback(async () => {
    try {
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }


      const { data, error } = await supabase
        .from('users')
        .select('loyalty_points, name, email, created_at')
        .eq('id', user.id)
        .single();

      if (error) {
        throw new Error(`فشل جلب بيانات الولاء: ${error.message}`);
      }

      
      // تحديد المستوى بناءً على النقاط
      let tier: LoyaltyData['tier'] = 'bronze';
      const points = data?.loyalty_points || 0;
      if (points >= 10000) tier = 'platinum';
      else if (points >= 5000) tier = 'gold';
      else if (points >= 1000) tier = 'silver';


      // تحديد الاسم بالأولوية: name > email > عضو مميز
      let userName = 'عضو مميز';
      if (data?.name && data.name.trim()) {
        userName = data.name;
      } else if (user.email) {
        userName = user.email.split('@')[0];
      }


      setLoyaltyData({
        points: points,
        tier,
        userName: userName,
        memberSince: data?.created_at || new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في جلب بيانات الولاء';
      
      logger.error('fetchLoyaltyData failed', {
        error: errorMessage,
        component: 'LoyaltyCard',
      });
      
      // محاولة الحصول على معلومات المستخدم من auth
      const { data: { user } } = await supabase.auth.getUser();
      const fallbackName = user?.email?.split('@')[0] || 'عضو مميز';
      
      // حتى لو حدث خطأ، أظهر البطاقة مع نقاط 0
      setLoyaltyData({
        points: 0,
        tier: 'bronze',
        userName: fallbackName,
        memberSince: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoyaltyData();

    // الاستماع لتحديثات النقاط من صناديق الحظ أو أي مصدر آخر
    const handlePointsUpdate = () => {
      logger.debug('Loyalty points updated, refreshing data');
      fetchLoyaltyData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('loyaltyPointsUpdated', handlePointsUpdate);
      
      // ✅ Cleanup
      return () => {
        window.removeEventListener('loyaltyPointsUpdated', handlePointsUpdate);
        logger.debug('LoyaltyCard event listener removed');
      };
    }
  }, [fetchLoyaltyData]);

  const getTierInfo = (tier: string) => {
    const tiers = {
      bronze: {
        name: 'برونزي',
        color: 'from-amber-700 via-amber-600 to-amber-800',
        bgPattern: 'bg-gradient-to-br from-amber-900/20 to-amber-700/20',
        icon: Gift,
        nextTier: 'فضي',
        nextPoints: 1000,
        benefits: ['خصم 5%', 'شحن مجاني فوق 200 د.أ']
      },
      silver: {
        name: 'فضي',
        color: 'from-gray-300 via-gray-200 to-gray-400',
        bgPattern: 'bg-gradient-to-br from-gray-500/20 to-gray-300/20',
        icon: Star,
        nextTier: 'ذهبي',
        nextPoints: 5000,
        benefits: ['خصم 10%', 'شحن مجاني فوق 100 د.أ', 'عروض حصرية']
      },
      gold: {
        name: 'ذهبي',
        color: 'from-yellow-400 via-amber-300 to-yellow-600',
        bgPattern: 'bg-gradient-to-br from-yellow-600/30 to-amber-500/30',
        icon: Award,
        nextTier: 'بلاتيني',
        nextPoints: 10000,
        benefits: ['خصم 15%', 'شحن مجاني دائماً', 'أولوية في الدعم']
      },
      platinum: {
        name: 'بلاتيني',
        color: 'from-indigo-600 via-purple-500 to-pink-600',
        bgPattern: 'bg-gradient-to-br from-purple-900/30 to-pink-900/30',
        icon: Crown,
        nextTier: null,
        nextPoints: null,
        benefits: ['خصم 20%', 'شحن مجاني سريع', 'دعم VIP']
      }
    };
    return tiers[tier as keyof typeof tiers] || tiers.bronze;
  };

  if (isLoading) {
    return (
      <div className="h-64 bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse rounded-[40px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-2"></div>
          <p className="text-purple-700 font-semibold">جاري تحميل نقاط الولاء...</p>
        </div>
      </div>
    );
  }

  // البطاقة ستظهر دائماً حتى لو كانت النقاط 0
  const tierInfo = getTierInfo(loyaltyData?.tier || 'bronze');
  const Icon = tierInfo.icon;
  const points = loyaltyData?.points || 0;
  const userName = loyaltyData?.userName || 'عضو مميز';
  const memberSince = loyaltyData?.memberSince || new Date().toISOString();
  const progress = tierInfo.nextPoints 
    ? (points / tierInfo.nextPoints) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* بطاقة الولاء بتصميم بطاقة البنك الحديثة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className={`relative w-full aspect-[1.7/1] rounded-[30px] bg-gradient-to-br ${tierInfo.color} shadow-2xl overflow-hidden`}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 80px rgba(98, 54, 255, 0.3)',
          }}
        >
          {/* خلفية مضيئة متحركة */}
          <motion.div 
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.8) 0%, transparent 50%)',
              ]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* نمط هندسي خفيف */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(30deg, transparent 48%, white 48%, white 52%, transparent 52%),
              linear-gradient(150deg, transparent 48%, white 48%, white 52%, transparent 52%)
            `,
            backgroundSize: '40px 40px'
          }}></div>

          {/* محتوى البطاقة */}
          <div className="relative z-10 p-4 sm:p-6 md:p-8 h-full flex flex-col justify-between">
            {/* الهيدر - الشعار والمستوى */}
            <div className="flex justify-between items-start">
              <div>
                <motion.div 
                  className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-wide">بوابتي</h3>
                    <p className="text-[10px] sm:text-xs text-white/70 font-medium">BAWWABTY</p>
                  </div>
                </motion.div>
                <motion.div 
                  className="inline-flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-xl px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-xs sm:text-sm font-bold text-white">{tierInfo.name}</span>
                </motion.div>
              </div>
            </div>

            {/* رقم النقاط */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="my-auto"
            >
              <div className="text-xs sm:text-sm text-white/80 font-semibold mb-1 sm:mb-2 tracking-wider">إجمالي النقاط</div>
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="font-black text-white tracking-tight text-4xl sm:text-5xl md:text-6xl" style={{ lineHeight: 1 }}>
                  {points.toLocaleString('ar-EG')}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl text-white/80 font-bold">نقطة</span>
              </div>
            </motion.div>

            {/* معلومات العضو والتاريخ */}
            <motion.div 
              className="flex justify-between items-end gap-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div>
                <div className="text-[10px] sm:text-xs text-white/70 font-medium mb-1 sm:mb-1.5 tracking-wide">عضو منذ</div>
                <div className="text-xs sm:text-sm md:text-base font-bold text-white">
                  {new Date(memberSince).toLocaleDateString('ar-EG', { 
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] sm:text-xs text-white/70 font-medium mb-1 sm:mb-1.5 tracking-wide">اسم العضو</div>
                <div className="text-xs sm:text-sm md:text-base font-bold text-white truncate max-w-[120px] sm:max-w-[150px] md:max-w-[200px]">
                  {userName}
                </div>
              </div>
            </motion.div>
          </div>

          {/* شريحة البطاقة (Chip) */}
          <motion.div 
            className="absolute top-6 sm:top-8 md:top-10 left-4 sm:left-6 md:left-8 w-12 h-9 sm:w-14 sm:h-10 md:w-16 md:h-12"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400 rounded-xl shadow-lg"
              style={{
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <div className="w-full h-full rounded-xl border-2 border-amber-600/30 p-1.5">
                <div className="w-full h-full grid grid-cols-4 gap-0.5">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-amber-700/40 rounded-sm"></div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* شعار contactless payment */}
          <motion.div 
            className="absolute top-28 left-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex">
              {[...Array(4)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="w-4 h-5 border-2 border-white rounded-full"
                  style={{
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    marginLeft: i > 0 ? '-8px' : '0',
                    rotate: '90deg'
                  }}
                  animate={{
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* تأثير اللمعان */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
              backgroundSize: '200% 100%'
            }}
            animate={{
              backgroundPosition: ['200% 0', '-200% 0']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 2
            }}
          />
        </div>
      </motion.div>

      {/* شريط التقدم للمستوى التالي */}
      {tierInfo.nextTier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-700">
              التقدم للمستوى {tierInfo.nextTier}
            </span>
            <span className="text-sm font-bold text-purple-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"
            />
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            تحتاج إلى {((tierInfo.nextPoints || 0) - points).toLocaleString('ar-EG')} نقطة إضافية
          </p>
        </motion.div>
      )}

      <div className="bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-900/95 backdrop-blur-xl border border-purple-500/20 rounded-[40px] p-8 shadow-2xl">
        <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-300" />
          مميزات مستواك الحالي
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tierInfo.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
              <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center text-purple-300">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-white font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
