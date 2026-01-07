'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function ReviewOrderPage() {
  const params = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [orderRating, setOrderRating] = useState(0);
  const [vendorRating, setVendorRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          vendor:stores!orders_vendor_id_fkey(id, name, name_ar)
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', params.id)
        .single();

      if (existingReview) {
        toast.error('لقد قمت بتقييم هذا الطلب مسبقاً');
        router.push(`/orders/${params.id}`);
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('حدث خطأ في تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderRating === 0 || vendorRating === 0) {
      toast.error('يرجى تقييم الطلب والمتجر');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        router.push('/auth/login');
        return;
      }

      // Calculate average rating
      const avgRating = Math.round((orderRating + vendorRating) / 2);

      // Insert review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          order_id: params.id,
          vendor_id: order.vendor_id,
          customer_id: user.id,
          rating: avgRating,
          comment: comment.trim() || null,
          is_verified: true,
        });

      if (reviewError) throw reviewError;

      // Update store rating
      const { data: allReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', order.vendor_id);

      if (!reviewsError && allReviews) {
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgStoreRating = totalRating / allReviews.length;

        await supabase
          .from('stores')
          .update({
            rating: Number(avgStoreRating.toFixed(1)),
            total_reviews: allReviews.length,
          })
          .eq('id', order.vendor_id);
      }

      toast.success('✅ تم إرسال التقييم بنجاح!');
      router.push(`/orders/${params.id}`);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('حدث خطأ في إرسال التقييم');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">الطلب غير موجود</p>
          <button
            onClick={() => router.push('/orders')}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            العودة إلى الطلبات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ⭐ تقييم الطلب والمتجر
          </h1>
          <p className="text-gray-600">رقم الطلب: {order.order_number}</p>
          <p className="text-gray-600">
            المتجر: {order.vendor?.name || order.vendor?.name_ar}
          </p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Order Rating */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              📦 تقييم الطلب
            </label>
            <p className="text-sm text-gray-600 mb-3">
              كيف كانت جودة المنتجات والتعبئة؟
            </p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOrderRating(star)}
                  className={`text-5xl transition-all ${
                    star <= orderRating
                      ? 'text-yellow-400 scale-110'
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {orderRating > 0 && (
              <p className="text-center mt-2 text-green-600 font-semibold">
                {orderRating} من 5 نجوم
              </p>
            )}
          </div>

          {/* Vendor Rating */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              🏪 تقييم المتجر
            </label>
            <p className="text-sm text-gray-600 mb-3">
              كيف كانت الخدمة ومدة التحضير؟
            </p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setVendorRating(star)}
                  className={`text-5xl transition-all ${
                    star <= vendorRating
                      ? 'text-yellow-400 scale-110'
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {vendorRating > 0 && (
              <p className="text-center mt-2 text-green-600 font-semibold">
                {vendorRating} من 5 نجوم
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              💬 تعليقك (اختياري)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شاركنا تجربتك مع هذا الطلب..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={5}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1 text-left">
              {comment.length}/500
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || orderRating === 0 || vendorRating === 0}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الإرسال...
                </span>
              ) : (
                '✅ إرسال التقييم'
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>ملاحظة:</strong> تقييمك يساعد المتاجر على تحسين خدماتها
            ويساعد العملاء الآخرين في اتخاذ قرارات أفضل
          </p>
        </div>
      </div>
    </div>
  );
}
