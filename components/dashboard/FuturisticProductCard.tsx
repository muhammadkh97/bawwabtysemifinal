'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface FuturisticProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  sales?: number;
  delay?: number;
}

export default function FuturisticProductCard({
  id,
  name,
  price,
  image,
  category,
  stock,
  sales = 0,
  delay = 0,
}: FuturisticProductCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleView = () => {
    router.push(`/products/${id}`);
    setShowMenu(false);
  };

  const handleEdit = () => {
    router.push(`/dashboard/vendor/products/edit/${id}`);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload the page to refresh the products list
      if (typeof window !== 'undefined') window.location.reload();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('حدث خطأ أثناء حذف المنتج');
      setIsDeleting(false);
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div
        className="relative rounded-3xl overflow-hidden bg-white dark:bg-[rgba(15,10,30,0.6)] backdrop-blur-xl border border-gray-200 dark:border-[rgba(98,54,255,0.3)] shadow-md dark:shadow-none"
      >
        {/* Image Container */}
        <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">📦</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A1E] via-transparent to-transparent opacity-60" />

          {/* Actions menu */}
          <div className="absolute top-3 left-3" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md flex items-center justify-center"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </motion.button>

            {/* Dropdown menu */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-12 left-0 w-40 rounded-2xl overflow-hidden z-50 bg-white dark:bg-[rgba(15,10,30,0.95)] backdrop-blur-xl border border-gray-200 dark:border-[rgba(98,54,255,0.3)] shadow-lg"
              >
                <button 
                  onClick={handleView}
                  className="w-full px-4 py-3 text-right text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">عرض</span>
                </button>
                <button 
                  onClick={handleEdit}
                  className="w-full px-4 py-3 text-right text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">تعديل</span>
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 text-right text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">{isDeleting ? 'جاري الحذف...' : 'حذف'}</span>
                </button>
              </motion.div>
            )}
          </div>

          {/* Stock badge */}
          <div className="absolute top-3 right-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
                stock > 10
                  ? 'bg-green-500/20 text-green-400'
                  : stock > 0
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {stock > 0 ? `${stock} قطعة` : 'نفذت الكمية'}
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 mb-3">
            {category}
          </span>

          {/* Product name */}
          <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-2 line-clamp-1">
            {name}
          </h3>

          {/* Price and Sales */}
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-[#6236FF] via-[#B621FE] to-[#FF219D] bg-clip-text text-transparent"
            >
              {price.toLocaleString('ar-SA')} ر.س
            </motion.div>

            {sales > 0 && (
              <div className="text-sm text-gray-600 dark:text-purple-300">
                {sales} مبيعات
              </div>
            )}
          </div>
        </div>

        {/* Hover glow line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'linear-gradient(90deg, #6236FF, #B621FE, #FF219D)',
          }}
        />
      </div>

      {/* Card glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, #6236FF, #FF219D)',
          filter: 'blur(25px)',
        }}
      />
    </motion.div>
  );
}

