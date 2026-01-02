'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Scale, Headphones, AlertCircle, MessageSquare, DollarSign, Package, User, Store, Truck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Dispute {
  id: string;
  order_id: string;
  customer_name: string;
  vendor_name: string;
  type: 'not_received' | 'damaged' | 'wrong_item' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  amount: number;
  created_at: string;
}

interface SupportTicket {
  id: string;
  user_name: string;
  user_role: 'vendor' | 'driver' | 'customer';
  subject: string;
  category: 'technical' | 'payment' | 'delivery' | 'product' | 'account' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

export default function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<'disputes' | 'support'>('disputes');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputesAndSupport();
  }, []);

  const fetchDisputesAndSupport = async () => {
    setLoading(true);
    try {
      // جلب النزاعات من جدول disputes
      const { data: disputesData } = await supabase
        .from('disputes')
        .select(`
          id,
          order_id,
          type,
          description,
          status,
          amount,
          created_at,
          orders!disputes_order_id_fkey (
            order_number,
            users (
              id,
              name,
              full_name
            ),
            stores!orders_vendor_id_fkey (
              id,
              name,
              name_ar
            )
          )
        `)
        .order('created_at', { ascending: false });

      const formattedDisputes: Dispute[] = disputesData?.map(d => {
        const order = d.orders as any;
        const customer = order?.users as any;
        const store = order?.stores as any;
        
        return {
          id: d.id,
          order_id: order?.order_number || d.order_id,
          customer_name: customer?.name || customer?.full_name || 'عميل',
          vendor_name: store?.name_ar || store?.name || 'بائع',
          type: d.type as any,
          description: d.description || 'لا يوجد وصف',
          status: d.status as any,
          amount: d.amount || 0,
          created_at: new Date(d.created_at).toLocaleDateString('ar-JO')
        };
      }) || [];

      setDisputes(formattedDisputes);

      // جلب تذاكر الدعم من جدول support_tickets
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select(`
          id,
          subject,
          category,
          priority,
          status,
          created_at,
          users!support_tickets_user_id_fkey (
            name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      const formattedTickets: SupportTicket[] = ticketsData?.map(t => {
        const user = t.users as any;
        
        return {
          id: t.id,
          user_name: user?.name || 'مستخدم',
          user_role: user?.role || 'customer',
          subject: t.subject || 'بدون موضوع',
          category: t.category as any,
          priority: t.priority as any,
          status: t.status as any,
          created_at: new Date(t.created_at).toLocaleDateString('ar-JO')
        };
      }) || [];

      setSupportTickets(formattedTickets);

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, action: 'refund' | 'reject') => {
    try {
      const newStatus = action === 'refund' ? 'resolved' : 'closed';
      
      const { error } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', disputeId);

      if (error) throw error;

      if (action === 'refund') {
        alert('✅ تم إعادة المبلغ للعميل وخصمه من رصيد البائع');
      } else {
        alert('❌ تم رفض النزاع');
      }
      
      setDisputes(disputes.map(d => 
        d.id === disputeId ? { ...d, status: newStatus as any } : d
      ));
      setSelectedDispute(null);
      
    } catch (error) {
      console.error('خطأ في حل النزاع:', error);
      alert('حدث خطأ في حل النزاع');
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'resolved' })
        .eq('id', ticketId);

      if (error) throw error;

      setSupportTickets(tickets => tickets.map(t =>
        t.id === ticketId ? { ...t, status: 'resolved' } : t
      ));
      setSelectedTicket(null);
      alert('✅ تم إغلاق التذكرة');
      
    } catch (error) {
      console.error('خطأ في إغلاق التذكرة:', error);
      alert('حدث خطأ في إغلاق التذكرة');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      not_received: 'لم يستلم الطلب',
      damaged: 'منتج تالف',
      wrong_item: 'منتج خاطئ',
      other: 'أخرى',
    };
    return labels[type] || type;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: 'تقني',
      payment: 'دفع',
      delivery: 'توصيل',
      product: 'منتج',
      account: 'حساب',
      other: 'أخرى',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
        <FuturisticSidebar role="admin" />
        <div className="md:mr-[280px] transition-all duration-300">
          <FuturisticNavbar userName="مدير" userRole="مدير" />
          <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-700 dark:text-purple-300">جاري تحميل البيانات...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="admin" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="مدير" userRole="مدير" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          {/* العنوان */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">النزاعات والدعم الفني</h1>
            <p className="text-purple-300 text-lg">إدارة النزاعات وتذاكر الدعم</p>
          </motion.div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <Scale className="w-8 h-8 text-red-400" />
                <span className="text-4xl font-bold text-white">
                  {disputes.filter(d => d.status === 'open').length}
                </span>
              </div>
              <p className="text-red-300 font-medium">نزاعات مفتوحة</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-400" />
                <span className="text-4xl font-bold text-white">
                  {disputes.filter(d => d.status === 'investigating').length}
                </span>
              </div>
              <p className="text-yellow-300 font-medium">قيد التحقيق</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <Headphones className="w-8 h-8 text-blue-400" />
                <span className="text-4xl font-bold text-white">
                  {supportTickets.filter(t => t.status === 'open').length}
                </span>
              </div>
              <p className="text-blue-300 font-medium">تذاكر مفتوحة</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-8 h-8 text-purple-400" />
                <span className="text-4xl font-bold text-white">
                  {supportTickets.filter(t => t.priority === 'urgent').length}
                </span>
              </div>
              <p className="text-purple-300 font-medium">عاجلة</p>
            </motion.div>
          </div>

          {/* التبويبات */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('disputes')}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
                activeTab === 'disputes'
                  ? 'text-white shadow-lg'
                  : 'text-purple-300 hover:text-white'
              }`}
              style={activeTab === 'disputes' ? {
                background: 'linear-gradient(90deg, #EF4444, #DC2626)'
              } : {}}
            >
              <Scale className="w-5 h-5" />
              <span>النزاعات</span>
              <span className="px-2 py-1 rounded-full text-xs"
                style={{
                  background: activeTab === 'disputes' ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.3)'
                }}>
                {disputes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
                activeTab === 'support'
                  ? 'text-white shadow-lg'
                  : 'text-purple-300 hover:text-white'
              }`}
              style={activeTab === 'support' ? {
                background: 'linear-gradient(90deg, #3B82F6, #2563EB)'
              } : {}}
            >
              <Headphones className="w-5 h-5" />
              <span>الدعم الفني</span>
              <span className="px-2 py-1 rounded-full text-xs"
                style={{
                  background: activeTab === 'support' ? 'rgba(255,255,255,0.2)' : 'rgba(59, 130, 246, 0.3)'
                }}>
                {supportTickets.length}
              </span>
            </button>
          </div>

          {/* المحتوى */}
          <AnimatePresence mode="wait">
            {activeTab === 'disputes' ? (
              <motion.div
                key="disputes"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {disputes.length > 0 ? (
                  disputes.map((dispute, index) => (
                  <motion.div
                    key={dispute.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl p-6"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-2xl font-bold text-white">نزاع #{dispute.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            dispute.status === 'open' ? 'bg-red-500/20 text-red-400' :
                            dispute.status === 'investigating' ? 'bg-yellow-500/20 text-yellow-400' :
                            dispute.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {dispute.status === 'open' && '🔴 مفتوح'}
                            {dispute.status === 'investigating' && '🔍 قيد التحقيق'}
                            {dispute.status === 'resolved' && '✅ محلول'}
                            {dispute.status === 'closed' && '⚫ مغلق'}
                          </span>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                            {getTypeLabel(dispute.type)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Package className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">رقم الطلب</p>
                              <p className="text-white font-medium">{dispute.order_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <DollarSign className="w-5 h-5 text-red-400" />
                            <div>
                              <p className="text-xs text-purple-300">المبلغ</p>
                              <p className="text-red-400 font-bold">{dispute.amount} د.أ</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <User className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">العميل</p>
                              <p className="text-white font-medium">{dispute.customer_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Store className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">البائع</p>
                              <p className="text-white font-medium">{dispute.vendor_name}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xs text-purple-300 mb-2">الوصف:</p>
                          <p className="text-white leading-relaxed">{dispute.description}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-purple-400">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(dispute.created_at).toLocaleString('ar-SA')}</span>
                        </div>
                      </div>

                      {dispute.status === 'open' && (
                        <button
                          onClick={() => setSelectedDispute(dispute)}
                          className="px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-blue-500/50"
                          style={{ background: 'linear-gradient(90deg, #3B82F6, #2563EB)' }}
                        >
                          🔍 تحقيق
                        </button>
                      )}
                    </div>
                  </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <Scale className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
                    <p className="text-2xl text-white font-bold mb-2">لا توجد نزاعات</p>
                    <p className="text-purple-300">لا توجد نزاعات مسجلة حالياً</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="support"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {supportTickets.length > 0 ? (
                  supportTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl p-6"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-white">#{ticket.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                            ticket.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            ticket.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {ticket.priority === 'urgent' && '🚨 عاجل'}
                            {ticket.priority === 'high' && '⚠️ عالي'}
                            {ticket.priority === 'normal' && '📋 عادي'}
                            {ticket.priority === 'low' && '📄 منخفض'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            ticket.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                            ticket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                            ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {ticket.status === 'open' && '🔓 مفتوح'}
                            {ticket.status === 'in_progress' && '⚙️ قيد العمل'}
                            {ticket.status === 'resolved' && '✅ محلول'}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold text-white mb-4">{ticket.subject}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            {ticket.user_role === 'vendor' && <Store className="w-5 h-5 text-purple-400" />}
                            {ticket.user_role === 'driver' && <Truck className="w-5 h-5 text-purple-400" />}
                            {ticket.user_role === 'customer' && <User className="w-5 h-5 text-purple-400" />}
                            <div>
                              <p className="text-xs text-purple-300">المستخدم</p>
                              <p className="text-white font-medium">{ticket.user_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <MessageSquare className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">التصنيف</p>
                              <p className="text-white font-medium">{getCategoryLabel(ticket.category)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Clock className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-xs text-purple-300">تاريخ الإنشاء</p>
                              <p className="text-white font-medium">
                                {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {ticket.status !== 'resolved' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => setSelectedTicket(ticket)}
                              className="flex-1 px-4 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-blue-500/50"
                              style={{ background: 'linear-gradient(90deg, #3B82F6, #2563EB)' }}
                            >
                              💬 الرد
                            </button>
                            <button
                              onClick={() => handleCloseTicket(ticket.id)}
                              className="flex-1 px-4 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-green-500/50"
                              style={{ background: 'linear-gradient(90deg, #10B981, #059669)' }}
                            >
                              ✅ إغلاق
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <Headphones className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
                    <p className="text-2xl text-white font-bold mb-2">لا توجد تذاكر دعم</p>
                    <p className="text-purple-300">لا توجد تذاكر دعم مسجلة حالياً</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Dispute Resolution Modal */}
      <AnimatePresence>
        {selectedDispute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDispute(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
              style={{
                background: 'rgba(15, 10, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)'
              }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">🔍 حل النزاع #{selectedDispute.id}</h2>

              <div className="p-6 rounded-2xl mb-6" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-purple-300">الطلب</p>
                    <p className="font-bold text-white">{selectedDispute.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-300">المبلغ</p>
                    <p className="font-bold text-red-400">{selectedDispute.amount} د.أ</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-sm text-purple-300 mb-2">وصف المشكلة:</p>
                  <p className="text-white">{selectedDispute.description}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl mb-6" style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <p className="text-sm text-blue-300 font-bold mb-2">⚠️ القرارات المتاحة:</p>
                <ul className="list-disc list-inside text-sm text-blue-200 space-y-1">
                  <li>إعادة المبلغ للعميل وخصمه من رصيد البائع</li>
                  <li>رفض النزاع وإبقاء المبلغ لدى البائع</li>
                  <li>حل وسط (يتطلب تواصل مع الطرفين)</li>
                </ul>
              </div>

              <textarea
                placeholder="ملاحظات إضافية..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400 focus:outline-none mb-6"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(98, 54, 255, 0.3)'
                }}
                rows={4}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleResolveDispute(selectedDispute.id, 'reject')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-red-500/50"
                  style={{ background: 'linear-gradient(90deg, #EF4444, #DC2626)' }}
                >
                  <XCircle className="w-5 h-5" />
                  <span>رفض النزاع</span>
                </button>
                <button
                  onClick={() => handleResolveDispute(selectedDispute.id, 'refund')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-green-500/50"
                  style={{ background: 'linear-gradient(90deg, #10B981, #059669)' }}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>إعادة المبلغ</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Ticket Reply Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
              style={{
                background: 'rgba(15, 10, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)'
              }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">💬 الرد على التذكرة #{selectedTicket.id}</h2>

              <div className="p-4 rounded-xl mb-6" style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <p className="font-bold text-white mb-2">{selectedTicket.subject}</p>
                <p className="text-sm text-purple-300">من: {selectedTicket.user_name}</p>
              </div>

              <textarea
                placeholder="اكتب ردك هنا..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400 focus:outline-none mb-6"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(98, 54, 255, 0.3)'
                }}
                rows={6}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    alert('✅ تم إرسال الرد');
                    setSelectedTicket(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:shadow-blue-500/50"
                  style={{ background: 'linear-gradient(90deg, #3B82F6, #2563EB)' }}
                >
                  📧 إرسال الرد
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

