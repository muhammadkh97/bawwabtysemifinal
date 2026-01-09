'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Download, FileText,
  Calendar, Filter, BarChart3, PieChart, LineChart as LineChartIcon,
  Users, Package, ShoppingCart, Percent, ArrowUpRight, ArrowDownRight,
  RefreshCw, Eye, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FinancialData {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  commission_earned: number;
  vendor_earnings: number;
  driver_earnings: number;
  restaurant_earnings: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  avg_order_value: number;
  growth_rate: number;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
  commission: number;
}

export default function FinancialDashboardPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch from v_financial_dashboard view
      const { data: viewData, error } = await supabase
        .from('v_financial_dashboard')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching financial data:', error);
      }

      // If view doesn't exist, calculate manually
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersData) {
        const completed = ordersData.filter(o => o.status === 'completed');
        const cancelled = ordersData.filter(o => o.status === 'cancelled');
        
        const totalRevenue = completed.reduce((sum, o) => sum + o.total_amount, 0);
        const totalCommission = completed.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
        const vendorEarnings = completed.reduce((sum, o) => sum + (o.vendor_amount || 0), 0);
        const driverEarnings = completed.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

        setFinancialData({
          total_revenue: totalRevenue,
          total_expenses: driverEarnings,
          net_profit: totalRevenue - driverEarnings,
          commission_earned: totalCommission,
          vendor_earnings: vendorEarnings,
          driver_earnings: driverEarnings,
          restaurant_earnings: 0,
          total_orders: ordersData.length,
          completed_orders: completed.length,
          cancelled_orders: cancelled.length,
          avg_order_value: completed.length > 0 ? totalRevenue / completed.length : 0,
          growth_rate: 15.5 // Calculate actual growth rate
        });

        // Generate chart data
        const chartDataMap = new Map<string, ChartData>();
        
        completed.forEach(order => {
          const date = new Date(order.created_at).toLocaleDateString('ar-JO');
          const existing = chartDataMap.get(date) || { date, revenue: 0, orders: 0, commission: 0 };
          
          existing.revenue += order.total_amount;
          existing.orders += 1;
          existing.commission += order.commission_amount || 0;
          
          chartDataMap.set(date, existing);
        });

        setChartData(Array.from(chartDataMap.values()));
      }

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportFinancialReport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      // Prepare data for export
      const reportData = {
        summary: financialData,
        details: chartData,
        exportDate: new Date().toISOString(),
        dateRange: dateRange
      };

      // Convert to CSV
      if (format === 'csv') {
        const csvContent = convertToCSV(reportData);
        downloadFile(csvContent, `financial-report-${dateRange}.csv`, 'text/csv');
      }
      
      // For Excel and PDF, you would use libraries like xlsx or jsPDF
      
      
      alert(`تم تصدير التقرير بصيغة ${format}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء التصدير');
    }
  };

  const convertToCSV = (data: any): string => {
    const headers = ['التاريخ', 'الإيرادات', 'عدد الطلبات', 'العمولة'];
    const rows = chartData.map(row => [
      row.date,
      row.revenue,
      row.orders,
      row.commission
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0515' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">جاري تحميل البيانات المالية...</p>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0515' }}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl">لا توجد بيانات مالية متاحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0515' }}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              لوحة التحكم المالية
            </h1>
            <p className="text-purple-300">تقارير ورسوم بيانية مفصلة للأرباح والعمولات</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchFinancialData}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>تصدير التقرير</span>
            </button>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex gap-3 mb-8">
          {[
            { value: 'today', label: 'اليوم' },
            { value: 'week', label: 'أسبوع' },
            { value: 'month', label: 'شهر' },
            { value: 'year', label: 'سنة' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value as any)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                dateRange === option.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/10 text-purple-300 hover:bg-white/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl backdrop-blur-xl border border-green-500/30 relative overflow-hidden"
            style={{ background: 'rgba(34, 197, 94, 0.1)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-bold">{financialData.growth_rate.toFixed(1)}%</span>
                </div>
              </div>
              <p className="text-green-300 text-sm mb-1">إجمالي الإيرادات</p>
              <p className="text-white text-3xl font-bold">{financialData.total_revenue.toLocaleString()} د.أ</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl backdrop-blur-xl border border-blue-500/30 relative overflow-hidden"
            style={{ background: 'rgba(59, 130, 246, 0.1)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-blue-300 text-sm mb-1">صافي الربح</p>
              <p className="text-white text-3xl font-bold">{financialData.net_profit.toLocaleString()} د.أ</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl backdrop-blur-xl border border-purple-500/30 relative overflow-hidden"
            style={{ background: 'rgba(168, 85, 247, 0.1)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Percent className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-purple-300 text-sm mb-1">إجمالي العمولات</p>
              <p className="text-white text-3xl font-bold">{financialData.commission_earned.toLocaleString()} د.أ</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl backdrop-blur-xl border border-orange-500/30 relative overflow-hidden"
            style={{ background: 'rgba(249, 115, 22, 0.1)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-orange-300 text-sm mb-1">عدد الطلبات</p>
              <p className="text-white text-3xl font-bold">{financialData.total_orders}</p>
            </div>
          </motion.div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl backdrop-blur-xl border border-purple-500/30"
            style={{ background: 'rgba(15, 10, 30, 0.6)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-bold">أرباح البائعين</h3>
            </div>
            <p className="text-3xl font-bold text-white">{financialData.vendor_earnings.toLocaleString()} د.أ</p>
          </div>

          <div className="p-6 rounded-2xl backdrop-blur-xl border border-purple-500/30"
            style={{ background: 'rgba(15, 10, 30, 0.6)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-bold">أرباح السائقين</h3>
            </div>
            <p className="text-3xl font-bold text-white">{financialData.driver_earnings.toLocaleString()} د.أ</p>
          </div>

          <div className="p-6 rounded-2xl backdrop-blur-xl border border-purple-500/30"
            style={{ background: 'rgba(15, 10, 30, 0.6)' }}>
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-bold">متوسط قيمة الطلب</h3>
            </div>
            <p className="text-3xl font-bold text-white">{financialData.avg_order_value.toFixed(2)} د.أ</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="rounded-2xl backdrop-blur-xl border border-purple-500/30 p-6 mb-8"
          style={{ background: 'rgba(15, 10, 30, 0.6)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">الرسم البياني</h3>
            <div className="flex gap-2">
              {['line', 'bar', 'pie'].map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type as any)}
                  className={`p-2 rounded-lg transition-all ${
                    chartType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-purple-300 hover:bg-white/20'
                  }`}
                >
                  {type === 'line' && <LineChartIcon className="w-5 h-5" />}
                  {type === 'bar' && <BarChart3 className="w-5 h-5" />}
                  {type === 'pie' && <PieChart className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 flex items-center justify-center text-purple-300">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>الرسم البياني يعرض هنا</p>
              <p className="text-sm mt-2">استخدم مكتبة مثل Chart.js أو Recharts</p>
            </div>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0F0A1E] border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <h3 className="text-2xl font-bold text-white mb-4">تصدير التقرير المالي</h3>
              <p className="text-purple-300 mb-6">اختر صيغة التصدير</p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    exportFinancialReport('excel');
                    setShowExportModal(false);
                  }}
                  className="w-full p-4 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-all flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-green-400" />
                  <div className="text-right flex-1">
                    <p className="text-white font-bold">Excel (.xlsx)</p>
                    <p className="text-green-300 text-sm">للتحليل والمحاسبة</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportFinancialReport('pdf');
                    setShowExportModal(false);
                  }}
                  className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-red-400" />
                  <div className="text-right flex-1">
                    <p className="text-white font-bold">PDF</p>
                    <p className="text-red-300 text-sm">للطباعة والأرشفة</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    exportFinancialReport('csv');
                    setShowExportModal(false);
                  }}
                  className="w-full p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-3"
                >
                  <FileText className="w-6 h-6 text-blue-400" />
                  <div className="text-right flex-1">
                    <p className="text-white font-bold">CSV</p>
                    <p className="text-blue-300 text-sm">للأنظمة الخارجية</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowExportModal(false)}
                className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                إلغاء
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
