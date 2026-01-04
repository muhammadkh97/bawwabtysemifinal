'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Wallet, DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownLeft, Clock, CreditCard } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'withdraw';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending';
}

export default function RestaurantWalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendorId, setVendorId] = useState<string>('');

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
      // Fetch completed orders
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at, order_number')
        .eq('vendor_id', vId)
        .eq('status', 'delivered');

      // Fetch pending orders
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('vendor_id', vId)
        .in('status', ['pending', 'preparing', 'ready', 'out_for_delivery']);

      // Calculate balances (assuming platform takes 10% commission)
      const completedBalance = completedOrders?.reduce((sum, order) => sum + (order.total_amount * 0.9), 0) || 0;
      const pendingBal = pendingOrders?.reduce((sum, order) => sum + (order.total_amount * 0.9), 0) || 0;

      setBalance(completedBalance);
      setPendingBalance(pendingBal);

      // Create transaction history
      const transactionList: Transaction[] = completedOrders?.map(order => ({
        id: order.order_number || Math.random().toString(),
        type: 'income' as const,
        amount: order.total_amount * 0.9,
        description: `طلب رقم ${order.order_number}`,
        date: new Date(order.created_at).toLocaleDateString('ar-EG'),
        status: 'completed' as const
      })) || [];

      setTransactions(transactionList.slice(0, 10));
    } catch (error) {
      console.error('Error fetching wallet data:', error);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Available Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-12 h-12" />
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-green-100 text-sm mb-2">الرصيد المتاح</p>
              <h2 className="text-5xl font-black mb-2">{balance.toFixed(2)} ₪</h2>
              <button className="mt-4 w-full bg-white text-green-600 py-3 rounded-xl font-bold hover:bg-green-50 transition">
                سحب الرصيد
              </button>
            </motion.div>

            {/* Pending Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-12 h-12" />
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
              <p className="text-orange-100 text-sm mb-2">الرصيد المعلق</p>
              <h2 className="text-5xl font-black mb-2">{pendingBalance.toFixed(2)} ₪</h2>
              <p className="text-sm text-orange-100 mt-4">من الطلبات قيد التنفيذ</p>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الأرباح</p>
                  <p className="text-2xl font-bold text-gray-900">{(balance + pendingBalance).toFixed(2)} ₪</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">عمولة المنصة</p>
                  <p className="text-2xl font-bold text-gray-900">10%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">المعاملات</p>
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                </div>
              </div>
            </div>
          </div>

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
                        transaction.type === 'income' 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowDownLeft className={`w-6 h-6 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <ArrowUpRight className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{transaction.description}</h3>
                        <p className="text-sm text-gray-600">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`text-xl font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)} ₪
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
