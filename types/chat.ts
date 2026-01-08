/**
 * Chat System Type Definitions
 * تعريفات الأنواع لنظام الدردشة
 */

// ============ Chat Participant ============

export interface ChatParticipant {
  user_id: string;
  role: 'customer' | 'vendor' | 'restaurant' | 'driver' | 'admin' | 'staff';
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
}

// ============ Chat Metadata ============

export interface ChatMetadata {
  order_id?: string;
  vendor_store_name?: string;
  subject?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  [key: string]: unknown;
}

// ============ Message Attachments ============

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  filename?: string;
  size?: number;
  mime_type?: string;
  thumbnail_url?: string;
}

// ============ Message Read Status ============

export interface MessageReadStatus {
  user_id: string;
  read_at: string;
}

// ============ Message Edit History ============

export interface MessageEditHistory {
  edited_at: string;
  old_content: string;
  edited_by: string;
}

// ============ Message Metadata ============

export interface MessageMetadata {
  mentions?: string[];
  reactions?: Record<string, string[]>; // emoji -> user_ids
  [key: string]: unknown;
}

// ============ Export all types ============

export type ChatParticipants = ChatParticipant[] | null;
export type MessageAttachments = MessageAttachment[] | null;
export type MessageReadStatuses = MessageReadStatus[] | null;
export type MessageEditHistoryList = MessageEditHistory[] | null;
