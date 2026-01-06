'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDeliveryPackages, BatchStatus } from '@/contexts/DeliveryPackagesContext';
import PackageCard from '@/components/admin/delivery/PackageCard';
import PackageStatusBadge from '@/components/admin/delivery/PackageStatusBadge';
import {
  Package,
  Plus,
  Filter,
  Calendar,
  MapPin,
  TrendingUp,
  Loader2,
  Search,
  Download,
} from 'lucide-react';

export default function DeliveryPackagesPage() {
  const router = useRouter();
  const {
    packages,
    zones,
    loading,
    stats,
    filterZone,
    filterStatus,
    filterDate,
    setFilterZone,
    setFilterStatus,
    setFilterDate,
  } = useDeliveryPackages();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter packages by search
  const filteredPackages = packages.filter(pkg => {
    if (!searchQuery) return true;
    return (
      pkg.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.zone?.name_ar.includes(searchQuery) ||
      pkg.zone?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const statsCards = [
    {
      title: 'إجمالي البكيجات',
      value: stats.totalPackages,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'جمع الطلبات',
      value: stats.collectingPackages,
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'جاهزة للتوصيل',
      value: stats.readyPackages,
      icon: Package,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'قيد التوصيل',
      value: stats.inTransitPackages,
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders,
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      title: 'الإيرادات',
      value: `${stats.totalRevenue.toFixed(0)} ر.س`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  إدارة بكيجات التوصيل
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                تنظيم وتتبع جميع بكيجات التوصيل حسب المناطق
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard/admin/delivery-packages/create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>إنشاء بكج جديد</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              التصفية والبحث
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم البكج..."
                className="w-full pr-10 pl-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Zone Filter */}
            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={filterZone || ''}
                onChange={(e) => setFilterZone(e.target.value || null)}
                className="w-full pr-10 pl-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">جميع المناطق</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as BatchStatus | 'all')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="collecting">جمع الطلبات</option>
                <option value="ready">جاهز للتوصيل</option>
                <option value="assigned">تم تعيين سائق</option>
                <option value="in_transit">قيد التوصيل</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filterDate || ''}
                onChange={(e) => setFilterDate(e.target.value || null)}
                className="w-full pr-10 pl-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Filters */}
          {(filterZone || filterStatus !== 'all' || filterDate || searchQuery) && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                التصفيات النشطة:
              </span>
              {searchQuery && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  بحث: {searchQuery}
                </span>
              )}
              {filterZone && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                  {zones.find(z => z.id === filterZone)?.name_ar}
                </span>
              )}
              {filterStatus !== 'all' && (
                <PackageStatusBadge status={filterStatus as BatchStatus} size="sm" />
              )}
              {filterDate && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm">
                  {new Date(filterDate).toLocaleDateString('ar-SA')}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterZone(null);
                  setFilterStatus('all');
                  setFilterDate(null);
                }}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ✕ مسح الكل
              </button>
            </div>
          )}
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              لا توجد بكيجات
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || filterZone || filterStatus !== 'all' || filterDate
                ? 'لم يتم العثور على بكيجات مطابقة للفلاتر'
                : 'ابدأ بإنشاء بكج توصيل جديد'}
            </p>
            <button
              onClick={() => router.push('/dashboard/admin/delivery-packages/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>إنشاء بكج جديد</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                عرض {filteredPackages.length} من {packages.length} بكج
              </p>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>تصدير Excel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PackageCard package={pkg} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
