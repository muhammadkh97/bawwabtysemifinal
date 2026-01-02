'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { CheckCircle, XCircle, Store, Package, Truck, FileText, Phone, Mail, Calendar, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ApprovalsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'vendors' | 'products' | 'drivers' | null;
  
  const [activeTab, setActiveTab] = useState<'vendors' | 'products' | 'drivers'>(tabParam || 'vendors');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // تحديث التبويب النشط عند تغيير معامل URL
    if (tabParam && ['vendors', 'products', 'drivers'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      // جلب المنتجات المعلقة
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          category_id,
          description,
          stock,
          images,
          created_at,
          vendor_id,
          categories!products_category_id_fkey (
            name,
            name_ar
          ),
          vendors!products_vendor_id_fkey (
            shop_name,
            shop_name_ar,
            user_id,
            users!vendors_user_id_fkey (name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('📦 المنتجات المعلقة:', products);
      console.log('❌ خطأ في جلب المنتجات:', productsError);

      if (products) {
        setPendingProducts(products.map((p: any) => ({
          id: p.id,
          name: p.name,
          vendor_name: p.vendors?.shop_name_ar || p.vendors?.shop_name || p.vendors?.users?.name || 'بائع',
          price: p.price,
          category: p.categories?.name_ar || p.categories?.name || 'غير محدد',
          images: p.images || [],
          description: p.description,
          stock: p.stock,
          created_at: p.created_at
        })));
      }

      // TODO: جلب البائعين والسائقين المعلقين عند إضافة جداولهم
      
    } catch (error) {
      console.error('Error fetching pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const openImage = (url: string) => {
    setSelectedImage(url);
  };

  const handleApprove = async (type: string, id: string) => {
    try {
      if (type === 'product') {
        const { error } = await supabase
          .from('products')
          .update({ status: 'approved' })
          .eq('id', id);

        if (error) throw error;
        
        alert('✅ تمت الموافقة على المنتج بنجاح!');
        fetchPendingItems(); // إعادة تحميل القائمة
      }
      // TODO: إضافة معالجة البائعين والسائقين
    } catch (error) {
      console.error('Error approving:', error);
      alert('❌ حدث خطأ أثناء الموافقة');
    }
  };

  const handleReject = async (type: string, id: string) => {
    const reason = prompt('يرجى إدخال سبب الرفض:');
    if (!reason) return;

    try {
      if (type === 'product') {
        const { error } = await supabase
          .from('products')
          .update({ 
            status: 'rejected',
            rejection_reason: reason 
          })
          .eq('id', id);

        if (error) throw error;
        
        alert('❌ تم رفض المنتج');
        fetchPendingItems();
      }
      // TODO: إضافة معالجة البائعين والسائقين
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('❌ حدث خطأ أثناء الرفض');
    }
  };

  const TabButton = ({ value, label, count, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all ${
        activeTab === value
          ? 'text-white shadow-lg'
          : 'text-purple-300 hover:text-white'
      }`}
      style={activeTab === value ? {
        background: 'linear-gradient(90deg, #6236FF, #FF219D)'
      } : {}}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      <span className="px-2 py-1 rounded-full text-xs"
        style={{
          background: activeTab === value ? 'rgba(255,255,255,0.2)' : 'rgba(98, 54, 255, 0.3)'
        }}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="admin" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="مدير" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          {/* العنوان */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">الموافقات والمراجعات</h1>
            <p className="text-purple-300 text-lg">راجع ووافق على البائعين والمنتجات والمناديب الجدد</p>
          </motion.div>

          {/* التبويبات */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <TabButton value="vendors" label="البائعين" count={pendingVendors.length} icon={Store} />
            <TabButton value="products" label="المنتجات" count={pendingProducts.length} icon={Package} />
            <TabButton value="drivers" label="المناديب" count={pendingDrivers.length} icon={Truck} />
          </div>

          {/* محتوى التبويبات */}
          <AnimatePresence mode="wait">
            {/* Vendors Tab */}
            {activeTab === 'vendors' && (
              <motion.div
                key="vendors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {pendingVendors.map((vendor, index) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl p-6"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                            style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}>
                            🏪
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{vendor.shop_name}</h3>
                            <p className="text-purple-300">{vendor.name}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Mail className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">البريد الإلكتروني</p>
                              <p className="text-white font-medium">{vendor.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Phone className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">رقم الهاتف</p>
                              <p className="text-white font-medium">{vendor.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Calendar className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">تاريخ التقديم</p>
                              <p className="text-white font-medium">{vendor.created_at}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <FileText className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">الوثائق</p>
                              <p className="text-white font-medium">{vendor.documents.length} وثيقة</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-purple-300 mb-3 text-sm">الوثائق المرفقة:</p>
                      <div className="flex gap-3">
                        {vendor.documents.map((doc: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => openImage(doc)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:shadow-lg transition"
                            style={{ background: 'rgba(98, 54, 255, 0.3)' }}
                          >
                            <Eye className="w-4 h-4" />
                            <span>الوثيقة {idx + 1}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleApprove('vendor', vendor.id)}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-green-500/50"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>قبول البائع</span>
                      </button>
                      <button
                        onClick={() => handleReject('vendor', vendor.id)}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-red-500/50"
                        style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                      >
                        <XCircle className="w-5 h-5" />
                        <span>رفض البائع</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {pendingVendors.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 rounded-2xl"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    <div className="text-7xl mb-4">✅</div>
                    <p className="text-xl text-purple-300">لا توجد طلبات بائعين معلقة</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {pendingProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl p-6"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    {/* صورة المنتج */}
                    <div className="aspect-video rounded-xl mb-4 overflow-hidden flex items-center justify-center relative"
                      style={{ background: 'rgba(98, 54, 255, 0.1)' }}>
                      {product.images && product.images.length > 0 ? (
                        <Image 
                          src={product.images[0]} 
                          alt={product.name}
                          fill
                          className="object-cover cursor-pointer hover:scale-105 transition"
                          onClick={() => openImage(product.images[0])}
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      ) : (
                        <span className="text-7xl">📦</span>
                      )}
                    </div>
                    
                    {/* معرض الصور الإضافية */}
                    {product.images && product.images.length > 1 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {product.images.slice(1, 5).map((img: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:scale-110 transition flex-shrink-0"
                            style={{ border: '2px solid rgba(98, 54, 255, 0.3)' }}
                            onClick={() => openImage(img)}
                          >
                            <Image
                              src={img}
                              alt={`${product.name} ${idx + 2}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ))}
                        {product.images.length > 5 && (
                          <div className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: 'rgba(98, 54, 255, 0.3)' }}>
                            +{product.images.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <h3 className="text-xl font-bold text-white mb-4">{product.name}</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-purple-300 text-sm">البائع</span>
                        <span className="text-white font-medium">{product.vendor_name}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-purple-300 text-sm">السعر</span>
                        <span className="text-2xl font-bold" style={{
                          background: 'linear-gradient(90deg, #10B981, #059669)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {product.price} د.أ
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-purple-300 text-sm">التصنيف</span>
                        <span className="text-white font-medium">{product.category}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-purple-300 text-sm">الكمية المتاحة</span>
                        <span className="text-white font-medium">{product.stock} قطعة</span>
                      </div>
                    </div>

                    <p className="text-purple-300 text-sm mb-6 leading-relaxed">{product.description}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleApprove('product', product.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-green-500/50"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>نشر</span>
                      </button>
                      <button
                        onClick={() => handleReject('product', product.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-red-500/50"
                        style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رفض</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {pendingProducts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-2 text-center py-20 rounded-2xl"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    <div className="text-7xl mb-4">✅</div>
                    <p className="text-xl text-purple-300">لا توجد منتجات معلقة</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
              <motion.div
                key="drivers"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {pendingDrivers.map((driver, index) => (
                  <motion.div
                    key={driver.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl p-6"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                            style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}>
                            🚗
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{driver.name}</h3>
                            <p className="text-purple-300">مندوب توصيل</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Mail className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">البريد الإلكتروني</p>
                              <p className="text-white font-medium">{driver.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Phone className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">رقم الهاتف</p>
                              <p className="text-white font-medium">{driver.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Truck className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">نوع المركبة</p>
                              <p className="text-white font-medium">{driver.vehicle_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <FileText className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">رقم المركبة</p>
                              <p className="text-white font-medium">{driver.vehicle_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <FileText className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">رقم الرخصة</p>
                              <p className="text-white font-medium">{driver.license_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Calendar className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">تاريخ التقديم</p>
                              <p className="text-white font-medium">{driver.created_at}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <button 
                        onClick={() => openImage(driver.license_image)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:shadow-lg transition"
                        style={{ background: 'rgba(98, 54, 255, 0.3)' }}>
                        <Eye className="w-4 h-4" />
                        <span>عرض صورة الرخصة</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleApprove('driver', driver.id)}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-green-500/50"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>قبول المندوب</span>
                      </button>
                      <button
                        onClick={() => handleReject('driver', driver.id)}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-red-500/50"
                        style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                      >
                        <XCircle className="w-5 h-5" />
                        <span>رفض المندوب</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {pendingDrivers.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 rounded-2xl"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    <div className="text-7xl mb-4">✅</div>
                    <p className="text-xl text-purple-300">لا توجد طلبات مناديب معلقة</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* نافذة عرض الصورة */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 left-0 text-white hover:text-purple-400 transition flex items-center gap-2"
              >
                <XCircle className="w-8 h-8" />
                <span className="text-lg">إغلاق</span>
              </button>
              <div className="relative w-full" style={{ minHeight: '400px' }}>
                <Image
                  src={selectedImage}
                  alt="Document"
                  width={1200}
                  height={800}
                  className="w-full h-auto rounded-2xl"
                  style={{
                    border: '2px solid rgba(98, 54, 255, 0.5)',
                    boxShadow: '0 0 50px rgba(98, 54, 255, 0.3)'
                  }}
                  sizes="100vw"
                />
              </div>
              <div style={{
                  border: '2px solid rgba(98, 54, 255, 0.5)',
                  boxShadow: '0 0 50px rgba(98, 54, 255, 0.3)',
                  display: 'none'
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

