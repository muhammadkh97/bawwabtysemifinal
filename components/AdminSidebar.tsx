'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  MessageSquare, 
  Settings,
  CheckCircle,
  TrendingUp,
  FileText,
  Truck,
  AlertCircle,
  LayoutGrid
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NavItem {
  title: string
  href: string
  icon: any
  badge?: number
  badgeKey?: string
}

const getAdminNavItems = (badges: any): NavItem[] => [
  {
    title: 'لوحة التحكم',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'الموافقات المعلقة',
    href: '/admin/approvals',
    icon: CheckCircle,
    badge: badges.approvals,
    badgeKey: 'approvals',
  },
  {
    title: 'إدارة البائعين',
    href: '/admin/vendors',
    icon: Users,
  },
  {
    title: 'إدارة المناديب',
    href: '/admin/drivers',
    icon: Truck,
  },
  {
    title: 'إدارة المنتجات',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'إدارة الطلبات',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'الإدارة المالية',
    href: '/admin/finance',
    icon: DollarSign,
  },
  {
    title: 'التقارير والإحصائيات',
    href: '/admin/analytics',
    icon: TrendingUp,
  },
  {
    title: 'النزاعات والدعم',
    href: '/admin/disputes',
    icon: AlertCircle,
    badge: badges.disputes,
    badgeKey: 'disputes',
  },
  {
    title: 'التذاكر',
    href: '/admin/tickets',
    icon: MessageSquare,
    badge: badges.tickets,
    badgeKey: 'tickets',
  },
  {
    title: 'التصنيفات',
    href: '/admin/categories',
    icon: LayoutGrid,
  },
  {
    title: 'الإعدادات العامة',
    href: '/admin/settings',
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [badges, setBadges] = useState({
    approvals: 0,
    disputes: 0,
    tickets: 0,
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      // جلب عدد الموافقات المعلقة
      let approvals = 0;
      
      // المنتجات المعلقة
      const { count: pendingProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      approvals += pendingProducts || 0;

      // البائعون المعلقون
      const { count: pendingVendors } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');
      approvals += pendingVendors || 0;

      // المناديب المعلقون (مع try-catch)
      try {
        const { count: pendingDrivers } = await supabase
          .from('drivers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        approvals += pendingDrivers || 0;
      } catch (error) {
        console.log('Drivers table not found');
      }

      // جلب النزاعات المفتوحة
      let disputes = 0;
      try {
        const { count: openDisputes } = await supabase
          .from('disputes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        disputes = openDisputes || 0;
      } catch (error) {
        console.log('Disputes table not found');
      }

      // جلب التذاكر المفتوحة
      const { count: openTickets } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setBadges({
        approvals,
        disputes,
        tickets: openTickets || 0,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }

  const adminNavItems = getAdminNavItems(badges)

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 bg-white border-l border-gray-200">
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">لوحة المدير</h1>
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide p-4">
        <ul className="space-y-2">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge.toLocaleString('ar-SA')}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

