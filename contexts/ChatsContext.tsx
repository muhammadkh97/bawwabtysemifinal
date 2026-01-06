'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';

// =====================================================
// 🎯 Types - محدّثة للنظام الجديد
// =====================================================

interface Chat {
  id: string;
  customer_id: string;
  vendor_id: string;
  chat_type: 'direct' | 'group' | 'support';
  last_message: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  last_message_sender_role: string | null;
  customer_unread_count: number;
  vendor_unread_count: number;
  admin_unread_count: number;
  driver_unread_count: number;
  is_active: boolean;
  is_archived: boolean;
  archived_by: string | null;
  archived_at: string | null;
  order_id: string | null;
  participants: any[] | null;
  metadata: any | null;
  created_at: string;
  updated_at: string;
  // معلومات الطرف الآخر (computed)
  other_user_name?: string;
  other_user_avatar?: string;
  other_user_role?: string;
  vendor_store_name?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: 'customer' | 'vendor' | 'restaurant' | 'driver' | 'admin' | 'staff';
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system';
  attachments: any[] | null;
  reply_to_id: string | null;
  is_read: boolean;
  read_at: string | null;
  read_by: any[] | null;
  is_edited: boolean;
  edited_at: string | null;
  edit_history: any[] | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  is_reported: boolean;
  report_reason: string | null;
  reported_by: string | null;
  reported_at: string | null;
  metadata: any | null;
  created_at: string;
}

interface ChatsContextType {
  chats: Chat[];
  currentChatId: string | null;
  messages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  unreadCount: number;
  userRole: string | null;
  userId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  sendMessage: (chatId: string, content: string, options?: SendMessageOptions) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  createOrGetChat: (targetId: string, targetType?: 'vendor' | 'customer') => Promise<string | null>;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  archiveChat: (chatId: string) => Promise<void>;
  unarchiveChat: (chatId: string) => Promise<void>;
}

interface SendMessageOptions {
  attachments?: any[];
  reply_to_id?: string;
  message_type?: 'text' | 'image' | 'file' | 'voice';
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

// =====================================================
// 🎯 Provider - محسّن بالكامل
// =====================================================

export function ChatsProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // =====================================================
  // 🔧 Initialize Authentication
  // =====================================================
  
  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (userId && userRole) {
      fetchChats();
      subscribeToChatsChanges();
    }
  }, [userId, userRole]);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
      subscribeToMessagesChanges(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  const initializeAuth = async () => {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        setUserId(user.id);
        setUserRole((user as any).role || 'customer');
      }
    } catch (error) {
      console.error('❌ خطأ في تهيئة المصادقة:', error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 📥 Fetch Chats - محسّن لجميع الأدوار
  // =====================================================

  const fetchChats = async () => {
    if (!userId || !userRole) return;

    try {
      setLoading(true);
      
      // بناء الاستعلام مع فلترة حسب المستخدم
      let query = supabase
        .from('chats')
        .select(`
          *,
          customer:users!chats_customer_id_fkey(id, full_name, avatar_url, role),
          vendor:stores(id, shop_name, logo_url, user_id)
        `)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      // فلترة حسب المستخدم - كل شخص يرى فقط المحادثات التي هو طرف فيها
      // يجب التحقق من كلا الجانبين: customer_id و vendor_id
      
      // أولاً: جلب متجر المستخدم (إذا كان لديه متجر)
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      // بناء الفلترة: المحادثات التي المستخدم طرف فيها
      // إما كعميل (customer_id) أو كبائع (vendor_id = متجره)
      if (storeData) {
        // لديه متجر: يرى المحادثات كعميل أو كبائع
        query = query.or(`customer_id.eq.${userId},vendor_id.eq.${storeData.id}`);
      } else {
        // ليس لديه متجر: يرى فقط المحادثات كعميل
        query = query.eq('customer_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ تفاصيل الخطأ:', error);
        throw error;
      }

      // تنسيق البيانات حسب دور المستخدم
      const formattedChats = (data || []).map((chat: any) => {
        return formatChatForUser(chat, userRole as string, userId as string);
      });

      setChats(formattedChats);

      // حساب عدد الرسائل غير المقروءة
      const totalUnread = calculateTotalUnread(formattedChats, userRole as string);
      setUnreadCount(totalUnread);

    } catch (error) {
      console.error('❌ خطأ في جلب المحادثات:', error);
      toast.error('فشل تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 🎨 Format Chat for User - دالة موحدة
  // =====================================================

  const formatChatForUser = (chat: any, role: string, uid: string): Chat => {
    const isCustomer = role === 'customer';
    const isVendor = role === 'vendor' || role === 'restaurant';
    const isAdmin = role === 'admin';
    const isDriver = role === 'driver';
    const isStaff = role === 'staff';

    let formattedChat: Chat = { ...chat };

    if (isAdmin) {
      // المدير يرى كل شيء
      formattedChat.other_user_name = `${chat.customer?.full_name} ↔ ${chat.vendor?.store_name}`;
      formattedChat.other_user_avatar = chat.customer?.avatar_url;
      formattedChat.unread_count = chat.admin_unread_count || 0;
    } else if (isDriver) {
      // السائق يرى العميل والمطعم
      formattedChat.other_user_name = `${chat.customer?.full_name} ↔ ${chat.vendor?.store_name}`;
      formattedChat.other_user_avatar = chat.customer?.avatar_url;
      formattedChat.unread_count = chat.driver_unread_count || 0;
    } else if (isCustomer) {
      // العميل يرى البائع
      formattedChat.other_user_name = chat.vendor?.shop_name || 'متجر';
      formattedChat.other_user_avatar = chat.vendor?.logo_url;
      formattedChat.other_user_role = 'vendor';
      formattedChat.vendor_store_name = chat.vendor?.shop_name;
      formattedChat.unread_count = chat.customer_unread_count || 0;
    } else if (isVendor || isStaff) {
      // البائع/المساعد يرى العميل
      formattedChat.other_user_name = chat.customer?.full_name || 'عميل';
      formattedChat.other_user_avatar = chat.customer?.avatar_url;
      formattedChat.other_user_role = 'customer';
      formattedChat.unread_count = chat.vendor_unread_count || 0;
    }

    return formattedChat;
  };

  // =====================================================
  // 🔢 Calculate Total Unread
  // =====================================================

  const calculateTotalUnread = (chats: Chat[], role: string): number => {
    return chats.reduce((sum, chat) => {
      if (role === 'admin') return sum + (chat.admin_unread_count || 0);
      if (role === 'driver') return sum + (chat.driver_unread_count || 0);
      if (role === 'customer') return sum + (chat.customer_unread_count || 0);
      if (role === 'vendor' || role === 'restaurant' || role === 'staff') {
        return sum + (chat.vendor_unread_count || 0);
      }
      return sum;
    }, 0);
  };

  // =====================================================
  // 📥 Fetch Messages
  // =====================================================

  const fetchMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_deleted', false) // لا نعرض المحذوفة
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('❌ خطأ في جلب الرسائل:', error);
      toast.error('فشل تحميل الرسائل');
    } finally {
      setMessagesLoading(false);
    }
  };

  // =====================================================
  // 📤 Send Message - محسّن بالكامل
  // =====================================================

  const sendMessage = async (
    chatId: string, 
    content: string, 
    options: SendMessageOptions = {}
  ) => {
    if (!userId || !userRole || !content.trim()) return;

    try {
      const messageData: any = {
        chat_id: chatId,
        sender_id: userId,
        sender_role: userRole,
        content: content.trim(),
        message_type: options.message_type || 'text',
        attachments: options.attachments || null,
        reply_to_id: options.reply_to_id || null,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // ✅ إضافة الرسالة محلياً فوراً
      if (data) {
        setMessages(prev => {
          // تحقق من عدم وجود الرسالة بالفعل
          const exists = prev.some(msg => msg.id === data.id);
          if (!exists) {
            return [...prev, data as Message];
          }
          return prev;
        });
      }

      // الـ Trigger سيحدث last_message و unread_count تلقائياً
      // تحديث قائمة المحادثات في الخلفية
      fetchChats();
      
      toast.success('✅ تم إرسال الرسالة');
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      toast.error('فشل إرسال الرسالة');
      throw error;
    }
  };

  // =====================================================
  // ✅ Mark as Read
  // =====================================================

  const markAsRead = async (chatId: string) => {
    if (!userId || !userRole) return;

    try {
      // تحديث الرسائل غير المقروءة
      await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('chat_id', chatId)
        .eq('is_read', false)
        .neq('sender_id', userId);

      // إعادة تعيين العداد حسب الدور
      const updateField = 
        userRole === 'customer' ? 'customer_unread_count' :
        userRole === 'admin' ? 'admin_unread_count' :
        userRole === 'driver' ? 'driver_unread_count' :
        'vendor_unread_count';

      await supabase
        .from('chats')
        .update({ [updateField]: 0 })
        .eq('id', chatId);

      fetchChats();
    } catch (error) {
      console.error('❌ خطأ في تحديد الرسائل كمقروءة:', error);
    }
  };

  // =====================================================
  // 🆕 Create or Get Chat - محسّن
  // =====================================================

  const createOrGetChat = async (
    targetId: string, 
    targetType: 'vendor' | 'customer' = 'vendor'
  ): Promise<string | null> => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول');
      return null;
    }

    try {
      // استخدام Function المحسّنة
      const { data, error } = await supabase.rpc('create_or_get_chat', {
        p_customer_id: userRole === 'customer' ? userId : targetId,
        p_vendor_id: userRole === 'customer' ? targetId : userId,
        p_chat_type: 'direct'
      });

      if (error) {
        // Fallback: الطريقة القديمة
        const customerId = userRole === 'customer' ? userId : targetId;
        const vendorId = userRole === 'customer' ? targetId : userId;

        const { data: existingChat } = await supabase
          .from('chats')
          .select('id')
          .eq('customer_id', customerId)
          .eq('vendor_id', vendorId)
          .single();

        if (existingChat) return existingChat.id;

        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            customer_id: customerId,
            vendor_id: vendorId,
            is_active: true,
            chat_type: 'direct'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        await fetchChats();
        return newChat.id;
      }

      await fetchChats();
      return data;
    } catch (error) {
      console.error('❌ خطأ في إنشاء المحادثة:', error);
      toast.error('فشل إنشاء المحادثة');
      return null;
    }
  };

  // =====================================================
  // ✏️ Edit Message
  // =====================================================

  const editMessage = async (messageId: string, newContent: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          // الـ Trigger سيحدث is_edited و edited_at تلقائياً
        })
        .eq('id', messageId)
        .eq('sender_id', userId);

      if (error) throw error;

      // تحديث UI محلياً
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, is_edited: true } 
          : msg
      ));

      toast.success('✅ تم تعديل الرسالة');
    } catch (error) {
      console.error('❌ خطأ في تعديل الرسالة:', error);
      toast.error('فشل تعديل الرسالة');
    }
  };

  // =====================================================
  // 🗑️ Delete Message
  // =====================================================

  const deleteMessage = async (messageId: string) => {
    if (!userId) return;

    try {
      // استخدام Function المحسّنة
      const { data, error } = await supabase.rpc('delete_message', {
        p_message_id: messageId,
        p_user_id: userId
      });

      if (error) throw error;

      // تحديث UI محلياً
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      toast.success('✅ تم حذف الرسالة');
    } catch (error) {
      console.error('❌ خطأ في حذف الرسالة:', error);
      toast.error('فشل حذف الرسالة');
    }
  };

  // =====================================================
  // 🗑️ Delete Chat
  // =====================================================

  const deleteChat = async (chatId: string) => {
    if (!userId) return;

    try {
      // حذف المحادثة (soft delete بتعيين is_active = false)
      const { error } = await supabase
        .from('chats')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', chatId);

      if (error) throw error;

      // إزالة من القائمة محلياً
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // إذا كانت المحادثة المفتوحة حالياً، أغلقها
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }

      toast.success('✅ تم حذف المحادثة');
    } catch (error) {
      console.error('❌ خطأ في حذف المحادثة:', error);
      toast.error('فشل حذف المحادثة');
    }
  };

  // =====================================================
  // 📦 Archive Chat
  // =====================================================

  const archiveChat = async (chatId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase.rpc('archive_chat', {
        p_chat_id: chatId,
        p_user_id: userId
      });

      if (error) throw error;

      await fetchChats();
      toast.success('✅ تم أرشفة المحادثة');
    } catch (error) {
      console.error('❌ خطأ في أرشفة المحادثة:', error);
      toast.error('فشل أرشفة المحادثة');
    }
  };

  // =====================================================
  // 📤 Unarchive Chat
  // =====================================================

  const unarchiveChat = async (chatId: string) => {
    try {
      const { error } = await supabase.rpc('unarchive_chat', {
        p_chat_id: chatId
      });

      if (error) throw error;

      await fetchChats();
      toast.success('✅ تم إلغاء أرشفة المحادثة');
    } catch (error) {
      console.error('❌ خطأ في إلغاء الأرشفة:', error);
      toast.error('فشل إلغاء الأرشفة');
    }
  };

  // =====================================================
  // 🔄 Real-time Subscriptions
  // =====================================================

  const subscribeToChatsChanges = () => {
    if (!userId || !userRole) return;

    // فلترة للاشتراك في المحادثات الخاصة بالمستخدم فقط
    let filter = '';
    if (userRole === 'customer') {
      filter = `customer_id=eq.${userId}`;
    } else if (userRole === 'vendor' || userRole === 'restaurant' || userRole === 'staff') {
      // سيتم التحديث عند تلقي رسالة جديدة
      filter = '';
    }

    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // فقط التحديثات (آخر رسالة، عدد غير مقروءة)
          schema: 'public',
          table: 'chats',
          filter: filter || undefined
        },
        (payload) => {
          console.log('📨 تم تحديث محادثة:', payload.new);
          // تحديث محلي فقط بدون re-fetch كامل
          setChats(prev => prev.map(chat => 
            chat.id === payload.new.id 
              ? formatChatForUser(payload.new, userRole as string, userId as string)
              : chat
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMessagesChanges = (chatId: string) => {
    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('📨 رسالة جديدة:', payload.new);
          const newMessage = payload.new as Message;
          
          // لا نضيف الرسالة إذا كانت محذوفة أو مرسلة من نفس المستخدم (تمت إضافتها بالفعل)
          if (!newMessage.is_deleted) {
            setMessages((prev) => {
              // تحقق من عدم وجود الرسالة بالفعل
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) {
                console.log('⏭️ الرسالة موجودة بالفعل - تخطي');
                return prev;
              }
              console.log('✅ إضافة رسالة جديدة');
              return [...prev, newMessage];
            });
            
            // تحديد كمقروءة تلقائياً إذا كانت المحادثة مفتوحة
            if (newMessage.sender_id !== userId) {
              markAsRead(chatId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // =====================================================
  // 🎁 Return Provider
  // =====================================================

  return (
    <ChatsContext.Provider
      value={{
        chats,
        currentChatId,
        messages,
        loading,
        messagesLoading,
        unreadCount,
        userRole,
        userId,
        setCurrentChatId,
        sendMessage,
        markAsRead,
        createOrGetChat,
        fetchChats,
        fetchMessages,
        editMessage,
        deleteMessage,
        deleteChat,
        archiveChat,
        unarchiveChat,
      }}
    >
      {children}
    </ChatsContext.Provider>
  );
}

// =====================================================
// 🪝 Custom Hook
// =====================================================

export function useChats() {
  const context = useContext(ChatsContext);
  if (context === undefined) {
    throw new Error('useChats must be used within a ChatsProvider');
  }
  return context;
}
