'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Search,
  Send,
  Image as ImageIcon,
  User,
  Clock,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  X,
  Loader2,
  Store,
  ShoppingBag
} from 'lucide-react';
import { useChats } from '@/contexts/ChatsContext';
import Image from 'next/image';
import EmptyState from '@/components/EmptyState';

// دالة بسيطة لحساب الوقت المنقضي
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'منذ لحظات';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function ChatsContent() {
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get('vendor');
  
  const {
    chats,
    currentChatId,
    messages,
    loading,
    messagesLoading,
    setCurrentChatId,
    sendMessage,
    markAsRead,
    createOrGetChat
  } = useChats();

  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // إذا كان هناك vendor_id في الرابط، افتح المحادثة معه
    if (vendorIdParam && chats.length > 0) {
      const chat = chats.find(c => c.vendor_id === vendorIdParam);
      if (chat) {
        setCurrentChatId(chat.id);
        markAsRead(chat.id);
      } else {
        // إنشاء محادثة جديدة
        createOrGetChat(vendorIdParam).then((chatId) => {
          if (chatId) {
            setCurrentChatId(chatId);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorIdParam, chats]);

  useEffect(() => {
    // تحديد الرسائل كمقروءة عند فتح المحادثة
    if (currentChatId) {
      markAsRead(currentChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId]);

  useEffect(() => {
    // التمرير لآخر رسالة
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedChatData = chats.find(c => c.id === currentChatId);
  const filteredChats = chats.filter(chat =>
    chat.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChatId || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(currentChatId, message);
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0515' }}>
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* العنوان */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center gap-3">
            <MessageCircle className="w-12 h-12" />
            المحادثات
          </h1>
          <p className="text-purple-200 text-lg">
            تواصل مع البائعين والمندوبين
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* قائمة المحادثات */}
          <div 
            className="rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)'
            }}
          >
            {/* البحث */}
            <div className="p-4 border-b border-purple-500/20">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في المحادثات..."
                  className="w-full pr-10 pl-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-gray-500"
                />
              </div>
            </div>

            {/* قائمة */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-16 h-16 text-purple-300/30 mx-auto mb-4" />
                  <p className="text-purple-200/50">لا توجد محادثات</p>
                </div>
              ) : (
                filteredChats.map((chat, index) => (
                  <motion.button
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      markAsRead(chat.id);
                    }}
                    className={`w-full p-4 border-b border-purple-500/10 hover:bg-white/5 transition-all text-right ${
                      currentChatId === chat.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* الصورة */}
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                          style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}>
                          {chat.other_user_avatar ? (
                            <Image
                              src={chat.other_user_avatar}
                              alt={chat.other_user_name || 'User'}
                              width={56}
                              height={56}
                              className="rounded-full object-cover"
                            />
                          ) : chat.other_user_role === 'vendor' ? (
                            <Store className="w-7 h-7 text-white" />
                          ) : (
                            <User className="w-7 h-7 text-white" />
                          )}
                        </div>
                        {chat.unread_count && chat.unread_count > 0 && (
                          <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                          </div>
                        )}
                      </div>

                      {/* المعلومات */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-white truncate">{chat.other_user_name}</h3>
                          {chat.last_message_at && (
                            <span className="text-xs text-gray-400">
                              {getTimeAgo(new Date(chat.last_message_at))}
                            </span>
                          )}
                        </div>
                        {chat.other_user_role === 'vendor' && chat.vendor_store_name && (
                          <div className="flex items-center gap-1 mb-1">
                            <Store className="w-3 h-3 text-purple-300" />
                            <span className="text-xs text-purple-300">{chat.vendor_store_name}</span>
                          </div>
                        )}
                        <p className="text-sm text-purple-200 truncate">
                          {chat.last_message || 'لا توجد رسائل'}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* نافذة الدردشة */}
          <div 
            className="lg:col-span-2 rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)'
            }}
          >
            {selectedChatData ? (
              <>
                {/* الرأس */}
                <div className="p-4 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}>
                          {selectedChatData.other_user_avatar ? (
                            <Image
                              src={selectedChatData.other_user_avatar}
                              alt={selectedChatData.other_user_name || 'User'}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                            />
                          ) : selectedChatData.other_user_role === 'vendor' ? (
                            <Store className="w-6 h-6 text-white" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{selectedChatData.other_user_name}</h3>
                        {selectedChatData.other_user_role === 'vendor' && selectedChatData.vendor_store_name && (
                          <p className="text-sm text-purple-300">
                            {selectedChatData.vendor_store_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* الرسائل */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <ShoppingBag className="w-20 h-20 text-purple-300/30 mx-auto mb-4" />
                        <p className="text-purple-200/50 text-lg">
                          لا توجد رسائل بعد. ابدأ المحادثة!
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.sender_role !== selectedChatData.other_user_role;
                      
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%]`}>
                            <div
                              className={`px-5 py-3 rounded-2xl ${
                                isMe
                                  ? 'text-white rounded-br-none'
                                  : 'bg-white/10 text-white rounded-bl-none'
                              }`}
                              style={isMe ? {
                                background: 'linear-gradient(90deg, #6236FF, #FF219D)'
                              } : {}}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </div>
                            <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(new Date(msg.created_at))}
                              </span>
                              {isMe && (
                                msg.is_read ? (
                                  <CheckCheck className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* إدخال الرسالة */}
                <div className="p-4 border-t border-purple-500/20">
                  <div className="flex gap-3">
                    <button className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-gray-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSending}
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                    <MessageCircle className="w-16 h-16 text-purple-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">اختر محادثة لبدء المراسلة</h3>
                  <p className="text-purple-200/70">حدد محادثة من القائمة أو ابدأ محادثة جديدة</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
            <p className="text-white text-xl">جاري تحميل المحادثات...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <ChatsContent />
    </Suspense>
  );
}
