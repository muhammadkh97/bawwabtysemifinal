'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface FollowedStore {
  vendor_id: string;
  store_name: string;
  logo_url: string | null;
  description: string | null;
  followed_at: string;
  products_count: number;
  followers_count: number;
}

interface StoreFollowContextType {
  followedStores: FollowedStore[];
  loading: boolean;
  followStore: (vendorId: string) => Promise<boolean>;
  unfollowStore: (vendorId: string) => Promise<boolean>;
  isFollowing: (vendorId: string) => boolean;
  getFollowersCount: (vendorId: string) => Promise<number>;
  refreshFollowedStores: () => Promise<void>;
}

const StoreFollowContext = createContext<StoreFollowContextType | undefined>(undefined);

export function StoreFollowProvider({ children }: { children: ReactNode }) {
  const { user, userId, userRole } = useAuth();
  const [followedStores, setFollowedStores] = useState<FollowedStore[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب المتاجر المتابعة عند تحميل الصفحة
  useEffect(() => {
    if (userId && userRole === 'customer') {
      fetchFollowedStores();
    } else {
      setLoading(false);
    }
  }, [userId, userRole]);

  // جلب قائمة المتاجر المتابعة
  const fetchFollowedStores = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('store_followers')
        .select(`
          vendor_id,
          created_at,
          vendors:vendor_id (
            id,
            store_name,
            logo_url,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // تنسيق البيانات
      const formattedStores = await Promise.all(
        (data || []).map(async (item: any) => {
          const vendor = item.vendors;
          
          // حساب عدد المنتجات
          const { count: productsCount } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id)
            .eq('is_active', true);

          // حساب عدد المتابعين
          const { count: followersCount } = await supabase
            .from('store_followers')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id);

          return {
            vendor_id: vendor.id,
            store_name: vendor.store_name,
            logo_url: vendor.logo_url,
            description: vendor.description,
            followed_at: item.created_at,
            products_count: productsCount || 0,
            followers_count: followersCount || 0
          };
        })
      );

      setFollowedStores(formattedStores);
    } catch (error) {
      console.error('Error fetching followed stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // متابعة متجر
  const followStore = async (vendorId: string): Promise<boolean> => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    if (userRole !== 'customer') {
      toast.error('هذه الميزة متاحة للعملاء فقط');
      return false;
    }

    try {
      const { error } = await supabase
        .from('store_followers')
        .insert({
          user_id: userId,
          vendor_id: vendorId
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('أنت تتابع هذا المتجر بالفعل');
          return false;
        }
        throw error;
      }

      toast.success('تمت متابعة المتجر بنجاح! 🎉');
      await fetchFollowedStores();
      return true;
    } catch (error) {
      console.error('Error following store:', error);
      toast.error('فشلت عملية المتابعة');
      return false;
    }
  };

  // إلغاء متابعة متجر
  const unfollowStore = async (vendorId: string): Promise<boolean> => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      const { error } = await supabase
        .from('store_followers')
        .delete()
        .eq('user_id', userId)
        .eq('vendor_id', vendorId);

      if (error) throw error;

      toast.success('تم إلغاء المتابعة بنجاح');
      await fetchFollowedStores();
      return true;
    } catch (error) {
      console.error('Error unfollowing store:', error);
      toast.error('فشلت عملية إلغاء المتابعة');
      return false;
    }
  };

  // التحقق من متابعة متجر
  const isFollowing = (vendorId: string): boolean => {
    return followedStores.some(store => store.vendor_id === vendorId);
  };

  // الحصول على عدد متابعي متجر
  const getFollowersCount = async (vendorId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('store_followers')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendorId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting followers count:', error);
      return 0;
    }
  };

  // تحديث القائمة يدوياً
  const refreshFollowedStores = async () => {
    await fetchFollowedStores();
  };

  const value: StoreFollowContextType = {
    followedStores,
    loading,
    followStore,
    unfollowStore,
    isFollowing,
    getFollowersCount,
    refreshFollowedStores
  };

  return (
    <StoreFollowContext.Provider value={value}>
      {children}
    </StoreFollowContext.Provider>
  );
}

export function useStoreFollow() {
  const context = useContext(StoreFollowContext);
  if (context === undefined) {
    throw new Error('useStoreFollow must be used within a StoreFollowProvider');
  }
  return context;
}
