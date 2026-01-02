'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  MessageSquare, 
  Settings,
  TrendingUp,
  Star,
  Tag,
  Store,
  LogOut
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  title: string
  href: string
  icon: any
  badge?: number
}

export default function VendorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { userId } = useAuth()
  const [ordersCount, setOrdersCount] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)

  useEffect(() => {
    if (userId) {
      fetchOrdersCount()
      fetchMessagesCount()

      // Subscribe to chats changes for real-time messages count
      const chatsSubscription = supabase
        .channel('vendor-chats-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chats'
          },
          () => {
            fetchMessagesCount()
          }
        )
        .subscribe()

      // Subscribe to orders changes for real-time orders count
      const ordersSubscription = supabase
        .channel('vendor-orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          () => {
            fetchOrdersCount()
          }
        )
        .subscribe()

      // Cleanup subscriptions
      return () => {
        chatsSubscription.unsubscribe()
        ordersSubscription.unsubscribe()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchOrdersCount = async () => {
    try {
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!vendorData) return

      // Get pending orders count
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('vendor_id', vendorData.id)

      const uniqueOrderIds = Array.from(new Set(orderItemsData?.map(item => item.order_id) || []))

      if (uniqueOrderIds.length > 0) {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('id', uniqueOrderIds)
          .in('status', ['pending', 'processing'])

        setOrdersCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching orders count:', error)
    }
  }

  const fetchMessagesCount = async () => {
    try {
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!vendorData) return

      // Get unread messages count from chats table
      const { data: chatsData } = await supabase
        .from('chats')
        .select('vendor_unread_count')
        .eq('vendor_id', vendorData.id)
        .eq('is_active', true)

      if (chatsData) {
        const totalUnread = chatsData.reduce((sum, chat) => sum + (chat.vendor_unread_count || 0), 0)
        setMessagesCount(totalUnread)
      }
    } catch (error) {
      console.error('Error fetching messages count:', error)
    }
  }

  const vendorNavItems: NavItem[] = [
    {
      title: 'نظرة عامة',
      href: '/vendor',
      icon: LayoutDashboard,
    },
    {
      title: 'إدارة المنتجات',
      href: '/vendor/products',
      icon: Package,
    },
    {
      title: 'الطلبات',
      href: '/vendor/orders',
      icon: ShoppingCart,
      badge: ordersCount,
    },
    {
      title: 'التحليلات والإحصائيات',
      href: '/vendor/analytics',
      icon: TrendingUp,
    },
    {
      title: 'المحفظة المالية',
      href: '/vendor/wallet',
      icon: DollarSign,
    },
    {
      title: 'التقييمات والمراجعات',
      href: '/vendor/reviews',
      icon: Star,
    },
    {
      title: 'الترويج والكوبونات',
      href: '/vendor/promotions',
      icon: Tag,
    },
    {
      title: 'الرسائل',
      href: '/vendor/messages',
      icon: MessageSquare,
      badge: messagesCount,
    },
    {
      title: 'متجري',
      href: '/vendor/store',
      icon: Store,
    },
    {
      title: 'الإعدادات',
      href: '/vendor/settings',
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
        <h1 className="text-xl font-bold text-green-600">لوحة البائع</h1>
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide p-4">
        <ul className="space-y-2">
          {vendorNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-green-50 text-green-600 font-semibold' 
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
        <div className="mt-4 pt-4 border-t border-gray-100">
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

