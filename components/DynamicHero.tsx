'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  title_ar?: string;
  subtitle?: string;
  subtitle_ar?: string;
  image_url?: string;
  mobile_image_url?: string;
  button_text?: string;
  button_text_ar?: string;
  button_link?: string;
  background_color?: string;
  text_color?: string;
  is_active?: boolean;
  display_order?: number;
  page?: string;
  created_at?: string;
}

export default function DynamicHero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    fetchHeroSlides();
  }, []);

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // تغيير كل 5 ثواني

    return () => clearInterval(interval);
  }, [autoPlay, slides.length]);

  const fetchHeroSlides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('hero_sections')
        .select('*')
        .eq('is_active', true)
        .eq('page', 'home')
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(`فشل تحميل الشرائح: ${error.message}`);
      }

      if (data && data.length > 0) {
        setSlides(data);
      } else {
        // استخدام شرائح افتراضية إذا لم يكن هناك بيانات
        setSlides(getDefaultSlides());
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      // استخدام شرائح افتراضية في حالة الخطأ لضمان عدم ظهور شاشة فارغة
      setSlides(getDefaultSlides());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSlides = (): HeroSlide[] => [
    {
      id: '1',
      title: 'Welcome to Bawwabty',
      title_ar: 'مرحباً بك في بوابتي 🛍️',
      subtitle: 'Shop thousands of high-quality products at the best prices with fast and secure shipping',
      subtitle_ar: 'تسوق من آلاف المنتجات عالية الجودة بأفضل الأسعار مع شحن سريع وآمن',
      image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
      button_text: 'Shop Now',
      button_text_ar: 'تسوق الآن',
      button_link: '/products',
      background_color: '#6236FF',
      text_color: '#FFFFFF',
      is_active: true,
      display_order: 1,
      page: 'home',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Exclusive Deals',
      title_ar: 'عروض حصرية 🔥',
      subtitle: 'Discounts up to 70% on selected products',
      subtitle_ar: 'خصومات تصل إلى 70% على منتجات مختارة',
      image_url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200',
      button_text: 'View Deals',
      button_text_ar: 'اكتشف العروض',
      button_link: '/deals',
      background_color: '#FF6B6B',
      text_color: '#FFFFFF',
      is_active: true,
      display_order: 2,
      page: 'home',
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Premium Quality',
      title_ar: 'جودة فاخرة ✨',
      subtitle: 'Authentic and certified products guaranteed',
      subtitle_ar: 'منتجات أصلية ومعتمدة 100%',
      image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      button_text: 'Discover',
      button_text_ar: 'اكتشف المزيد',
      button_link: '/categories',
      background_color: '#667eea',
      text_color: '#FFFFFF',
      is_active: true,
      display_order: 3,
      page: 'home',
      created_at: new Date().toISOString(),
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setAutoPlay(false);
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden py-8 sm:py-12 md:py-16 lg:py-20 animate-pulse" style={{ background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between gap-4 sm:gap-6 md:gap-12">
            <div className="flex-1 max-w-2xl">
              <div className="h-12 bg-white/20 rounded-lg mb-4 animate-pulse"></div>
              <div className="h-6 bg-white/20 rounded-lg mb-4 w-3/4 animate-pulse"></div>
              <div className="h-10 bg-white/20 rounded-lg w-40 animate-pulse"></div>
            </div>
            <div className="hidden lg:block flex-1">
              <div className="h-64 bg-white/20 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">جارٍ التحميل...</p>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section 
      className="relative overflow-hidden py-8 sm:py-12 md:py-16 lg:py-20 transition-all duration-1000"
      style={{ 
        backgroundColor: currentSlideData.background_color || '#FF6B35',
        color: currentSlideData.text_color || '#FFFFFF'
      }}
    >
      {/* خلفية متحركة */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-32 sm:w-48 md:w-72 h-32 sm:h-48 md:h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-5 sm:bottom-10 right-5 sm:right-10 w-40 sm:w-64 md:w-96 h-40 sm:h-64 md:h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* شرارات */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-3 sm:px-4 relative z-10">
        <div className="flex items-center justify-between gap-4 sm:gap-6 md:gap-12">
          {/* محتوى النص */}
          <div className="flex-1 text-white max-w-2xl">
            {/* أيقونات ديناميكية */}
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
              <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 animate-bounce" />
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 fill-current animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 leading-tight animate-fade-in">
              {currentSlideData.title_ar || currentSlideData.title}
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 mb-4 sm:mb-6 md:mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {currentSlideData.subtitle_ar || currentSlideData.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link
                href={currentSlideData.button_link || '/products'}
                className="group px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-white text-purple-600 rounded-lg sm:rounded-xl hover:bg-yellow-300 hover:text-purple-700 transition-all font-bold text-sm sm:text-base md:text-lg shadow-2xl transform hover:scale-105 text-center flex items-center justify-center gap-2"
              >
                <span>{currentSlideData.button_text_ar || currentSlideData.button_text || 'تسوق الآن'}</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
              </Link>
              
              <Link
                href="/about"
                className="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 border-2 border-white text-white rounded-lg sm:rounded-xl hover:bg-white/10 backdrop-blur transition-all font-bold text-sm sm:text-base md:text-lg text-center"
              >
                اعرف المزيد
              </Link>
            </div>

            {/* مؤشرات الشرائح */}
            {slides.length > 1 && (
              <div className="flex items-center gap-2 mt-8">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSlide(index);
                      setAutoPlay(false);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === index 
                        ? 'bg-white w-12' 
                        : 'bg-white/40 w-6 hover:bg-white/60'
                    }`}
                    aria-label={`الانتقال إلى الشريحة ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* صورة الشريحة - مخفية على الشاشات الصغيرة */}
          <div className="flex-1 hidden xl:block">
            <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={currentSlideData.image_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200'}
                alt={currentSlideData.title_ar || currentSlideData.title}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
                priority={currentSlide === 0}
                loading={currentSlide === 0 ? 'eager' : 'lazy'}
                sizes="(max-width: 1280px) 0px, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التنقل */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-2xl transition-all hover:scale-110 z-20 backdrop-blur-sm"
            aria-label="الشريحة السابقة"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-2xl transition-all hover:scale-110 z-20 backdrop-blur-sm"
            aria-label="الشريحة التالية"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      ` }} />
    </section>
  );
}
