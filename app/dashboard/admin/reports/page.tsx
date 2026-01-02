'use client';

import { useState, useEffect } from 'react';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { supabase } from '@/lib/supabase';
import { FileText, FileSpreadsheet } from 'lucide-react';

interface ReportData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  totalCommissions: number;
}

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('month');
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCommissions: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // حساب التاريخ بناءً على الفترة المختارة
      const now = new Date();
      let startDate = new Date();
      
      switch(period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // 1. جلب الطلبات المكتملة في الفترة المحددة
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', 'delivered')
        .gte('created_at', startDate.toISOString());

      const totalSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // 2. حساب العمولات (10% من المبيعات كمثال)
      const totalCommissions = totalSales * 0.10;

      setReportData({
        totalSales,
        totalOrders,
        avgOrderValue,
        totalCommissions
      });

    } catch (error) {
      console.error('خطأ في جلب بيانات التقرير:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch(period) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      case 'year': return 'هذا العام';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      <FuturisticSidebar role="admin" />
      
      {/* Main Content Area */}
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="admin" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">التقارير والتحليلات</h1>
            <p className="text-gray-600">عرض وتحليل تقارير المنصة</p>
          </div>

          {/* Report Controls */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="sales">تقرير المبيعات</option>
                  <option value="orders">تقرير الطلبات</option>
                  <option value="vendors">تقرير البائعين</option>
                  <option value="customers">تقرير العملاء</option>
                  <option value="financial">التقرير المالي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="today">اليوم</option>
                  <option value="week">هذا الأسبوع</option>
                  <option value="month">هذا الشهر</option>
                  <option value="year">هذا العام</option>
                  <option value="custom">فترة مخصصة</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={fetchReportData}
                  disabled={loading}
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '⏳ جاري التحميل...' : '📊 إنشاء التقرير'}
                </button>
              </div>
            </div>
          </div>

          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">إجمالي المبيعات</p>
              <h3 className="text-3xl font-bold text-green-600">
                {loading ? '...' : `${reportData.totalSales.toLocaleString('ar-JO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₪`}
              </h3>
              <p className="text-sm text-gray-500 mt-2">{getPeriodLabel()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">عدد الطلبات</p>
              <h3 className="text-3xl font-bold text-blue-600">
                {loading ? '...' : reportData.totalOrders.toLocaleString('ar-JO')}
              </h3>
              <p className="text-sm text-gray-500 mt-2">طلب مكتمل</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">متوسط قيمة الطلب</p>
              <h3 className="text-3xl font-bold text-purple-600">
                {loading ? '...' : `${reportData.avgOrderValue.toLocaleString('ar-JO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₪`}
              </h3>
              <p className="text-sm text-gray-500 mt-2">للطلب الواحد</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">العمولات المحصلة</p>
              <h3 className="text-3xl font-bold text-green-600">
                {loading ? '...' : `${reportData.totalCommissions.toLocaleString('ar-JO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₪`}
              </h3>
              <p className="text-sm text-gray-500 mt-2">10% من المبيعات</p>
            </div>
          </div>

          {/* Report Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">تفاصيل التقرير</h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-gray-600 mb-6">اختر نوع التقرير والفترة الزمنية لعرض التفاصيل</p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => alert('جاري تصدير التقرير بصيغة PDF...')}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  <FileText className="w-5 h-5" />
                  <span>تصدير PDF</span>
                </button>
                
                <button 
                  onClick={() => alert('جاري تصدير التقرير بصيغة Excel...')}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>تصدير Excel</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

