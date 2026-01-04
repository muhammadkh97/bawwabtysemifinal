import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface Product {
  id: string;
  name: string;
  name_ar?: string;
  price: number;
  images?: string[];
  featured_image?: string;
  vendor_id: string;
}

export interface RestaurantCartItem {
  id: string;
  user_id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  selected_variant?: any;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  restaurant_name?: string;
  restaurant_logo?: string;
}

interface RestaurantCartContextType {
  restaurantCartItems: RestaurantCartItem[];
  restaurantCartTotal: number;
  restaurantItemsCount: number;
  isLoading: boolean;
  addToRestaurantCart: (productId: string, vendorId: string, quantity?: number, specialInstructions?: string) => Promise<void>;
  removeFromRestaurantCart: (itemId: string) => Promise<void>;
  updateRestaurantCartQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateSpecialInstructions: (itemId: string, instructions: string) => Promise<void>;
  clearRestaurantCart: () => Promise<void>;
  refreshRestaurantCart: () => Promise<void>;
}

const RestaurantCartContext = createContext<RestaurantCartContextType | undefined>(undefined);

export function RestaurantCartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [restaurantCartItems, setRestaurantCartItems] = useState<RestaurantCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // حساب الإجمالي
  const restaurantCartTotal = restaurantCartItems.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + (price * item.quantity);
  }, 0);

  // عدد المنتجات
  const restaurantItemsCount = restaurantCartItems.reduce((count, item) => count + item.quantity, 0);

  // تحميل سلة المطاعم
  const loadRestaurantCart = async () => {
    if (!user) {
      setRestaurantCartItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_cart_with_details')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setRestaurantCartItems(data || []);
    } catch (error) {
      console.error('Error loading restaurant cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة إلى السلة
  const addToRestaurantCart = async (
    productId: string,
    vendorId: string,
    quantity: number = 1,
    specialInstructions?: string
  ) => {
    if (!user) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      // التحقق من وجود المنتج في السلة
      const existingItem = restaurantCartItems.find(
        item => item.product_id === productId && !item.selected_variant
      );

      if (existingItem) {
        // تحديث الكمية
        await updateRestaurantCartQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // إضافة منتج جديد
        const { error } = await supabase
          .from('restaurant_cart_items')
          .insert([{
            user_id: user.id,
            product_id: productId,
            vendor_id: vendorId,
            quantity: quantity,
            special_instructions: specialInstructions
          }]);

        if (error) throw error;
        await loadRestaurantCart();
      }
    } catch (error: any) {
      console.error('Error adding to restaurant cart:', error);
      alert('حدث خطأ في إضافة المنتج');
    }
  };

  // حذف من السلة
  const removeFromRestaurantCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setRestaurantCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from restaurant cart:', error);
      alert('حدث خطأ في حذف المنتج');
    }
  };

  // تحديث الكمية
  const updateRestaurantCartQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromRestaurantCart(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('restaurant_cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      
      setRestaurantCartItems(prev =>
        prev.map(item => item.id === itemId ? { ...item, quantity } : item)
      );
    } catch (error) {
      console.error('Error updating restaurant cart quantity:', error);
      alert('حدث خطأ في تحديث الكمية');
    }
  };

  // تحديث الملاحظات الخاصة
  const updateSpecialInstructions = async (itemId: string, instructions: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_cart_items')
        .update({ special_instructions: instructions })
        .eq('id', itemId);

      if (error) throw error;
      
      setRestaurantCartItems(prev =>
        prev.map(item => item.id === itemId ? { ...item, special_instructions: instructions } : item)
      );
    } catch (error) {
      console.error('Error updating special instructions:', error);
      alert('حدث خطأ في تحديث الملاحظات');
    }
  };

  // مسح السلة بالكامل
  const clearRestaurantCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('restaurant_cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setRestaurantCartItems([]);
    } catch (error) {
      console.error('Error clearing restaurant cart:', error);
      alert('حدث خطأ في مسح السلة');
    }
  };

  // تحديث السلة
  const refreshRestaurantCart = async () => {
    await loadRestaurantCart();
  };

  // تحميل السلة عند تسجيل الدخول
  useEffect(() => {
    loadRestaurantCart();
  }, [user]);

  // الاشتراك في التحديثات الفورية
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('restaurant_cart_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_cart_items',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadRestaurantCart();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <RestaurantCartContext.Provider
      value={{
        restaurantCartItems,
        restaurantCartTotal,
        restaurantItemsCount,
        isLoading,
        addToRestaurantCart,
        removeFromRestaurantCart,
        updateRestaurantCartQuantity,
        updateSpecialInstructions,
        clearRestaurantCart,
        refreshRestaurantCart,
      }}
    >
      {children}
    </RestaurantCartContext.Provider>
  );
}

export function useRestaurantCart() {
  const context = useContext(RestaurantCartContext);
  if (context === undefined) {
    throw new Error('useRestaurantCart must be used within a RestaurantCartProvider');
  }
  return context;
}
