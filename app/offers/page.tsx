'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, TrendingUp, Clock, Tag, ShoppingCart } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount_percentage?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  image_url?: string;
  link?: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // محاولة جلب العروض من قاعدة البيانات
      const { data, error: fetchError } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching offers:', fetchError);
        // استخدام عروض افتراضية
        setOffers(getDefaultOffers());
      } else if (data && data.length > 0) {
        setOffers(data);
      } else {
        // استخدام عروض افتراضية إذا لم توجد بيانات
        setOffers(getDefaultOffers());
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setOffers(getDefaultOffers());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultOffers = (): Offer[] => [
    {
      id: '1',
      title: 'خصم 50% على الإلكترونيات',
      description: 'عروض حصرية على جميع المنتجات الإلكترونية لفترة محدودة',
      discount_percentage: 50,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800',
      link: '/products?category=electronics',
    },
    {
      id: '2',
      title: 'خصم 30% على الأزياء',
      description: 'تخفيضات كبيرة على أحدث صيحات الموضة والأزياء',
      discount_percentage: 30,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
      link: '/products?category=fashion',
    },
    {
      id: '3',
      title: 'عروض على المنزل والمطبخ',
      description: 'وفر حتى 40% على منتجات المنزل والمطبخ',
      discount_percentage: 40,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
      link: '/products?category=home',
    },
  ];

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pt-20">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-semibold">عروض حصرية</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            أفضل العروض اليومية
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
            خصومات مذهلة تصل إلى 50% على منتجات مختارة
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/products"
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              تسوق الآن
            </Link>
            
            <Link 
              href="/deals"
              className="bg-purple-500/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-500/50 transition-all border-2 border-white/30 inline-flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              أفضل الصفقات
            </Link>
          </div>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">جاري تحميل العروض...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchOffers}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {offers.map((offer, index) => {
              const daysRemaining = calculateDaysRemaining(offer.end_date);
              
              return (
                <div
                  key={offer.id}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* صورة العرض */}
                  <div className="relative h-64 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                    {offer.image_url ? (
                      <Image
                        src={offer.image_url}
                        alt={offer.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="w-20 h-20 text-purple-300" />
                      </div>
                    )}
                    
                    {/* شارة الخصم */}
                    {offer.discount_percentage && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                        خصم {offer.discount_percentage}%
                      </div>
                    )}
                    
                    {/* الوقت المتبقي */}
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : 'ينتهي اليوم'}
                    </div>
                  </div>
                  
                  {/* محتوى العرض */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-purple-600 transition-colors">
                      {offer.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {offer.description}
                    </p>
                    
                    <Link
                      href={offer.link || '/products'}
                      className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-3 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all hover:shadow-lg"
                    >
                      اكتشف العرض
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-16 px-4 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            لا تفوت عروضنا الحصرية!
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            اشترك في نشرتنا البريدية للحصول على آخر العروض والخصومات
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="أدخل بريدك الإلكتروني"
              className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all whitespace-nowrap">
              اشترك الآن
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
