import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const dialogContent = (
    <div className="fixed inset-0 z-[70] overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#211F1C]/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative bg-[#FFFDF9] border border-[#E5DDD1] rounded-2xl p-6 shadow-modal max-w-sm w-full z-10 animate-fade-in text-center">
        <div className="w-12 h-12 rounded-full bg-[#6B2638]/10 border border-[#6B2638]/20 text-[#6B2638] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-serif font-bold text-[#211F1C] mb-2">{title}</h3>
        <p className="text-sm text-[#736B63] mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'wine'}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};
