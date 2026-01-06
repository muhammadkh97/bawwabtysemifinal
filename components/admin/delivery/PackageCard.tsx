import React from 'react';
import Link from 'next/link';
import { DeliveryPackage } from '@/contexts/DeliveryPackagesContext';
import PackageStatusBadge from './PackageStatusBadge';
import { Package, MapPin, Calendar, User, DollarSign } from 'lucide-react';

interface PackageCardProps {
  package: DeliveryPackage;
}

export default function PackageCard({ package: pkg }: PackageCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProgressPercentage = () => {
    const statuses = ['collecting', 'ready', 'assigned', 'in_transit', 'completed'];
    const currentIndex = statuses.indexOf(pkg.status);
    return ((currentIndex + 1) / statuses.length) * 100;
  };

  return (
    <Link href={`/dashboard/admin/delivery-packages/${pkg.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-blue-500">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {pkg.batch_number}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pkg.zone?.name_ar || 'غير محدد'}
            </p>
          </div>
          <PackageStatusBadge status={pkg.status} size="sm" />
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">الطلبات</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {pkg.total_orders || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">الإجمالي</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {(pkg.total_amount || 0).toFixed(2)} ر.س
              </p>
            </div>
          </div>
        </div>

        {/* Zone & Date */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>
              {pkg.zone?.cities?.join(', ') || 'غير محدد'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(pkg.scheduled_date)}</span>
          </div>
        </div>

        {/* Driver */}
        {pkg.driver && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {pkg.driver.full_name?.[0] || '؟'}
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">السائق</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {pkg.driver.full_name || 'غير محدد'}
              </p>
            </div>
          </div>
        )}

        {/* No Driver */}
        {!pkg.driver && pkg.status !== 'cancelled' && pkg.status !== 'completed' && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <User className="w-4 h-4" />
              <span>لم يتم تعيين سائق بعد</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
