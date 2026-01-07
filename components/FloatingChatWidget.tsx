'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, User, Store, CheckCheck, Check, ArrowLeft, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useChats } from '@/contexts/ChatsContext';
import { useRouter } from 'next/navigation';

export default function FloatingChatWidget() {
  const { user, userId, userRole } = useAuth();
  const router = useRouter();
  const { 
    chats, 
    currentChatId, 
    messages, 
    loading: chatsLoading,
    messagesLoading,
    unreadCount,
    setCurrentChatId, 
    sendMessage,
    markAsRead,
    createOrGetChat
  } = useChats();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Load saved position from localStorage or use default
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPosition = localStorage.getItem('floatingChatPosition');
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      }
    }
  }, []);

  // Access Control: Show for customers, vendors, drivers, and admins
  const shouldShowWidget = user && userId && (userRole === 'customer' || userRole === 'vendor' || userRole === 'driver' || userRole === 'admin');

  // Listen for external events to open chat with vendor
  useEffect(() => {
    const handleOpenVendorChat = async (event: CustomEvent<{ vendorId: string }>) => {
      const { vendorId } = event.detail;
      
      // Check if chat already exists
      const existingChat = chats.find(chat => chat.vendor_id === vendorId);
      
      if (existingChat) {
        setCurrentChatId(existingChat.id);
        setShowChatList(false);
        setIsOpen(true);
      } else {
        // Create new chat
        const chatId = await createOrGetChat(vendorId);
        if (chatId) {
          setCurrentChatId(chatId);
          setShowChatList(false);
          setIsOpen(true);
        }
      }
    };

    window.addEventListener('openVendorChat' as any, handleOpenVendorChat as any);
    return () => {
      window.removeEventListener('openVendorChat' as any, handleOpenVendorChat as any);
    };
  }, [chats, createOrGetChat, setCurrentChatId]);

  // Play notification sound for new messages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKni7rZiHQU2jdXux3MnBSh+zPDhkUQMFF61%2BOutVhYKQ5zf67dhIQUrhM/z2og3CBlou/DknE0MDVCn4e62Yh0FN47V7sZyJwUpf83w4ZBEDBVetfjrrVYVCkGb3uu4YSEFKoXP89qINwgZaLzv5JxNDA1Qp%2BHutWIdBTaO1e7HcycFK3/N8OGQRA0VXbX467%2BWFQo/m93ruGAhBSiEz/Pah0cKGmm78OSbTQwNT6fh7rViFgU1jtXuxnMoBSp/zfDhkEQMFF20%2BOu/lhQKPprc67hfIQcrhM/z2odHChlouO/km04MDk%2Bn4u61YhYFM47V7sZyKQUqf87v4ZBEDBRctPjqv5cUCj2Z3Ou4XyEHKoTP89mHRwobaLjw45tODA5Sp%2BLutmIVBjOO1e7Gcioa');
      
      // Track user interaction
      const markInteraction = () => {
        hasInteracted.current = true;
      };
      document.addEventListener('click', markInteraction, { once: true });
      document.addEventListener('keydown', markInteraction, { once: true });
      
      return () => {
        document.removeEventListener('click', markInteraction);
        document.removeEventListener('keydown', markInteraction);
      };
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messages.length > 0 && !showChatList) {
      scrollToBottom();
    }
  }, [messages, isOpen, showChatList]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (isOpen && currentChatId && !showChatList) {
      markAsRead(currentChatId);
    }
  }, [isOpen, currentChatId, showChatList]);

  // Play sound when new unread message arrives
  const prevUnreadCount = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && !isOpen && audioRef.current && hasInteracted.current) {
      audioRef.current.play().catch(console.error);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChatId || sending) return;

    setSending(true);
    try {
      await sendMessage(currentChatId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = (message: string) => {
    setNewMessage(message);
  };

  const handleOpenChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowChatList(false);
  };

  const handleGoToFullChat = () => {
    setIsOpen(false);
    router.push('/chats');
  };

  const handleBackToChatList = () => {
    setShowChatList(true);
    setCurrentChatId(null);
  };

  const getMessageStatus = (messageId: string, isRead: boolean, senderId: string) => {
    if (senderId !== userId) return null;
    
    if (isRead) {
      return <CheckCheck className="w-3 h-3 text-blue-400" />;
    }
    return <Check className="w-3 h-3 text-gray-400" />;
  };

  const getTimeAgo = (date: Date | string): string => {
    const now = new Date();
    const messageDate = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'منذ لحظات';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} ${diffInMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ${diffInHours === 1 ? 'ساعة' : 'ساعات'}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} ${diffInDays === 1 ? 'يوم' : 'أيام'}`;
  };

  // Get selected chat data
  const selectedChatData = currentChatId ? chats.find(chat => chat.id === currentChatId) : null;

  // Don't render if user shouldn't see widget
  if (!shouldShowWidget) return null;

  return (
    <>
      {/* Floating Action Button - Draggable with Grip Indicator */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{
          top: -window.innerHeight + 150,
          bottom: 0,
          left: -window.innerWidth + 150,
          right: 0,
        }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(event: any, info: any) => {
          setIsDragging(false);
          // Save position to localStorage
          const newPosition = { x: info.point.x, y: info.point.y };
          setPosition(newPosition);
          localStorage.setItem('floatingChatPosition', JSON.stringify(newPosition));
        }}
        className="fixed z-50"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
          left: '1.5rem',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        initial={{ x: position.x, y: position.y }}
      >
        {/* Drag Indicator - Shows when hovering */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-purple-900/90 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap pointer-events-none"
          style={{
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(98, 54, 255, 0.5)',
          }}
        >
          <Move className="w-3 h-3 inline-block ml-1" />
          اسحب لتحريك الأيقونة
        </motion.div>
        
        <motion.button
          onClick={() => {
            if (!isDragging) {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setShowChatList(true);
              }
            }
          }}
          className="p-4 rounded-full shadow-2xl transition-all"
          style={{
            background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
            boxShadow: '0 0 30px rgba(98, 54, 255, 0.6), 0 0 60px rgba(98, 54, 255, 0.3)',
          }}
          whileHover={{ rotate: 15, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={!isOpen && !isDragging ? {
            boxShadow: [
              '0 0 30px rgba(98, 54, 255, 0.6)',
              '0 0 50px rgba(98, 54, 255, 0.8)',
              '0 0 30px rgba(98, 54, 255, 0.6)',
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-7 h-7 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageCircle className="w-7 h-7 text-white" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold px-1 animate-pulse"
                  style={{
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      </motion.div>

      {/* Chat Window - Glassmorphism & Neon Glow */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 rounded-2xl overflow-hidden"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)',
              left: '1.5rem',
              width: 'min(90vw, 400px)',
              height: 'min(75vh, 600px)',
              maxHeight: 'calc(100vh - 8rem)',
              background: 'linear-gradient(135deg, rgba(10, 5, 30, 0.95) 0%, rgba(30, 15, 60, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(98, 54, 255, 0.5)',
              boxShadow: '0 0 40px rgba(98, 54, 255, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.3) 0%, rgba(182, 33, 254, 0.3) 50%, rgba(255, 33, 157, 0.3) 100%)',
                borderBottom: '1px solid rgba(98, 54, 255, 0.3)',
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                {!showChatList && selectedChatData && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBackToChatList}
                    className="text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                )}
                
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
                    }}
                  >
                    {selectedChatData && !showChatList ? (
                      selectedChatData.other_user_role === 'vendor' ? (
                        <Store className="w-5 h-5 text-white" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )
                    ) : (
                      <MessageCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></span>
                </div>
                
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {selectedChatData && !showChatList ? selectedChatData.other_user_name : 'محادثاتي'}
                  </h3>
                  <p className="text-xs text-purple-300">
                    {selectedChatData && !showChatList 
                      ? (selectedChatData.other_user_role === 'vendor' ? selectedChatData.vendor_store_name : 'عميل')
                      : `${chats.length} محادثة`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleGoToFullChat}
                  className="text-purple-300 hover:text-white transition-colors text-xs"
                >
                  عرض الكل
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Chat List View */}
            {showChatList && (
              <div className="h-[calc(100%-60px)] overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <MessageCircle className="w-16 h-16 text-purple-300/50 mb-4" />
                    <p className="text-white/70 mb-2">لا توجد محادثات حالياً</p>
                    <p className="text-white/50 text-sm">ابدأ محادثة جديدة مع البائعين</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {chats.map((chat) => (
                      <motion.div
                        key={chat.id}
                        whileHover={{ backgroundColor: 'rgba(98, 54, 255, 0.1)' }}
                        onClick={() => handleOpenChat(chat.id)}
                        className="p-4 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
                              }}
                            >
                              {chat.other_user_role === 'vendor' ? (
                                <Store className="w-6 h-6 text-white" />
                              ) : (
                                <User className="w-6 h-6 text-white" />
                              )}
                            </div>
                            {((userRole === 'customer' && chat.customer_unread_count > 0) || (userRole === 'vendor' && chat.vendor_unread_count > 0)) && (
                              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold px-1 animate-pulse">
                                {(() => {
                                  const count = userRole === 'customer' ? chat.customer_unread_count : chat.vendor_unread_count;
                                  return count > 99 ? '99+' : count;
                                })()}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-white text-sm truncate">
                                {chat.other_user_name}
                              </h4>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">
                                {getTimeAgo(chat.last_message_at || chat.created_at)}
                              </span>
                            </div>
                            {chat.other_user_role === 'vendor' && chat.vendor_store_name && (
                              <p className="text-[10px] text-purple-300 mb-1">{chat.vendor_store_name}</p>
                            )}
                            <p className="text-xs text-gray-300 truncate">
                              {chat.last_message || 'ابدأ محادثة...'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages View */}
            {!showChatList && selectedChatData && (
              <>
                {/* Messages Container */}
                <div className="h-[calc(100%-180px)] overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="w-12 h-12 text-purple-300/50 mb-3" />
                      <p className="text-white/70 text-sm">لا توجد رسائل بعد</p>
                      <p className="text-white/50 text-xs mt-1">ابدأ المحادثة الآن</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isMe = msg.sender_role !== selectedChatData.other_user_role;
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] ${isMe ? 'text-left' : 'text-right'}`}>
                              <div
                                className={`px-3 py-2 ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} rounded-2xl`}
                                style={isMe ? {
                                  background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
                                  boxShadow: '0 4px 15px rgba(98, 54, 255, 0.3)',
                                } : {
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                              >
                                <p className="text-white text-sm">{msg.content}</p>
                              </div>
                              <div className="flex items-center gap-1 mt-1 px-1">
                                <span className="text-[10px] text-gray-400">
                                  {new Date(msg.created_at).toLocaleTimeString('ar-SA', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {getMessageStatus(msg.id, msg.is_read, msg.sender_id)}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="px-3 py-2 border-t border-purple-500/20">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAction('مرحباً، أريد الاستفسار عن المنتج')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap"
                      style={{
                        background: 'rgba(98, 54, 255, 0.2)',
                        border: '1px solid rgba(98, 54, 255, 0.4)',
                      }}
                    >
                      استفسار
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAction('ما هي مدة التوصيل؟')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap"
                      style={{
                        background: 'rgba(98, 54, 255, 0.2)',
                        border: '1px solid rgba(98, 54, 255, 0.4)',
                      }}
                    >
                      التوصيل
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAction('هل يوجد خصم؟')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap"
                      style={{
                        background: 'rgba(98, 54, 255, 0.2)',
                        border: '1px solid rgba(98, 54, 255, 0.4)',
                      }}
                    >
                      خصم
                    </motion.button>
                  </div>
                </div>

                {/* Input Area */}
                <div
                  className="px-3 py-2"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderTop: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 px-3 py-2 rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                      disabled={sending}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
                        boxShadow: '0 4px 15px rgba(98, 54, 255, 0.4)',
                      }}
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
