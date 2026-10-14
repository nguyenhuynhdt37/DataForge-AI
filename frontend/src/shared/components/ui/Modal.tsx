"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AnimatedContent } from '../react-bits/AnimatedContent';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F2627]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog with React Bits AnimatedContent */}
      <div className={`relative w-full ${maxWidthClass} z-10`}>
        <AnimatedContent
          distance={20}
          direction="vertical"
          reverse={false}
          scale={0.96}
          duration={0.3}
        >
          <div className="bg-[#FAF9F5] border border-[#E5E3DC] rounded-2xl shadow-soft-xl overflow-hidden">
            {(Boolean(title) || Boolean(onClose)) && (
              <div className="flex items-center justify-between border-b border-[#ECEAE2] px-6 py-4 bg-white/80">
                <div>
                  {title && (
                    <h3 className="text-base font-bold text-[#1F2627] font-editorial">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-[#5A6466] mt-0.5 font-sans">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#5A6466] hover:text-[#1F2627] hover:bg-black/5 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Đóng cửa sổ"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </div>
        </AnimatedContent>
      </div>
    </div>
  );
};
