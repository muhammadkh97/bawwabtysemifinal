'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2,
  Trash2,
  Reply,
  Copy,
  MoreVertical,
  Check,
  X
} from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  content: string;
  isMe: boolean;
  onEdit?: any;
  onDelete?: any;
  onReply?: any;
}

export default function MessageActions({
  messageId,
  content,
  isMe,
  onEdit,
  onDelete,
  onReply
}: MessageActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setShowMenu(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit(messageId, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') handleCancelEdit();
          }}
        />
        <button
          onClick={handleSaveEdit}
          className="p-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
        >
          <Check className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={handleCancelEdit}
          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={`absolute z-50 ${isMe ? 'left-0' : 'right-0'} top-8 min-w-[160px] rounded-xl overflow-hidden shadow-2xl`}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 15, 60, 0.98) 0%, rgba(10, 5, 30, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.5)'
              }}
            >
              <button
                onClick={() => {
                  onReply(messageId);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-purple-500/20 transition-colors text-white"
              >
                <Reply className="w-4 h-4" />
                <span>رد</span>
              </button>

              <button
                onClick={handleCopy}
                className="w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-purple-500/20 transition-colors text-white"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ</span>
              </button>

              {isMe && (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-purple-500/20 transition-colors text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                        onDelete(messageId);
                        setShowMenu(false);
                      }
                    }}
                    className="w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-red-500/20 transition-colors text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
