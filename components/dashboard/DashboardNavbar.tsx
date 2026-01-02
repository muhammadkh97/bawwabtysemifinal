'use client';

export default function DashboardNavbar({ userName, role, title }: { userName: string; role: string; title?: string }) {
  return (
    <nav className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/10" style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}>
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && (
            <h1 className="text-2xl font-bold text-white hidden lg:block">{title}</h1>
          )}
          <button className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-white">
            ☰
          </button>
          <div className="relative">
            <input
              type="search"
              placeholder="ابحث..."
              className="w-64 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/60"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">🔍</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-white/10 rounded-xl transition text-white">
            <span className="text-2xl">🔔</span>
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              3
            </span>
          </button>
          
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 rounded-xl cursor-pointer transition">
            <div className="text-right">
              <p className="font-bold text-white">{userName}</p>
              <p className="text-sm text-white/70">
                {role === 'admin' && 'مدير النظام'}
                {role === 'vendor' && 'بائع'}
                {role === 'driver' && 'مندوب توصيل'}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center font-bold border-2 border-white/30">
              {userName.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

