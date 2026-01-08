'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    old_price?: number;
    images: string[];
    stock: number;
    rating?: number;
    vendor_name?: string;
  };
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist items
  const fetchWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products(
            id,
            name,
            price,
            old_price,
            images,
            stock,
            rating,
            vendor:vendors(store_name)
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ [WishlistContext] Fetch error:', error);
        throw error;
      }


      const mappedItems = (data || []).map(item => ({
        ...item,
        product: item.product ? {
          ...item.product,
          vendor_name: item.product.vendor?.store_name
        } : undefined
      }));

      setWishlistItems(mappedItems);
    } catch (error) {
      console.error('❌ [WishlistContext] Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  // Add to wishlist
  const addToWishlist = async (productId: string) => {
    
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      // Check if already in wishlist
      const exists = wishlistItems.some(item => item.product_id === productId);
      if (exists) {
        toast('المنتج موجود بالفعل في المفضلة', { icon: 'ℹ️' });
        return;
      }

      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          product_id: productId
        });

      if (error) {
        console.error('❌ [WishlistContext] Insert error:', error);
        throw error;
      }
      
      await fetchWishlist();
      toast.success('تمت إضافة المنتج للمفضلة');
    } catch (error) {
      console.error('❌ [WishlistContext] Error adding to wishlist:', error);
      toast.error('حدث خطأ أثناء إضافة المنتج للمفضلة');
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId: string) => {
    
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user?.id)
        .eq('product_id', productId);

      if (error) {
        console.error('❌ [WishlistContext] Delete error:', error);
        throw error;
      }
      
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      toast.success('تم حذف المنتج من المفضلة');
    } catch (error) {
      console.error('❌ [WishlistContext] Error removing from wishlist:', error);
      toast.error('حدث خطأ أثناء حذف المنتج من المفضلة');
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
