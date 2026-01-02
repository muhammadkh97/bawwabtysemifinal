import type { Metadata } from 'next'
import './globals.css'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { ChatsProvider } from '@/contexts/ChatsContext'
import { StoreFollowProvider } from '@/contexts/StoreFollowContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import FloatingChatWidget from '@/components/FloatingChatWidget'
import ToastProvider from '@/components/ToastProvider'

export const metadata: Metadata = {
  title: 'بوابتي - متجرك الإلكتروني المميز',
  description: 'تسوق من آلاف المنتجات عالية الجودة بأفضل الأسعار',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                <WishlistProvider>
                  <ChatsProvider>
                    <StoreFollowProvider>
                      {children}
                      <FloatingChatWidget />
                      <ToastProvider />
                    </StoreFollowProvider>
                  </ChatsProvider>
                </WishlistProvider>
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

