import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDanger?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = 'CONFIRM',
  confirmDanger = false,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[#0a1a2b] border border-[#244463] p-6 shadow-2xl text-[#eaf4ff] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#1b3853]">
          <h3 className="text-base font-semibold tracking-wide text-[#eaf4ff]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#91a9c1] hover:text-white hover:bg-[#12283e] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-[#b9cde0] leading-relaxed max-h-[75vh] overflow-y-auto">
          {children}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1b3853]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wider text-[#91a9c1] bg-[#071725] border border-[#1b3853] hover:text-white hover:border-[#315578] transition"
          >
            CANCEL
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition shadow-sm ${
                confirmDanger
                  ? 'bg-rose-600 text-white hover:bg-rose-500'
                  : 'bg-[#4aa8ff] text-[#041322] hover:bg-[#82c5ff]'
              }`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
