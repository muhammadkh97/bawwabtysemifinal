'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Image as ImageIcon, X, Smile, Paperclip } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { logger } from '@/lib/logger';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}

interface Chat {
  id: string;
  customer_id: string;
  vendor_id: string;
  last_message?: string;
  last_message_at: string;
  customer_unread_count: number;
  vendor_unread_count: number;
}

interface ChatComponentProps {
  vendorId: string;
  vendorName: string;
  vendorAvatar?: string;
}

export default function ChatComponent({ vendorId, vendorName, vendorAvatar }: ChatComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // جلب معرف المستخدم
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await initializeChat(user.id);
      }
    };
    getUser();
  }, [vendorId]);

  // تهيئة الدردشة
  const initializeChat = async (uid: string) => {
    // البحث عن دردشة موجودة
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('customer_id', uid)
      .eq('vendor_id', vendorId)
      .single();

    if (existingChat) {
      setChatId(existingChat.id);
      await fetchMessages(existingChat.id);
    } else {
      // إنشاء دردشة جديدة
      const { data: newChat } = await supabase
        .from('chats')
        .insert({
          customer_id: uid,
          vendor_id: vendorId,
        })
        .select()
        .single();

      if (newChat) {
        setChatId(newChat.id);
      }
    }
  };

  // جلب الرسائل
  const fetchMessages = async (cId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', cId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  // Realtime Subscription
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // التمرير للأسفل
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // إرسال رسالة
  const sendMessage = async () => {
    if (!newMessage.trim() && !imagePreview) return;
    if (!chatId || !userId) return;

    setIsLoading(true);

    try {
      const { data } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userId,
          message: newMessage.trim(),
          image_url: imagePreview,
        })
        .select()
        .single();

      if (data) {
        setNewMessage('');
        setImagePreview(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error sending message'
      
      logger.error('sendMessage failed', {
        error: errorMessage,
        component: 'ChatComponent',
        chatId,
        vendorId,
      })
    } finally {
      setIsLoading(false);
    }
  };

  // رفع صورة
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // معاينة محلية
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // تنسيق الوقت
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* زر فتح الدردشة */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50"
        style={{
          background: 'linear-gradient(135deg, #6236FF, #FF219D)',
          boxShadow: '0 0 40px rgba(98, 54, 255, 0.6)',
        }}
      >
        <MessageCircle className="w-7 h-7 text-white" />
        
        {/* Pulse animation */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(98, 54, 255, 0.7)',
              '0 0 0 20px rgba(98, 54, 255, 0)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </motion.button>

      {/* نافذة الدردشة */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 w-96 h-[600px] rounded-3xl overflow-hidden shadow-2xl z-50 flex flex-col"
            style={{
              background: 'rgba(15, 10, 30, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between"
              style={{
                background: 'linear-gradient(90deg, #6236FF 0%, #FF219D 100%)',
              }}
            >
              <div className="flex items-center gap-3">
                {vendorAvatar ? (
                  <Image
                    src={vendorAvatar}
                    alt={vendorName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                    {vendorName[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-white font-bold">{vendorName}</h3>
                  <p className="text-white/70 text-xs">متصل</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/10 rounded-xl p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-purple-300/50 text-center">
                  <div>
                    <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                    <p>ابدأ محادثتك مع {vendorName}</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender_id === userId;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 ${
                          isOwn
                            ? 'bg-gradient-to-r from-[#6236FF] to-[#FF219D] text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        {msg.image_url && (
                          <div className="mb-2 rounded-xl overflow-hidden">
                            <Image
                              src={msg.image_url}
                              alt="attachment"
                              width={200}
                              height={200}
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="text-sm mb-1">{msg.message}</p>
                        <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-purple-300'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="px-4 py-2">
                <div className="relative inline-block">
                  <img src={imagePreview} alt="preview" className="w-20 h-20 rounded-xl object-cover" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-purple-500/20">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="chat-image-upload"
                />
                <label
                  htmlFor="chat-image-upload"
                  className="cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-purple-300" />
                </label>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 px-4 py-3 rounded-2xl text-white placeholder-purple-300/50 outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={isLoading || (!newMessage.trim() && !imagePreview)}
                  className="p-3 rounded-xl text-white disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #6236FF, #FF219D)',
                  }}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

