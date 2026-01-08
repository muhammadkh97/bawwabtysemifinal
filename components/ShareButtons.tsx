'use client';

import { Share2, MessageCircle, Facebook, Copy, Check, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonsProps {
  productName: string;
  productId: string;
  productPrice: number;
  productImage?: string;
}

export default function ShareButtons({ productName, productId, productPrice, productImage }: ShareButtonsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const productUrl = typeof window !== 'undefined' 
    ? `${(typeof window !== 'undefined' ? window.location.origin : undefined)}/products/${productId}` 
    : '';
  
  const shareText = `تحقق من هذا المنتج الرائع: ${productName}`;

  const shareLinks = [
    {
      name: 'فيسبوك',
      icon: Facebook,
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:shadow-blue-500/30',
      action: () => {
        (typeof window !== 'undefined' ? window.open : undefined)(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank', 'width=600,height=400');
        setShowMenu(false);
      }
    },
    {
      name: 'واتساب',
      icon: MessageCircle,
      color: 'from-green-600 to-green-700',
      hoverColor: 'hover:shadow-green-500/30',
      action: () => {
        (typeof window !== 'undefined' ? window.open : undefined)(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + productUrl)}`, '_blank');
        setShowMenu(false);
      }
    },
    {
      name: 'تويتر',
      icon: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'from-gray-900 to-black',
      hoverColor: 'hover:shadow-gray-500/30',
      action: () => {
        (typeof window !== 'undefined' ? window.open : undefined)(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`, '_blank', 'width=600,height=400');
        setShowMenu(false);
      }
    },
    {
      name: 'تيليجرام',
      icon: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:shadow-blue-400/30',
      action: () => {
        (typeof window !== 'undefined' ? window.open : undefined)(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        setShowMenu(false);
      }
    },
    {
      name: 'سناب شات',
      icon: () => (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3 0 .719-.186.988-.46.216-.215.324-.413.324-.587 0-.107-.043-.233-.146-.36-.122-.151-.24-.25-.353-.346l-.013-.011c-.232-.183-.373-.297-.373-.505 0-.197.145-.334.356-.334.121 0 .244.044.37.131.632.433 1.018.757 1.018 1.418 0 .498-.283.959-.796 1.296a2.326 2.326 0 01-1.296.393c-.596 0-1.036-.233-1.397-.585-.299-.324-.583-.825-1.042-.825-.474 0-.695.442-1.004.825-.361.452-.85.785-1.543.785-.714 0-1.227-.363-1.609-.84-.357-.447-.566-.927-1.022-.927-.469 0-.709.496-1.047.957-.396.542-.946.94-1.735.94-.888 0-1.465-.441-1.791-1.053-.358-.677-.533-1.543-.533-2.574 0-2.405.702-5.16 2.145-6.99C8.328 1.232 10.051.793 12.206.793z"/>
        </svg>
      ),
      color: 'from-yellow-400 to-yellow-500',
      hoverColor: 'hover:shadow-yellow-400/30',
      action: () => {
        // Snapchat doesn't have direct web sharing, copy link instead
        copyToClipboard();
      }
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="group relative overflow-hidden rounded-2xl px-6 py-4 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 w-full"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-indigo-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center justify-center gap-2 text-white">
          <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg">مشاركة المنتج</span>
        </div>
      </button>

      {/* Share Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Share Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold">مشاركة المنتج</h3>
                    <button
                      onClick={() => setShowMenu(false)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-white/80 text-sm">{productName}</p>
                </div>

                {/* Share Options */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {shareLinks.map((social, index) => (
                      <motion.button
                        key={social.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={social.action}
                        className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:shadow-xl ${social.hoverColor}`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r ${social.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
                        <div className={`absolute inset-0 bg-gradient-to-r ${social.color} blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="relative flex flex-col items-center gap-2 text-white">
                          {(() => {
                            const IconComponent = social.icon;
                            return typeof IconComponent === 'function' && IconComponent.length === 0 ? (
                              <IconComponent />
                            ) : (
                              <IconComponent className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            );
                          })()}
                          <span className="font-bold text-sm">{social.name}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Copy Link */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gray-50 rounded-2xl p-4"
                  >
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      أو انسخ الرابط
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={productUrl}
                        readOnly
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={copyToClipboard}
                        className={`px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                          copied
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span className="text-xs">تم</span>
                          </>
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-green-600 text-sm font-medium mt-2"
                      >
                        ✓ تم نسخ الرابط بنجاح!
                      </motion.p>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
