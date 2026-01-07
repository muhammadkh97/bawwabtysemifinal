'use client';

import { motion } from 'framer-motion';
import { ReactNode, ComponentType } from 'react';

interface ModernDashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon?: ComponentType<{ className?: string }>;
  loading?: boolean;
  blobColors?: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  headerAction?: ReactNode;
}

export default function ModernDashboardLayout({ 
  children, 
  title, 
  subtitle,
  icon: Icon,
  loading = false,
  blobColors = {
    primary: '#9333ea',
    secondary: '#3b82f6', 
    tertiary: '#ec4899'
  },
  headerAction
}: ModernDashboardLayoutProps) {
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0 opacity-40">
          <div 
            className="absolute top-0 -left-4 w-72 h-72 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"
            style={{ backgroundColor: blobColors.primary }}
          ></div>
          <div 
            className="absolute top-0 -right-4 w-72 h-72 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000"
            style={{ backgroundColor: blobColors.secondary }}
          ></div>
          <div 
            className="absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-4000"
            style={{ backgroundColor: blobColors.tertiary }}
          ></div>
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
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 backdrop-blur-lg flex items-center justify-center border border-slate-700/50 shadow-lg">
                  <Icon className="w-7 h-7 text-slate-100" />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-black text-slate-100 drop-shadow-lg">
                  {title}
                </h1>
                <p className="text-slate-300 text-lg mt-1 font-medium">{subtitle}</p>
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

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

interface ModernStatCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
  compact?: boolean;
  large?: boolean;
}

export function ModernStatCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  trend,
  delay = 0,
  compact = false,
  large = false
}: ModernStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200`}></div>
      
      {/* Card Content */}
      <div className={`relative bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden ${
        compact ? 'p-4' : large ? 'p-8' : 'p-6'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative">
          {compact ? (
            <>
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className={`${large ? 'text-4xl' : 'text-2xl'} font-black text-slate-50 mb-1 text-center`}>{value}</p>
              <p className="text-xs text-slate-400 text-center uppercase tracking-wide">{title}</p>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className={`${large ? 'w-16 h-16' : 'w-14 h-14'} rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl`}>
                  <Icon className={`${large ? 'w-8 h-8' : 'w-7 h-7'} text-white`} />
                </div>
                {trend && (
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                    trend.isPositive ? 'bg-green-500/30 text-green-300 border-green-500/50' : 'bg-red-500/30 text-red-300 border-red-500/50'
                  }`}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                )}
              </div>
              
              <h3 className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</h3>
              <p className={`text-slate-50 ${large ? 'text-4xl' : 'text-3xl'} font-black`}>{value}</p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ModernSectionProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  iconColor?: string;
  children: ReactNode;
  delay?: number;
  gradient?: string;
  action?: ReactNode;
  className?: string;
}

export function ModernSection({ 
  title, 
  subtitle,
  icon: Icon, 
  iconColor = 'text-slate-100',
  children, 
  delay = 0,
  gradient = 'from-purple-600 to-pink-600',
  action,
  className = ''
}: ModernSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative group ${className}`}
    >
      {/* Glow */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000`}></div>
      
      {/* Content */}
      <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-10 h-10 rounded-xl bg-slate-700/70 flex items-center justify-center shadow-lg">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-black text-slate-100">{title}</h2>
                {subtitle && (
                  <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
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
