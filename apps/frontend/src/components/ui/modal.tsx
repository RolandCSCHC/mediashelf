'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ModalSize = 'md' | 'lg';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  nested?: boolean;
};

const sizeClass: Record<ModalSize, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
  nested = false,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (nested) {
          event.stopImmediatePropagation();
        }
        onCloseRef.current();
      }
    }

    window.addEventListener('keydown', handleKeyDown, nested);

    // Prefer form fields so the header Close button is not autofocused.
    const focusTarget =
      dialogRef.current?.querySelector<HTMLElement>(
        'input, textarea, select, [data-autofocus]',
      ) ?? null;
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown, nested);
    };
  }, [open, nested]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 overflow-y-auto p-4 ${nested ? 'z-[60]' : 'z-50'}`}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/55"
        onClick={onClose}
      />
      <div className="relative flex min-h-full items-start justify-center pt-16 pb-8 sm:pt-20">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`relative z-10 w-full rounded-lg border border-border bg-surface p-6 shadow-lg ${sizeClass[size]}`}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2
              id={titleId}
              className="font-display text-2xl font-semibold tracking-tight text-foreground"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-muted transition hover:bg-[var(--overlay)] hover:text-foreground"
            >
              Close
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
