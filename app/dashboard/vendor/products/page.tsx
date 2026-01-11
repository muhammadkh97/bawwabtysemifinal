'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BulkUploadModal from '@/components/BulkUploadModal';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import PermissionGuard from '@/components/PermissionGuard';
import { Package, Plus, Search, Edit, TrendingUp, Trash2, FileUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: 'approved' | 'pending' | 'draft';
  total_sales: number;
  images: string[];
  featured_image: string | null;
}

export default function VendorProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { userId } = useAuth();

  // جلب قيمة البحث من URL
  useEffect(() => {
    const urlSearch = searchParams?.get('search');
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    if (userId) {
      fetchVendorProducts();
    }
  }, [userId]);

  const fetchVendorProducts = async () => {
    if (!userId) {
      return;
    }
    
    try {
      setLoading(true);

      // Get store ID (vendor_id)
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('user_id', userId)
        .maybeSingle();

      if (storeError) {
        logger.error('Error fetching store', { error: storeError.message, component: 'VendorProductsPage', userId });
        throw storeError;
      }

      if (!storeData) {
        logger.error('Store not found', { component: 'VendorProductsPage', userId });
        setLoading(false);
        return;
      }

      setVendorId(storeData.id);

      // Fetch store's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, stock, status, total_sales, images, featured_image')
        .eq('vendor_id', storeData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        logger.error('Error fetching products', { error: productsError.message, component: 'VendorProductsPage', vendorId: storeData.id });
        throw productsError;
      }

      setProducts(productsData || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Unexpected error in products page', { error: errorMessage, component: 'VendorProductsPage' });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'all' || product.status === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}>منشور</span>;
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBB024' }}>قيد المراجعة</span>;
      case 'draft':
        return <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#94A3B8' }}>مسودة</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-6 lg:px-8 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">إدارة المنتجات</h1>
              <p className="text-gray-600 text-lg">أضف وعدل منتجاتك</p>
            </div>
            <a
              href="/dashboard/vendor/products/new"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
            >
              <Plus className="w-5 h-5" />
              <span>إضافة منتج جديد</span>
            </a>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mb-6"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="search"
                    placeholder="ابحث عن منتج..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-12 px-4 py-3 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(98, 54, 255, 0.3)',
                    }}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'all'
                      ? 'text-white'
                      : 'text-purple-300 hover:text-white'
                  }`}
                  style={filter === 'all' ? { background: 'linear-gradient(135deg, #6236FF, #FF219D)' } : { background: 'rgba(255,255,255,0.05)' }}
                >
                  الكل ({products.length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'approved'
                      ? 'text-white'
                      : 'text-purple-300 hover:text-white'
                  }`}
                  style={filter === 'approved' ? { background: 'rgba(34, 197, 94, 0.3)' } : { background: 'rgba(255,255,255,0.05)' }}
                >
                  منشور ({products.filter(p => p.status === 'approved').length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'pending'
                      ? 'text-white'
                      : 'text-purple-300 hover:text-white'
                  }`}
                  style={filter === 'pending' ? { background: 'rgba(251, 191, 36, 0.3)' } : { background: 'rgba(255,255,255,0.05)' }}
                >
                  قيد المراجعة ({products.filter(p => p.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('draft')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === 'draft'
                      ? 'text-white'
                      : 'text-purple-300 hover:text-white'
                  }`}
                  style={filter === 'draft' ? { background: 'rgba(148, 163, 184, 0.3)' } : { background: 'rgba(255,255,255,0.05)' }}
                >
                  مسودة ({products.filter(p => p.status === 'draft').length})
                </button>
              </div>
            </div>
          </motion.div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 rounded-2xl"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
              }}
            >
              <Package className="w-20 h-20 mx-auto mb-4 text-purple-400" />
              <h3 className="text-2xl font-bold text-white mb-2">لا توجد منتجات</h3>
              <p className="text-purple-300 mb-6">ابدأ بإضافة منتجك الأول!</p>
              <a
                href="/dashboard/vendor/products/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
              >
                <Plus className="w-5 h-5" />
                <span>إضافة منتج جديد</span>
              </a>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => {
                const productImage = product.images?.[0] || product.featured_image || null;
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl overflow-hidden transition-all hover:scale-105"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)',
                    }}
                  >
                    {/* Product Image */}
                    <div
                      className="aspect-square flex items-center justify-center overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.2), rgba(255, 33, 157, 0.2))' }}
                    >
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-20 h-20 text-purple-300" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg text-white line-clamp-2">{product.name}</h3>
                        {getStatusBadge(product.status)}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">السعر:</span>
                          <span className="font-bold text-green-400">{product.price} ₪</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">المخزون:</span>
                          <span className={`font-semibold ${
                            product.stock === 0 ? 'text-red-400' :
                            product.stock < 10 ? 'text-orange-400' :
                            'text-white'
                          }`}>
                            {product.stock} وحدة
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">المبيعات:</span>
                          <span className="font-semibold text-white">{product.total_sales || 0} مبيعة</span>
                        </div>
                      </div>

                      {/* Stock Warning */}
                      {product.stock < 10 && product.stock > 0 && (
                        <div className="rounded-lg px-3 py-2 text-xs mb-3" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBB024' }}>
                          ⚠️ المخزون منخفض
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="rounded-lg px-3 py-2 text-xs mb-3" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}>
                          ❌ نفذت الكمية
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/vendor/products/edit/${product.id}`)}
                          className="flex-1 px-4 py-2 text-white text-sm rounded-lg font-medium transition-all hover:shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                        >
                          <Edit className="w-4 h-4 inline mr-1" />
                          تعديل
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg transition-all hover:shadow-lg"
                          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                              const { error } = await supabase
                                .from('products')
                                .delete()
                                .eq('id', product.id);
                              
                              if (!error) {
                                fetchVendorProducts();
                              }
                            }
                          }}
                          className="px-4 py-2 rounded-lg transition-all hover:shadow-lg"
                          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Bulk Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.2), rgba(255, 33, 157, 0.2))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <FileUp className="w-5 h-5" />
                  رفع جماعي للمنتجات
                </h3>
                <p className="text-purple-300">قم برفع مئات المنتجات مرة واحدة باستخدام ملف Excel أو CSV</p>
              </div>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
              >
                📄 رفع ملف
              </button>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && vendorId && (
        <BulkUploadModal
          vendorId={vendorId}
          onSuccess={() => {
            fetchVendorProducts();
            setShowBulkUpload(false);
          }}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
}

