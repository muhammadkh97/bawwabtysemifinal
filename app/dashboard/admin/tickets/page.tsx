'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, User, Mail, Calendar, Tag, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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

export default function TicketsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          users!support_tickets_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTickets: Ticket[] = (data || []).map((ticket: any) => ({
        id: ticket.id,
        user_name: ticket.users?.full_name || 'مستخدم',
        user_email: ticket.users?.email || 'غير محدد',
        subject: ticket.subject || 'بدون عنوان',
        message: ticket.description || '',
        category: ticket.category || 'عام',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        created_at: new Date(ticket.created_at).toLocaleDateString('ar-SA'),
        updated_at: ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString('ar-SA') : undefined,
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: string) => {
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
      console.error('Error fetching replies:', error);
      setReplies([]);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || !user) return;

    try {
      setSendingReply(true);

      const { error } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: replyText.trim(),
          is_admin: true,
        });

      if (error) throw error;

      // تحديث حالة التذكرة إلى "قيد المعالجة" إذا كانت مفتوحة
      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);

        setTickets(tickets.map(t => 
          t.id === selectedTicket.id 
            ? { ...t, status: 'in_progress', updated_at: new Date().toLocaleDateString('ar-SA') }
            : t
        ));
      }

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

  const filteredTickets = activeFilter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === activeFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#6236FF';
      case 'in_progress': return '#FF9500';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6236FF';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'مفتوح';
      case 'in_progress': return 'قيد المعالجة';
      case 'resolved': return 'تم الحل';
      case 'closed': return 'مغلق';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10B981';
      case 'medium': return '#FF9500';
      case 'high': return '#FF6B35';
      case 'urgent': return '#EF4444';
      default: return '#6236FF';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'عالي';
      case 'urgent': return 'عاجل';
      default: return priority;
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: 'in_progress' | 'resolved' | 'closed') => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      // تحديث الحالة المحلية
      setTickets(tickets.map(t => 
        t.id === ticketId 
          ? { ...t, status: newStatus, updated_at: new Date().toLocaleDateString('ar-SA') }
          : t
      ));

      const statusTexts = {
        'in_progress': 'قيد المعالجة',
        'resolved': 'تم الحل',
        'closed': 'مغلق'
      };

      alert(`✅ تم تحديث حالة التذكرة إلى: ${statusTexts[newStatus]}`);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('❌ حدث خطأ في تحديث حالة التذكرة');
    }
  };

  const stats = [
    { label: 'إجمالي التذاكر', value: tickets.length, color: '#6236FF', icon: MessageSquare },
    { label: 'مفتوحة', value: tickets.filter(t => t.status === 'open').length, color: '#6236FF', icon: AlertCircle },
    { label: 'قيد المعالجة', value: tickets.filter(t => t.status === 'in_progress').length, color: '#FF9500', icon: Clock },
    { label: 'تم الحل', value: tickets.filter(t => t.status === 'resolved').length, color: '#10B981', icon: CheckCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-purple-300 text-lg">جاري تحميل التذاكر...</p>
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
            <h1 className="text-4xl font-bold text-white mb-2">التذاكر والدعم الفني</h1>
            <p className="text-purple-300 text-lg">إدارة طلبات الدعم والاستفسارات</p>
          </motion.div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${stat.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-purple-300 text-sm">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* الفلاتر */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'الكل' },
              { value: 'open', label: 'مفتوحة' },
              { value: 'in_progress', label: 'قيد المعالجة' },
              { value: 'resolved', label: 'تم الحل' },
              { value: 'closed', label: 'مغلقة' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value as any)}
                className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeFilter === filter.value
                    ? 'text-white shadow-lg'
                    : 'text-purple-300 hover:text-white'
                }`}
                style={
                  activeFilter === filter.value
                    ? { background: 'linear-gradient(90deg, #6236FF, #FF219D)' }
                    : { background: 'rgba(98, 54, 255, 0.2)' }
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* قائمة التذاكر */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${getPriorityColor(ticket.priority)}20` }}
                    >
                      <MessageSquare
                        className="w-6 h-6"
                        style={{ color: getPriorityColor(ticket.priority) }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{ticket.subject}</h3>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-purple-300 flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {ticket.user_name}
                            </span>
                            <span className="text-purple-300 flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {ticket.user_email}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                            style={{ background: getStatusColor(ticket.status) }}
                          >
                            {getStatusText(ticket.status)}
                          </span>
                          <span
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                            style={{ background: getPriorityColor(ticket.priority) }}
                          >
                            {getPriorityText(ticket.priority)}
                          </span>
                        </div>
                      </div>

                      <p className="text-purple-300 text-sm mb-3 line-clamp-2">{ticket.message}</p>

                      <div className="flex items-center gap-4 text-xs text-purple-400">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {ticket.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ticket.created_at}
                        </span>
                        {ticket.updated_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            آخر تحديث: {ticket.updated_at}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTickets.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 rounded-2xl"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                <div className="text-7xl mb-4">📭</div>
                <p className="text-xl text-purple-300">لا توجد تذاكر في هذه الفئة</p>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* نافذة تفاصيل التذكرة */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-2xl w-full rounded-2xl p-8"
              style={{
                background: 'rgba(15, 10, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
              }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-purple-300 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedTicket.user_name}
                    </span>
                    <span className="text-purple-300 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedTicket.user_email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-purple-300 hover:text-white transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(98, 54, 255, 0.1)' }}>
                  <p className="text-white leading-relaxed">{selectedTicket.message}</p>
                </div>

                {/* الردود */}
                {replies.length > 0 && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-xl ${
                          reply.is_admin
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 ml-8'
                            : 'bg-white/5 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-bold ${reply.is_admin ? 'text-purple-300' : 'text-blue-300'}`}>
                            {reply.is_admin ? '👨‍💼 المدير' : '👤 ' + reply.user_name}
                          </span>
                          <span className="text-xs text-purple-400">{reply.created_at}</span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* مربع الرد */}
                <div className="relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    rows={4}
                    className="w-full p-4 rounded-xl text-white placeholder-purple-300 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: 'rgba(98, 54, 255, 0.1)', border: '1px solid rgba(98, 54, 255, 0.3)' }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendingReply}
                    className="absolute bottom-4 left-4 px-6 py-2 rounded-lg text-white font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
                  >
                    <Send className="w-4 h-4" />
                    {sendingReply ? 'جاري الإرسال...' : 'إرسال الرد'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs text-purple-300 mb-1">الحالة</p>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white inline-block"
                      style={{ background: getStatusColor(selectedTicket.status) }}
                    >
                      {getStatusText(selectedTicket.status)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs text-purple-300 mb-1">الأولوية</p>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white inline-block"
                      style={{ background: getPriorityColor(selectedTicket.priority) }}
                    >
                      {getPriorityText(selectedTicket.priority)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs text-purple-300 mb-1">التصنيف</p>
                    <p className="text-white font-medium">{selectedTicket.category}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs text-purple-300 mb-1">تاريخ الإنشاء</p>
                    <p className="text-white font-medium">{selectedTicket.created_at}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  className="px-4 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FF9500, #FF6B35)' }}
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                >
                  قيد المعالجة
                </button>
                <button
                  className="px-4 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                >
                  تم الحل
                </button>
                <button
                  className="px-4 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
