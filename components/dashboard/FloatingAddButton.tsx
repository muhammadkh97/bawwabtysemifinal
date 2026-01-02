'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function FloatingAddButton() {
  const router = useRouter();

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      onClick={() => router.push('/dashboard/vendor/products/new')}
      className="fixed bottom-8 left-8 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center group"
      style={{
        background: 'linear-gradient(135deg, #00A86B, #00C878)',
        boxShadow: '0 10px 40px rgba(0, 168, 107, 0.6), 0 0 60px rgba(0, 200, 120, 0.4)',
      }}
      title="إضافة منتج جديد"
    >
      <Plus className="w-8 h-8 text-white" strokeWidth={3} />
      
      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #00A86B, #00C878)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.button>
  );
}
