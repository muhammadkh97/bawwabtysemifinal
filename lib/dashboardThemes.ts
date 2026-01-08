/**
 * نظام الألوان الديناميكي للوحات التحكم
 * Dynamic Color System for Dashboards
 */

export type DashboardRole = 'admin' | 'vendor' | 'restaurant' | 'driver';

export interface DashboardTheme {
  role: DashboardRole;
  primary: {
    light: string;
    main: string;
    dark: string;
  };
  gradient: {
    primary: string;
    secondary: string;
    accent: string;
  };
  colors: {
    background: string;
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    icon: string;
  };
  glow: {
    primary: string;
    secondary: string;
  };
  title: string;
  emoji: string;
}

export const dashboardThemes: Record<DashboardRole, DashboardTheme> = {
  admin: {
    role: 'admin',
    primary: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#b45309',
    },
    gradient: {
      primary: 'from-amber-400 via-amber-600 to-amber-700',
      secondary: 'from-amber-500 to-orange-600',
      accent: 'from-yellow-400 to-amber-500',
    },
    colors: {
      background: 'bg-slate-950',
      card: 'bg-slate-900/80',
      border: 'border-amber-500/20',
      text: 'text-white',
      textSecondary: 'text-amber-100/70',
      icon: 'text-amber-400',
    },
    glow: {
      primary: 'rgba(245, 158, 11, 0.5)',
      secondary: 'rgba(217, 119, 6, 0.3)',
    },
    title: 'لوحة تحكم المدير',
    emoji: '👑',
  },
  vendor: {
    role: 'vendor',
    primary: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1e40af',
    },
    gradient: {
      primary: 'from-blue-600 via-indigo-600 to-violet-700',
      secondary: 'from-blue-500 to-indigo-600',
      accent: 'from-indigo-400 to-blue-500',
    },
    colors: {
      background: 'bg-slate-950',
      card: 'bg-slate-900/80',
      border: 'border-blue-500/20',
      text: 'text-white',
      textSecondary: 'text-blue-100/70',
      icon: 'text-blue-400',
    },
    glow: {
      primary: 'rgba(59, 130, 246, 0.5)',
      secondary: 'rgba(37, 99, 235, 0.3)',
    },
    title: 'لوحة تحكم البائع',
    emoji: '🏪',
  },
  restaurant: {
    role: 'restaurant',
    primary: {
      light: '#ccfbf1',
      main: '#14b8a6',
      dark: '#0d9488',
    },
    gradient: {
      primary: 'from-emerald-500 via-teal-600 to-cyan-700',
      secondary: 'from-emerald-500 to-teal-600',
      accent: 'from-teal-400 to-emerald-500',
    },
    colors: {
      background: 'bg-slate-950',
      card: 'bg-slate-900/80',
      border: 'border-emerald-500/20',
      text: 'text-white',
      textSecondary: 'text-emerald-100/70',
      icon: 'text-emerald-400',
    },
    glow: {
      primary: 'rgba(20, 184, 166, 0.5)',
      secondary: 'rgba(13, 148, 136, 0.3)',
    },
    title: 'لوحة تحكم المطعم',
    emoji: '🍽️',
  },
  driver: {
    role: 'driver',
    primary: {
      light: '#fed7aa',
      main: '#f97316',
      dark: '#c2410c',
    },
    gradient: {
      primary: 'from-orange-500 via-red-600 to-rose-700',
      secondary: 'from-orange-500 to-red-600',
      accent: 'from-red-400 to-orange-500',
    },
    colors: {
      background: 'bg-slate-950',
      card: 'bg-slate-900/80',
      border: 'border-orange-500/20',
      text: 'text-white',
      textSecondary: 'text-orange-100/70',
      icon: 'text-orange-400',
    },
    glow: {
      primary: 'rgba(249, 115, 22, 0.5)',
      secondary: 'rgba(194, 65, 12, 0.3)',
    },
    title: 'لوحة تحكم المندوب',
    emoji: '🚗',
  },
};

/**
 * الحصول على موضوع اللوحة بناءً على الدور
 * Get dashboard theme by role
 */
export function getDashboardTheme(role: DashboardRole): DashboardTheme {
  return dashboardThemes[role] || dashboardThemes.admin;
}

/**
 * الحصول على ألوان الإحصائيات المتنوعة
 * Get diverse stat card gradients
 */
export function getStatGradients(role: DashboardRole): string[] {
  const theme = getDashboardTheme(role);
  
  switch (role) {
    case 'admin':
      return [
        'from-amber-500 to-yellow-600',
        'from-orange-500 to-red-600',
        'from-yellow-500 to-amber-600',
        'from-amber-600 to-orange-700',
      ];
    case 'vendor':
      return [
        'from-blue-500 to-indigo-600',
        'from-indigo-500 to-purple-600',
        'from-cyan-500 to-blue-600',
        'from-blue-600 to-violet-700',
      ];
    case 'restaurant':
      return [
        'from-emerald-500 to-teal-600',
        'from-teal-500 to-cyan-600',
        'from-green-500 to-emerald-600',
        'from-emerald-600 to-cyan-700',
      ];
    case 'driver':
      return [
        'from-orange-500 to-red-600',
        'from-red-500 to-rose-600',
        'from-orange-600 to-yellow-600',
        'from-red-600 to-orange-700',
      ];
    default:
      return [
        'from-purple-500 to-pink-600',
        'from-blue-500 to-purple-600',
        'from-pink-500 to-red-600',
        'from-purple-600 to-pink-700',
      ];
  }
}

/**
 * الحصول على لون التدرج العشوائي من قائمة الإحصائيات
 * Get random stat gradient
 */
export function getRandomStatGradient(role: DashboardRole, index: number): string {
  const gradients = getStatGradients(role);
  return gradients[index % gradients.length];
}
