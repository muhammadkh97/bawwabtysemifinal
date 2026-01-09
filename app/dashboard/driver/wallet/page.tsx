'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CreditCard, 
  Download, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus';
  amount: number;
  description: string;
  order_number?: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
}

interface DriverWalletSummary {
  current_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  completed_deliveries: number;
  pending_deliveries: number;
  avg_delivery_fee: number;
  today_earnings: number;
  week_earnings: number;
  month_earnings: number;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  bank_name: string;
  account_number: string;
  requested_at: string;
  processed_at?: string;
  rejection_reason?: string;
}

interface OrderFromDB {
  order_number: string;
  delivery_fee: number;
  created_at: string;
  status: string;
}

export default function DriverWalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [walletSummary, setWalletSummary] = useState<DriverWalletSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [driverId, setDriverId] = useState<string>('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    iban: '',
    notes: ''
  });

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get driver ID
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (driverData) {
        setDriverId(driverData.id);
        await fetchWalletData(driverData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchWalletData = async (dId: string) => {
    try {
      // جلب بيانات الطلبات المكتملة
      const { data: ordersData } = await supabase
        .from('orders')
        .select('delivery_fee, created_at, order_number, status')
        .eq('driver_id', dId)
        .order('created_at', { ascending: false });

      if (ordersData) {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalEarned = 0;
        let todayEarnings = 0;
        let weekEarnings = 0;
        let monthEarnings = 0;
        let completedCount = 0;
        let pendingCount = 0;

        const txns: Transaction[] = [];

        (ordersData as OrderFromDB[]).forEach((order) => {
          const fee = order.delivery_fee || 0;
          const date = new Date(order.created_at);
          
          if (order.status === 'delivered') {
            totalEarned += fee;
            completedCount++;
            
            if (date >= today) todayEarnings += fee;
            if (date >= weekAgo) weekEarnings += fee;
            if (date >= monthStart) monthEarnings += fee;

            txns.push({
              id: order.order_number || '',
              type: 'earning',
              amount: fee,
              description: `رسوم توصيل - طلب #${order.order_number}`,
              order_number: order.order_number,
              created_at: order.created_at,
              status: 'completed'
            });
          } else if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') {
            pendingCount++;
          }
        });

        // جلب معلومات السحوبات
        const { data: payoutsData } = await supabase
          .from('payout_requests')
          .select('amount, status')
          .eq('vendor_id', dId)
          .eq('status', 'approved');

        let totalWithdrawn = 0;
        if (payoutsData) {
          totalWithdrawn = payoutsData.reduce((sum, p) => sum + (p.amount || 0), 0);
        }

        const currentBalance = totalEarned - totalWithdrawn;

        setWalletSummary({
          current_balance: currentBalance,
          pending_balance: 0,
          total_earned: totalEarned,
          total_withdrawn: totalWithdrawn,
          completed_deliveries: completedCount,
          pending_deliveries: pendingCount,
          avg_delivery_fee: completedCount > 0 ? totalEarned / completedCount : 0,
          today_earnings: todayEarnings,
          week_earnings: weekEarnings,
          month_earnings: monthEarnings
        });

        setTransactions(txns);
        setPayoutAmount(currentBalance);
      }

      // جلب طلبات السحب
      const { data: payoutsData } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('vendor_id', dId)
        .order('requested_at', { ascending: false });

      if (payoutsData) {
        setPayoutRequests(payoutsData);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  const handleRequestPayout = async () => {
    if (!walletSummary) return;

    if (payoutAmount < 100) {
      alert('⚠️ الحد الأدنى للسحب هو 100 ريال');
      return;
    }

    if (payoutAmount > walletSummary.current_balance) {
      alert('⚠️ المبلغ المطلوب أكبر من رصيدك المتاح');
      return;
    }

    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountHolder) {
      alert('⚠️ يرجى إدخال جميع بيانات البنك المطلوبة');
      return;
    }

    try {
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          vendor_id: driverId,
          amount: payoutAmount,
          bank_name: bankDetails.bankName,
          account_number: bankDetails.accountNumber,
          account_holder: bankDetails.accountHolder,
          iban: bankDetails.iban,
          notes: bankDetails.notes,
          status: 'pending'
        });

      if (error) throw error;

      alert('✅ تم إرسال طلب السحب بنجاح! سيتم مراجعته من قبل الإدارة.');
      setShowPayoutModal(false);
      setBankDetails({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        iban: '',
        notes: ''
      });
      fetchWalletData(driverId);
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('حدث خطأ في إرسال الطلب');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <FuturisticSidebar role="driver" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <FuturisticNavbar />
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <FuturisticSidebar role="driver" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Wallet className="w-8 h-8 text-blue-400" />
                  المحفظة والأرباح
                </h1>
                <p className="text-gray-400 mt-2">تتبع أرباحك وطلبات السحب</p>
              </div>
              {walletSummary && walletSummary.current_balance >= 100 && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                >
                  <Download className="w-5 h-5" />
                  طلب سحب
                </button>
              )}
            </div>

            {/* Stats Cards */}
            {walletSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-sm">الرصيد المتاح</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {walletSummary.current_balance.toFixed(2)} ر.س
                      </p>
                      <p className="text-green-300 text-xs mt-2">
                        {walletSummary.completed_deliveries} توصيل مكتمل
                      </p>
                    </div>
                    <Wallet className="w-12 h-12 text-green-400" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm">إجمالي الأرباح</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {walletSummary.total_earned.toFixed(2)} ر.س
                      </p>
                      <p className="text-blue-300 text-xs mt-2">
                        متوسط: {walletSummary.avg_delivery_fee.toFixed(2)} ر.س
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-blue-400" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">أرباح هذا الشهر</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {walletSummary.month_earnings.toFixed(2)} ر.س
                      </p>
                      <p className="text-purple-300 text-xs mt-2">
                        هذا الأسبوع: {walletSummary.week_earnings.toFixed(2)} ر.س
                      </p>
                    </div>
                    <Calendar className="w-12 h-12 text-purple-400" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-300 text-sm">تم السحب</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {walletSummary.total_withdrawn.toFixed(2)} ر.س
                      </p>
                      <p className="text-orange-300 text-xs mt-2">
                        عمليات سحب سابقة
                      </p>
                    </div>
                    <ArrowDownLeft className="w-12 h-12 text-orange-400" />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Payout Requests */}
            {payoutRequests.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                  طلبات السحب ({payoutRequests.length})
                </h2>
                <div className="space-y-3">
                  {payoutRequests.map((payout) => (
                    <div
                      key={payout.id}
                      className="bg-gray-700/30 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          payout.status === 'pending' ? 'bg-yellow-500/20' :
                          payout.status === 'approved' ? 'bg-green-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {payout.status === 'pending' && <Clock className="w-5 h-5 text-yellow-400" />}
                          {payout.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-400" />}
                          {payout.status === 'rejected' && <XCircle className="w-5 h-5 text-red-400" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {payout.amount.toFixed(2)} ر.س
                          </p>
                          <p className="text-gray-400 text-sm">
                            {new Date(payout.requested_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          payout.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          payout.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {payout.status === 'pending' && 'قيد المراجعة'}
                          {payout.status === 'approved' && 'تمت الموافقة'}
                          {payout.status === 'rejected' && 'مرفوض'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ArrowUpRight className="w-6 h-6 text-green-400" />
                آخر التوصيلات ({transactions.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">رقم الطلب</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الوصف</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">المبلغ</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">التاريخ</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {transactions.slice(0, 20).map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-gray-300">{txn.order_number}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">{txn.description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-green-400 font-medium">
                            +{txn.amount.toFixed(2)} ر.س
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(txn.created_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            مكتمل
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700"
          >
            <h3 className="text-2xl font-bold text-white mb-4">طلب سحب رصيد</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  المبلغ المطلوب سحبه
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="أدخل المبلغ"
                  min="100"
                  max={walletSummary?.current_balance}
                />
                <p className="text-xs text-gray-400 mt-1">
                  الحد الأدنى: 100 ر.س | المتاح: {walletSummary?.current_balance.toFixed(2)} ر.س
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  اسم البنك *
                </label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="مثال: بنك الراجحي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  اسم صاحب الحساب *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountHolder}
                  onChange={(e) => setBankDetails({...bankDetails, accountHolder: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="الاسم كما في البطاقة البنكية"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  رقم الحساب / IBAN *
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="SA1234567890123456789012"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  IBAN (اختياري)
                </label>
                <input
                  type="text"
                  value={bankDetails.iban}
                  onChange={(e) => setBankDetails({...bankDetails, iban: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="SA..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={bankDetails.notes}
                  onChange={(e) => setBankDetails({...bankDetails, notes: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRequestPayout}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800"
              >
                إرسال الطلب
              </button>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
