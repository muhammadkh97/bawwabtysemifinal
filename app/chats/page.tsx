'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Search,
  Send,
  User,
  Loader2,
  Store,
  ShoppingBag,
  Archive,
  ArchiveX,
  Smile
} from 'lucide-react';
import { useChats } from '@/contexts/ChatsContext';
import Image from 'next/image';
import EmptyState from '@/components/EmptyState';
import MessageBubble from '@/components/chat/MessageBubble';
import ReplyPreview from '@/components/chat/ReplyPreview';
import RoleBadge from '@/components/chat/RoleBadge';

// Dynamic import for EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

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
    userRole,
    setCurrentChatId,
    sendMessage,
    markAsRead,
    createOrGetChat,
    editMessage,
    deleteMessage,
    deleteChat,
    archiveChat,
    unarchiveChat
  } = useChats();

  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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
  }, [vendorIdParam, chats]);

  useEffect(() => {
    // تحديد الرسائل كمقروءة عند فتح المحادثة
    if (currentChatId) {
      markAsRead(currentChatId);
    }
  }, [currentChatId]);

  useEffect(() => {
    // التمرير لآخر رسالة
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // إغلاق emoji picker عند الضغط خارجه
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const selectedChatData = chats.find(c => c.id === currentChatId);
  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchive = showArchived ? chat.is_archived : !chat.is_archived;
    return matchesSearch && matchesArchive;
  });

  const handleEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChatId || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(currentChatId, message, {
        reply_to_id: replyToMessage?.id
      });
      setMessage('');
      setReplyToMessage(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReply = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      setReplyToMessage(msg);
    }
  };

  const handleArchive = async (chatId: string) => {
    try {
      await archiveChat(chatId);
      setCurrentChatId(null);
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  };

  const handleUnarchive = async (chatId: string) => {
    try {
      await unarchiveChat(chatId);
    } catch (error) {
      console.error('Error unarchiving chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #0a0520 0%, #1a0b40 50%, #0a0520 100%)',
    }}>
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* العنوان */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.2) 0%, rgba(182, 33, 254, 0.2) 100%)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            <MessageCircle className="w-8 h-8 text-purple-300" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
              الدردشات
            </h1>
          </motion.div>
          {userRole && (
            <div className="flex justify-center">
              <RoleBadge role={userRole} size="md" />
            </div>
          )}
        </div>

        {chats.length === 0 ? (
          <EmptyState
            type="search"
            title="لا توجد محادثات بعد"
            description="ابدأ محادثة مع البائعين من خلال المتاجر"
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* قائمة المحادثات */}
            <div 
              className="lg:col-span-1 rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
                maxHeight: 'calc(100vh - 250px)',
              }}
            >
              {/* البحث */}
              <div className="p-4 border-b border-purple-500/20">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    type="text"
                    placeholder="ابحث عن محادثة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                {/* Archive Toggle */}
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="w-full mt-3 px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 text-purple-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  {showArchived ? (
                    <>
                      <ArchiveX className="w-4 h-4" />
                      <span>المحادثات النشطة</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>المحادثات المؤرشفة</span>
                    </>
                  )}
                </button>
              </div>

              {/* المحادثات */}
              <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {filteredChats.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-purple-200/50">
                      {showArchived ? 'لا توجد محادثات مؤرشفة' : 'لا توجد نتائج'}
                    </p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <motion.button
                      key={chat.id}
                      onClick={() => {
                        setCurrentChatId(chat.id);
                        markAsRead(chat.id);
                      }}
                      className={`w-full p-4 text-right transition-all border-b border-purple-500/10 ${
                        currentChatId === chat.id
                          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30'
                          : 'hover:bg-white/5'
                      }`}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}>
                            {chat.other_user_avatar ? (
                              <Image
                                src={chat.other_user_avatar}
                                alt={chat.other_user_name || 'User'}
                                width={56}
                                height={56}
                                className="object-cover"
                              />
                            ) : chat.other_user_role === 'vendor' ? (
                              <Store className="w-6 h-6 text-white" />
                            ) : (
                              <User className="w-6 h-6 text-white" />
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
                          <div className="flex items-center gap-2">
                            {chat.last_message_sender_role && (
                              <RoleBadge role={chat.last_message_sender_role} size="sm" />
                            )}
                            <p className="text-sm text-purple-200 truncate flex-1">
                              {chat.last_message || 'لا توجد رسائل'}
                            </p>
                          </div>
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
                border: '1px solid rgba(98, 54, 255, 0.3)',
                height: 'calc(100vh - 250px)',
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
                      
                      {/* أزرار الإجراءات */}
                      <div className="flex items-center gap-2">
                        {/* Archive Button */}
                        <button
                          onClick={() => selectedChatData.is_archived 
                            ? handleUnarchive(selectedChatData.id)
                            : handleArchive(selectedChatData.id)
                          }
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title={selectedChatData.is_archived ? 'إلغاء الأرشفة' : 'أرشفة'}
                        >
                          {selectedChatData.is_archived ? (
                            <ArchiveX className="w-5 h-5 text-purple-300" />
                          ) : (
                            <Archive className="w-5 h-5 text-purple-300" />
                          )}
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={async () => {
                            if ((typeof window !== 'undefined' ? window.confirm : undefined)('هل أنت متأكد من حذف هذه المحادثة؟')) {
                              await deleteChat(selectedChatData.id);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                          title="حذف المحادثة"
                        >
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
                      messages.map((msg) => {
                        const isMe = msg.sender_id === (selectedChatData.customer_id === msg.sender_id ? selectedChatData.customer_id : selectedChatData.vendor_id);
                        const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                        
                        return (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            isMe={isMe}
                            showRole={true}
                            replyToMessage={replyMsg}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onReply={handleReply}
                          />
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Preview */}
                  <AnimatePresence>
                    {replyToMessage && (
                      <ReplyPreview
                        replyToMessage={replyToMessage}
                        onClear={() => setReplyToMessage(null)}
                      />
                    )}
                  </AnimatePresence>

                  {/* مربع الإرسال */}
                  <div className="p-4 border-t border-purple-500/20">
                    {/* Emoji Picker */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          ref={emojiPickerRef}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-20 right-4 z-50"
                        >
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={'dark' as any}
                            width={350}
                            height={400}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-3">
                      {/* زر الإيموجي */}
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-3 rounded-xl bg-white/5 border border-purple-500/20 text-purple-300 hover:bg-white/10 transition-colors"
                        type="button"
                      >
                        <Smile className="w-5 h-5" />
                      </button>

                      <input
                        type="text"
                        placeholder="اكتب رسالتك..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={isSending}
                      />
                      <motion.button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isSending}
                        className="px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 100%)',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 text-purple-300/30 mx-auto mb-4" />
                    <p className="text-purple-200/50 text-lg">
                      اختر محادثة للبدء
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(98, 54, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #6236FF, #B621FE);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7347FF, #C732FF);
        }
      `}</style>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    }>
      <ChatsContent />
    </Suspense>
  );
}
