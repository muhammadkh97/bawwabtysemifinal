'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface FuturisticStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  delay?: number;
}

export default function FuturisticStatCard({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'from-purple-500 to-pink-500',
  delay = 0,
}: FuturisticStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div
        className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 overflow-hidden bg-white dark:bg-[rgba(15,10,30,0.6)] backdrop-blur-xl border border-gray-200 dark:border-[rgba(98,54,255,0.3)] shadow-md dark:shadow-none"
      >
        {/* Animated gradient background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Icon with glow */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center relative`}
            style={{
              boxShadow: '0 0 20px rgba(98, 54, 255, 0.4)',
            }}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            
            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(98, 54, 255, 0.6)',
                  '0 0 40px rgba(255, 33, 157, 0.6)',
                  '0 0 20px rgba(98, 54, 255, 0.6)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Trend indicator */}
          {trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.3 }}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                trend.isPositive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-gray-600 dark:text-purple-200 text-sm font-medium mb-2">{title}</h3>

        {/* Value */}
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
        >
          {value}
        </motion.p>

        {/* Decorative corner */}
        <div
          className="absolute top-0 left-0 w-24 h-24 rounded-full blur-3xl opacity-20"
          style={{
            background: `linear-gradient(135deg, ${gradient.includes('purple') ? '#6236FF' : '#FF219D'}, transparent)`,
          }}
        />
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, #6236FF, #FF219D)',
          filter: 'blur(20px)',
        }}
      />
    </motion.div>
  );
}

