'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { MessageCircle, Send, Search, User, Clock, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'customer';
  timestamp: string;
  read: boolean;
}

interface Chat {
  id: string;
  customer_name: string;
  customer_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  online: boolean;
}

export default function VendorMessagesPage() {
  const { userId } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchChats();
    }
  }, [userId]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        setLoading(false);
        return;
      }

      // جلب المحادثات من قاعدة البيانات
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select(`
          *,
          users!chats_customer_id_fkey(name, avatar_url)
        `)
        .eq('vendor_id', vendorData.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // تحويل البيانات إلى الشكل المطلوب
      const formattedChats = (chatsData || []).map(chat => ({
        id: chat.id,
        customer_name: chat.users?.name || 'عميل',
        customer_avatar: chat.users?.avatar_url,
        last_message: chat.last_message || '',
        last_message_time: new Date(chat.updated_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        unread_count: chat.unread_count || 0,
        online: false,
      }));

      setChats(formattedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: (msg.sender_id === userId ? 'me' : 'customer') as 'me' | 'customer',
        timestamp: new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        read: msg.read || false,
      }));

      setMessages(prev => ({ ...prev, [chatId]: formattedMessages }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    if (!messages[chatId]) {
      fetchMessages(chatId);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat,
          sender_id: userId,
          content: messageText,
          read: false,
        });

      if (error) throw error;

      // إعادة جلب الرسائل
      await fetchMessages(selectedChat);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('❌ حدث خطأ أثناء إرسال الرسالة');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#0A0515] transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-800 dark:text-white text-xl">جاري تحميل الرسائل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="بائع" userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-4xl font-bold text-white mb-2">الرسائل</h1>
            <p className="text-purple-300 text-lg">تواصل مع عملائك</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* قائمة المحادثات */}
            <div
              className="lg:col-span-1 rounded-2xl p-4"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
                maxHeight: '70vh',
                overflowY: 'auto',
              }}
            >
              {/* البحث */}
              <div className="mb-4 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في المحادثات..."
                  className="w-full pr-10 pl-4 py-3 rounded-xl text-white"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                />
              </div>

              {/* المحادثات */}
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`w-full p-4 rounded-xl text-right transition-all ${
                      selectedChat === chat.id ? 'shadow-lg' : ''
                    }`}
                    style={
                      selectedChat === chat.id
                        ? { background: 'linear-gradient(135deg, #6236FF, #FF219D)' }
                        : { background: 'rgba(255,255,255,0.05)' }
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                          style={{ background: 'rgba(98, 54, 255, 0.3)' }}
                        >
                          {chat.customer_name.charAt(0)}
                        </div>
                        {chat.online && (
                          <div
                            className="absolute bottom-0 left-0 w-3 h-3 rounded-full border-2"
                            style={{ background: '#10B981', borderColor: '#0A0515' }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-bold truncate">{chat.customer_name}</h3>
                          <span className="text-xs text-purple-300">{chat.last_message_time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-purple-200 truncate">{chat.last_message}</p>
                          {chat.unread_count > 0 && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-bold text-white ml-2"
                              style={{ background: '#FF219D' }}
                            >
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* نافذة المحادثة */}
            <div
              className="lg:col-span-2 rounded-2xl flex flex-col"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
                height: '70vh',
              }}
            >
              {selectedChat ? (
                <>
                  {/* رأس المحادثة */}
                  <div className="p-4 border-b" style={{ borderColor: 'rgba(98, 54, 255, 0.3)' }}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                          style={{ background: 'rgba(98, 54, 255, 0.3)' }}
                        >
                          {chats.find(c => c.id === selectedChat)?.customer_name.charAt(0)}
                        </div>
                        {chats.find(c => c.id === selectedChat)?.online && (
                          <div
                            className="absolute bottom-0 left-0 w-3 h-3 rounded-full border-2"
                            style={{ background: '#10B981', borderColor: '#0A0515' }}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-bold">
                          {chats.find(c => c.id === selectedChat)?.customer_name}
                        </h3>
                        <p className="text-xs text-purple-300">
                          {chats.find(c => c.id === selectedChat)?.online ? 'متصل الآن' : 'غير متصل'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* الرسائل */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages[selectedChat]?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'me' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] p-4 rounded-2xl ${
                            message.sender === 'me'
                              ? 'rounded-br-none'
                              : 'rounded-bl-none'
                          }`}
                          style={{
                            background:
                              message.sender === 'me'
                                ? 'linear-gradient(135deg, #6236FF, #FF219D)'
                                : 'rgba(255,255,255,0.05)',
                          }}
                        >
                          <p className="text-white mb-1">{message.text}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-purple-200">{message.timestamp}</span>
                            {message.sender === 'me' && (
                              <CheckCheck
                                className={`w-3 h-3 ${message.read ? 'text-blue-400' : 'text-purple-300'}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* إرسال رسالة */}
                  <div className="p-4 border-t" style={{ borderColor: 'rgba(98, 54, 255, 0.3)' }}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="اكتب رسالتك..."
                        className="flex-1 px-4 py-3 rounded-xl text-white"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(98, 54, 255, 0.3)',
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 text-purple-400 mx-auto mb-4" />
                    <p className="text-xl text-purple-300">اختر محادثة لبدء المراسلة</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
