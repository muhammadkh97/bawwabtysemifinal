'use client';

import { Reply, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReplyPreviewProps {
  replyToMessage: {
    id: string;
    content: string;
    sender_role: string;
  } | null;
  onClear?: any;
}

export default function ReplyPreview({ replyToMessage, onClear }: ReplyPreviewProps) {
  if (!replyToMessage) return null;

  const getRoleName = (role: string) => {
    switch (role) {
      case 'customer': return 'عميل';
      case 'vendor': return 'بائع';
      case 'restaurant': return 'مطعم';
      case 'driver': return 'سائق';
      case 'admin': return 'مدير';
      case 'staff': return 'مساعد';
      default: return role;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="px-4 py-3 border-t border-purple-500/20"
      style={{
        background: 'rgba(98, 54, 255, 0.1)',
      }}
    >
      <div className="flex items-start gap-3">
        <Reply className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-purple-300 mb-1">
            رد على {getRoleName(replyToMessage.sender_role)}
          </p>
          <p className="text-sm text-white/80 truncate">
            {replyToMessage.content}
          </p>
        </div>
        <button
          onClick={onClear}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}
