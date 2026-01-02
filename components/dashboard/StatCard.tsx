'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  blue: 'from-blue-400 to-cyan-400',
  green: 'from-green-400 to-emerald-400',
  purple: 'from-purple-400 to-pink-400',
  orange: 'from-orange-400 to-yellow-400',
  red: 'from-red-400 to-pink-400',
};

export default function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className="backdrop-blur-xl border border-white/20 hover:border-white/40 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1 relative overflow-hidden group" style={{ background: 'rgba(30, 30, 60, 0.7)' }}>
      {/* Animated Gradient Background */}
      <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${colorClasses[color]} opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-white/60 mb-2 font-medium">{title}</p>
            <h3 className="text-4xl font-bold text-white">{value}</h3>
          </div>
          
          <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center text-3xl shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform`}>
            {icon}
          </div>
        </div>
        
        
        {trend && (
          <div className="flex items-center gap-2 pt-4 border-t border-white/10">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              trend.isPositive 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-white/50">من الشهر الماضي</span>
          </div>
        )}
      </div>
    </div>
  );
}

