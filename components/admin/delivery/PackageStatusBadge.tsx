import React from 'react';
import { BatchStatus } from '@/contexts/DeliveryPackagesContext';

interface PackageStatusBadgeProps {
  status: BatchStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function PackageStatusBadge({ status, size = 'md' }: PackageStatusBadgeProps) {
  const getStatusConfig = (status: BatchStatus) => {
    switch (status) {
      case 'collecting':
        return {
          label: 'جمع الطلبات',
          icon: '📦',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-300 dark:border-blue-700',
        };
      case 'ready':
        return {
          label: 'جاهز للتوصيل',
          icon: '✅',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-300 dark:border-green-700',
        };
      case 'assigned':
        return {
          label: 'تم تعيين سائق',
          icon: '🚗',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-800 dark:text-purple-200',
          borderColor: 'border-purple-300 dark:border-purple-700',
        };
      case 'in_transit':
        return {
          label: 'قيد التوصيل',
          icon: '🛣️',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          textColor: 'text-orange-800 dark:text-orange-200',
          borderColor: 'border-orange-300 dark:border-orange-700',
        };
      case 'completed':
        return {
          label: 'مكتمل',
          icon: '🎉',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-800 dark:text-gray-200',
          borderColor: 'border-gray-300 dark:border-gray-700',
        };
      case 'cancelled':
        return {
          label: 'ملغي',
          icon: '❌',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-300 dark:border-red-700',
        };
      default:
        return {
          label: status,
          icon: '❓',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-800 dark:text-gray-200',
          borderColor: 'border-gray-300 dark:border-gray-700',
        };
    }
  };

  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        border rounded-full font-semibold
        ${sizeClasses[size]}
        transition-all duration-200
      `}
    >
      <span className="text-lg leading-none">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
