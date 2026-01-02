'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Star, ThumbsUp, MessageSquare, TrendingUp, User } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_name: string;
  order_number: string;
}

export default function RestaurantReviewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [vendorId, setVendorId] = useState<string>('');

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        setVendorId(vendorData.id);
        await fetchReviews(vendorData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchReviews = async (vId: string) => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users:user_id(full_name),
          orders:order_id(order_number)
        `)
        .eq('vendor_id', vId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReviews: Review[] = reviewsData?.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment || '',
        created_at: new Date(review.created_at).toLocaleDateString('ar-EG'),
        customer_name: review.users?.full_name || 'عميل',
        order_number: review.orders?.order_number || ''
      })) || [];

      setReviews(formattedReviews);

      // Calculate average rating
      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg);

        // Calculate distribution
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsData.forEach((r: any) => {
          dist[r.rating as keyof typeof dist]++;
        });
        setRatingDistribution(dist);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <FuturisticNavbar />
      <div className="flex">
        <FuturisticSidebar role="restaurant" />
        <div className="md:mr-[280px] transition-all duration-300 w-full">
          <main className="pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">⭐ التقييمات والمراجعات</h1>
            <p className="text-gray-600">تقييمات العملاء وآرائهم</p>
          </div>

          {/* Rating Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Average Rating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl"
            >
              <div className="text-center">
                <Star className="w-16 h-16 mx-auto mb-4 fill-current" />
                <h2 className="text-6xl font-black mb-2">{averageRating.toFixed(1)}</h2>
                <div className="flex justify-center gap-1 mb-2">
                  {renderStars(Math.round(averageRating))}
                </div>
                <p className="text-yellow-100">متوسط التقييم</p>
                <p className="text-sm text-yellow-100 mt-2">{reviews.length} تقييم</p>
              </div>
            </motion.div>

            {/* Rating Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">توزيع التقييمات</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-24">
                        <span className="font-bold text-gray-900">{rating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-left">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <ThumbsUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">تقييمات إيجابية</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {ratingDistribution[5] + ratingDistribution[4]}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">تعليقات العملاء</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.filter(r => r.comment).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">معدل الرضا</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.length > 0 
                      ? ((ratingDistribution[5] + ratingDistribution[4]) / reviews.length * 100).toFixed(0) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">آراء العملاء</h2>
            
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                          {review.customer_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{review.customer_name}</h3>
                          <p className="text-sm text-gray-600">{review.created_at}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                    {review.order_number && (
                      <p className="text-sm text-gray-500 mt-2">طلب رقم: {review.order_number}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد تقييمات بعد</p>
              </div>
            )}
          </div>
          </main>
        </div>
      </div>
    </>
  );
}
