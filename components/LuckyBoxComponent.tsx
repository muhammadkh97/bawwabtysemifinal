'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface LuckyBox {
  id: string;
  title_ar: string;
  icon: string;
  gradient: string;
  min_points: number;
  max_points: number;
  current_winners: number;
  max_winners: number;
  is_active: boolean;
}

export default function LuckyBoxComponent() {
  const { user: authUser } = useAuth();
  const [luckyBoxes, setLuckyBoxes] = useState<LuckyBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<LuckyBox | null>(null);
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<{ points: number; message: string } | null>(null);

  useEffect(() => {
    fetchLuckyBoxes();
  }, []);

  const fetchLuckyBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('lucky_boxes')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .lte('start_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLuckyBoxes(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error fetching lucky boxes'
      
      logger.error('fetchLuckyBoxes failed', {
        error: errorMessage,
        component: 'LuckyBoxComponent',
      })
    }
  };

  const handleOpenBox = async (box: LuckyBox) => {
    if (!authUser) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (box.current_winners >= box.max_winners) {
      toast.error('وصل الصندوق للحد الأقصى من الفائزين');
      return;
    }

    setSelectedBox(box);
    setOpening(true);
    setResult(null);

    try {
      // استدعاء دالة فتح الصندوق
      const { data, error } = await supabase.rpc('open_lucky_box', {
        p_lucky_box_id: box.id,
        p_user_id: authUser.id
      });

      if (error) throw error;

      const resultData = data[0];

      if (!resultData.success) {
        toast.error(resultData.message);
        setOpening(false);
        setSelectedBox(null);
        return;
      }

      // تأخير لعرض الأنيميشن
      setTimeout(() => {
        setResult({
          points: resultData.points_won,
          message: resultData.message
        });
        setOpening(false);

        toast.success(`تهانينا! ربحت ${resultData.points_won} نقطة! 🎉`);

        // إطلاق حدث لتحديث بطاقة الولاء
        window.dispatchEvent(new Event('loyaltyPointsUpdated'));

        // تحديث القائمة
        fetchLuckyBoxes();
      }, 2000);

    } catch (error: any) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ أثناء فتح الصندوق'
      
      logger.error('handleOpenBox failed', {
        error: errorMessage,
        component: 'LuckyBoxComponent',
        boxId: box.id,
        userId: authUser.id,
      })
      toast.error(errorMessage);
      setOpening(false);
      setSelectedBox(null);
    }
  };

  const closeModal = () => {
    setSelectedBox(null);
    setOpening(false);
    setResult(null);
  };

  if (luckyBoxes.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-6xl mb-4">🎁</div>
        <h2 className="text-4xl font-bold mb-3"
          style={{
            background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
          صناديق الحظ
        </h2>
        <p className="text-purple-300 text-lg">
          افتح صندوقاً واربح نقاطاً مجانية!
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {luckyBoxes.map((box, index) => (
          <motion.div
            key={box.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 215, 0, 0.3)'
            }}
            onClick={() => handleOpenBox(box)}
          >
            <div className={`h-48 bg-gradient-to-r ${box.gradient} flex items-center justify-center relative overflow-hidden`}>
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-8xl"
              >
                {box.icon}
              </motion.div>
              
              {/* Sparkles Animation */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-3 text-center">
                {box.title_ar}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-300">نطاق النقاط:</span>
                  <span className="text-yellow-400 font-bold text-lg">
                    {box.min_points} - {box.max_points}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-300">الفرص المتبقية:</span>
                  <span className="text-white font-bold">
                    {box.max_winners - box.current_winners} / {box.max_winners}
                  </span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-3">
                  <motion.div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${((box.max_winners - box.current_winners) / box.max_winners) * 100}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
              >
                <Gift className="w-5 h-5" />
                افتح الصندوق
                <Sparkles className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Shine Effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                backgroundSize: '200% 200%'
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Opening Modal */}
      <AnimatePresence>
        {selectedBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-12 max-w-lg w-full mx-4 border-4 border-yellow-400 relative overflow-hidden"
            >
              {!result && opening && (
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-9xl mb-6"
                  >
                    {selectedBox.icon}
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    جاري فتح الصندوق...
                  </h3>
                  <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto" />
                </div>
              )}

              {result && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: 3
                    }}
                    className="text-9xl mb-6"
                  >
                    🎉
                  </motion.div>
                  <h3 className="text-4xl font-bold text-white mb-4">
                    مبروك!
                  </h3>
                  <div className="text-7xl font-bold mb-4"
                    style={{
                      background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                    {result.points}
                  </div>
                  <p className="text-2xl text-white mb-8">
                    نقطة
                  </p>
                  <button
                    onClick={closeModal}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-transform"
                  >
                    رائع! 🎊
                  </button>
                </motion.div>
              )}

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 50%, rgba(255,215,0,0.2) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 50%, rgba(255,165,0,0.2) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 80%, rgba(255,69,0,0.2) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 50%, rgba(255,215,0,0.2) 0%, transparent 50%)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
