'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    vendor_name?: string;
    vendor_id?: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart items
  const fetchCart = async () => {
    if (!user) {
      console.log('ℹ️ [CartContext] No user, clearing cart');
      setCartItems([]);
      return;
    }

    try {
      console.log('🔄 [CartContext] Fetching cart for user:', user.id);
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(
            id,
            name,
            price,
            images,
            stock,
            vendor:vendors(store_name)
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ [CartContext] Fetch error:', error);
        throw error;
      }

      console.log('✅ [CartContext] Cart fetched successfully:', data?.length || 0, 'items');

      const mappedItems = (data || []).map(item => ({
        ...item,
        product: item.product ? {
          ...item.product,
          vendor_name: item.product.vendor?.store_name
        } : undefined
      }));

      setCartItems(mappedItems);
    } catch (error) {
      console.error('❌ [CartContext] Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  // Add to cart
  const addToCart = async (productId: string, quantity: number = 1) => {
    console.log('🛒 [CartContext] addToCart called', { productId, quantity, user: user?.id });
    
    if (!user) {
      console.log('❌ [CartContext] User not logged in');
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      console.log('🔍 [CartContext] Checking if item exists in cart...');
      // Check if item already in cart
      const existingItem = cartItems.find(item => item.product_id === productId);

      if (existingItem) {
        console.log('✏️ [CartContext] Item exists, updating quantity', existingItem);
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
        toast.success('تم تحديث الكمية في السلة');
      } else {
        console.log('➕ [CartContext] Adding new item to cart...');
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: quantity
          });

        if (error) {
          console.error('❌ [CartContext] Insert error:', error);
          throw error;
        }
        
        console.log('✅ [CartContext] Item added successfully');
        await fetchCart();
        toast.success('تمت إضافة المنتج للسلة بنجاح');
      }
    } catch (error) {
      console.error('❌ [CartContext] Error adding to cart:', error);
      toast.error('حدث خطأ أثناء إضافة المنتج للسلة');
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId: string) => {
    console.log('🗑️ [CartContext] removeFromCart called', { itemId });
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('❌ [CartContext] Delete error:', error);
        throw error;
      }
      
      console.log('✅ [CartContext] Item removed successfully');
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('تم حذف المنتج من السلة');
    } catch (error) {
      console.error('❌ [CartContext] Error removing from cart:', error);
      toast.error('حدث خطأ أثناء حذف المنتج من السلة');
    }
  };

  // Update quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      
      setCartItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, quantity } : item))
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('حدث خطأ أثناء تحديث الكمية');
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
