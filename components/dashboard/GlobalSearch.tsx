'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, ShoppingBag, User, Truck, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface SearchResult {
  id: string;
  type: 'order' | 'product' | 'user' | 'driver';
  title: string;
  subtitle: string;
  link: string;
  icon: any;
  metadata?: any;
}

interface GlobalSearchProps {
  userRole: 'admin' | 'vendor' | 'restaurant' | 'driver';
  userId?: string;
}

export default function GlobalSearch({ userRole, userId }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search Orders
      if (userRole === 'admin' || userRole === 'vendor' || userRole === 'restaurant') {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number, status, total_amount, created_at, user:users(full_name)')
          .or(`order_number.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`)
          .limit(5);

        orders?.forEach(order => {
          searchResults.push({
            id: order.id,
            type: 'order',
            title: `طلب #${order.order_number}`,
            subtitle: `${order.status} - ${order.total_amount} د.أ`,
            link: `/${userRole === 'admin' ? 'admin' : 'dashboard'}/orders/${order.id}`,
            icon: ShoppingBag,
            metadata: order
          });
        });
      }

      // Search Products
      if (userRole === 'admin' || userRole === 'vendor' || userRole === 'restaurant') {
        let productQuery = supabase
          .from('products')
          .select('id, name, name_ar, price, stock')
          .or(`name.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%`)
          .limit(5);

        // Filter by vendor/restaurant
        if (userRole === 'vendor' && userId) {
          productQuery = productQuery.eq('vendor_id', userId);
        } else if (userRole === 'restaurant' && userId) {
          productQuery = productQuery.eq('restaurant_id', userId);
        }

        const { data: products } = await productQuery;

        products?.forEach(product => {
          searchResults.push({
            id: product.id,
            type: 'product',
            title: product.name_ar || product.name,
            subtitle: `${product.price} د.أ - متوفر: ${product.stock}`,
            link: `/${userRole === 'admin' ? 'admin' : 'dashboard'}/products/${product.id}`,
            icon: Package,
            metadata: product
          });
        });
      }

      // Search Users (Admin only)
      if (userRole === 'admin') {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email, role, phone')
          .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
          .limit(5);

        users?.forEach(user => {
          searchResults.push({
            id: user.id,
            type: 'user',
            title: user.full_name,
            subtitle: `${user.email} - ${user.role}`,
            link: `/admin/users/${user.id}`,
            icon: User,
            metadata: user
          });
        });
      }

      // Search Drivers (Admin only)
      if (userRole === 'admin') {
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, user:users(full_name, phone), vehicle_type, status')
          .limit(5);

        drivers?.forEach(driver => {
          const userData = Array.isArray(driver.user) ? driver.user[0] : driver.user;
          searchResults.push({
            id: driver.id,
            type: 'driver',
            title: userData?.full_name || 'سائق',
            subtitle: `${driver.vehicle_type} - ${driver.status}`,
            link: `/admin/drivers/${driver.id}`,
            icon: Truck,
            metadata: driver
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Search error'
      
      logger.error('performSearch failed', {
        error: errorMessage,
        component: 'GlobalSearch',
        userRole,
        query,
      })
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'order': return ShoppingBag;
      case 'product': return Package;
      case 'user': return User;
      case 'driver': return Truck;
      default: return Search;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'order': return 'from-blue-500 to-cyan-500';
      case 'product': return 'from-purple-500 to-pink-500';
      case 'user': return 'from-green-500 to-emerald-500';
      case 'driver': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="ابحث عن الطلبات، المنتجات، المستخدمين..."
          className="w-full pr-12 pl-12 py-3 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          style={{
            background: 'rgba(98, 54, 255, 0.1)',
            border: '1px solid rgba(98, 54, 255, 0.3)',
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full rounded-xl overflow-hidden shadow-2xl z-50"
            style={{
              background: 'rgba(15, 10, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
                <p className="text-purple-300">جاري البحث...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
                <p className="text-purple-300">
                  {query.length < 2 ? 'اكتب حرفين على الأقل للبحث' : 'لا توجد نتائج'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                <div className="px-4 py-2 text-xs text-purple-400 font-medium">
                  {results.length} نتيجة
                </div>
                {results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <Link
                      key={`${result.type}-${result.id}-${index}`}
                      href={result.link}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="block px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorForType(result.type)} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{result.title}</p>
                          <p className="text-purple-300 text-sm truncate">{result.subtitle}</p>
                        </div>
                        <div className="text-purple-400 text-xs">
                          {result.type === 'order' && 'طلب'}
                          {result.type === 'product' && 'منتج'}
                          {result.type === 'user' && 'مستخدم'}
                          {result.type === 'driver' && 'سائق'}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            {results.length > 0 && (
              <div className="border-t border-purple-500/20 p-3">
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <Clock className="w-3 h-3" />
                  <span>اضغط Enter للبحث المتقدم</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
