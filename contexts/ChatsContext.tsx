'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  customer_id: string;
  vendor_id: string;
  last_message: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  is_active: boolean;
  is_archived: boolean;
  customer_unread_count: number;
  vendor_unread_count: number;
  created_at: string;
  updated_at: string;
  // معلومات الطرف الآخر
  other_user_name?: string;
  other_user_avatar?: string;
  other_user_role?: 'customer' | 'vendor';
  vendor_store_name?: string;
  // computed property for current user's unread count
  unread_count?: number;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_role: 'customer' | 'vendor' | 'driver' | 'admin';
  message: string;
  attachments: string[] | null;
  attachment_types: string[] | null;
  is_read: boolean;
  read_at: string | null;
  is_reported: boolean;
  report_reason: string | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatsContextType {
  chats: Chat[];
  currentChatId: string | null;
  messages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  unreadCount: number;
  setCurrentChatId: (chatId: string | null) => void;
  sendMessage: (chatId: string, message: string, attachments?: string[]) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  createOrGetChat: (vendorId: string) => Promise<string | null>;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

export function ChatsProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
      console.error('خطأ في تهيئة المصادقة:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    if (!userId || !userRole) return;

    try {
      setLoading(true);
      let query = supabase.from('chats').select(`
        *,
        customer:users!chats_customer_id_fkey(id, full_name, avatar_url),
        vendor:vendors(id, store_name, logo_url, user_id, users:user_id(full_name, avatar_url))
      `).eq('is_active', true).order('last_message_at', { ascending: false, nullsFirst: false });

      if (userRole === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userRole === 'vendor') {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (vendorData) {
          query = query.eq('vendor_id', vendorData.id);
        }
      }
      // Drivers and admins can see all chats (no filter)

      const { data, error } = await query;

      if (error) throw error;

      // تنسيق البيانات
      const formattedChats = data.map((chat: any) => {
        const isCustomerView = userRole === 'customer';
        const isDriverView = userRole === 'driver';
        const isAdminView = userRole === 'admin';
        
        // For drivers and admins, show both customer and vendor info
        if (isDriverView || isAdminView) {
          return {
            ...chat,
            other_user_name: `${chat.customer?.full_name} ↔ ${chat.vendor?.store_name}`,
            other_user_avatar: chat.customer?.avatar_url,
            other_user_role: 'customer',
            vendor_store_name: chat.vendor?.store_name,
            unread_count: chat.customer_unread_count + chat.vendor_unread_count
          };
        }
        
        return {
          ...chat,
          other_user_name: isCustomerView ? chat.vendor?.store_name : chat.customer?.full_name,
          other_user_avatar: isCustomerView ? chat.vendor?.logo_url : chat.customer?.avatar_url,
          other_user_role: isCustomerView ? 'vendor' : 'customer',
          vendor_store_name: chat.vendor?.store_name,
          unread_count: isCustomerView ? chat.customer_unread_count : chat.vendor_unread_count
        };
      });

      setChats(formattedChats);

      // حساب عدد الرسائل غير المقروءة
      const totalUnread = formattedChats.reduce((sum: number, chat: any) => {
        const isDriverOrAdmin = userRole === 'driver' || userRole === 'admin';
        if (isDriverOrAdmin) {
          return sum + chat.customer_unread_count + chat.vendor_unread_count;
        }
        return sum + (userRole === 'customer' ? chat.customer_unread_count : chat.vendor_unread_count);
      }, 0);
      setUnreadCount(totalUnread);

    } catch (error) {
      console.error('خطأ في جلب المحادثات:', error);
      toast.error('فشل تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('خطأ في جلب الرسائل:', error);
      toast.error('فشل تحميل الرسائل');
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async (chatId: string, message: string, attachments?: string[]) => {
    if (!userId || !userRole || !message.trim()) return;

    try {
      // 1. Insert message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userId,
          sender_role: userRole,
          message: message.trim(),
          attachments: attachments || null,
          attachment_types: attachments?.map(() => 'image') || null
        })
        .select()
        .single();

      if (messageError) {
        console.error('خطأ في إدراج الرسالة:', messageError);
        throw messageError;
      }

      // 2. Get current chat to increment unread count correctly
      const { data: currentChat, error: chatError } = await supabase
        .from('chats')
        .select('vendor_unread_count, customer_unread_count')
        .eq('id', chatId)
        .single();

      if (chatError) {
        console.error('خطأ في جلب بيانات المحادثة:', chatError);
        throw chatError;
      }

      // 3. Update chat with new message and increment unread count
      const isCustomer = userRole === 'customer';
      const updateData: any = {
        last_message: message.trim(),
        last_message_at: new Date().toISOString(),
        last_message_sender_id: userId,
      };

      // Increment unread count for the receiver
      if (isCustomer) {
        updateData.vendor_unread_count = (currentChat.vendor_unread_count || 0) + 1;
      } else {
        updateData.customer_unread_count = (currentChat.customer_unread_count || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from('chats')
        .update(updateData)
        .eq('id', chatId);

      if (updateError) {
        console.error('خطأ في تحديث المحادثة:', updateError);
        throw updateError;
      }

      // Refresh chats to update UI
      await fetchChats();
      
      toast.success('تم إرسال الرسالة');
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      toast.error('فشل إرسال الرسالة');
      throw error;
    }
  };

  const markAsRead = async (chatId: string) => {
    if (!userId || !userRole) return;

    try {
      const isCustomer = userRole === 'customer';
      
      // تحديث حالة الرسائل
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('is_read', false)
        .neq('sender_id', userId);

      // إعادة تعيين العداد
      await supabase
        .from('chats')
        .update(isCustomer ? { customer_unread_count: 0 } : { vendor_unread_count: 0 })
        .eq('id', chatId);

      fetchChats();
    } catch (error) {
      console.error('خطأ في تحديد الرسائل كمقروءة:', error);
    }
  };

  const createOrGetChat = async (vendorId: string): Promise<string | null> => {
    if (!userId || userRole !== 'customer') {
      toast.error('يجب تسجيل الدخول كعميل');
      return null;
    }

    try {
      // التحقق من وجود محادثة
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('customer_id', userId)
        .eq('vendor_id', vendorId)
        .single();

      if (existingChat) {
        return existingChat.id;
      }

      // إنشاء محادثة جديدة
      const { data, error } = await supabase
        .from('chats')
        .insert({
          customer_id: userId,
          vendor_id: vendorId,
          is_active: true
        })
        .select('id')
        .single();

      if (error) throw error;
      
      await fetchChats();
      return data.id;
    } catch (error) {
      console.error('خطأ في إنشاء المحادثة:', error);
      toast.error('فشل إنشاء المحادثة');
      return null;
    }
  };

  const subscribeToChatsChanges = () => {
    if (!userId || !userRole) return;

    // For vendors, we need to get vendor_id first
    const setupSubscription = async () => {
      let filter = '';
      
      if (userRole === 'customer') {
        filter = `customer_id=eq.${userId}`;
      } else if (userRole === 'vendor') {
        // Get vendor_id from vendors table
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (vendorError || !vendorData) {
          console.log('لم يتم العثور على بيانات البائع');
          return;
        }
        
        filter = `vendor_id=eq.${vendorData.id}`;
      }

      const channel = supabase
        .channel('chats-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chats',
            filter: filter
          },
          () => {
            console.log('تم تحديث المحادثات');
            fetchChats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
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
          setMessages((prev) => [...prev, payload.new as Message]);
          // تحديث كمقروءة تلقائياً إذا كانت المحادثة مفتوحة
          if (payload.new.sender_id !== userId) {
            markAsRead(chatId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <ChatsContext.Provider
      value={{
        chats,
        currentChatId,
        messages,
        loading,
        messagesLoading,
        unreadCount,
        setCurrentChatId,
        sendMessage,
        markAsRead,
        createOrGetChat,
        fetchChats,
        fetchMessages
      }}
    >
      {children}
    </ChatsContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatsContext);
  if (context === undefined) {
    throw new Error('useChats must be used within a ChatsProvider');
  }
  return context;
}
