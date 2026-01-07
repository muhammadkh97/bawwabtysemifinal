'use client'

import Link from 'next/link'
import { ShoppingCart, Heart, User, Search, Menu, Phone, Mail, Globe, LayoutDashboard, LogOut, MessageCircle, ChevronRight, ChevronDown, Package, Zap, Star, Sparkles, AlertTriangle, LifeBuoy, ChefHat, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CurrencySelector from './CurrencySelector'
import SmartSearch from './SmartSearch'
import NotificationDropdown from './NotificationDropdown'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import { useRestaurantCart } from '@/contexts/RestaurantCartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon?: string;
  subcategories: {
    id: string;
    name: string;
    name_ar: string;
    slug: string;
    icon?: string;
  }[];
}

export default function Header() {
  const { user, userRole, loading: isLoading, isVendorStaff, isRestaurantStaff } = useAuth(); // استخدام AuthContext
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { cartCount } = useCart();
  const { restaurantItemsCount } = useRestaurantCart();
  const { wishlistCount } = useWishlist();

  // تحديث حالة تسجيل الدخول عند تغير user
  useEffect(() => {
    setIsLoggedIn(!!user);
    if (user && userRole) {
      fetchUnreadChatsCount(user.id, userRole);
    } else {
      setUnreadChatsCount(0);
    }
  }, [user, userRole]);

  // جلب التصنيفات مع الفروع
  const fetchCategories = async () => {
    try {
      console.log('🔍 [Header] بدء جلب التصنيفات...');
      
      // جلب التصنيفات الرئيسية
      const { data: mainCategories, error: mainError } = await supabase
        .from('categories')
        .select('id, name, name_ar, slug, icon')
        .is('parent_id', null)
        .order('display_order', { ascending: true });

      console.log('📊 [Header] التصنيفات الرئيسية:', mainCategories);
      console.log('📊 [Header] عدد التصنيفات:', mainCategories?.length);

      if (mainError) {
        console.error('❌ [Header] خطأ في جلب التصنيفات:', mainError);
        throw mainError;
      }

      if (!mainCategories || mainCategories.length === 0) {
        console.log('⚠️ [Header] لا توجد تصنيفات في قاعدة البيانات');
        setCategories([]);
        return;
      }

      // جلب التصنيفات الفرعية لكل تصنيف رئيسي
      const categoriesWithSubs = await Promise.all(
        (mainCategories || []).map(async (category: any) => {
          const { data: subs } = await supabase
            .from('categories')
            .select('id, name, name_ar, slug, icon')
            .eq('parent_id', category.id)
            .order('display_order', { ascending: true });

          console.log(`✅ [Header] الفروع لـ ${category.name_ar}:`, subs?.length || 0);

          return {
            ...category,
            subcategories: subs || []
          };
        })
      );

      console.log('✅ [Header] جميع التصنيفات مع الفروع:', categoriesWithSubs);
      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error('❌ خطأ في جلب التصنيفات:', error);
      setCategories([]);
    }
  };

  // جلب عدد الرسائل غير المقروءة
  const fetchUnreadChatsCount = async (userId: string, role: string) => {
    try {
      if (role === 'customer') {
        const { data, error } = await supabase
          .from('chats')
          .select('customer_unread_count')
          .eq('customer_id', userId)
          .eq('is_active', true);

        if (error) throw error;
        const totalUnread = data?.reduce((sum, chat) => sum + (chat.customer_unread_count || 0), 0) || 0;
        setUnreadChatsCount(totalUnread);
      } else if (role === 'vendor') {
        const { data: vendorData, error: vendorError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (vendorError) {
          console.log('لم يتم العثور على بيانات البائع');
          return;
        }

        if (!vendorData) {
          console.log('لم يتم العثور على بيانات البائع');
          return;
        }

        const { data, error } = await supabase
          .from('chats')
          .select('vendor_unread_count')
          .eq('vendor_id', vendorData.id)
          .eq('is_active', true);

        if (error) throw error;
        const totalUnread = data?.reduce((sum, chat) => sum + (chat.vendor_unread_count || 0), 0) || 0;
        setUnreadChatsCount(totalUnread);
      }
    } catch (error) {
      console.error('خطأ في جلب عدد الرسائل غير المقروءة:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsLoggedIn(false);
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const getDashboardUrl = () => {
    // إذا كان مساعد بائع أو مطعم، نوجهه إلى لوحة التحكم المناسبة
    if (isVendorStaff) return '/dashboard/vendor';
    if (isRestaurantStaff) return '/dashboard/restaurant';
    
    // إذا كان مستخدم عادي، نفحص الدور
    switch (userRole) {
      case 'admin': return '/dashboard/admin';
      case 'vendor': return '/dashboard/vendor';
      case 'driver': return '/dashboard/driver';
      case 'restaurant': return '/dashboard/restaurant';
      default: return '/auth/login';
    }
  };

  return (
    <header className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
      {/* Top Bar */}
      <div className="hidden md:block text-white py-1.5" style={{ background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)' }}>
        <div className="container mx-auto px-3 sm:px-4 md:px-8 flex justify-between items-center text-[12px] font-medium max-w-full">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors cursor-pointer">
              <Phone className="w-3.5 h-3.5" />
              <span>+970-59-XXXXXXX</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white/80 transition-colors cursor-pointer">
              <Mail className="w-3.5 h-3.5" />
              <span>support@bawwabty.com</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/my-tickets" className="flex items-center gap-2 hover:text-white/80 transition-colors cursor-pointer">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>تذاكري</span>
            </Link>
            <Link href="/complaints" className="flex items-center gap-2 hover:text-white/80 transition-colors cursor-pointer">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>الشكاوي</span>
            </Link>
            <div className="h-3 w-[1px] bg-white/20"></div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>شحن مجاني للطلبات فوق 200₪</span>
            </div>
            <div className="h-3 w-[1px] bg-white/20"></div>
            <div className="flex items-center gap-2 cursor-pointer hover:underline">
              <Globe className="w-3.5 h-3.5" />
              <span>العربية</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-3 sm:px-4 md:px-8 py-2 sm:py-3 md:py-4 max-w-full">
        <div className="flex items-center justify-between gap-2 md:gap-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <div className="text-xl sm:text-2xl md:text-4xl group-hover:scale-110 transition-transform duration-300">🛍️</div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl md:text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-transparent bg-clip-text tracking-tighter">بوابتي</h1>
              <span className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Premium Store</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl items-center gap-3">
            <div className="flex-1">
              <SmartSearch />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-5">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {isLoggedIn && <NotificationDropdown />}
              
              {/* Currency Selector */}
              <div className="hidden lg:block">
                <CurrencySelector />
              </div>

              <Link href="/wishlist" className="relative group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                  <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-red-500 group-hover:text-red-600 transition-colors" />
                </div>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 sm:px-1.5 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-lg border-2 border-white">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* سلة المطاعم */}
              <Link href="/restaurant-cart" className="relative group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                  <UtensilsCrossed className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-orange-600 group-hover:text-orange-700 transition-colors" />
                </div>
                {restaurantItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 sm:px-1.5 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg border-2 border-white">
                    {restaurantItemsCount > 99 ? '99+' : restaurantItemsCount}
                  </span>
                )}
              </Link>

              {/* سلة المنتجات */}
              <Link href="/cart" className="relative group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                  <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-purple-600 group-hover:text-purple-700 transition-colors" />
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 sm:px-1.5 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg border-2 border-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

            </div>

            <div className="h-6 sm:h-8 w-[1px] bg-gray-100 hidden md:block"></div>
            
            {!isLoggedIn ? (
              <Link
                href="/auth/login"
                className="flex items-center gap-1 px-2.5 sm:px-3 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-white rounded-lg md:rounded-2xl transition-all duration-300 font-bold text-[10px] sm:text-xs md:text-sm hover:shadow-xl hover:shadow-purple-500/20"
                style={{ background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 100%)' }}
              >
                <span>دخول</span>
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-current" />
              </Link>
            ) : (
              <div className="relative">
                {/* User Menu - Unified for Mobile and Desktop */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1 p-0.5 pr-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-300 border border-gray-100"
                  >
                    <ChevronDown className={`w-3 h-3 text-gray-700 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* القائمة المنسدلة */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <>  
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        
                        {/* القائمة */}
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="fixed right-2 top-[70px] w-[calc(100vw-16px)] max-w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                        >
                          {/* لوحة التحكم - للـ admin/vendor/driver أو المساعدين */}
                          {((userRole && userRole !== 'customer') || isVendorStaff || isRestaurantStaff) && (
                            <Link
                              href={getDashboardUrl()}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100"
                            >
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 100%)' }}>
                                <LayoutDashboard className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 text-right">
                                <p className="text-sm font-bold text-gray-900">لوحة التحكم</p>
                                <p className="text-xs text-gray-500">إدارة حسابك</p>
                              </div>
                            </Link>
                          )}

                          {/* الملف الشخصي */}
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-sm font-bold text-gray-900">حسابي</p>
                              <p className="text-xs text-gray-500">البيانات الشخصية</p>
                            </div>
                          </Link>

                          {/* الدردشات */}
                          <Link
                            href="/chats"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative">
                              <MessageCircle className="w-5 h-5 text-white" />
                              {unreadChatsCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[8px] font-black text-white bg-red-500 rounded-full border border-white">
                                  {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-sm font-bold text-gray-900">الدردشات</p>
                              <p className="text-xs text-gray-500">رسائلك ومحادثاتك</p>
                            </div>
                          </Link>

                          {/* طلباتي */}
                          <Link
                            href="/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-sm font-bold text-gray-900">طلباتي</p>
                              <p className="text-xs text-gray-500">متابعة الطلبات</p>
                            </div>
                          </Link>

                          {/* تسجيل الخروج */}
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                              <LogOut className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-sm font-bold text-red-600">تسجيل الخروج</p>
                              <p className="text-xs text-red-400">الخروج من الحساب</p>
                            </div>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden mt-3">
          <SmartSearch />
        </div>
      </div>

      {/* Navigation Desktop */}
      <nav className="border-t hidden md:block bg-white/50">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-10 py-3">
            <li>
              <Link href="/" className="text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                الرئيسية
              </Link>
            </li>
            <li className="relative group">
              <button className="text-sm font-bold text-gray-700 group-hover:text-purple-600 transition-all flex items-center gap-2 py-2">
                الفئات
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              {/* Mega Menu */}
              <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[32px] border border-gray-100 overflow-hidden flex" style={{ width: '900px' }}>
                  {/* Sidebar Categories */}
                  <div className="w-1/3 bg-gray-50/50 p-6 border-l border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        الأقسام
                      </h3>
                      <Link href="/categories" className="text-xs font-bold text-purple-600 hover:underline">عرض الكل</Link>
                    </div>
                    <div className="space-y-1">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onMouseEnter={() => setHoveredCategory(category.id)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 ${
                            hoveredCategory === category.id 
                            ? 'bg-white shadow-md text-purple-600 scale-[1.02] border border-purple-100' 
                            : 'text-gray-600 hover:bg-white/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{category.icon || '📦'}</span>
                            <span className="font-bold text-sm">{category.name_ar || category.name}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${hoveredCategory === category.id ? 'translate-x-[-4px]' : 'opacity-0'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subcategories Content */}
                  <div className="flex-1 p-8 bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
                    
                    <AnimatePresence mode="wait">
                      {hoveredCategory ? (
                        <motion.div
                          key={hoveredCategory}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="relative z-10"
                        >
                          {categories.find(c => c.id === hoveredCategory)?.subcategories.length ? (
                            <>
                              <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-200">
                                  {categories.find(c => c.id === hoveredCategory)?.icon || '📦'}
                                </div>
                                <div>
                                  <h4 className="text-2xl font-black text-gray-900">
                                    {categories.find(c => c.id === hoveredCategory)?.name_ar}
                                  </h4>
                                  <p className="text-sm text-gray-500 font-medium">اكتشف أحدث المنتجات في هذا القسم</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                {categories.find(c => c.id === hoveredCategory)?.subcategories.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={`/products?category=${hoveredCategory}&subcategory=${sub.id}`}
                                    className="group/sub flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:border-purple-100 hover:bg-purple-50/30 transition-all duration-300"
                                  >
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm group-hover/sub:scale-110 transition-transform">
                                      {sub.icon || '✨'}
                                    </div>
                                    <div>
                                      <span className="block font-bold text-gray-800 group-hover/sub:text-purple-600 transition-colors">
                                        {sub.name_ar || sub.name}
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">تصفح الآن</span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                              
                              <Link
                                href={`/products?category=${hoveredCategory}`}
                                className="mt-8 inline-flex items-center gap-2 text-sm font-black text-purple-600 hover:gap-3 transition-all"
                              >
                                عرض جميع منتجات {categories.find(c => c.id === hoveredCategory)?.name_ar}
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Package className="w-10 h-10 text-gray-300" />
                              </div>
                              <h4 className="text-lg font-bold text-gray-900 mb-2">لا توجد أقسام فرعية</h4>
                              <p className="text-sm text-gray-500 mb-6">يمكنك تصفح جميع المنتجات في هذا القسم مباشرة</p>
                              <Link
                                href={`/products?category=${hoveredCategory}`}
                                className="px-8 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
                              >
                                تصفح المنتجات
                              </Link>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-24 h-24 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <Star className="w-12 h-12 text-purple-400 fill-purple-400" />
                          </div>
                          <h4 className="text-xl font-black text-gray-900 mb-2">اختر قسماً للتصفح</h4>
                          <p className="text-sm text-gray-500 max-w-xs">مرر الماوس فوق الأقسام الجانبية لاستكشاف الفئات الفرعية والمنتجات المميزة</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <Link href="/products" className="text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors">المنتجات</Link>
            </li>
            <li>
              <Link href="/restaurants" className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-1.5">
                <ChefHat className="w-4 h-4" />
                المطاعم
              </Link>
            </li>
            <li>
              <Link href="/vendors" className="text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors">المتاجر</Link>
            </li>
            <li>
              <Link href="/deals" className="text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors flex items-center gap-1">
                <Zap className="w-4 h-4 fill-current" />
                العروض اليومية
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
