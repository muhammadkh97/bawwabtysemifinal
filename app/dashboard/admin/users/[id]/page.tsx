'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Shield, 
  ShoppingBag, Truck, Star, ArrowLeft, CheckCircle, Ban, Clock, Store
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      // Fetch user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // If vendor, fetch vendor details
      if (userData.role === 'vendor') {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (vendorData) {
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendorData.id);

          setVendor({ ...vendorData, total_products: productsCount || 0 });
        }
      }

      // If driver, fetch driver details
      if (userData.role === 'driver') {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (driverData) {
          const { count: deliveriesCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', userId)
            .eq('status', 'delivered');

          setDriver({ ...driverData, total_deliveries: deliveriesCount || 0 });
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!user) return;
    try {
      if (user.role === 'vendor' && vendor) {
        await supabase.from('vendors').update({ status: newStatus }).eq('id', vendor.id);
      } else if (user.role === 'driver' && driver) {
        await supabase.from('drivers').update({ status: newStatus }).eq('id', driver.id);
      }
      await fetchUserDetails();
      alert('تم تحديث الحالة بنجاح');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0516]">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0516] text-white">
        <h2 className="text-2xl font-bold mb-4">المستخدم غير موجود</h2>
        <button onClick={() => router.back()} className="flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-xl">
          <ArrowLeft className="w-5 h-5" /> العودة
        </button>
      </div>
    );
  }

  const roleLabels: any = {
    admin: { label: 'مدير النظام', color: 'from-red-500 to-orange-500', icon: Shield },
    vendor: { label: 'تاجر / بائع', color: 'from-emerald-500 to-teal-500', icon: Store },
    driver: { label: 'سائق توصيل', color: 'from-blue-500 to-cyan-500', icon: Truck },
    customer: { label: 'عميل', color: 'from-purple-500 to-pink-500', icon: User }
  };

  const currentRole = roleLabels[user.role] || roleLabels.customer;
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-[#0A0516] text-white overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 bg-[#6236FF]" />
      </div>

      <FuturisticSidebar role="admin" />
      
      <div className="md:mr-[280px] transition-all duration-300 relative z-10">
        <FuturisticNavbar userName="" userRole="مدير" notificationCount={0} />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 max-w-[1800px] mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>العودة لقائمة المستخدمين</span>
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
              <div className="rounded-3xl p-8 sticky top-24" style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)'
              }}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentRole.color} p-1 mb-6`}>
                    <div className="w-full h-full rounded-full bg-[#0F0A1E] flex items-center justify-center overflow-hidden">
                      <RoleIcon className="w-16 h-16 text-purple-300" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{user.full_name || user.name}</h2>
                  <span className={`px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${currentRole.color} text-white mb-6`}>
                    {currentRole.label}
                  </span>

                  <div className="w-full space-y-4 text-right">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <Mail className="w-5 h-5 text-purple-400" />
                      <div className="overflow-hidden text-right">
                        <p className="text-xs text-purple-300">البريد الإلكتروني</p>
                        <p className="text-sm truncate">{user.email}</p>
                      </div>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                        <Phone className="w-5 h-5 text-purple-400" />
                        <div className="text-right">
                          <p className="text-xs text-purple-300">رقم الهاتف</p>
                          <p className="text-sm">{user.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      <div className="text-right">
                        <p className="text-xs text-purple-300">تاريخ الانضمام</p>
                        <p className="text-sm">{new Date(user.created_at).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  </div>

                  {(vendor || driver) && (
                    <div className="w-full grid grid-cols-2 gap-3 mt-8">
                      <button 
                        onClick={() => handleUpdateStatus('active')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" /> <span>تفعيل</span>
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus('suspended')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                      >
                        <Ban className="w-4 h-4" /> <span>حظر</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Details Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vendor && (
                  <>
                    <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
                      <ShoppingBag className="w-8 h-8 text-blue-400 mb-4" />
                      <p className="text-purple-300 text-sm mb-1">عدد المنتجات</p>
                      <p className="text-2xl font-bold">{vendor.total_products}</p>
                    </div>
                    <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
                      <Clock className="w-8 h-8 text-emerald-400 mb-4" />
                      <p className="text-purple-300 text-sm mb-1">نسبة العمولة</p>
                      <p className="text-2xl font-bold">{vendor.commission_rate || 0}%</p>
                    </div>
                    <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
                      <Star className="w-8 h-8 text-yellow-400 mb-4" />
                      <p className="text-purple-300 text-sm mb-1">الحالة</p>
                      <p className="text-2xl font-bold">{vendor.status === 'active' ? 'نشط' : 'معلق'}</p>
                    </div>
                  </>
                )}
                {driver && (
                  <>
                    <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
                      <Truck className="w-8 h-8 text-blue-400 mb-4" />
                      <p className="text-purple-300 text-sm mb-1">إجمالي التوصيلات</p>
                      <p className="text-2xl font-bold">{driver.total_deliveries}</p>
                    </div>
                    <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
                      <Star className="w-8 h-8 text-yellow-400 mb-4" />
                      <p className="text-purple-300 text-sm mb-1">التقييم</p>
                      <p className="text-2xl font-bold">{driver.rating || 0}</p>
                    </div>
                    <div className="rounded-3xl p-6 bg-white/5 border border-white/10">
                      <Shield className="w-8 h-8 text-purple-400 mb-4" />
                      <p className="text-purple-300 text-sm mb-1">الحالة</p>
                      <p className="text-2xl font-bold">{driver.status === 'active' ? 'نشط' : 'معلق'}</p>
                    </div>
                  </>
                )}
                {!vendor && !driver && (
                  <div className="col-span-3 rounded-3xl p-8 bg-white/5 border border-white/10 text-center">
                    <User className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-300">هذا المستخدم مسجل كعميل عادي</p>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {(vendor || driver) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-8 bg-white/5 border border-white/10">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-400" />
                    <span>معلومات إضافية</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vendor && (
                      <>
                        <div>
                          <p className="text-xs text-purple-300 mb-1">اسم المتجر</p>
                          <p className="font-bold">{vendor.store_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-purple-300 mb-1">وصف المتجر</p>
                          <p className="text-sm">{vendor.store_description || 'لا يوجد وصف'}</p>
                        </div>
                      </>
                    )}
                    {driver && (
                      <>
                        <div>
                          <p className="text-xs text-purple-300 mb-1">نوع المركبة</p>
                          <p className="font-bold">{driver.vehicle_type || 'غير محدد'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-purple-300 mb-1">رقم المركبة</p>
                          <p className="font-bold">{driver.vehicle_number || 'غير محدد'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
