'use client';

import { motion } from 'framer-motion';
import { ReactNode, ComponentType } from 'react';
import { getDashboardTheme, DashboardRole, getRandomStatGradient } from '@/lib/dashboardThemes';

interface ModernDashboardLayoutLuxuryProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon?: ComponentType<{ className?: string }>;
  loading?: boolean;
  role: DashboardRole;
  headerAction?: ReactNode;
}

export default function ModernDashboardLayoutLuxury({ 
  children, 
  title, 
  subtitle,
  icon: Icon,
  loading = false,
  role,
  headerAction
}: ModernDashboardLayoutLuxuryProps) {
  const theme = getDashboardTheme(role);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 rounded-full mx-auto mb-4"
            style={{
              borderColor: `${theme.primary.main}20`,
              borderTopColor: theme.primary.main,
            }}
          />
          <p className="text-white text-lg font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Animated Background with Theme Colors */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0 opacity-40">
          {/* Primary Blob */}
          <motion.div
            className="absolute top-0 -left-4 w-72 h-72 rounded-full mix-blend-screen filter blur-3xl opacity-40"
            style={{ backgroundColor: theme.primary.main }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -50, 20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Secondary Blob */}
          <motion.div
            className="absolute top-0 -right-4 w-72 h-72 rounded-full mix-blend-screen filter blur-3xl opacity-40"
            style={{ backgroundColor: theme.primary.dark }}
            animate={{
              x: [0, -30, 20, 0],
              y: [0, 50, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
          
          {/* Tertiary Blob */}
          <motion.div
            className="absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-screen filter blur-3xl opacity-40"
            style={{ backgroundColor: theme.primary.light }}
            animate={{
              x: [0, 20, -30, 0],
              y: [0, -20, 50, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 md:px-8 lg:px-10 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              {Icon && (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.primary.dark})`,
                    borderColor: theme.colors.border,
                    boxShadow: `0 0 30px ${theme.glow.primary}`,
                  }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
              )}
              <div>
                <h1 className="text-4xl font-black text-white drop-shadow-lg">
                  {title}
                </h1>
                <p className="text-white/70 text-lg mt-1 font-medium">{subtitle}</p>
              </div>
            </div>
            {headerAction && (
              <div>{headerAction}</div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
}

interface ModernStatCardLuxuryProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
  compact?: boolean;
  large?: boolean;
  role: DashboardRole;
}

export function ModernStatCardLuxury({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  trend,
  delay = 0,
  compact = false,
  large = false,
  role,
}: ModernStatCardLuxuryProps) {
  const theme = getDashboardTheme(role);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      {/* Glow Effect */}
      <div 
        className={`absolute -inset-0.5 rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200`}
        style={{
          background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.primary.dark})`,
        }}
      />
      
      {/* Card Content */}
      <div 
        className={`relative bg-slate-800/90 backdrop-blur-xl rounded-3xl border shadow-2xl overflow-hidden ${
          compact ? 'p-4' : large ? 'p-8' : 'p-6'
        }`}
        style={{
          borderColor: theme.colors.border,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative">
          {compact ? (
            <>
              <div 
                className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center shadow-xl`}
                style={{
                  background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.primary.dark})`,
                  boxShadow: `0 0 20px ${theme.glow.primary}`,
                }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className={`${large ? 'text-4xl' : 'text-2xl'} font-black text-white mb-1 text-center`}>{value}</p>
              <p className="text-xs text-white/50 text-center uppercase tracking-wide">{title}</p>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div 
                  className={`${large ? 'w-16 h-16' : 'w-14 h-14'} rounded-2xl flex items-center justify-center shadow-xl`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.primary.dark})`,
                    boxShadow: `0 0 25px ${theme.glow.primary}`,
                  }}
                >
                  <Icon className={`${large ? 'w-8 h-8' : 'w-7 h-7'} text-white`} />
                </div>
                {trend && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`text-sm font-bold px-3 py-1 rounded-full border ${
                      trend.isPositive 
                        ? 'bg-green-500/30 text-green-300 border-green-500/50' 
                        : 'bg-red-500/30 text-red-300 border-red-500/50'
                    }`}
                  >
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </motion.span>
                )}
              </div>
              
              <h3 className="text-white/70 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</h3>
              <p className={`text-white ${large ? 'text-4xl' : 'text-3xl'} font-black`}>{value}</p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ModernSectionLuxuryProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  delay?: number;
  action?: ReactNode;
  className?: string;
  role: DashboardRole;
}

export function ModernSectionLuxury({ 
  title, 
  subtitle,
  icon: Icon, 
  children, 
  delay = 0,
  action,
  className = '',
  role,
}: ModernSectionLuxuryProps) {
  const theme = getDashboardTheme(role);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative group ${className}`}
    >
      {/* Glow */}
      <div 
        className="absolute -inset-0.5 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000"
        style={{
          background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.primary.dark})`,
        }}
      />
      
      {/* Content */}
      <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-3xl border shadow-2xl overflow-hidden" style={{ borderColor: theme.colors.border }}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.primary.dark})`,
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-black text-white">{title}</h2>
                {subtitle && (
                  <p className="text-white/50 text-sm mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            {action && (
              <div>{action}</div>
            )}
          </div>
        </div>
        
        {/* Body */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
