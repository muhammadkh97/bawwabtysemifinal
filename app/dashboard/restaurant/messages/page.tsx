'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { MessageSquare, Mail, Send, User, Clock, Search, Bell } from 'lucide-react';

interface Message {
  id: string;
  customer_name: string;
  message: string;
  order_number: string;
  created_at: string;
  read: boolean;
}

export default function RestaurantMessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

      const { data: vendorData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        setVendorId(vendorData.id);
        await fetchMessages(vendorData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchMessages = async (vId: string) => {
    try {
      // Fetch orders with customer messages/notes
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          users:user_id(full_name)
        `)
        .eq('vendor_id', vId)
        .not('notes', 'is', null)
        .order('created_at', { ascending: false });

      const formattedMessages: Message[] = ordersData?.map((order: any) => ({
        id: order.id,
        customer_name: order.users?.full_name || 'عميل',
        message: order.notes || '',
        order_number: order.order_number || order.id,
        created_at: new Date(order.created_at).toLocaleString('ar-EG'),
        read: false
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const filteredMessages = messages.filter(msg =>
    msg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-4xl font-black text-gray-900 mb-2">💬 الرسائل والإشعارات</h1>
            <p className="text-gray-600">تواصل مع العملاء والإدارة</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <MessageSquare className="w-10 h-10 mb-2" />
              <h3 className="text-3xl font-bold mb-1">{messages.length}</h3>
              <p className="text-blue-100">إجمالي الرسائل</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <Mail className="w-10 h-10 mb-2" />
              <h3 className="text-3xl font-bold mb-1">{messages.filter(m => !m.read).length}</h3>
              <p className="text-green-100">رسائل جديدة</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <Bell className="w-10 h-10 mb-2" />
              <h3 className="text-3xl font-bold mb-1">0</h3>
              <p className="text-orange-100">إشعارات</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في الرسائل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-6 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Messages Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-4 shadow-lg max-h-[600px] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">جميع الرسائل</h2>
              
              {filteredMessages.length > 0 ? (
                <div className="space-y-2">
                  {filteredMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedMessage(message)}
                      className={`p-4 rounded-2xl cursor-pointer transition ${
                        selectedMessage?.id === message.id
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {message.customer_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-900 truncate">{message.customer_name}</h3>
                            {!message.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{message.message}</p>
                          <p className="text-xs text-gray-500 mt-1">طلب: {message.order_number}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد رسائل</p>
                </div>
              )}
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-lg">
              {selectedMessage ? (
                <div>
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedMessage.customer_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.customer_name}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {selectedMessage.created_at}
                        </span>
                        <span>طلب رقم: {selectedMessage.order_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">محتوى الرسالة</h3>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">{selectedMessage.message}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">الرد على العميل</h3>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                      rows={4}
                      placeholder="اكتب ردك هنا..."
                    ></textarea>
                    <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                      <Send className="w-5 h-5" />
                      إرسال الرد
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Mail className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">اختر رسالة</h3>
                    <p className="text-gray-600">اختر رسالة من القائمة لعرض تفاصيلها</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          </main>
        </div>
      </div>
    </>
  );
}
