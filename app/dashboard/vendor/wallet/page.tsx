'use client';

import { useState, useEffect } from 'react';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FloatingAddButton from '@/components/dashboard/FloatingAddButton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  balance_after: number;
  created_at: string;
  order_id?: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  bank_name: string;
  account_number: string;
  requested_at: string;
  processed_at?: string;
  rejection_reason?: string;
}

export default function VendorWalletPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'payouts'>('overview');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const { formatPrice } = useCurrency();
  const { userId } = useAuth();

  const [walletData, setWalletData] = useState({
    current_balance: 0,
    pending_balance: 0,
    total_earned: 0,
    total_withdrawn: 0,
    platform_commission_rate: 10,
    last_payout: null as string | null,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);

  useEffect(() => {
    if (userId) {
      fetchWalletData();
    }
  }, [userId]);

  const fetchWalletData = async () => {
    try {
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) return;
      
      setVendorId(vendorData.id);

      // Get wallet data
      const { data: wallet } = await supabase
        .from('vendor_wallets')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .single();

      if (wallet) {
        setWalletData({
          current_balance: wallet.current_balance || 0,
          pending_balance: wallet.pending_balance || 0,
          total_earned: wallet.total_earned || 0,
          total_withdrawn: wallet.total_withdrawn || 0,
          platform_commission_rate: 10,
          last_payout: wallet.last_payout_at,
        });
      }

      // Get transactions (disabled - table doesn't exist yet)
      // TODO: Create wallet_transactions table
      /*
      const { data: transactionsData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsData) {
        setTransactions(transactionsData);
      }
      */

      // Get payout requests (disabled - table doesn't exist yet)
      // TODO: Create payout_requests table
      /*
      const { data: payoutsData } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (payoutsData) {
        setPayouts(payoutsData);
      }
      */

    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    // التحقق من إدخال المبلغ
    if (!payoutAmount || payoutAmount.trim() === '') {
      alert('⚠️ يرجى إدخال المبلغ المراد سحبه');
      return;
    }

    const amount = parseFloat(payoutAmount);

    // التحقق من صحة المبلغ
    if (isNaN(amount) || amount <= 0) {
      alert('⚠️ يرجى إدخال مبلغ صحيح');
      return;
    }

    // التحقق من الرصيد المتاح
    if (walletData.current_balance <= 0) {
      alert('⚠️ رصيدك الحالي لا يسمح بإجراء عملية سحب. رصيدك: ' + formatPrice(walletData.current_balance));
      return;
    }

    // التحقق من أن المبلغ المطلوب لا يتجاوز الرصيد
    if (amount > walletData.current_balance) {
      alert('⚠️ المبلغ المطلوب (' + formatPrice(amount) + ') أكبر من رصيدك المتاح (' + formatPrice(walletData.current_balance) + ')');
      return;
    }

    // التحقق من الحد الأدنى للسحب
    if (amount < 100) {
      alert('⚠️ الحد الأدنى للسحب هو 100 ريال');
      return;
    }

    // التحقق من معلومات البنك
    if (!bankName || bankName.trim() === '') {
      alert('⚠️ يرجى إدخال اسم البنك');
      return;
    }

    if (!accountNumber || accountNumber.trim() === '') {
      alert('⚠️ يرجى إدخال رقم الحساب البنكي');
      return;
    }

    if (!vendorId) {
      alert('⚠️ خطأ: لم يتم العثور على معلومات البائع');
      return;
    }

    try {
      setSubmitting(true);

      // TODO: Create payout_requests table first
      alert('⚠️ نظام طلبات السحب قيد التطوير حالياً');
      setSubmitting(false);
      return;

      /* Disabled until payout_requests table is created
      // إنشاء طلب سحب في قاعدة البيانات
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          vendor_id: vendorId,
          amount: amount,
          status: 'pending',
          bank_name: bankName,
          account_number: accountNumber,
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      */

      // تحديث الرصيد المتاح (خصم المبلغ المطلوب)
      const { error: updateError } = await supabase
        .from('vendor_wallets')
        .update({
          current_balance: walletData.current_balance - amount,
          pending_balance: walletData.pending_balance + amount,
        })
        .eq('vendor_id', vendorId);

      if (updateError) throw updateError;

      alert('✅ تم إرسال طلب السحب بنجاح! سيتم معالجته خلال 1-3 أيام عمل');
      
      // إعادة تحميل البيانات
      await fetchWalletData();
      
      // إغلاق النافذة وإعادة تعيين الحقول
      setShowPayoutModal(false);
      setPayoutAmount('');
      setBankName('');
      setAccountNumber('');

    } catch (error) {
      console.error('Error creating payout request:', error);
      alert('❌ حدث خطأ أثناء إرسال طلب السحب. يرجى المحاولة مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-hidden bg-[#0A0515] transition-colors duration-300">
        <FuturisticSidebar role="vendor" />
        
        {/* Main Content Area */}
        <div className="md:mr-[280px] transition-all duration-300">
          <FuturisticNavbar userName="" userRole="بائع" />

          {loading ? (
            <div className="flex items-center justify-center h-screen">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            </div>
          ) : (
            <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
              <h1 className="text-4xl font-bold text-white mb-6">المحفظة المالية</h1>

          {/* Wallet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm opacity-90 mb-2">الرصيد المتاح</p>
              <p className="text-4xl font-bold mb-2">{formatPrice(walletData.current_balance)}</p>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="w-full bg-white text-green-600 py-2 px-4 rounded-lg font-bold hover:bg-green-50 transition-colors"
              >
                💸 سحب الرصيد
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-yellow-200">
              <p className="text-sm text-slate-600 mb-2">رصيد قيد المعالجة</p>
              <p className="text-4xl font-bold text-yellow-600">{formatPrice(walletData.pending_balance)}</p>
              <p className="text-xs text-slate-500 mt-2">سيضاف بعد تسليم الطلبات</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-200">
              <p className="text-sm text-slate-600 mb-2">إجمالي الأرباح</p>
              <p className="text-4xl font-bold text-blue-600">{formatPrice(walletData.total_earned)}</p>
              <p className="text-xs text-slate-500 mt-2">منذ انضمامك</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-200">
              <p className="text-sm text-slate-600 mb-2">إجمالي السحوبات</p>
              <p className="text-4xl font-bold text-purple-600">{formatPrice(walletData.total_withdrawn)}</p>
              <p className="text-xs text-slate-500 mt-2">آخر سحب: {walletData.last_payout}</p>
            </div>
          </div>

          {/* Commission Info */}
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">ℹ️</span>
              <h3 className="text-xl font-bold text-slate-800">معلومات العمولة</h3>
            </div>
            <p className="text-slate-700">
              عمولة المنصة الحالية: <span className="font-bold text-blue-600">{walletData.platform_commission_rate}%</span> من كل عملية بيع
            </p>
            <p className="text-sm text-slate-600 mt-2">
              مثال: إذا بعت منتج بـ 100 دينار، ستحصل على 90 دينار وستذهب 10 دنانير كعمولة للمنصة
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-4 px-6 font-bold transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📊 نظرة عامة
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 py-4 px-6 font-bold transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                💳 المعاملات
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`flex-1 py-4 px-6 font-bold transition-colors ${
                  activeTab === 'payouts'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                💸 طلبات السحب
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>📊</span> ملخص المحفظة
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">الرصيد المتاح:</span>
                        <span className="font-bold text-green-600">{formatPrice(walletData.current_balance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">رصيد قيد المعالجة:</span>
                        <span className="font-bold text-yellow-600">{formatPrice(walletData.pending_balance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">إجمالي الأرباح:</span>
                        <span className="font-bold text-blue-600">{formatPrice(walletData.total_earned)}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t-2 border-green-300">
                        <span className="text-slate-800 font-bold">إجمالي السحوبات:</span>
                        <span className="font-bold text-red-600">{formatPrice(walletData.total_withdrawn)}</span>
                      </div>
                    </div>
                  </div>

                  {transactions.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>📝</span> آخر المعاملات
                      </h4>
                      <div className="space-y-2">
                        {transactions.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="flex justify-between items-center py-2 border-b border-blue-200">
                            <div>
                              <p className="font-bold text-slate-800">{tx.description}</p>
                              <p className="text-xs text-slate-600">{new Date(tx.created_at).toLocaleDateString('ar-SA')}</p>
                            </div>
                            <span className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {transactions.length === 0 && (
                    <div className="text-center py-12 bg-slate-100 rounded-xl">
                      <p className="text-slate-600 text-lg">لا توجد معاملات حتى الآن</p>
                      <p className="text-slate-500 text-sm mt-2">ستظهر هنا أرباحك من الطلبات المكتملة</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? '💰' : '💸'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{transaction.description}</p>
                          <p className="text-sm text-slate-600">
                            {new Date(transaction.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`text-2xl font-bold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatPrice(transaction.amount)}
                        </p>
                        <p className="text-sm text-slate-500">
                          الرصيد: {formatPrice(transaction.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="text-center py-12 bg-slate-100 rounded-xl">
                      <p className="text-slate-600 text-lg">لا توجد معاملات حتى الآن</p>
                      <p className="text-slate-500 text-sm mt-2">ستظهر هنا جميع معاملاتك المالية</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payouts' && (
                <div className="space-y-4">
                  {payouts.length > 0 ? (
                    payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="border-2 border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-2xl font-bold text-slate-800">{formatPrice(payout.amount)}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {payout.bank_name} • {payout.account_number}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          payout.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payout.status === 'completed' && '✅ مكتمل'}
                          {payout.status === 'pending' && '⏳ قيد الانتظار'}
                          {payout.status === 'processing' && '⚙️ قيد المعالجة'}
                          {payout.status === 'rejected' && '❌ مرفوض'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">تاريخ الطلب</p>
                          <p className="font-bold text-slate-800">{payout.requested_at}</p>
                        </div>
                        {payout.processed_at && (
                          <div>
                            <p className="text-slate-600">تاريخ التحويل</p>
                            <p className="font-bold text-slate-800">{payout.processed_at}</p>
                          </div>
                        )}
                        {payout.rejection_reason && (
                          <div className="col-span-2">
                            <p className="text-red-600 font-bold">سبب الرفض:</p>
                            <p className="text-slate-700">{payout.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="text-center py-12 bg-slate-100 rounded-xl">
                      <p className="text-slate-600 text-lg">لا توجد طلبات سحب حتى الآن</p>
                      <p className="text-slate-500 text-sm mt-2">يمكنك طلب سحب رصيدك من الأعلى</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payout Modal */}
          {showPayoutModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">💸 طلب سحب رصيد</h3>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-600 mb-1">الرصيد المتاح</p>
                  <p className="text-3xl font-bold text-blue-600">{formatPrice(walletData.current_balance)}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      المبلغ المطلوب <span className="text-red-500">*</span> (الحد الأدنى 100 ريال)
                    </label>
                    <input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="أدخل المبلغ"
                      min="100"
                      max={walletData.current_balance}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      اسم البنك <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="مثال: البنك الأهلي"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      رقم الحساب البنكي <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="أدخل رقم الحساب"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    ⚠️ سيتم معالجة طلبك خلال 1-3 أيام عمل
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPayoutModal(false);
                      setPayoutAmount('');
                      setBankName('');
                      setAccountNumber('');
                    }}
                    disabled={submitting}
                    className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-bold hover:bg-slate-300 transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleRequestPayout}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {submitting ? 'جاري الإرسال...' : 'تأكيد السحب'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Floating Add Button */}
          <FloatingAddButton />
          </main>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

