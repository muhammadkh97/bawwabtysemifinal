'use client';

/**
 * ============================================
 * 💬 صفحة الدردشة المحسّنة مع Realtime
 * Improved Chat Page with Realtime
 * ============================================
 * 
 * ✅ التحسينات:
 * 1. Realtime subscriptions للرسائل الفورية
 * 2. ربط مع قاعدة البيانات الحقيقية
 * 3. إرسال واستقبال رسائل حية
 * 4. إشعارات عند وصول رسالة جديدة
 * 5. عرض حالة الاتصال (online/offline)
 * 
 * استخدم هذا الملف بدلاً من page.tsx القديم
 */

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, ArrowRight, User, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// Types
// ============================================

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Chat {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  participant1?: {
    full_name: string;
    avatar_url?: string;
  };
  participant2?: {
    full_name: string;
    avatar_url?: string;
  };
}

// ============================================
// Main Component
// ============================================

export default function ChatsPage() {
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // ============================================
  // Fetch Current User
  // ============================================

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) {
        window.location.href = '/auth/login';
        return;
      }

      setUser(user);
      fetchChats(user.id);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      toast.error('فشل تحميل بيانات المستخدم');
    }
  };

  // ============================================
  // Fetch User's Chats
  // ============================================

  const fetchChats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          participant1:users!participant1_id(full_name, avatar_url),
          participant2:users!participant2_id(full_name, avatar_url)
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      setChats(data || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      toast.error('فشل تحميل المحادثات');
      setLoading(false);
    }
  };

  // ============================================
  // Select Chat & Fetch Messages
  // ============================================

  const selectChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
    setupRealtimeSubscription(chat.id);
    markMessagesAsRead(chat.id);
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(full_name, avatar_url)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      scrollToBottom();
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('فشل تحميل الرسائل');
    }
  };

  // ============================================
  // Setup Realtime Subscription
  // ============================================

  const setupRealtimeSubscription = (chatId: string) => {
    // إلغاء الاشتراك السابق إن وُجد
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // إنشاء اشتراك جديد
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
          
          // إضافة الرسالة للقائمة
          setMessages((prev) => [...prev, payload.new as Message]);
          
          // التمرير للأسفل
          setTimeout(scrollToBottom, 100);
          
          // إشعار صوتي (اختياري)
          if (payload.new.sender_id !== user?.id) {
            playNotificationSound();
            toast.success('رسالة جديدة!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          
          // تحديث الرسالة في القائمة
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          );
        }
      )
      .subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  };

  // ============================================
  // Send Message
  // ============================================

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedChat || !user) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      // تحديث آخر رسالة في الـ chat
      await supabase
        .from('chats')
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedChat.id);

      setNewMessage('');
      
      // الرسالة ستظهر تلقائياً عبر Realtime subscription
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  // ============================================
  // Mark Messages as Read
  // ============================================

  const markMessagesAsRead = async (chatId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .eq('sender_id', user.id)
        .eq('read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // ============================================
  // Helper Functions
  // ============================================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = () => {
    // يمكنك إضافة ملف صوت هنا
    // const audio = new Audio('/notification.mp3');
    // audio.play();
  };

  const getOtherParticipant = (chat: Chat) => {
    if (!user) return null;
    return chat.participant1_id === user.id
      ? chat.participant2
      : chat.participant1;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============================================
  // Cleanup on Unmount
  // ============================================

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* Sidebar - قائمة المحادثات */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">المحادثات</h1>
          <p className="text-sm text-gray-500 mt-1">
            {chats.length} محادثة
          </p>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">لا توجد محادثات بعد</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              const isSelected = selectedChat?.id === chat.id;

              return (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`w-full p-4 text-right hover:bg-gray-50 border-b border-gray-100 transition ${
                    isSelected ? 'bg-purple-50 border-r-4 border-r-purple-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      {otherUser?.avatar_url ? (
                        <img
                          src={otherUser.avatar_url}
                          alt={otherUser.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-purple-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {otherUser?.full_name || 'مستخدم'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {chat.last_message || 'لا توجد رسائل'}
                      </p>
                    </div>

                    {/* Time */}
                    {chat.last_message_at && (
                      <span className="text-xs text-gray-400">
                        {formatTime(chat.last_message_at)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area - منطقة المحادثة */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-50 to-pink-50">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>

                  {/* Name & Status */}
                  <div>
                    <h2 className="font-medium text-gray-900">
                      {getOtherParticipant(selectedChat)?.full_name || 'مستخدم'}
                    </h2>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Circle
                        className={`w-2 h-2 ${
                          isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
                        }`}
                      />
                      <span className="text-xs text-gray-500">
                        {isOnline ? 'متصل' : 'غير متصل'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Back Button (Mobile) */}
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden text-gray-600 hover:text-gray-900"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">ابدأ المحادثة...</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === user?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                          isMine
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <span
                          className={`text-xs mt-1 block ${
                            isMine ? 'text-purple-200' : 'text-gray-400'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          // No Chat Selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                اختر محادثة
              </h3>
              <p className="text-gray-500">
                اختر محادثة من القائمة للبدء بالمراسلة
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
