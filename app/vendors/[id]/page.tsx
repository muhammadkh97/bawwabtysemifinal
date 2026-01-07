'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Store, MapPin, Phone, Mail, Star, Package, MessageCircle, ExternalLink, Loader2, Heart, HeartOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreFollow } from '@/contexts/StoreFollowContext';
import { useChats } from '@/contexts/ChatsContext';
import toast from 'react-hot-toast';

interface Vendor {
  id: string;
  store_name: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  user_id: string;
  created_at: string;
}

export default function VendorStorePage() {
  const params = useParams();
  const vendorId = params.id as string;
  const { user, userRole } = useAuth();
  const { followStore, unfollowStore, isFollowing, getFollowersCount } = useStoreFollow();
  const { createOrGetChat } = useChats();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followersCountAnimation, setFollowersCountAnimation] = useState(false);

  const following = isFollowing(vendorId);

  const fetchVendor = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      setVendor(data);
    } catch (error) {
      console.error('Error fetching vendor:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, [vendorId]);

  const loadFollowersCount = useCallback(async () => {
    const count = await getFollowersCount(vendorId);
    setFollowersCount(count);
  }, [vendorId, getFollowersCount]);

  useEffect(() => {
    fetchVendor();
    fetchProducts();
    loadFollowersCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تأثير الأنيميشن عند تغيير عدد المتابعين
  useEffect(() => {
    if (followersCountAnimation) {
      const timer = setTimeout(() => setFollowersCountAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [followersCountAnimation]);

  const handleChatWithVendor = useCallback(async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (userRole !== 'customer') {
      toast.error('هذه الميزة متاحة للعملاء فقط');
      return;
    }

    try {
      const chatId = await createOrGetChat(vendorId);
      if (chatId) {
        // Dispatch custom event to open FloatingChatWidget
        const event = new CustomEvent('openVendorChat', {
          detail: { vendorId }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      toast.error('فشل فتح المحادثة');
    }
  }, [user, userRole, vendorId, createOrGetChat]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (userRole !== 'customer') {
      toast.error('هذه الميزة متاحة للعملاء فقط');
      return;
    }

    setIsFollowLoading(true);
    try {
      if (following) {
        await unfollowStore(vendorId);
        // تحديث العدد فوراً بالنقصان
        setFollowersCount(prev => Math.max(0, prev - 1));
        setFollowersCountAnimation(true);
      } else {
        await followStore(vendorId);
        // تحديث العدد فوراً بالزيادة
        setFollowersCount(prev => prev + 1);
        setFollowersCountAnimation(true);
      }
      // إعادة تحميل العدد الفعلي من قاعدة البيانات للتأكد
      setTimeout(() => loadFollowersCount(), 500);
    } catch (error) {
      console.error('Error toggling follow:', error);
      // في حالة الخطأ، إعادة تحميل العدد الصحيح
      await loadFollowersCount();
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">جاري تحميل المتجر...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!vendor) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <EmptyState
            type="products"
            title="المتجر غير موجود"
            description="عذراً، لم نتمكن من العثور على المتجر المطلوب"
            actionLabel="العودة للرئيسية"
            actionHref="/"
          />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Cover Image */}
      <div className="relative h-64 md:h-96 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900">
        {vendor.cover_image_url ? (
          <Image
            src={vendor.cover_image_url}
            alt={vendor.store_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store className="w-24 h-24 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10 pb-12">
        {/* Vendor Info Card */}
        <div className="group relative overflow-hidden rounded-3xl mb-12">
          {/* Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-blue-900/20 rounded-3xl p-[2px]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
          </div>
          
          <div className="relative bg-white backdrop-blur-xl rounded-3xl p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Logo */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-50" />
                <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                  {vendor.logo_url ? (
                    <Image
                      src={vendor.logo_url}
                      alt={vendor.store_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center">
                      <Store className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  {vendor.store_name}
                </h1>
                
                {vendor.description && (
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    {vendor.description}
                  </p>
                )}

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {vendor.phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-medium">{vendor.phone}</span>
                    </div>
                  )}
                  
                  {vendor.email && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium">{vendor.email}</span>
                    </div>
                  )}
                  
                  {(vendor.address || vendor.city) && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-medium">{vendor.city || vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {/* Follow Button */}
                  {user && userRole === 'customer' && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      className={`group relative overflow-hidden rounded-xl px-6 py-3 transition-all duration-300 hover:shadow-xl ${
                        following 
                          ? 'hover:shadow-red-500/30' 
                          : 'hover:shadow-purple-500/30'
                      }`}
                    >
                      <div className={`absolute inset-0 ${
                        following 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 opacity-90' 
                          : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-90'
                      } group-hover:opacity-100 transition-opacity`} />
                      <div className={`absolute inset-0 ${
                        following 
                          ? 'bg-gradient-to-r from-red-500/50 to-pink-500/50' 
                          : 'bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-blue-600/50'
                      } blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className="relative flex items-center gap-2 text-white font-bold">
                        {isFollowLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : following ? (
                          <HeartOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                        <span>{following ? 'إلغاء المتابعة' : 'متابعة المتجر'}</span>
                      </div>
                    </button>
                  )}

                  {/* Chat Button */}
                  <button
                    onClick={handleChatWithVendor}
                    className="group relative overflow-hidden rounded-xl px-6 py-3 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-blue-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-2 text-white font-bold">
                      <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>تواصل مع البائع</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                  {products.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">منتج متاح</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-1">
                  {products.reduce((sum, p) => sum + p.reviews_count, 0)}
                </div>
                <div className="text-sm text-gray-600 font-medium">تقييم</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                  {products.length > 0 
                    ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="text-sm text-gray-600 font-medium">متوسط التقييم</div>
              </div>

              <div className="text-center">
                <div className={`text-3xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-1 transition-all duration-300 ${
                  followersCountAnimation ? 'scale-125 animate-pulse' : 'hover:scale-110'
                }`}>
                  {followersCount}
                </div>
                <div className="text-sm text-gray-600 font-medium">متابع</div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              منتجات المتجر
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          </div>
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            type="products"
            title="لا توجد منتجات"
            description="هذا المتجر لا يحتوي على منتجات حالياً"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
