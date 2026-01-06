'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeliveryPackages, DeliveryZone, PackageOrder } from '@/contexts/DeliveryPackagesContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import {
  Package,
  MapPin,
  Calendar,
  CheckSquare,
  Square,
  ArrowLeft,
  Loader2,
  Search,
  Store,
  User,
  DollarSign
} from 'lucide-react';

export default function CreatePackagePage() {
  const router = useRouter();
  const { zones, createPackage } = useDeliveryPackages();
  
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [availableOrders, setAvailableOrders] = useState<PackageOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (selectedZone && scheduledDate) {
      loadAvailableOrders();
    }
  }, [selectedZone, scheduledDate]);

  const loadAvailableOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, customer_id, vendor_id, status,
          total_amount, delivery_fee, delivery_address,
          delivery_lat, delivery_lng, is_ready_for_pickup,
          pickup_time, created_at,
          customer:users!orders_customer_id_fkey(id, full_name, phone),
          vendor:stores!orders_vendor_id_fkey(id, shop_name, latitude, longitude)
        `)
        .eq('delivery_type', 'scheduled')
        .eq('zone_id', selectedZone)
        .is('batch_id', null)
        .in('status', ['confirmed', 'preparing', 'ready', 'ready_for_pickup']);
      
      if (error) throw error;
      
      const transformedOrders: PackageOrder[] = (data || []).map((order: any) => ({
        ...order,
        customer: order.customer || undefined,
        vendor: order.vendor || undefined,
      }));
      
      setAvailableOrders(transformedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast.error('فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleCreate = async () => {
    if (!selectedZone || !scheduledDate) {
      toast.error('يرجى اختيار المنطقة والتاريخ');
      return;
    }

    if (selectedOrders.size === 0) {
      toast.error('يرجى اختيار طلب واحد على الأقل');
      return;
    }

    try {
      setCreating(true);
      
      const pkg = await createPackage({
        zone_id: selectedZone,
        scheduled_date: scheduledDate,
        order_ids: Array.from(selectedOrders),
      });
      
      if (pkg) {
        toast.success(`✅ تم إنشاء البكج ${pkg.batch_number}`);
        router.push(`/dashboard/admin/delivery-packages/${pkg.id}`);
      }
    } catch (error: any) {
      console.error('Error creating package:', error);
      toast.error('فشل في إنشاء البكج');
    } finally {
      setCreating(false);
    }
  };

  const filteredOrders = availableOrders.filter(order => {
    if (!searchQuery) return true;
    return (
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vendor?.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedOrdersData = availableOrders.filter(o => selectedOrders.has(o.id));
  const totalAmount = selectedOrdersData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalDeliveryFee = selectedOrdersData.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

  const selectedZoneData = zones.find(z => z.id === selectedZone);

  // Set minimum date to tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                إنشاء بكج توصيل جديد
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                اختر المنطقة والتاريخ والطلبات المراد تجميعها
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Zone and Date Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                معلومات البكج الأساسية
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline-block ml-1" />
                    المنطقة
                  </label>
                  <select
                    value={selectedZone}
                    onChange={(e) => {
                      setSelectedZone(e.target.value);
                      setSelectedOrders(new Set());
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر المنطقة...</option>
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name_ar} ({zone.cities.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline-block ml-1" />
                    تاريخ التوصيل المتوقع
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => {
                      setScheduledDate(e.target.value);
                      setSelectedOrders(new Set());
                    }}
                    min={minDateString}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {selectedZoneData && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">رسوم التوصيل</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {selectedZoneData.delivery_fee} ر.س
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">المدة المتوقعة</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {selectedZoneData.estimated_days} أيام
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Selection */}
            {selectedZone && scheduledDate && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      الطلبات المتاحة ({availableOrders.length})
                    </h3>
                    {availableOrders.length > 0 && (
                      <button
                        onClick={toggleAll}
                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                      >
                        {selectedOrders.size === filteredOrders.length ? (
                          <>
                            <CheckSquare className="w-4 h-4" />
                            <span>إلغاء الكل</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4" />
                            <span>تحديد الكل</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث برقم الطلب، العميل، أو المتجر..."
                      className="w-full pr-10 pl-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا توجد طلبات متاحة لهذه المنطقة والتاريخ</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => toggleOrder(order.id)}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedOrders.has(order.id)
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {selectedOrders.has(order.id) ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-900 dark:text-white">
                                  #{order.order_number}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  order.is_ready_for_pickup
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                }`}>
                                  {order.is_ready_for_pickup ? '✅ جاهز' : '⏳ قيد التحضير'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 mb-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <User className="w-4 h-4" />
                                  <span>{order.customer?.full_name || 'غير متوفر'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Store className="w-4 h-4" />
                                  <span>{order.vendor?.shop_name || 'غير متوفر'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {order.total_amount.toFixed(2)} ر.س
                                </span>
                                <span className="text-green-600 dark:text-green-400">
                                  + {order.delivery_fee.toFixed(2)} ر.س
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white sticky top-6">
              <h3 className="text-xl font-bold mb-6">معاينة البكج</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">عدد الطلبات</p>
                  <p className="text-3xl font-bold">{selectedOrders.size}</p>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <p className="text-blue-100 text-sm mb-1">إجمالي قيمة الطلبات</p>
                  <p className="text-2xl font-bold">{totalAmount.toFixed(2)} ر.س</p>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <p className="text-blue-100 text-sm mb-1">رسوم التوصيل</p>
                  <p className="text-2xl font-bold">{totalDeliveryFee.toFixed(2)} ر.س</p>
                </div>

                {selectedZoneData && (
                  <>
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-blue-100 text-sm mb-1">المنطقة</p>
                      <p className="font-bold">{selectedZoneData.name_ar}</p>
                    </div>

                    {scheduledDate && (
                      <div className="pt-4 border-t border-white/20">
                        <p className="text-blue-100 text-sm mb-1">التاريخ</p>
                        <p className="font-bold">
                          {new Date(scheduledDate).toLocaleDateString('ar-SA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={handleCreate}
                disabled={!selectedZone || !scheduledDate || selectedOrders.size === 0 || creating}
                className="w-full mt-6 px-6 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري الإنشاء...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    <span>إنشاء البكج</span>
                  </>
                )}
              </button>

              {(!selectedZone || !scheduledDate || selectedOrders.size === 0) && (
                <p className="text-blue-100 text-xs text-center mt-3">
                  {!selectedZone && 'اختر المنطقة أولاً'}
                  {selectedZone && !scheduledDate && 'اختر التاريخ'}
                  {selectedZone && scheduledDate && selectedOrders.size === 0 && 'اختر طلب واحد على الأقل'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
