/**
 * Dashboard Luxury UI Styles
 * Consistent styling for buttons, tables, and components across all dashboards
 * Supports both Light and Dark modes with luxury aesthetics
 */

// Button Styles
export const buttonStyles = {
  // Primary Action Button (e.g., Create, Add, Save)
  primary: `
    px-6 py-3 rounded-2xl font-bold text-white
    bg-gradient-to-r from-indigo-600 to-violet-600
    hover:from-indigo-700 hover:to-violet-700
    hover:scale-[1.02] active:scale-[0.98]
    shadow-[0_8px_30px_rgb(0,0,0,0.12)]
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    dark:focus:ring-offset-[#0B0F1A]
  `,
  
  // Secondary Button (e.g., Cancel, Back)
  secondary: `
    px-6 py-3 rounded-2xl font-bold
    text-slate-700 dark:text-white
    bg-slate-100 dark:bg-white/10
    hover:bg-slate-200 dark:hover:bg-white/15
    border border-slate-200 dark:border-white/10
    hover:scale-[1.02] active:scale-[0.98]
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white/20
  `,
  
  // Success Button (e.g., Approve, Confirm)
  success: `
    px-6 py-3 rounded-2xl font-bold text-white
    bg-gradient-to-r from-emerald-600 to-teal-600
    hover:from-emerald-700 hover:to-teal-700
    hover:scale-[1.02] active:scale-[0.98]
    shadow-[0_8px_30px_rgba(16,185,129,0.3)]
    transition-all duration-200
  `,
  
  // Danger Button (e.g., Delete, Remove, Reject)
  danger: `
    px-6 py-3 rounded-2xl font-bold text-white
    bg-gradient-to-r from-red-600 to-rose-600
    hover:from-red-700 hover:to-rose-700
    hover:scale-[1.02] active:scale-[0.98]
    shadow-[0_8px_30px_rgba(239,68,68,0.3)]
    transition-all duration-200
  `,
  
  // Warning Button
  warning: `
    px-6 py-3 rounded-2xl font-bold text-white
    bg-gradient-to-r from-amber-600 to-orange-600
    hover:from-amber-700 hover:to-orange-700
    hover:scale-[1.02] active:scale-[0.98]
    shadow-[0_8px_30px_rgba(245,158,11,0.3)]
    transition-all duration-200
  `,
  
  // Small variants
  primarySmall: `
    px-4 py-2 rounded-xl text-sm font-bold text-white
    bg-gradient-to-r from-indigo-600 to-violet-600
    hover:from-indigo-700 hover:to-violet-700
    hover:scale-[1.02] active:scale-[0.98]
    transition-all duration-200
  `,
  
  secondarySmall: `
    px-4 py-2 rounded-xl text-sm font-bold
    text-slate-700 dark:text-white
    bg-slate-100 dark:bg-white/10
    hover:bg-slate-200 dark:hover:bg-white/15
    border border-slate-200 dark:border-white/10
    hover:scale-[1.02] active:scale-[0.98]
    transition-all duration-200
  `,
  
  // Icon Button
  icon: `
    w-10 h-10 rounded-xl flex items-center justify-center
    bg-slate-100 dark:bg-white/10
    hover:bg-slate-200 dark:hover:bg-white/15
    border border-slate-200 dark:border-white/10
    transition-all duration-200
    hover:scale-110
  `,
};

// Table Styles
export const tableStyles = {
  // Main container
  container: `
    w-full overflow-hidden rounded-2xl
    bg-white/80 dark:bg-[#161B2A]/80
    backdrop-blur-md
    border border-slate-100 dark:border-white/5
    shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl
  `,
  
  // Table wrapper for horizontal scroll
  wrapper: `
    overflow-x-auto
  `,
  
  // Table element
  table: `
    w-full
  `,
  
  // Table header
  thead: `
    bg-slate-50 dark:bg-slate-900/50
    border-b border-slate-200 dark:border-white/10
  `,
  
  // Header cell
  th: `
    px-6 py-4 text-right text-xs font-bold uppercase tracking-wider
    text-slate-700 dark:text-white/80
  `,
  
  // Table body
  tbody: `
    divide-y divide-slate-100 dark:divide-white/5
  `,
  
  // Body row
  tr: `
    hover:bg-slate-50 dark:hover:bg-white/5
    transition-colors duration-150
  `,
  
  // Body cell
  td: `
    px-6 py-4 text-sm
    text-slate-900 dark:text-white
  `,
  
  // Empty state
  emptyState: `
    text-center py-12
    text-slate-600 dark:text-white/60
  `,
};

// Card Styles
export const cardStyles = {
  // Standard card
  standard: `
    bg-white/80 dark:bg-[#161B2A]/80
    backdrop-blur-md
    rounded-2xl
    border border-slate-100 dark:border-white/5
    shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl
    p-6
  `,
  
  // Hover card (interactive)
  hover: `
    bg-white/80 dark:bg-[#161B2A]/80
    backdrop-blur-md
    rounded-2xl
    border border-slate-100 dark:border-white/5
    shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl
    p-6
    transition-all duration-200
    hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
    hover:-translate-y-1
  `,
  
  // Compact card
  compact: `
    bg-white/80 dark:bg-[#161B2A]/80
    backdrop-blur-md
    rounded-xl
    border border-slate-100 dark:border-white/5
    shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-xl
    p-4
  `,
};

// Input Styles
export const inputStyles = {
  // Text input
  text: `
    w-full px-4 py-3 rounded-xl
    bg-slate-50 dark:bg-white/5
    border border-slate-200 dark:border-white/10
    text-slate-900 dark:text-white
    placeholder-slate-500 dark:placeholder-white/40
    focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
    focus:border-transparent
    transition-all duration-200
  `,
  
  // Select
  select: `
    w-full px-4 py-3 rounded-xl
    bg-slate-50 dark:bg-white/5
    border border-slate-200 dark:border-white/10
    text-slate-900 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
    focus:border-transparent
    transition-all duration-200
    cursor-pointer
  `,
  
  // Textarea
  textarea: `
    w-full px-4 py-3 rounded-xl
    bg-slate-50 dark:bg-white/5
    border border-slate-200 dark:border-white/10
    text-slate-900 dark:text-white
    placeholder-slate-500 dark:placeholder-white/40
    focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
    focus:border-transparent
    transition-all duration-200
    resize-none
  `,
  
  // Checkbox
  checkbox: `
    w-5 h-5 rounded
    border-slate-300 dark:border-white/20
    text-indigo-600 dark:text-indigo-400
    focus:ring-indigo-500 dark:focus:ring-indigo-400
    focus:ring-offset-0
    bg-slate-50 dark:bg-white/5
  `,
};

// Badge Styles
export const badgeStyles = {
  // Status badges
  success: `
    px-3 py-1 rounded-full text-xs font-bold
    bg-emerald-100 dark:bg-emerald-500/20
    text-emerald-700 dark:text-emerald-400
    border border-emerald-200 dark:border-emerald-500/30
  `,
  
  warning: `
    px-3 py-1 rounded-full text-xs font-bold
    bg-amber-100 dark:bg-amber-500/20
    text-amber-700 dark:text-amber-400
    border border-amber-200 dark:border-amber-500/30
  `,
  
  danger: `
    px-3 py-1 rounded-full text-xs font-bold
    bg-red-100 dark:bg-red-500/20
    text-red-700 dark:text-red-400
    border border-red-200 dark:border-red-500/30
  `,
  
  info: `
    px-3 py-1 rounded-full text-xs font-bold
    bg-blue-100 dark:bg-blue-500/20
    text-blue-700 dark:text-blue-400
    border border-blue-200 dark:border-blue-500/30
  `,
  
  neutral: `
    px-3 py-1 rounded-full text-xs font-bold
    bg-slate-100 dark:bg-slate-500/20
    text-slate-700 dark:text-slate-400
    border border-slate-200 dark:border-slate-500/30
  `,
};

// Modal/Dialog Styles
export const modalStyles = {
  overlay: `
    fixed inset-0 bg-black/50 dark:bg-black/70
    backdrop-blur-sm
    z-50
    flex items-center justify-center
    p-4
  `,
  
  container: `
    bg-white dark:bg-[#161B2A]
    rounded-2xl
    border border-slate-100 dark:border-white/5
    shadow-[0_20px_70px_rgb(0,0,0,0.2)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.5)]
    max-w-2xl w-full
    max-h-[90vh]
    overflow-hidden
    flex flex-col
  `,
  
  header: `
    px-6 py-4
    border-b border-slate-200 dark:border-white/10
    bg-slate-50 dark:bg-slate-900/50
  `,
  
  body: `
    px-6 py-4
    overflow-y-auto
    flex-1
  `,
  
  footer: `
    px-6 py-4
    border-t border-slate-200 dark:border-white/10
    bg-slate-50 dark:bg-slate-900/50
    flex items-center justify-end gap-3
  `,
};

// Typography Styles
export const textStyles = {
  h1: 'text-4xl font-black text-slate-900 dark:text-white',
  h2: 'text-3xl font-black text-slate-900 dark:text-white',
  h3: 'text-2xl font-black text-slate-900 dark:text-white',
  h4: 'text-xl font-bold text-slate-900 dark:text-white',
  h5: 'text-lg font-bold text-slate-900 dark:text-white',
  body: 'text-base text-slate-700 dark:text-white/80',
  bodySecondary: 'text-base text-slate-600 dark:text-white/60',
  small: 'text-sm text-slate-600 dark:text-white/60',
  tiny: 'text-xs text-slate-500 dark:text-white/50',
};
