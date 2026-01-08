'use client';

import { motion } from 'framer-motion';
import { Check, CheckCheck, Edit2 } from 'lucide-react';
import RoleBadge from './RoleBadge';
import ReplyIndicator from './ReplyIndicator';
import MessageActions from './MessageActions';

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id: string | null;
  message_type: string;
}

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  showRole?: boolean;
  replyToMessage?: Message | null;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: Message) => void;
}

export default function MessageBubble({
  message,
  isMe,
  showRole = true,
  replyToMessage,
  onEdit,
  onDelete,
  onReply
}: MessageBubbleProps) {
  if (message.is_deleted) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-sm text-gray-400 italic">
            تم حذف هذه الرسالة
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Role Badge */}
        {showRole && !isMe && (
          <div className="mb-1 mr-2">
            <RoleBadge role={message.sender_role} size="sm" />
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-lg ${
            isMe
              ? 'rounded-br-sm'
              : 'rounded-bl-sm'
          }`}
          style={{
            background: isMe
              ? 'linear-gradient(135deg, #6236FF 0%, #B621FE 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Reply Indicator */}
          {message.reply_to_id && replyToMessage && (
            <ReplyIndicator
              replyToContent={replyToMessage.content}
              replySenderRole={replyToMessage.sender_role}
            />
          )}

          {/* Content */}
          <div className="flex items-start gap-2">
            <p className={`text-sm ${isMe ? 'text-white' : 'text-white/90'} break-words flex-1`}>
              {message.content}
            </p>

            {/* Actions Menu */}
            <MessageActions
              messageId={message.id}
              content={message.content}
              isMe={isMe}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
            />
          </div>

          {/* Metadata */}
          <div className={`flex items-center gap-2 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {message.is_edited && (
              <span className="flex items-center gap-1 text-xs text-white/50">
                <Edit2 className="w-3 h-3" />
                معدّلة
              </span>
            )}
            <span className={`text-xs ${isMe ? 'text-white/70' : 'text-white/50'}`}>
              {new Date(message.created_at).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isMe && (
              message.is_read ? (
                <CheckCheck className="w-4 h-4 text-blue-300" />
              ) : (
                <Check className="w-4 h-4 text-white/50" />
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
