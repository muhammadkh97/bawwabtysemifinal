'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Store, Package, Users, MessageCircle, ExternalLink, Loader2, HeartOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreFollow } from '@/contexts/StoreFollowContext';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState';

export default function FollowingStoresPage() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const { followedStores, loading, unfollowStore, refreshFollowedStores } = useStoreFollow();
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'customer')) {
      router.push('/auth/login');
    }
  }, [user, userRole, authLoading, router]);

  const handleUnfollow = async (vendorId: string) => {
    setUnfollowingId(vendorId);
    await unfollowStore(vendorId);
    setUnfollowingId(null);
  };

  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const followDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - followDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'منذ لحظات';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} ${diffInMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ${diffInHours === 1 ? 'ساعة' : 'ساعات'}`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `منذ ${diffInDays} ${diffInDays === 1 ? 'يوم' : 'أيام'}`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `منذ ${diffInMonths} ${diffInMonths === 1 ? 'شهر' : 'أشهر'}`;
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">جاري تحميل المتاجر المتابعة...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
            <Heart className="w-6 h-6 text-purple-600 fill-purple-600" />
            <span className="text-purple-900 font-bold">المتاجر المتابعة</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            متاجري المفضلة
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            تابع آخر منتجات وعروض المتاجر المفضلة لديك
          </p>
        </div>

        {/* Stores Grid */}
        {followedStores.length === 0 ? (
          <EmptyState
            type="wishlist"
            title="لم تتابع أي متجر بعد"
            description="ابدأ بمتابعة متاجرك المفضلة للحصول على آخر التحديثات والعروض"
            actionLabel="تصفح المتاجر"
            actionHref="/categories"
          />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                تتابع <span className="font-bold text-purple-600">{followedStores.length}</span> متجر
              </p>
              <button
                onClick={refreshFollowedStores}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4" />
                <span>تحديث</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followedStores.map((store) => (
                <div
                  key={store.vendor_id}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  {/* Store Card */}
                  <div className="relative">
                    {/* Logo/Cover */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
                      {store.logo_url ? (
                        <Image
                          src={store.logo_url}
                          alt={store.store_name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Store className="w-24 h-24 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Unfollow Button */}
                      <button
                        onClick={() => handleUnfollow(store.vendor_id)}
                        disabled={unfollowingId === store.vendor_id}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                      >
                        {unfollowingId === store.vendor_id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <HeartOff className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-6">
                      <Link
                        href={`/vendors/${store.vendor_id}`}
                        className="group/title"
                      >
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover/title:text-purple-600 transition-colors">
                          {store.store_name}
                        </h3>
                      </Link>

                      {store.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {store.description}
                        </p>
                      )}

                      <div className="text-xs text-gray-500 mb-4">
                        متابع منذ {getTimeAgo(store.followed_at)}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Package className="w-4 h-4 text-purple-600" />
                            <span className="text-lg font-bold text-purple-600">
                              {store.products_count}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">منتج</div>
                        </div>

                        <div className="bg-pink-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="w-4 h-4 text-pink-600" />
                            <span className="text-lg font-bold text-pink-600">
                              {store.followers_count}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">متابع</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/vendors/${store.vendor_id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>زيارة المتجر</span>
                        </Link>

                        <Link
                          href={`/chats?vendor=${store.vendor_id}`}
                          className="flex items-center justify-center w-12 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
