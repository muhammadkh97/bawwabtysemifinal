-- ====================================
-- إنشاء جدول الردود على التذاكر
-- ====================================

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة الفهارس
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_user_id ON ticket_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created_at ON ticket_replies(created_at DESC);

-- تفعيل RLS
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- سياسات RLS: المستخدمون يمكنهم رؤية ردودهم فقط
CREATE POLICY "Users can view replies for their tickets"
  ON ticket_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_replies.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- المستخدمون يمكنهم إضافة ردود على تذاكرهم
CREATE POLICY "Users can reply to their tickets"
  ON ticket_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_replies.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- الإداريون يمكنهم رؤية جميع الردود
CREATE POLICY "Admins can view all replies"
  ON ticket_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- الإداريون يمكنهم إضافة ردود على أي تذكرة
CREATE POLICY "Admins can reply to any ticket"
  ON ticket_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- الإداريون يمكنهم تعديل ردودهم
CREATE POLICY "Admins can update their replies"
  ON ticket_replies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    AND user_id = auth.uid()
  );

-- الإداريون يمكنهم حذف ردودهم
CREATE POLICY "Admins can delete their replies"
  ON ticket_replies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    AND user_id = auth.uid()
  );

-- منح الصلاحيات
GRANT SELECT, INSERT, UPDATE, DELETE ON ticket_replies TO anon, authenticated;

-- التحقق من الجدول
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ticket_replies'
ORDER BY ordinal_position;
