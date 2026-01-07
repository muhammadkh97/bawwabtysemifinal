'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Wallet, DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownLeft, Clock, CreditCard, Download, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'refund';
  amount: number;
  description: string;
  order_number?: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
}

interface WalletSummary {
  current_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  completed_orders: number;
  pending_orders: number;
  total_commission: number;
  avg_order_value: number;
  can_request_payout: boolean;
  min_payout_amount: number;
}

export default function RestaurantWalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    iban: '',
    notes: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        setVendorId(vendorData.id);
        await fetchWalletData(vendorData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchWalletData = async (vId: string) => {
    try {
      // استخدام الـ Function الاحترافية الجديدة
      const { data: summary, error: summaryError } = await supabase
        .rpc('get_vendor_wallet_summary', { p_vendor_id: vId })
        .single<WalletSummary>();

      if (summaryError) throw summaryError;
      if (summary) {
        setWalletSummary(summary);
        setPayoutAmount(summary.current_balance);
      }

      // جلب المعاملات من الـ Function
      const { data: txns, error: txnsError } = await supabase
        .rpc('get_vendor_transactions', {
          p_vendor_id: vId,
          p_limit: 50,
          p_offset: 0
        });

      if (txnsError) throw txnsError;
      setTransactions(txns || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  const handleRequestPayout = async () => {
    if (!walletSummary?.can_request_payout) {
      alert(`الحد الأدنى للسحب هو ${walletSummary?.min_payout_amount} ر.س`);
      return;
    }

    try {
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          vendor_id: vendorId,
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
      fetchWalletData(vendorId);
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('حدث خطأ في إرسال الطلب');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <FuturisticNavbar />
      <div className="flex">
        <FuturisticSidebar role="restaurant" />
        <div className="md:mr-[280px] transition-all duration-300 w-full">
          <main className="pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">💰 المحفظة والأرباح</h1>
            <p className="text-gray-600">إدارة الأرباح والمعاملات المالية</p>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Available Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl"
            >
              <Wallet className="w-10 h-10 mb-3" />
              <p className="text-green-100 text-sm mb-1">الرصيد المتاح</p>
              <h2 className="text-4xl font-black mb-3">{walletSummary?.current_balance.toFixed(2) || '0.00'} ر.س</h2>
              {walletSummary?.can_request_payout && (
                <button 
                  onClick={() => setShowPayoutModal(true)}
                  className="w-full bg-white text-green-600 py-2 rounded-xl font-bold hover:bg-green-50 transition text-sm"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  سحب الرصيد
                </button>
              )}
            </motion.div>

            {/* Pending Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-xl"
            >
              <Clock className="w-10 h-10 mb-3" />
              <p className="text-orange-100 text-sm mb-1">الرصيد المعلق</p>
              <h2 className="text-4xl font-black mb-3">{walletSummary?.pending_balance.toFixed(2) || '0.00'} ر.س</h2>
              <p className="text-sm text-orange-100">من {walletSummary?.pending_orders || 0} طلبات معلقة</p>
            </motion.div>

            {/* Total Earned */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl"
            >
              <TrendingUp className="w-10 h-10 mb-3" />
              <p className="text-blue-100 text-sm mb-1">إجمالي الأرباح</p>
              <h2 className="text-4xl font-black mb-3">{walletSummary?.total_earned.toFixed(2) || '0.00'} ر.س</h2>
              <p className="text-sm text-blue-100">من {walletSummary?.completed_orders || 0} طلب مكتمل</p>
            </motion.div>

            {/* Total Withdrawn */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl"
            >
              <DollarSign className="w-10 h-10 mb-3" />
              <p className="text-purple-100 text-sm mb-1">إجمالي المسحوبات</p>
              <h2 className="text-4xl font-black mb-3">{walletSummary?.total_withdrawn.toFixed(2) || '0.00'} ر.س</h2>
              <p className="text-sm text-purple-100">طلبات سحب مكتملة</p>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">متوسط قيمة الطلب</p>
                  <p className="text-2xl font-bold text-gray-900">{walletSummary?.avg_order_value.toFixed(2) || '0.00'} ر.س</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي العمولات</p>
                  <p className="text-2xl font-bold text-gray-900">{walletSummary?.total_commission.toFixed(2) || '0.00'} ر.س</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">عدد المعاملات</p>
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Payout Warning */}
          {!walletSummary?.can_request_payout && walletSummary && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-semibold">الحد الأدنى للسحب</p>
                <p className="text-yellow-700 text-sm">
                  رصيدك الحالي {walletSummary.current_balance.toFixed(2)} ر.س، 
                  الحد الأدنى للسحب هو {walletSummary.min_payout_amount.toFixed(2)} ر.س
                </p>
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">سجل المعاملات</h2>
            
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.type === 'earning' 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {transaction.type === 'earning' ? (
                          <ArrowDownLeft className={`w-6 h-6 ${transaction.type === 'earning' ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <ArrowUpRight className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{transaction.description}</h3>
                        <p className="text-sm text-gray-600">{new Date(transaction.created_at).toLocaleDateString('ar-JO')}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`text-xl font-bold ${
                        transaction.type === 'earning' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'earning' ? '+' : '-'}{transaction.amount.toFixed(2)} ₪
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {transaction.status === 'completed' ? 'مكتمل' : 'معلق'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد معاملات بعد</p>
              </div>
            )}
          </div>
          </main>
        </div>
      </div>
    </>
  );
}
