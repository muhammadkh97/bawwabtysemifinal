'use client';

import { useState } from 'react';
import { Star, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ReviewFormProps {
  productId: string;
  orderId?: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // التحقق من الشراء
  const [canReview, setCanReview] = useState(true);
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 5) {
      setError('يمكنك رفع 5 صور كحد أقصى');
      return;
    }

    setImages([...images, ...files]);
    
    // إنشاء معاينة للصور
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('products')
        .upload(filePath, image);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('يرجى اختيار تقييم');
      return;
    }

    if (!comment.trim()) {
      setError('يرجى كتابة تعليق');
      return;
    }

    setIsSubmitting(true);

    try {
      // الحصول على المستخدم الحالي
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('يجب تسجيل الدخول أولاً');
        setIsSubmitting(false);
        return;
      }

      // رفع الصور
      const imageUrls = await uploadImages();

      // إضافة التقييم
      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          order_id: orderId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          images: imageUrls,
          is_verified_purchase: !!orderId
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('حدث خطأ أثناء إضافة التقييم');
        setIsSubmitting(false);
        return;
      }

      // إعادة تعيين النموذج
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);
      setPreviewUrls([]);
      
      if (onSuccess) onSuccess();
      
      alert('تم إضافة تقييمك بنجاح! 🎉');
    } catch (error) {
      console.error('Submit error:', error);
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl"
      style={{
        background: 'rgba(15, 10, 30, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(98, 54, 255, 0.3)'
      }}
    >
      <h3 className="text-2xl font-bold text-white mb-6">اكتب تقييمك</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* نجوم التقييم */}
        <div>
          <label className="block text-white mb-3 font-medium">التقييم</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-500'
                  } transition-colors`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-white mr-3 self-center">
                {rating === 5 && '🤩 ممتاز'}
                {rating === 4 && '😊 جيد جداً'}
                {rating === 3 && '😐 جيد'}
                {rating === 2 && '😕 مقبول'}
                {rating === 1 && '😞 سيء'}
              </span>
            )}
          </div>
        </div>

        {/* عنوان التقييم */}
        <div>
          <label className="block text-white mb-3 font-medium">عنوان التقييم (اختياري)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: منتج رائع وجودة عالية"
            className="w-full p-4 rounded-2xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-colors placeholder-gray-500"
            maxLength={100}
          />
        </div>

        {/* التعليق */}
        <div>
          <label className="block text-white mb-3 font-medium">تعليقك *</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شاركنا رأيك التفصيلي في المنتج..."
            className="w-full p-4 rounded-2xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-colors placeholder-gray-500"
            rows={5}
            maxLength={1000}
            required
          />
          <p className="text-gray-400 text-sm mt-2">{comment.length}/1000 حرف</p>
        </div>

        {/* رفع صور */}
        <div>
          <label className="block text-white mb-3 font-medium">إضافة صور (اختياري - حتى 5 صور)</label>
          
          {/* معاينة الصور */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-5 gap-3 mb-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/5">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-500/30 rounded-2xl cursor-pointer hover:border-purple-500/60 transition-colors bg-white/5">
              <Upload className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-gray-400 text-sm">انقر لرفع الصور</span>
              <span className="text-gray-500 text-xs mt-1">PNG, JPG, WEBP (حتى 5MB)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* رسالة خطأ */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-400">
            {error}
          </div>
        )}

        {/* زر الإرسال */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full py-4 rounded-2xl text-white font-bold transition-all hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جارٍ النشر...
            </>
          ) : (
            '✨ نشر التقييم'
          )}
        </button>
      </form>
    </motion.div>
  );
}

