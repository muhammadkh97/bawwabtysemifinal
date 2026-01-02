'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Package, Store, Heart, ShoppingCart, Search, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  type: 'products' | 'shops' | 'cart' | 'wishlist' | 'orders' | 'search';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction
}: EmptyStateProps) {
  const configs = {
    products: {
      icon: Package,
      defaultTitle: 'لا توجد منتجات بعد',
      defaultDescription: 'لم يتم إضافة أي منتجات حتى الآن. تحقق مرة أخرى قريباً!',
      defaultAction: 'تصفح الفئات',
      defaultHref: '/categories',
      gradient: 'from-purple-600 to-pink-600'
    },
    shops: {
      icon: Store,
      defaultTitle: 'لا توجد متاجر بعد',
      defaultDescription: 'لم يتم تسجيل أي متاجر حتى الآن. كن أول من ينضم!',
      defaultAction: 'سجل متجرك',
      defaultHref: '/vendor/register',
      gradient: 'from-blue-600 to-cyan-600'
    },
    cart: {
      icon: ShoppingCart,
      defaultTitle: 'سلتك فارغة',
      defaultDescription: 'ابدأ بإضافة منتجات رائعة إلى سلة التسوق الخاصة بك!',
      defaultAction: 'تسوق الآن',
      defaultHref: '/products',
      gradient: 'from-orange-600 to-red-600'
    },
    wishlist: {
      icon: Heart,
      defaultTitle: 'قائمة الأمنيات فارغة',
      defaultDescription: 'احفظ منتجاتك المفضلة هنا لشرائها لاحقاً!',
      defaultAction: 'اكتشف المنتجات',
      defaultHref: '/products',
      gradient: 'from-pink-600 to-rose-600'
    },
    orders: {
      icon: ShoppingBag,
      defaultTitle: 'لا توجد طلبات بعد',
      defaultDescription: 'لم تقم بأي طلبات حتى الآن. ابدأ التسوق الآن!',
      defaultAction: 'ابدأ التسوق',
      defaultHref: '/products',
      gradient: 'from-green-600 to-emerald-600'
    },
    search: {
      icon: Search,
      defaultTitle: 'لا توجد نتائج',
      defaultDescription: 'لم نجد أي منتجات تطابق بحثك. جرب كلمات مختلفة!',
      defaultAction: 'إعادة التعيين',
      defaultHref: '/products',
      gradient: 'from-indigo-600 to-purple-600'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  const finalTitle = title || config.defaultTitle;
  const finalDescription = description || config.defaultDescription;
  const finalActionLabel = actionLabel || config.defaultAction;
  const finalActionHref = actionHref || config.defaultHref;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 md:py-24 px-4"
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
        className={`relative mb-8`}
      >
        {/* Background glow */}
        <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-full blur-3xl opacity-20 animate-pulse`}></div>
        
        {/* Icon container */}
        <div className={`relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${config.gradient} rounded-full flex items-center justify-center shadow-2xl`}>
          <Icon className="w-12 h-12 md:w-16 md:h-16 text-white" strokeWidth={1.5} />
        </div>

        {/* Decorative circles */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-full opacity-0`}
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3 text-center"
      >
        {finalTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8 text-sm md:text-base"
      >
        {finalDescription}
      </motion.p>

      {/* Action Button */}
      {onAction ? (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className={`px-8 py-3 bg-gradient-to-r ${config.gradient} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2`}
        >
          <Plus className="w-5 h-5" />
          {finalActionLabel}
        </motion.button>
      ) : (
        <Link href={finalActionHref}>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 bg-gradient-to-r ${config.gradient} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2`}
          >
            <Plus className="w-5 h-5" />
            {finalActionLabel}
          </motion.button>
        </Link>
      )}

      {/* Floating particles animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r ${config.gradient} rounded-full opacity-20`}
            initial={{
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
            }}
            animate={{
              x: Math.random() * 200 - 100,
              y: Math.random() * 200 - 100,
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
