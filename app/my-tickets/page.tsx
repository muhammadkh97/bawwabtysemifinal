'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Eye, Plus, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface Ticket {
  id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at?: string;
}

interface Reply {
  id: string;
  message: string;
  is_admin: boolean;
  user_name: string;
  created_at: string;
}

const priorityConfig = {
  low: { label: 'منخفضة', color: 'bg-gray-500', icon: Clock },
  medium: { label: 'متوسطة', color: 'bg-blue-500', icon: AlertCircle },
  high: { label: 'عالية', color: 'bg-orange-500', icon: AlertCircle },
  urgent: { label: 'عاجلة', color: 'bg-red-500', icon: AlertCircle }
};

const statusConfig = {
  open: { label: 'مفتوحة', color: 'bg-blue-500', icon: MessageSquare },
  in_progress: { label: 'قيد المعالجة', color: 'bg-yellow-500', icon: Clock },
  resolved: { label: 'تم الحل', color: 'bg-green-500', icon: CheckCircle },
  closed: { label: 'مغلقة', color: 'bg-gray-500', icon: XCircle }
};

const categoryLabels: Record<string, string> = {
  general: 'استفسار عام',
  order: 'استفسار عن طلب',
  product: 'استفسار عن منتج',
  technical: 'مشكلة تقنية',
  complaint: 'شكوى',
  suggestion: 'اقتراح'
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const router = useRouter();

  const fetchTickets = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedTickets: Ticket[] = (data || []).map((ticket: any) => ({
        id: ticket.id,
        user_name: ticket.user_name || 'مستخدم',
        user_email: ticket.user_email || 'غير محدد',
        subject: ticket.subject || 'بدون عنوان',
        message: ticket.message || '',
        category: ticket.category || 'general',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        created_at: ticket.created_at,
        updated_at: ticket.updated_at
      }));

      setTickets(formattedTickets);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في جلب التذاكر';
      
      logger.error('fetchTickets failed', {
        error: errorMessage,
        component: 'MyTicketsPage',
        userId,
      });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchReplies = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_replies')
        .select(`
          *,
          users!ticket_replies_user_id_fkey (
            full_name
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedReplies: Reply[] = (data || []).map((reply: any) => ({
        id: reply.id,
        message: reply.message,
        is_admin: reply.is_admin || false,
        user_name: reply.users?.full_name || 'مستخدم',
        created_at: new Date(reply.created_at).toLocaleString('ar-SA'),
      }));

      setReplies(formattedReplies);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في جلب الردود';
      
      logger.error('fetchReplies failed', {
        error: errorMessage,
        component: 'MyTicketsPage',
        ticketId,
      });
      
      setReplies([]);
    }
  }, []);

  const checkAuthAndFetchTickets = useCallback(async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      await fetchTickets(user.id);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في المصادقة';
      
      logger.error('checkAuthAndFetchTickets failed', {
        error: errorMessage,
        component: 'MyTicketsPage',
      });
      
      router.push('/auth/login');
    }
  }, [fetchTickets, router]);

  useEffect(() => {
    checkAuthAndFetchTickets();
  }, [checkAuthAndFetchTickets]);

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.id);
    } else {
      setReplies([]);
      setReplyText('');
    }
  }, [selectedTicket, fetchReplies]);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const { user } = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: replyText.trim(),
          is_admin: false,
        });

      if (error) throw error;

      // إعادة جلب الردود
      await fetchReplies(selectedTicket.id);
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('❌ حدث خطأ في إرسال الرد');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                تذاكر الدعم الخاصة بي
              </h1>
              <p className="text-gray-600">تتبع وإدارة جميع تذاكرك</p>
            </div>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold"
            >
              <Plus className="w-5 h-5" />
              <span>تذكرة جديدة</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                filter === status
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'الكل' : statusConfig[status].label}
            </button>
          ))}
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد تذاكر</h3>
            <p className="text-gray-500 mb-6">لم تقم بإنشاء أي تذاكر دعم بعد</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-bold"
            >
              <Plus className="w-5 h-5" />
              <span>إنشاء تذكرة جديدة</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tickets.map((ticket) => {
              const StatusIcon = statusConfig[ticket.status].icon;
              const PriorityIcon = priorityConfig[ticket.priority].icon;

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-5 h-5 text-white" />
                      <span className={`px-3 py-1 ${statusConfig[ticket.status].color} text-white text-xs font-bold rounded-full`}>
                        {statusConfig[ticket.status].label}
                      </span>
                    </div>
                    <span className={`px-2 py-1 ${priorityConfig[ticket.priority].color} text-white text-xs font-bold rounded`}>
                      {priorityConfig[ticket.priority].label}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {ticket.subject}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {ticket.message}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(ticket.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <span className="text-purple-600 font-bold">
                      {categoryLabels[ticket.category] || ticket.category}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedTicket(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 mb-2">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 ${statusConfig[selectedTicket.status].color} text-white text-xs font-bold rounded-full`}>
                      {statusConfig[selectedTicket.status].label}
                    </span>
                    <span className={`px-3 py-1 ${priorityConfig[selectedTicket.priority].color} text-white text-xs font-bold rounded-full`}>
                      {priorityConfig[selectedTicket.priority].label}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      {categoryLabels[selectedTicket.category] || selectedTicket.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 mb-2">الرسالة</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* الردود */}
                {replies.length > 0 && (
                  <div className="space-y-3 pt-4 border-t max-h-[300px] overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-500 mb-2">الردود</h3>
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-xl ${
                          reply.is_admin
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 ml-8 border-l-4 border-purple-500'
                            : 'bg-gray-50 mr-8 border-r-4 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-bold ${reply.is_admin ? 'text-purple-700' : 'text-blue-700'}`}>
                            {reply.is_admin ? '👨‍💼 المدير' : '👤 ' + reply.user_name}
                          </span>
                          <span className="text-xs text-gray-500">{reply.created_at}</span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* مربع الرد - يظهر فقط للتذاكر المفتوحة أو قيد المعالجة */}
                {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-bold text-gray-500 mb-2">إضافة رد</h3>
                    <div className="relative">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="اكتب ردك هنا..."
                        rows={4}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sendingReply}
                        className="absolute bottom-4 left-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {sendingReply ? 'جاري الإرسال...' : 'إرسال'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 mb-1">تاريخ الإنشاء</h3>
                    <p className="text-gray-700">{new Date(selectedTicket.created_at).toLocaleString('ar-EG')}</p>
                  </div>
                  {selectedTicket.updated_at && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 mb-1">آخر تحديث</h3>
                      <p className="text-gray-700">{new Date(selectedTicket.updated_at).toLocaleString('ar-EG')}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
