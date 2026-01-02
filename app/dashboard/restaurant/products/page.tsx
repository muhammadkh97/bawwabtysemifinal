'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Package, Plus, Edit, Trash2, Eye, EyeOff, Search, ChefHat } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  sale_price: number;
  images: string[];
  is_active: boolean;
  stock: number;
  created_at: string;
}

export default function RestaurantProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorId, setVendorId] = useState<string>('');

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get vendor/restaurant ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        setVendorId(vendorData.id);
        await fetchProducts(vendorData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchProducts = async (vId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ));

      alert(currentStatus ? 'تم إخفاء المنتج' : 'تم تفعيل المنتج');
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ في تحديث حالة المنتج');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <FuturisticNavbar />
      <div className="flex">
        <FuturisticSidebar role="restaurant" />
        <div className="md:mr-[280px] transition-all duration-300 w-full">
          <main className="pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2">🍽️ قائمة الطعام</h1>
                <p className="text-gray-600">إدارة الوجبات والأطباق</p>
              </div>
              <Link href="/dashboard/restaurant/products/new">
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-bold hover:shadow-lg transition">
                  <Plus className="w-5 h-5" />
                  إضافة وجبة جديدة
                </button>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن وجبة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-6 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-lg text-center">
              <ChefHat className="w-20 h-20 text-orange-600 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'لا توجد نتائج' : 'لا توجد وجبات'}
              </h2>
              <p className="text-gray-600 mb-6">
                {searchQuery ? 'جرب البحث بكلمات أخرى' : 'ابدأ بإضافة الوجبات والأطباق'}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/restaurant/products/new">
                  <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                    إضافة وجبة الآن
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-red-100">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name_ar || product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-16 h-16 text-orange-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        product.is_active 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`}>
                        {product.is_active ? '🟢 مفعل' : '⚪ معطل'}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {product.name_ar || product.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description_ar || product.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {product.sale_price && product.sale_price < product.price ? (
                          <div>
                            <span className="text-xl font-bold text-orange-600">
                              {product.sale_price} ₪
                            </span>
                            <span className="text-sm text-gray-400 line-through mr-2">
                              {product.price} ₪
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-orange-600">
                            {product.price} ₪
                          </span>
                        )}
                      </div>
                      
                      <span className="text-sm text-gray-600">
                        المخزون: {product.stock}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/dashboard/restaurant/products/edit/${product.id}`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition">
                          <Edit className="w-4 h-4" />
                          تعديل
                        </button>
                      </Link>
                      
                      <button
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                        className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                      >
                        {product.is_active ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </main>
        </div>
      </div>
    </>
  );
}

