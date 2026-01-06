# 📝 دليل التنفيذ الشامل لنظام الدردشة المحترف

## 🎯 نظرة عامة

تم تطوير نظام دردشة احترافي وعالمي يدعم جميع أنواع المستخدمين مع ميزات متقدمة.

---

## 📋 خطوات التنفيذ (بالترتيب)

### المرحلة 1️⃣: تحديث قاعدة البيانات

#### الخطوة 1: نسخ احتياطي (مهم جداً!)
```sql
-- في Supabase SQL Editor
-- قم بتصدير البيانات الحالية أولاً من:
-- Table Editor > chats > Export to CSV
-- Table Editor > messages > Export to CSV
```

#### الخطوة 2: تنفيذ Migrations بالترتيب

**📁 ملف 1: `migrations/01-migrate-chats-table.sql`**
```
افتح Supabase Dashboard > SQL Editor
انسخ محتوى الملف 01
Run SQL
انتظر رسالة Success
```

**📁 ملف 2: `migrations/02-migrate-messages-table.sql`**
```
نفس الخطوات
Run بعد نجاح الملف 01
```

**📁 ملف 3: `migrations/03-create-chat-triggers.sql`**
```
نفس الخطوات
Run بعد نجاح الملف 02
```

**📁 ملف 4: `migrations/04-update-chat-policies.sql`**
```
نفس الخطوات
Run بعد نجاح الملف 03
```

#### الخطوة 3: التحقق من التنفيذ
```sql
-- تحقق من الأعمدة الجديدة في chats
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chats';

-- تحقق من الأعمدة الجديدة في messages
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages';

-- تحقق من Functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- تحقق من Triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

### المرحلة 2️⃣: تحديث الكود

#### الخطوة 1: نسخ الملف القديم للأمان
```powershell
# في VS Code Terminal
Copy-Item "contexts/ChatsContext.tsx" "contexts/ChatsContext-OLD-BACKUP.tsx"
```

#### الخطوة 2: استبدال ChatsContext
```powershell
# احذف الملف القديم
Remove-Item "contexts/ChatsContext.tsx"

# أعد تسمية الملف الجديد
Rename-Item "contexts/ChatsContext-NEW.tsx" "ChatsContext.tsx"
```

#### الخطوة 3: التحقق من عدم وجود أخطاء
```powershell
# تحقق من أخطاء TypeScript
npm run build
```

---

## 🧪 الاختبار الشامل

### اختبار 1: إنشاء محادثة جديدة

**كعميل:**
```typescript
// في أي صفحة
import { useChats } from '@/contexts/ChatsContext';

const { createOrGetChat, setCurrentChatId } = useChats();

const handleStartChat = async () => {
  const chatId = await createOrGetChat('vendor-id-here', 'vendor');
  if (chatId) {
    setCurrentChatId(chatId);
  }
};
```

**التحقق في قاعدة البيانات:**
```sql
SELECT * FROM chats WHERE customer_id = 'your-user-id';
```

---

### اختبار 2: إرسال رسالة

**إرسال رسالة نصية:**
```typescript
const { sendMessage } = useChats();

await sendMessage('chat-id-here', 'مرحباً! كيف حالك؟');
```

**إرسال رسالة مع مرفق:**
```typescript
await sendMessage('chat-id-here', 'صورة المنتج', {
  message_type: 'image',
  attachments: [{
    type: 'image',
    url: 'https://example.com/image.jpg',
    name: 'product.jpg'
  }]
});
```

**إرسال رسالة رد:**
```typescript
await sendMessage('chat-id-here', 'شكراً على السؤال', {
  reply_to_id: 'message-id-to-reply-to'
});
```

**التحقق:**
```sql
SELECT id, content, sender_role, message_type, attachments, reply_to_id
FROM messages 
WHERE chat_id = 'chat-id-here'
ORDER BY created_at DESC;
```

---

### اختبار 3: تحديد كمقروءة

```typescript
const { markAsRead } = useChats();

// عند فتح المحادثة
useEffect(() => {
  if (currentChatId) {
    markAsRead(currentChatId);
  }
}, [currentChatId]);
```

**التحقق:**
```sql
-- تحقق من تحديث العداد
SELECT 
  id,
  customer_unread_count,
  vendor_unread_count,
  admin_unread_count,
  driver_unread_count
FROM chats 
WHERE id = 'chat-id-here';

-- تحقق من تحديث الرسائل
SELECT id, is_read, read_at
FROM messages 
WHERE chat_id = 'chat-id-here';
```

---

### اختبار 4: تعديل رسالة

```typescript
const { editMessage } = useChats();

await editMessage('message-id', 'المحتوى المعدل');
```

**التحقق:**
```sql
SELECT 
  id, 
  content, 
  is_edited, 
  edited_at, 
  edit_history
FROM messages 
WHERE id = 'message-id';
```

---

### اختبار 5: حذف رسالة

```typescript
const { deleteMessage } = useChats();

await deleteMessage('message-id');
```

**التحقق:**
```sql
SELECT 
  id, 
  is_deleted, 
  deleted_at, 
  deleted_by,
  content -- يجب أن يكون 'تم حذف هذه الرسالة'
FROM messages 
WHERE id = 'message-id';
```

---

### اختبار 6: أرشفة محادثة

```typescript
const { archiveChat, unarchiveChat } = useChats();

// أرشفة
await archiveChat('chat-id');

// إلغاء الأرشفة
await unarchiveChat('chat-id');
```

**التحقق:**
```sql
SELECT 
  id, 
  is_archived, 
  archived_by, 
  archived_at
FROM chats 
WHERE id = 'chat-id';
```

---

### اختبار 7: الأدوار المختلفة

#### كعميل (Customer):
```typescript
// في app/chats/page.tsx
// يجب أن يرى:
// - جميع محادثاته مع البائعين
// - customer_unread_count
// - يمكنه إرسال رسائل
```

#### كبائع (Vendor):
```typescript
// يجب أن يرى:
// - جميع محادثاته مع العملاء
// - vendor_unread_count
// - يمكنه إرسال رسائل
```

#### كمدير (Admin):
```typescript
// يجب أن يرى:
// - جميع المحادثات في النظام
// - admin_unread_count
// - يمكنه حذف أي رسالة
```

#### كسائق (Driver):
```typescript
// يجب أن يرى:
// - المحادثات المرتبطة بطلباته
// - driver_unread_count
// - يمكنه إرسال رسائل
```

**التحقق:**
```sql
-- اختبر RLS Policies
-- سجل دخول بحسابات مختلفة وتحقق من البيانات المرئية
```

---

## 🔍 اختبار Triggers التلقائية

### Trigger 1: تحديث last_message
```sql
-- أرسل رسالة جديدة
INSERT INTO messages (chat_id, sender_id, sender_role, content)
VALUES ('chat-id', 'user-id', 'customer', 'رسالة اختبار');

-- تحقق من التحديث التلقائي
SELECT 
  id, 
  last_message, 
  last_message_at, 
  last_message_sender_id,
  last_message_sender_role
FROM chats 
WHERE id = 'chat-id';
```

### Trigger 2: زيادة عداد الرسائل غير المقروءة
```sql
-- أرسل رسالة من البائع للعميل
INSERT INTO messages (chat_id, sender_id, sender_role, content)
VALUES ('chat-id', 'vendor-id', 'vendor', 'مرحباً');

-- تحقق من زيادة customer_unread_count
SELECT 
  id, 
  customer_unread_count, 
  vendor_unread_count
FROM chats 
WHERE id = 'chat-id';
```

### Trigger 3: حفظ تاريخ التعديلات
```sql
-- عدّل رسالة مرتين
UPDATE messages 
SET content = 'تعديل 1' 
WHERE id = 'message-id';

UPDATE messages 
SET content = 'تعديل 2' 
WHERE id = 'message-id';

-- تحقق من حفظ التاريخ
SELECT 
  id, 
  content, 
  is_edited, 
  edit_history
FROM messages 
WHERE id = 'message-id';
```

---

## 🎨 الميزات المتقدمة (للمستقبل)

### 1. نظام المرفقات (Attachments)

**هيكل البيانات:**
```json
{
  "attachments": [
    {
      "type": "image",
      "url": "https://storage.supabase.co/...",
      "name": "product.jpg",
      "size": 245678,
      "mime_type": "image/jpeg"
    }
  ]
}
```

**واجهة الرفع:**
```typescript
// في FloatingChatWidget.tsx أو app/chats/page.tsx
const handleFileUpload = async (file: File) => {
  // 1. رفع الملف إلى Supabase Storage
  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(`${userId}/${Date.now()}_${file.name}`, file);

  if (error) throw error;

  // 2. الحصول على URL عام
  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(data.path);

  // 3. إرسال الرسالة مع المرفق
  await sendMessage(chatId, file.name, {
    message_type: 'image',
    attachments: [{
      type: 'image',
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      mime_type: file.type
    }]
  });
};
```

---

### 2. مؤشر الكتابة (Typing Indicator)

**إضافة Broadcast Channel:**
```typescript
// في ChatsContext.tsx
const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

const broadcastTyping = (chatId: string, isTyping: boolean) => {
  const channel = supabase.channel(`chat-${chatId}`);
  
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId, isTyping }
  });
};

// الاستماع للكتابة
channel.on('broadcast', { event: 'typing' }, (payload) => {
  const { userId: typingUserId, isTyping } = payload.payload;
  
  if (isTyping) {
    setTypingUsers(prev => new Set([...prev, typingUserId]));
  } else {
    setTypingUsers(prev => {
      const updated = new Set(prev);
      updated.delete(typingUserId);
      return updated;
    });
  }
});
```

---

### 3. الحالة Online/Offline

**إضافة Presence:**
```typescript
// في ChatsContext.tsx
const trackPresence = (chatId: string) => {
  const channel = supabase.channel(`chat-${chatId}`, {
    config: { presence: { key: userId } }
  });

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    // state يحتوي على جميع المستخدمين Online
  });

  // تتبع المستخدم الحالي
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ 
        online_at: new Date().toISOString(),
        user_id: userId 
      });
    }
  });
};
```

---

### 4. Emoji Picker

**مكتبة موصى بها:**
```bash
npm install emoji-picker-react
```

**الاستخدام:**
```typescript
import EmojiPicker from 'emoji-picker-react';

const [showEmojiPicker, setShowEmojiPicker] = useState(false);

<div>
  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
    😊
  </button>
  
  {showEmojiPicker && (
    <EmojiPicker 
      onEmojiClick={(emoji) => {
        setMessage(prev => prev + emoji.emoji);
        setShowEmojiPicker(false);
      }}
    />
  )}
</div>
```

---

### 5. الرد على رسالة (Reply)

**في UI:**
```typescript
const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

// عند النقر على زر الرد
<button onClick={() => setReplyToMessage(message)}>
  رد
</button>

// في مربع الإرسال
{replyToMessage && (
  <div className="reply-preview">
    <p>الرد على: {replyToMessage.content}</p>
    <button onClick={() => setReplyToMessage(null)}>×</button>
  </div>
)}

// عند الإرسال
await sendMessage(chatId, content, {
  reply_to_id: replyToMessage?.id
});
```

---

### 6. البحث في الرسائل

**إضافة دالة بحث:**
```typescript
const searchMessages = async (chatId: string, query: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false });

  return data;
};
```

---

## 📊 مراقبة الأداء

### Query 1: أكثر المحادثات نشاطاً
```sql
SELECT 
  c.id,
  c.last_message,
  COUNT(m.id) as message_count,
  c.updated_at
FROM chats c
LEFT JOIN messages m ON m.chat_id = c.id
GROUP BY c.id
ORDER BY message_count DESC
LIMIT 10;
```

### Query 2: الرسائل غير المقروءة الكلية
```sql
SELECT 
  SUM(customer_unread_count) as total_customer_unread,
  SUM(vendor_unread_count) as total_vendor_unread,
  SUM(admin_unread_count) as total_admin_unread,
  SUM(driver_unread_count) as total_driver_unread
FROM chats;
```

### Query 3: متوسط وقت الرد
```sql
WITH message_times AS (
  SELECT 
    chat_id,
    sender_role,
    created_at,
    LAG(created_at) OVER (PARTITION BY chat_id ORDER BY created_at) as prev_time,
    LAG(sender_role) OVER (PARTITION BY chat_id ORDER BY created_at) as prev_role
  FROM messages
)
SELECT 
  AVG(EXTRACT(EPOCH FROM (created_at - prev_time))) / 60 as avg_response_minutes
FROM message_times
WHERE prev_role != sender_role;
```

---

## 🚨 استكشاف الأخطاء

### مشكلة 1: لا تظهر المحادثات

**السبب المحتمل:**
- RLS Policies غير صحيحة
- User ID غير موجود

**الحل:**
```sql
-- تحقق من RLS
SELECT * FROM chats WHERE customer_id = 'your-user-id';

-- إيقاف RLS مؤقتاً للاختبار
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
-- اختبر الآن
-- ثم أعد تفعيله
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
```

---

### مشكلة 2: الرسائل لا ترسل

**السبب المحتمل:**
- sender_role غير صحيح
- chat_id غير موجود

**الحل:**
```sql
-- تحقق من Chat
SELECT * FROM chats WHERE id = 'chat-id';

-- تحقق من User Role
SELECT id, role FROM users WHERE id = 'user-id';

-- جرب إرسال يدوياً
INSERT INTO messages (chat_id, sender_id, sender_role, content)
VALUES ('chat-id', 'user-id', 'customer', 'test');
```

---

### مشكلة 3: العداد لا يتحدث

**السبب المحتمل:**
- Triggers لم يتم تطبيقها

**الحل:**
```sql
-- تحقق من وجود Triggers
SELECT * FROM information_schema.triggers 
WHERE event_object_table IN ('chats', 'messages');

-- أعد تنفيذ ملف 03
```

---

## ✅ Checklist النهائي

### قاعدة البيانات
- [ ] تم تنفيذ Migration 01 (chats table)
- [ ] تم تنفيذ Migration 02 (messages table)
- [ ] تم تنفيذ Migration 03 (functions & triggers)
- [ ] تم تنفيذ Migration 04 (RLS policies)
- [ ] جميع Triggers تعمل بشكل صحيح
- [ ] RLS تسمح للأدوار المناسبة

### الكود
- [ ] تم استبدال ChatsContext.tsx
- [ ] لا توجد أخطاء TypeScript
- [ ] npm run build ينجح بدون أخطاء

### الاختبار
- [ ] إنشاء محادثة جديدة يعمل
- [ ] إرسال رسالة يعمل
- [ ] تحديد كمقروءة يعمل
- [ ] تعديل رسالة يعمل
- [ ] حذف رسالة يعمل
- [ ] أرشفة محادثة يعمل
- [ ] جميع الأدوار تعمل (Customer, Vendor, Admin, Driver, Staff)
- [ ] Real-time updates تعمل
- [ ] العداد الكلي يتحدث بشكل صحيح

---

## 🎉 المرحلة التالية

بعد إكمال جميع الخطوات أعلاه، يمكنك البدء في:

1. **إضافة UI للمرفقات** في FloatingChatWidget
2. **إضافة Emoji Picker**
3. **إضافة Typing Indicators**
4. **إضافة Online/Offline Status**
5. **إضافة Search في الرسائل**
6. **إضافة Notifications صوتية محسّنة**
7. **إضافة Dark Mode**
8. **إضافة Animations محسّنة**

---

## 📞 الدعم

إذا واجهت أي مشكلة، تحقق من:
- `CHAT_SYSTEM_COMPREHENSIVE_REPORT.md` - التحليل الشامل
- `migrations/README.md` - دليل الـ Migrations
- Supabase Dashboard > Logs - لرؤية الأخطاء
- Browser Console - لرؤية أخطاء JavaScript

---

**تم إنشاء هذا الدليل بواسطة GitHub Copilot** 🤖  
**آخر تحديث:** 2024
