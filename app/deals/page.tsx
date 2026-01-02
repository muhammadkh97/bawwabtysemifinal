'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Zap, Tag, TrendingUp, Percent, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LuckyBoxComponent from '@/components/LuckyBoxComponent';

interface Deal {
  id: string;
  title: string;
  title_ar: string;
  discount: number;
  discount_percentage: number;
  icon: string;
  products: number;
  hours: number;
  minutes: number;
  seconds: number;
  gradient: string;
  end_date: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);

  // جلب العروض من قاعدة البيانات
  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // تحويل البيانات إلى الشكل المطلوب
      const formattedDeals = (data || []).map(deal => {
        const timeRemaining = calculateTimeRemaining(deal.end_date);
        return {
          id: deal.id,
          title: deal.title,
          title_ar: deal.title_ar,
          discount: deal.discount_percentage,
          discount_percentage: deal.discount_percentage,
          icon: deal.icon,
          products: 0, // سيتم تحديثه لاحقاً من علاقة deal_products
          hours: timeRemaining.hours,
          minutes: timeRemaining.minutes,
          seconds: timeRemaining.seconds,
          gradient: deal.gradient,
          end_date: deal.end_date,
        };
      });

      setDeals(formattedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = Math.max(0, end - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  // تحديث العد التنازلي
  useEffect(() => {
    const interval = setInterval(() => {
      setDeals(prevDeals => 
        prevDeals.map(deal => {
          let { hours, minutes, seconds } = deal;
          
          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          }
          
          return { ...deal, hours, minutes, seconds };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0A0515' }}>
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* العنوان */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="text-7xl mb-4">🔥</div>
          <h1 className="text-6xl font-bold mb-4"
            style={{
              background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
            العروض الخاصة
          </h1>
          <p className="text-purple-300 text-xl mb-6">
            خصومات تصل إلى 70% على منتجات مختارة
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
            style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)'
            }}>
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">عروض لفترة محدودة!</span>
          </div>
        </motion.div>

        {/* Lucky Boxes Section */}
        <LuckyBoxComponent />

        {/* شبكة العروض */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {deals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)'
              }}
            >
              {/* الرأس */}
              <div className="p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className={`absolute inset-0 bg-gradient-to-r ${deal.gradient}`}></div>
                </div>
                
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div>
                    <div className="text-6xl mb-3">{deal.icon}</div>
                    <h3 className="text-3xl font-bold text-white mb-2">{deal.title_ar}</h3>
                    <p className="text-purple-300 mb-2">{deal.title}</p>
                    <div className="flex items-center gap-2 text-purple-300">
                      <Tag className="w-4 h-4" />
                      <span>{deal.products} منتج</span>
                    </div>
                  </div>
                  
                  <div className="px-6 py-3 rounded-2xl text-white backdrop-blur-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.3), rgba(255, 33, 157, 0.3))',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                    <div className="text-sm opacity-80 mb-1">خصم</div>
                    <div className="text-4xl font-bold flex items-center gap-1">
                      {deal.discount}
                      <Percent className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* العد التنازلي */}
                <div className="grid grid-cols-3 gap-3 relative z-10">
                  <div className="text-center p-3 rounded-xl backdrop-blur-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {String(deal.hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-purple-300">ساعة</div>
                  </div>
                  <div className="text-center p-3 rounded-xl backdrop-blur-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {String(deal.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-purple-300">دقيقة</div>
                  </div>
                  <div className="text-center p-3 rounded-xl backdrop-blur-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {String(deal.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-purple-300">ثانية</div>
                  </div>
                </div>
              </div>

              {/* زر */}
              <div className="p-6">
                <Link
                  href={`/products?deal=${deal.id}`}
                  className="block w-full py-4 rounded-xl text-white text-center font-bold transition-all hover:shadow-lg hover:shadow-purple-500/50 group-hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
                >
                  <span>تسوق الآن</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* عروض الفلاش */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background: 'rgba(15, 10, 30, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(98, 54, 255, 0.3)'
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(90deg, #FFD700, #FFA500)'
            }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="text-7xl mb-6">⚡</div>
            <h2 className="text-5xl font-bold text-white mb-4">عروض الفلاش</h2>
            <p className="text-2xl text-purple-200 mb-8">
              خصومات كبيرة لفترة قصيرة جداً - لا تفوت الفرصة!
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-yellow-400">
                <TrendingUp className="w-6 h-6" />
                <span className="text-xl font-bold">أكثر من 500 منتج</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-6 h-6" />
                <span className="text-xl font-bold">ينتهي خلال 24 ساعة</span>
              </div>
            </div>

            <Link
              href="/products?flash=true"
              className="inline-block px-12 py-5 rounded-xl text-white text-xl font-bold transition-all hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)' }}
            >
              اكتشف العروض الآن
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

