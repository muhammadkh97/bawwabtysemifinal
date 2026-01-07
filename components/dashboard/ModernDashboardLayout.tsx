'use client';

import { motion } from 'framer-motion';
import { ReactNode, ComponentType } from 'react';

interface ModernDashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon?: ComponentType<{ className?: string }>;
}

export default function ModernDashboardLayout({ 
  children, 
  title, 
  subtitle,
  icon: Icon 
}: ModernDashboardLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            {Icon && (
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-lg flex items-center justify-center border border-white/20">
                <Icon className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-black text-white drop-shadow-lg">
                {title}
              </h1>
              <p className="text-purple-200 text-lg mt-1">{subtitle}</p>
            </div>
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
}

export function ModernStatCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  trend,
  delay = 0 
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
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200`}></div>
      
      {/* Card Content */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            {trend && (
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          
          <h3 className="text-white/70 text-sm font-medium mb-2">{title}</h3>
          <p className="text-white text-3xl font-black">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface ModernSectionProps {
  title: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  delay?: number;
}

export function ModernSection({ title, icon: Icon, children, delay = 0 }: ModernSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group"
    >
      {/* Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
      
      {/* Content */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <h2 className="text-2xl font-black text-white">{title}</h2>
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
