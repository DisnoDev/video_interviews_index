import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface TranscriptModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export function TranscriptModal({ open, title, onClose, actions, children }: TranscriptModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-medium">{title}</h2>
          <div className="flex items-center gap-2">
            {actions}
            <button type="button" onClick={onClose} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 transition hover:border-white/50 hover:text-white">
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-5 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
