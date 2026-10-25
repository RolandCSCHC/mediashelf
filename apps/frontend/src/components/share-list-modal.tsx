'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useI18n } from '@/components/locale-provider';
import { shareListBackup } from '@/lib/api';

const FIELD_CLASS =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] placeholder:text-muted focus:ring-2';

type ShareListTarget = {
  id: string;
  name: string;
};

type ShareListModalProps = {
  list: ShareListTarget | null;
  onClose: () => void;
};

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ShareListModal({ list, onClose }: ShareListModalProps) {
  const { locale, t } = useI18n();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const listId = list?.id ?? null;

  useEffect(() => {
    if (!listId) {
      return;
    }
    setEmail('');
    setError(null);
    setIsSending(false);
  }, [listId]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const handle = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(handle);
  }, [notice]);

  function close() {
    if (isSending) {
      return;
    }
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!list || isSending) {
      return;
    }

    const recipient = email.trim();
    if (!isEmail(recipient)) {
      setError(t('shareList.emailInvalid'));
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const result = await shareListBackup(list.id, {
        email: recipient,
        locale,
      });
      setNotice(result.sentTo);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shareList.failed'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <Modal
        open={list !== null}
        title={
          list
            ? t('shareList.title', { name: list.name })
            : t('shareList.button')
        }
        onClose={close}
      >
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
        >
          <p className="text-sm text-muted">{t('shareList.body')}</p>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              {t('shareList.email')}
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('shareList.emailPlaceholder')}
              autoComplete="email"
              maxLength={320}
              required
              disabled={isSending}
              className={FIELD_CLASS}
            />
          </label>

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSending}
              onClick={close}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isSending}>
              {isSending ? t('shareList.sending') : t('shareList.send')}
            </Button>
          </div>
        </form>
      </Modal>
      {notice
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 top-6 z-[70] flex justify-center px-4">
              <p
                role="status"
                className="pointer-events-auto w-full max-w-lg rounded-lg border border-accent bg-surface px-6 py-5 text-center font-display text-2xl font-semibold tracking-tight text-foreground shadow-lg sm:text-3xl"
              >
                {t('shareList.sent', { email: notice })}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
