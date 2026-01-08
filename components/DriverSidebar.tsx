'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Truck, 
  DollarSign, 
  MapPin, 
  Settings,
  TrendingUp,
  Clock,
  LogOut
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Icon } from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: Icon
  badge?: number
}

export default function DriverSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [availableOrders, setAvailableOrders] = useState(0)

  useEffect(() => {
    fetchAvailableOrders()
  }, [])

  const fetchAvailableOrders = async () => {
    try {
      // جلب الطلبات المتاحة (pending and not assigned to any driver)
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .is('driver_id', null)

      setAvailableOrders(count || 0)
    } catch (error) {
      console.error('Error fetching available orders:', error)
    }
  }

  const driverNavItems: NavItem[] = [
    {
      title: 'نظرة عامة',
      href: '/dashboard/driver',
      icon: LayoutDashboard,
    },
    {
      title: 'الطلبات المتاحة',
      href: '/dashboard/driver/available',
      icon: Truck,
      badge: availableOrders,
    },
    {
      title: 'طلباتي الحالية',
      href: '/dashboard/driver/my-orders',
      icon: Clock,
    },
    {
      title: 'سجل التوصيلات',
      href: '/dashboard/driver/history',
      icon: TrendingUp,
    },
    {
      title: 'المحفظة',
      href: '/dashboard/driver/wallet',
      icon: DollarSign,
    },
    {
      title: 'الموقع',
      href: '/dashboard/driver/location',
      icon: MapPin,
    },
    {
      title: 'الإعدادات',
      href: '/dashboard/driver/settings',
      icon: Settings,
    },
  ]

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      router.push('/auth/login')
    }
  }

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 bg-white border-l border-gray-200">
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-purple-600">لوحة المندوب</h1>
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
        <ul className="space-y-2">
          {driverNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-purple-50 text-purple-600 font-semibold' 
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
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Logout Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}
