'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeliveryPackages, DeliveryPackage, BatchStatus } from '@/contexts/DeliveryPackagesContext';
import PackageStatusBadge from '@/components/admin/delivery/PackageStatusBadge';
import { 
  Package, 
  MapPin, 
  Calendar, 
  User, 
  DollarSign, 
  Truck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  Clock,
  Phone,
  Store
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';

const OrdersMapComponent = dynamic(() => import('@/components/OrdersMapComponent'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
});

export default function PackageDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getPackageById, drivers, updatePackageStatus, assignDriver, removeOrderFromPackage, cancelPackage } = useDeliveryPackages();
  
  const [pkg, setPkg] = useState<DeliveryPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [showAssignDriver, setShowAssignDriver] = useState(false);

  useEffect(() => {
    loadPackage();
  }, [params.id]);

  const loadPackage = async () => {
    setLoading(true);
    const data = await getPackageById(params.id);
    if (data) {
      setPkg(data);
      setSelectedDriver(data.driver_id || '');
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (status: BatchStatus) => {
    if (!pkg) return;
    const success = await updatePackageStatus(pkg.id, status);
    if (success) {
      await loadPackage();
    }
  };

  const handleAssignDriver = async () => {
    if (!pkg || !selectedDriver) return;
    const success = await assignDriver(pkg.id, selectedDriver);
    if (success) {
      setShowAssignDriver(false);
      await loadPackage();
    }
  };

  const handleRemoveOrder = async (orderId: string) => {
    if (!pkg) return;
    if (confirm('هل أنت متأكد من إزالة هذا الطلب من البكج؟')) {
      const success = await removeOrderFromPackage(pkg.id, orderId);
      if (success) {
        await loadPackage();
      }
    }
  };

  const handleCancelPackage = async () => {
    if (!pkg) return;
    const reason = prompt('سبب الإلغاء (اختياري):');
    if (reason !== null) {
      const success = await cancelPackage(pkg.id, reason);
      if (success) {
        router.push('/dashboard/admin/delivery-packages');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">البكج غير موجود</h2>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  const statusActions: Record<BatchStatus, { next: BatchStatus; label: string; icon: any }[]> = {
    collecting: [
      { next: 'ready', label: 'جاهز للتوصيل', icon: CheckCircle },
    ],
    ready: [
      { next: 'assigned', label: 'تعيين سائق', icon: UserPlus },
    ],
    assigned: [
      { next: 'in_transit', label: 'بدء التوصيل', icon: Truck },
    ],
    in_transit: [
      { next: 'completed', label: 'إكمال البكج', icon: CheckCircle },
    ],
    completed: [],
    cancelled: [],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pkg.batch_number}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {pkg.zone?.name_ar} - {new Date(pkg.scheduled_date).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PackageStatusBadge status={pkg.status} size="lg" />
              {pkg.status !== 'cancelled' && pkg.status !== 'completed' && (
                <button
                  onClick={handleCancelPackage}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  <span>إلغاء البكج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">الطلبات</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pkg.total_orders || 0}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">الإجمالي</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {(pkg.total_amount || 0).toFixed(2)}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Truck className="w-6 h-6 text-purple-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">التوصيل</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {(pkg.delivery_fee || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Status Actions */}
            {statusActions[pkg.status]?.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  الإجراءات المتاحة
                </h3>
                <div className="flex flex-wrap gap-3">
                  {statusActions[pkg.status].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        if (action.next === 'assigned') {
                          setShowAssignDriver(true);
                        } else {
                          handleStatusUpdate(action.next);
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <action.icon className="w-5 h-5" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Orders List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  الطلبات ({pkg.orders?.length || 0})
                </h3>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {pkg.orders && pkg.orders.length > 0 ? (
                  pkg.orders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                              #{order.order_number}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.is_ready_for_pickup
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                            }`}>
                              {order.is_ready_for_pickup ? '✅ جاهز للاستلام' : '⏳ قيد التحضير'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <User className="w-4 h-4" />
                              <span>{order.customer?.full_name || 'غير متوفر'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Store className="w-4 h-4" />
                              <span>{order.vendor?.shop_name || 'غير متوفر'}</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{order.delivery_address}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {order.total_amount.toFixed(2)} ر.س
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400">
                              + {order.delivery_fee.toFixed(2)} ر.س توصيل
                            </span>
                          </div>
                        </div>

                        {pkg.status === 'collecting' && (
                          <button
                            onClick={() => handleRemoveOrder(order.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد طلبات في هذا البكج</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Zone Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                معلومات المنطقة
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">المنطقة</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {pkg.zone?.name_ar}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ التوصيل</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(pkg.scheduled_date).toLocaleDateString('ar-SA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {pkg.zone?.cities && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">المدن المشمولة</p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.zone.cities.map((city, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Driver Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">السائق</h3>
                {pkg.driver && pkg.status !== 'completed' && pkg.status !== 'cancelled' && (
                  <button
                    onClick={() => setShowAssignDriver(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    تغيير
                  </button>
                )}
              </div>

              {pkg.driver ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {pkg.driver.full_name?.[0] || '؟'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {pkg.driver.full_name || 'غير محدد'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pkg.driver.vehicle_type || 'مركبة'}
                      </p>
                    </div>
                  </div>
                  {pkg.driver.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{pkg.driver.phone}</span>
                    </div>
                  )}
                  {pkg.driver.rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">★</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {pkg.driver.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    لم يتم تعيين سائق بعد
                  </p>
                  <button
                    onClick={() => setShowAssignDriver(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    تعيين سائق
                  </button>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                السجل الزمني
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">تم الإنشاء</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(pkg.created_at).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </div>

                {pkg.assigned_at && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">تم تعيين السائق</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(pkg.assigned_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                )}

                {pkg.started_at && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">بدء التوصيل</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(pkg.started_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                )}

                {pkg.completed_at && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">تم الإكمال</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(pkg.completed_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Driver Modal */}
      {showAssignDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {pkg.driver ? 'تغيير السائق' : 'تعيين سائق'}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اختر السائق
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر سائق...</option>
                {drivers.filter(d => d.is_available && d.is_active).map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name} - {driver.vehicle_type || 'مركبة'}
                    {driver.rating && ` (${driver.rating.toFixed(1)}★)`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriver}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                تأكيد
              </button>
              <button
                onClick={() => setShowAssignDriver(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
