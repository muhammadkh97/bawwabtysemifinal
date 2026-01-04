'use client';

import { useEffect, useState } from 'react';
import { Star, ThumbsUp, Shield, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  is_verified_purchase: boolean;
  created_at: string;
  users: {
    name: string;
    avatar_url: string;
  };
}

interface ReviewsListProps {
  productId: string;
}

export default function ReviewsList({ productId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
  const [filter, setFilter] = useState<'all' | 'verified' | number>('all');
  const [visibleReviews, setVisibleReviews] = useState(5);

  useEffect(() => {
    fetchReviews();
  }, [productId, filter]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('reviews')
        .select('*, users(name, avatar_url)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (filter === 'verified') {
        query = query.eq('is_verified_purchase', true);
      } else if (typeof filter === 'number') {
        query = query.eq('rating', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReviews(data || []);
      
      // حساب المتوسط
      if (data && data.length > 0) {
        const avg = data.reduce((acc, review) => acc + review.rating, 0) / data.length;
        setAverageRating(avg);
        setTotalReviews(data.length);

        // توزيع التقييمات
        const dist = [0, 0, 0, 0, 0];
        data.forEach(review => {
          dist[review.rating - 1]++;
        });
        setRatingDistribution(dist);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      // التحقق من عدم التصويت مسبقاً
      const { data: existing } = await supabase
        .from('review_helpfulness')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        alert('لقد قمت بالتصويت بالفعل');
        return;
      }

      // إضافة التصويت
      await supabase
        .from('review_helpfulness')
        .insert({ review_id: reviewId, user_id: user.id });

      // تحديث العداد
      await supabase.rpc('increment_review_helpful', { review_id: reviewId });

      fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'منذ يوم واحد';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
    return `منذ ${Math.floor(diffDays / 365)} سنة`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ملخص التقييمات - تصميم فخم */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-1">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-20 blur-xl"></div>
        <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* التقييم الإجمالي - تصميم محدث */}
            <div className="text-center">
              <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 mb-4 shadow-2xl shadow-orange-500/50">
                <div className="text-6xl font-black text-white drop-shadow-2xl">
                  {averageRating.toFixed(1)}
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-7 h-7 transition-all ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg scale-110'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-300 text-lg font-medium">
                بناءً على <span className="text-white font-bold">{totalReviews}</span> تقييم
              </p>
            </div>

            {/* توزيع التقييمات - تصميم محسن */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingDistribution[rating - 1];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                
                return (
                  <button
                    key={rating}
                    onClick={() => setFilter(rating)}
                    className="flex items-center gap-3 w-full hover:bg-white/10 p-3 rounded-xl transition-all group"
                  >
                    <span className="text-white font-bold text-sm w-10 flex items-center gap-1">
                      {rating} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </span>
                    <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 transition-all duration-500 relative group-hover:shadow-lg group-hover:shadow-orange-500/50"
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <span className="text-gray-300 font-semibold text-sm w-12 text-right">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* فلاتر - تصميم محسن */}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              🌟 الكل
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center gap-2 ${
                filter === 'verified'
                  ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg shadow-green-500/50'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Shield className="w-5 h-5" />
              مشتريات موثقة
            </button>
          </div>
        </div>
      </div>

      {/* قائمة التقييمات - تصميم فخم */}
      <div className="space-y-5">
        {reviews.slice(0, visibleReviews).map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-blue-900/20 p-1 hover:shadow-2xl hover:shadow-purple-500/20 transition-all group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6">
              <div className="flex items-start gap-5">
                {/* صورة المستخدم - محسنة */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    {review.users?.avatar_url ? (
                      <Image
                        src={review.users.avatar_url}
                        alt={review.users.name}
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-white font-black text-2xl">
                        {review.users?.name?.[0] || '؟'}
                      </span>
                    )}
                  </div>
                  {review.is_verified_purchase && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {/* اسم المستخدم والتاريخ - محسن */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-white font-bold text-lg">
                          {review.users?.name || 'مستخدم'}
                        </h4>
                        {review.is_verified_purchase && (
                          <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-xs rounded-full border border-green-500/30 font-semibold">
                            <Shield className="w-3 h-3" />
                            مشتري موثق
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{formatDate(review.created_at)}</p>
                    </div>

                    {/* النجوم - محسنة */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-5 h-5 transition-all ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* العنوان - محسن */}
                  {review.title && (
                    <h5 className="text-white font-bold text-xl mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {review.title}
                    </h5>
                  )}

                  {/* التعليق - محسن */}
                  <p className="text-gray-300 leading-relaxed mb-5 text-base">
                    {review.comment}
                  </p>

                  {/* الصور - محسنة */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-3 mb-5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-800">
                      {review.images.map((image, idx) => (
                        <div
                          key={idx}
                          className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-purple-500/30 hover:border-purple-500"
                        >
                          <Image
                            src={image}
                            alt={`Review image ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* زر عرض المزيد - محسن */}
      {reviews.length > visibleReviews && (
        <button
          onClick={() => setVisibleReviews(prev => prev + 5)}
          className="w-full py-5 rounded-2xl text-white font-bold hover:shadow-2xl hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-2 border-purple-500/30 hover:border-purple-500/50 group"
        >
          <ChevronDown className="w-5 h-5 group-hover:animate-bounce" />
          <span className="text-lg">عرض المزيد ({reviews.length - visibleReviews} تقييم)</span>
        </button>
      )}


    </div>
  );
}

