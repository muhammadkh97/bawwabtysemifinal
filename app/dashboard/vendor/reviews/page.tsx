'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star, Calendar, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface Review {
  id: string;
  customer_name: string;
  customer_avatar?: string;
  product_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function VendorReviewsPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchVendorReviews();
    }
  }, [userId]);

  const fetchVendorReviews = async () => {
    if (!userId) return;
    
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

      // Get vendor's products IDs
      const { data: vendorProductsData } = await supabase
        .from('products')
        .select('id')
        .eq('vendor_id', vendorData.id);

      const productIds = vendorProductsData?.map(p => p.id) || [];

      if (productIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get reviews for vendor's products
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          customer_id,
          product_id
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false});

      if (reviewsError) {
        logger.error('خطأ في جلب المراجعات', { error: reviewsError.message, component: 'VendorReviewsPage' });
        setLoading(false);
        return;
      }

      // Get unique customer IDs and product IDs
      const customerIds = Array.from(new Set(reviewsData?.map(r => r.customer_id) || []));
      const reviewProductIds = Array.from(new Set(reviewsData?.map(r => r.product_id) || []));

      // Fetch users data
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', customerIds);

      // Fetch products data
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', reviewProductIds);

      // Create lookup maps
      const usersMap = new Map(usersData?.map(u => [u.id, u.name]) || []);
      const productsMap = new Map(productsData?.map(p => [p.id, p.name]) || []);

      const formattedReviews = reviewsData?.map(review => ({
        id: review.id,
        customer_name: usersMap.get(review.customer_id) || 'عميل',
        product_name: productsMap.get(review.product_id) || 'منتج',
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
      })) || [];

      setReviews(formattedReviews);
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching reviews', { error: errorMessage, component: 'VendorReviewsPage' });
      setLoading(false);
    }
  };

  const filteredReviews = selectedRating === 'all'
    ? reviews
    : reviews.filter(r => r.rating === selectedRating);

  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0515] transition-colors duration-300">
      
      <div className="md:mr-[280px] transition-all duration-300">
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">التقييمات والمراجعات</h1>
            <p className="text-purple-300 text-lg">آراء العملاء حول منتجاتك</p>
          </motion.div>

          {/* ملخص التقييمات */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 text-center"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <div className="text-6xl font-bold mb-2"
                    style={{
                      background: 'linear-gradient(90deg, #FF9500, #FFD700)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {avgRating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${star <= avgRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <p className="text-purple-300 text-sm">بناءً على {reviews.length} تقييم</p>
                </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 rounded-2xl p-6"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
              }}
            >
              <h3 className="text-white font-bold mb-4">توزيع التقييمات</h3>
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-white font-medium">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          background: 'linear-gradient(90deg, #FF9500, #FFD700)',
                        }}
                      />
                    </div>
                    <span className="text-purple-300 text-sm w-16 text-left">{count} تقييم</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* الفلاتر */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'الكل' },
              { value: 5, label: '5 نجوم' },
              { value: 4, label: '4 نجوم' },
              { value: 3, label: '3 نجوم' },
              { value: 2, label: 'نجمتان' },
              { value: 1, label: 'نجمة واحدة' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedRating(filter.value as number | 'all')}
                className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedRating === filter.value
                    ? 'text-white shadow-lg'
                    : 'text-purple-300 hover:text-white'
                }`}
                style={
                  selectedRating === filter.value
                    ? { background: 'linear-gradient(90deg, #6236FF, #FF219D)' }
                    : { background: 'rgba(98, 54, 255, 0.2)' }
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* قائمة التقييمات */}
              <div className="space-y-4">
                {filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
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
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                  >
                    {review.customer_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-bold">{review.customer_name}</h3>
                        <p className="text-purple-400 text-sm flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {review.product_name}
                        </p>
                      </div>
                      <span className="text-purple-400 text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {review.created_at}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-white leading-relaxed mb-3">{review.comment}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredReviews.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 rounded-2xl"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                <div className="text-7xl mb-4">⭐</div>
                <p className="text-xl text-purple-300">لا توجد تقييمات في هذه الفئة</p>
              </motion.div>
            )}
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
