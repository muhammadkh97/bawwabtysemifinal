'use client';

import { User, Store, Utensils, Truck, Shield, Users } from 'lucide-react';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
}

export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'customer':
        return {
          label: 'عميل',
          icon: User,
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30'
        };
      case 'vendor':
        return {
          label: 'بائع',
          icon: Store,
          color: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30'
        };
      case 'restaurant':
        return {
          label: 'مطعم',
          icon: Utensils,
          color: 'from-orange-500 to-red-500',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/30'
        };
      case 'driver':
        return {
          label: 'سائق',
          icon: Truck,
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30'
        };
      case 'admin':
        return {
          label: 'مدير',
          icon: Shield,
          color: 'from-red-500 to-pink-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30'
        };
      case 'staff':
        return {
          label: 'مساعد',
          icon: Users,
          color: 'from-teal-500 to-cyan-500',
          bgColor: 'bg-teal-500/20',
          borderColor: 'border-teal-500/30'
        };
      default:
        return {
          label: role,
          icon: User,
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30'
        };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full ${config.bgColor} border ${config.borderColor} ${textSize} font-medium`}
    >
      <Icon className={iconSize} />
      <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{
        backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`
      }}>
        {config.label}
      </span>
    </span>
  );
}
