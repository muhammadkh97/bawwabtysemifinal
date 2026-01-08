'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mail, Phone, MapPin, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';

interface FuturisticUserCardProps {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  delay?: number;
}

export default function FuturisticUserCard({
  id,
  name,
  email,
  phone,
  location,
  avatar,
  role,
  status,
  delay = 0,
}: FuturisticUserCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const statusColors = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'نشط' },
    inactive: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'غير نشط' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'قيد المراجعة' },
  };

  const roleColors = {
    admin: 'from-red-500 to-orange-500',
    vendor: 'from-emerald-500 to-teal-500',
    driver: 'from-blue-500 to-cyan-500',
    customer: 'from-purple-500 to-pink-500',
  };

  const currentStatus = statusColors[status];
  const roleGradient = roleColors[role as keyof typeof roleColors] || 'from-purple-500 to-pink-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div
        className="relative rounded-3xl p-6 overflow-hidden"
        style={{
          background: 'rgba(15, 10, 30, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(98, 54, 255, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative"
          >
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${roleGradient} p-1`}
              style={{
                boxShadow: '0 0 30px rgba(98, 54, 255, 0.5)',
              }}
            >
              <div className="w-full h-full rounded-full bg-[#0F0A1E] flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={name}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className={`absolute -bottom-1 -left-1 w-6 h-6 rounded-full ${currentStatus.bg} border-4 border-[#0F0A1E] flex items-center justify-center`}
            >
              <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-green-400' : status === 'pending' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
            </motion.div>
          </motion.div>

          {/* Actions */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-purple-300" />
            </motion.button>
            
            {/* Dropdown menu */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-12 left-0 w-40 rounded-2xl overflow-hidden z-50"
                style={{
                  background: 'rgba(15, 10, 30, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                <button 
                  onClick={() => (typeof window !== 'undefined' ? window.location.href : undefined) = `/dashboard/admin/users/${id}`}
                  className="w-full px-4 py-3 text-right text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">عرض التفاصيل</span>
                </button>
                <button className="w-full px-4 py-3 text-right text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">تعديل</span>
                </button>
                <button className="w-full px-4 py-3 text-right text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">حذف</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-3">
          {/* Name and Role */}
          <div>
            <h3 className="text-white text-xl font-bold mb-1">{name}</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${roleGradient} text-white`}>
              {role === 'admin' ? 'مدير' : role === 'vendor' ? 'تاجر' : role === 'driver' ? 'سائق' : 'عميل'}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-200 text-sm">
              <Mail className="w-4 h-4 text-purple-400" />
              <span className="truncate">{email}</span>
            </div>

            {phone && (
              <div className="flex items-center gap-2 text-purple-200 text-sm">
                <Phone className="w-4 h-4 text-purple-400" />
                <span>{phone}</span>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-2 text-purple-200 text-sm">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>

          {/* Status badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3 }}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${currentStatus.bg}`}
          >
            <span className={`text-xs font-bold ${currentStatus.text}`}>
              {currentStatus.label}
            </span>
          </motion.div>
        </div>

        {/* Decorative gradient */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20"
          style={{
            background: `linear-gradient(135deg, ${roleGradient.includes('purple') ? '#6236FF' : '#00A86B'}, transparent)`,
          }}
        />
      </div>

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, #6236FF, #FF219D)',
          filter: 'blur(25px)',
        }}
      />
    </motion.div>
  );
}

