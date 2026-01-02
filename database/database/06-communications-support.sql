-- =========================================================
-- 06-communications-support.sql
-- نظام الاتصالات والدعم
-- =========================================================

-- =====================================================
-- 1. جدول الإشعارات
-- =====================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  notification_type VARCHAR(50) NOT NULL, -- 'order', 'payment', 'promotion', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  is_read BOOLEAN DEFAULT FALSE,
  
  action_url VARCHAR(500),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- =====================================================
-- 2. جدول الرسائل
-- =====================================================

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  
  subject VARCHAR(255),
  content TEXT NOT NULL,
  
  is_read BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);

-- =====================================================
-- 3. جدول تذاكر الدعم
-- =====================================================

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  category VARCHAR(50), -- 'order', 'payment', 'product', 'other'
  priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  
  attachment_urls TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_support_tickets_customer_id ON public.support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);

-- =====================================================
-- 4. جدول الأسئلة الشائعة
-- =====================================================

CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  
  category VARCHAR(100),
  order_index INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_is_active ON public.faqs(is_active);

-- =====================================================
-- 5. جدول تعليقات العملاء
-- =====================================================

CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  feedback_type VARCHAR(50), -- 'app', 'service', 'vendor'
  reference_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);

-- =====================================================
-- 6. Triggers
-- =====================================================

CREATE TRIGGER update_support_tickets_timestamp BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_faqs_timestamp BEFORE UPDATE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

SELECT 'تم إنشاء نظام الاتصالات والدعم بنجاح ✓' AS status;
