'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { CustomList } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import {
  ListEditorFields,
  emptyListEditorValues,
  listEditorPayload,
  listEditorValuesFromList,
  type ListEditorValues,
} from '@/components/list-editor-fields';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useI18n } from '@/components/locale-provider';
import {
  createCustomList,
  deleteCustomList,
  listCustomLists,
  updateCustomList,
} from '@/lib/api';
import { formatListStateSummary } from '@/lib/list-state';

function ListsContent() {
  const { t } = useI18n();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [values, setValues] = useState<ListEditorValues>(emptyListEditorValues);
  const [editingList, setEditingList] = useState<CustomList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customLists = await listCustomLists();
      setLists(customLists);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('lists.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreateModal() {
    setEditingList(null);
    setValues(emptyListEditorValues());
    setFormError(null);
    setIsEditorOpen(true);
  }

  function openEditModal(list: CustomList) {
    setEditingList(list);
    setValues(listEditorValuesFromList(list));
    setFormError(null);
    setIsEditorOpen(true);
  }

  function closeEditorModal() {
    if (isSaving) {
      return;
    }
    setIsEditorOpen(false);
    setEditingList(null);
    setFormError(null);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const payload = listEditorPayload(values);
    if (!payload.name) {
      setFormError(t('lists.nameRequired'));
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingList) {
        const updated = await updateCustomList(editingList.id, payload);
        setLists((prev) =>
          [...prev.filter((entry) => entry.id !== updated.id), updated].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        );
      } else {
        const created = await createCustomList(payload);
        setLists((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      setValues(emptyListEditorValues());
      setEditingList(null);
      setIsEditorOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : editingList
            ? t('lists.updateFailed')
            : t('lists.createFailed'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(list: CustomList) {
    const confirmed = window.confirm(
      t('lists.deleteConfirm', { name: list.name }),
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomList(list.id);
      setLists((prev) => prev.filter((entry) => entry.id !== list.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('lists.deleteFailed'));
    }
  }

  return (
    <AppShell width="wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-muted">
            {t('lists.kicker')}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t('lists.heading')}
          </h1>
          <p className="mt-3 max-w-xl text-muted">{t('lists.description')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" onClick={openCreateModal}>
            {t('lists.create')}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-10 text-sm text-muted">{t('lists.loading')}</p>
      ) : null}

      {!isLoading && lists.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
          <p className="font-display text-xl text-foreground">
            {t('lists.emptyTitle')}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            {t('lists.emptyBody')}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-4"
            onClick={openCreateModal}
          >
            {t('lists.create')}
          </Button>
        </div>
      ) : null}

      {!isLoading && lists.length > 0 ? (
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {lists.map((list) => {
            const stateSummary = formatListStateSummary(list, t);

            return (
              <li
                key={list.id}
                className="group relative flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/lists/${list.id}`}
                  className="absolute inset-0 z-[1] rounded-sm transition hover:bg-[var(--overlay)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                  aria-label={t('lists.openAria', { name: list.name })}
                />
                <div>
                  <p className="font-display text-xl text-foreground transition group-hover:text-accent">
                    {list.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {list.itemCount === 1
                      ? t('lists.titleCountOne', { count: list.itemCount })
                      : t('lists.titleCountMany', { count: list.itemCount })}
                    {list.description ? ` · ${list.description}` : ''}
                    {stateSummary ? ` · ${stateSummary}` : ''}
                  </p>
                </div>
                <div className="relative z-[2] flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      openEditModal(list);
                    }}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleDelete(list);
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Modal
        open={isEditorOpen}
        title={editingList ? t('lists.editList') : t('lists.createList')}
        onClose={closeEditorModal}
      >
        <form
          onSubmit={(event) => void handleSave(event)}
          className="space-y-4"
        >
          <ListEditorFields
            values={values}
            disabled={isSaving}
            onChange={setValues}
          />

          {formError ? (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={closeEditorModal}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving
                ? editingList
                  ? t('common.saving')
                  : t('lists.creating')
                : editingList
                  ? t('lists.saveChanges')
                  : t('lists.createList')}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

export default function ListsPage() {
  return (
    <AuthGuard>
      <ListsContent />
    </AuthGuard>
  );
}
