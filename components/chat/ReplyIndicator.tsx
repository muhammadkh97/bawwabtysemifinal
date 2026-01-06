'use client';

import { Reply } from 'lucide-react';

interface ReplyIndicatorProps {
  replyToContent: string;
  replySenderRole: string;
}

export default function ReplyIndicator({ replyToContent, replySenderRole }: ReplyIndicatorProps) {
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
    <div className="mb-2 px-3 py-2 rounded-lg bg-white/5 border-r-2 border-purple-400">
      <div className="flex items-center gap-2 mb-1">
        <Reply className="w-3 h-3 text-purple-400" />
        <span className="text-xs text-purple-300">
          رد على {getRoleName(replySenderRole)}
        </span>
      </div>
      <p className="text-sm text-white/60 truncate">
        {replyToContent}
      </p>
    </div>
  );
}
