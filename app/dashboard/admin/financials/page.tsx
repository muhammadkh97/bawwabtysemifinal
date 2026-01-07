'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { 
  DollarSign, TrendingUp, Users, Wallet, Clock, CheckCircle, XCircle, Download, Calendar, AlertCircle, FileText
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PlatformStats {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_revenue: number;
  total_platform_earning: number;
  total_vendors_earning: number;
  avg_commission_rate: number;
  active_vendors: number;
}

interface VendorEarnings {
  vendor_id: string;
  vendor_name: string;
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  net_earnings: number;
  current_balance: number;
}

interface DailyRevenue {
  date: string;
  total_orders: number;
  total_revenue: number;
  platform_earning: number;
  vendors_earning: number;
}

interface PayoutRequest {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_phone: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  iban: string;
  requested_at: string;
  notes: string;
  current_balance: number;
}

export default function AdminFinancialsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [vendors, setVendors] = useState<VendorEarnings[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7days' | '30days'>('30days');
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    checkConnection();
    loadFinancialData();
  }, [dateRange]);

  async function checkConnection() {
    try {
      setConnectionStatus('checking');
      const { data, error } = await supabase.from('financial_settings').select('id').limit(1);
      setConnectionStatus(error ? 'disconnected' : 'connected');
    } catch {
      setConnectionStatus('disconnected');
    }
  }

  async function loadFinancialData() {
    setLoading(true);
    try {
      // 1. Platform Stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_platform_financial_stats');
      if (statsError) {
        console.error('Error loading platform stats:', statsError);
      }
      if (statsData?.[0]) setStats(statsData[0]);

      // 2. Top Vendors
      const { data: vendorsData, error: vendorsError } = await supabase.rpc('get_vendors_earnings_report');
      if (vendorsError) {
        console.error('Error loading vendors report:', vendorsError);
      }
      if (vendorsData) setVendors(vendorsData.slice(0, 10));

      // 3. Daily Revenue
      const daysBack = dateRange === '7days' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const { data: revenueData, error: revenueError } = await supabase.rpc('get_daily_revenue_report', {
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0]
      });
      if (revenueError) {
        console.error('Error loading daily revenue:', revenueError);
      }
      if (revenueData) setDailyRevenue(revenueData);

      // 4. Pending Payout Requests
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payout_requests')
        .select(`
          id,
          vendor_id,
          amount,
          status,
          bank_name,
          account_number,
          account_holder,
          iban,
          requested_at,
          notes,
          stores!payout_requests_vendor_id_fkey (
            name,
            phone
          ),
          vendor_wallets!payout_requests_vendor_id_fkey (
            current_balance
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (payoutsError) {
        console.error('Error loading payout requests:', payoutsError);
      }
      if (payoutsData) {
        const formatted = payoutsData.map((p: any) => ({
          id: p.id,
          vendor_id: p.vendor_id,
          vendor_name: p.stores?.name || 'غير معروف',
          vendor_phone: p.stores?.phone || '',
          amount: p.amount,
          status: p.status,
          bank_name: p.bank_name || '',
          account_number: p.account_number || '',
          account_holder: p.account_holder || '',
          iban: p.iban || '',
          requested_at: p.requested_at,
          notes: p.notes || '',
          current_balance: p.vendor_wallets?.current_balance || 0
        }));
        setPayoutRequests(formatted);
      }

      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error loading financial data:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayoutAction(payoutId: string, action: 'approve' | 'reject') {
    if (!confirm(`هل أنت متأكد من ${action === 'approve' ? 'الموافقة على' : 'رفض'} هذا الطلب؟`)) {
      return;
    }

    setProcessingPayout(payoutId);
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('payout_requests')
        .update({ 
          status: newStatus,
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', payoutId);

      if (error) throw error;

      // If approved, update vendor wallet
      if (action === 'approve') {
        const payout = payoutRequests.find(p => p.id === payoutId);
        if (payout) {
          await supabase
            .from('vendor_wallets')
            .update({
              current_balance: payout.current_balance - payout.amount,
              total_withdrawn: payout.current_balance
            })
            .eq('vendor_id', payout.vendor_id);
        }
      }

      await loadFinancialData();
      alert(action === 'approve' ? '✅ تم الموافقة على طلب السحب بنجاح' : '❌ تم رفض طلب السحب');
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('حدث خطأ أثناء معالجة الطلب');
    } finally {
      setProcessingPayout(null);
    }
  }

  function exportToCSV() {
    if (!vendors.length) return;

    const headers = ['اسم البائع', 'عدد الطلبات', 'الإيرادات', 'العمولة', 'الأرباح الصافية', 'الرصيد الحالي'];
    const rows = vendors.map(v => [
      v.vendor_name,
      v.total_orders,
      v.total_revenue,
      v.total_commission,
      v.net_earnings,
      v.current_balance
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function exportDailyRevenueToCSV() {
    if (!dailyRevenue.length) return;

    const headers = ['التاريخ', 'الطلبات', 'الإيرادات', 'عمولة المنصة', 'أرباح البائعين'];
    const rows = dailyRevenue.map(d => [
      new Date(d.date).toLocaleDateString('ar-SA'),
      d.total_orders,
      d.total_revenue,
      d.platform_earning,
      d.vendors_earning
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `daily_revenue_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <FuturisticSidebar role="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <FuturisticSidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <FuturisticNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header with Connection Status */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  النظام المالي الإحترافي
                  {connectionStatus === 'connected' && (
                    <span className="flex items-center gap-1 text-sm font-normal text-green-400 bg-green-500/20 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      متصل
                    </span>
                  )}
                  {connectionStatus === 'disconnected' && (
                    <span className="flex items-center gap-1 text-sm font-normal text-red-400 bg-red-500/20 px-3 py-1 rounded-full">
                      <XCircle className="w-4 h-4" />
                      غير متصل
                    </span>
                  )}
                  {connectionStatus === 'checking' && (
                    <span className="flex items-center gap-1 text-sm font-normal text-yellow-400 bg-yellow-500/20 px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4 animate-spin" />
                      جاري التحقق...
                    </span>
                  )}
                </h1>
                <p className="text-gray-400 mt-2">إحصائيات وتقارير شاملة | Amazon-like Dashboard</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportDailyRevenueToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  <FileText className="w-5 h-5" />
                  تصدير اليومي
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                >
                  <Download className="w-5 h-5" />
                  تصدير البائعين
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm">إجمالي الإيرادات</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.total_revenue.toFixed(2)} ر.س</p>
                      <p className="text-blue-300 text-xs mt-2">{stats.total_orders} طلب</p>
                    </div>
                    <DollarSign className="w-12 h-12 text-blue-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-sm">أرباح المنصة</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.total_platform_earning.toFixed(2)} ر.س</p>
                      <p className="text-green-300 text-xs mt-2">{stats.avg_commission_rate.toFixed(1)}% عمولة</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">أرباح البائعين</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.total_vendors_earning.toFixed(2)} ر.س</p>
                      <p className="text-purple-300 text-xs mt-2">{stats.active_vendors} بائع</p>
                    </div>
                    <Wallet className="w-12 h-12 text-purple-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-300 text-sm">الطلبات المكتملة</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.completed_orders}</p>
                      <p className="text-orange-300 text-xs mt-2">من {stats.total_orders} طلب</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-orange-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Payout Requests Section */}
            {payoutRequests.length > 0 && (
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-orange-400" />
                  طلبات السحب المعلقة ({payoutRequests.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">البائع</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">المبلغ</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الرصيد الحالي</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">البنك / IBAN</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">التاريخ</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {payoutRequests.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-700/30">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-white">{payout.vendor_name}</p>
                              <p className="text-sm text-gray-400">{payout.vendor_phone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-lg font-bold text-green-400">{payout.amount.toFixed(2)} ر.س</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-300">{payout.current_balance.toFixed(2)} ر.س</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-white">{payout.bank_name}</p>
                              <p className="text-xs text-gray-400 font-mono">{payout.iban || payout.account_number}</p>
                              <p className="text-xs text-gray-500">{payout.account_holder}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {new Date(payout.requested_at).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePayoutAction(payout.id, 'approve')}
                                disabled={processingPayout === payout.id}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingPayout === payout.id ? (
                                  <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                موافقة
                              </button>
                              <button
                                onClick={() => handlePayoutAction(payout.id, 'reject')}
                                disabled={processingPayout === payout.id}
                                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <XCircle className="w-4 h-4" />
                                رفض
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Revenue Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">منحنى الإيرادات</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                    <Line type="monotone" dataKey="total_revenue" stroke="#3B82F6" strokeWidth={2} name="الإيرادات" />
                    <Line type="monotone" dataKey="platform_earning" stroke="#10B981" strokeWidth={2} name="أرباح المنصة" />
                    <Line type="monotone" dataKey="vendors_earning" stroke="#8B5CF6" strokeWidth={2} name="أرباح البائعين" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">مقارنة الطلبات اليومية</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                    <Bar dataKey="total_orders" fill="#3B82F6" name="عدد الطلبات" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-400" />
                  الإيرادات اليومية
                </h2>
                <div className="flex gap-2">
                  {['7days', '30days'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        dateRange === range
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {range === '7days' ? '7 أيام' : '30 يوم'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">التاريخ</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الطلبات</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الإيرادات</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">عمولة المنصة</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">أرباح البائعين</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {dailyRevenue.map((day) => (
                      <tr key={day.date} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-sm font-medium text-white">
                          {new Date(day.date).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{day.total_orders}</td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-400">{day.total_revenue.toFixed(2)} ر.س</td>
                        <td className="px-4 py-3 text-sm text-green-400">{day.platform_earning.toFixed(2)} ر.س</td>
                        <td className="px-4 py-3 text-sm text-purple-400">{day.vendors_earning.toFixed(2)} ر.س</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                أفضل البائعين ({vendors.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">#</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">البائع</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الطلبات</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الإيرادات</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">العمولة</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الصافي</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الرصيد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {vendors.map((vendor, index) => (
                      <tr key={vendor.vendor_id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{vendor.vendor_name}</td>
                        <td className="px-4 py-3 text-gray-300">{vendor.total_orders}</td>
                        <td className="px-4 py-3 font-bold text-blue-400">{vendor.total_revenue.toFixed(2)} ر.س</td>
                        <td className="px-4 py-3 text-orange-400">{vendor.total_commission.toFixed(2)} ر.س</td>
                        <td className="px-4 py-3 font-bold text-green-400">{vendor.net_earnings.toFixed(2)} ر.س</td>
                        <td className="px-4 py-3 text-purple-400">{vendor.current_balance.toFixed(2)} ر.س</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


