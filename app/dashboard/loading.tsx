/**
 * Loading component for dashboard pages
 * Shown during server-side authentication check
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0A0515] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
          {/* Spinning gradient ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
          {/* Inner glow */}
          <div className="absolute inset-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-md"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          جارٍ التحقق من الصلاحيات
        </h2>
        <p className="text-gray-400 text-sm">
          Verifying your session...
        </p>
      </div>
    </div>
  );
}
