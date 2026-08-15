'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { CustomList } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { createCustomList, deleteCustomList, listCustomLists } from '@/lib/api';

function ListsContent() {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customLists = await listCustomLists();
      setLists(customLists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lists');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreateModal() {
    setName('');
    setDescription('');
    setFormError(null);
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    if (isCreating) {
      return;
    }
    setIsCreateOpen(false);
    setFormError(null);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('List name is required');
      return;
    }

    setIsCreating(true);
    setFormError(null);
    try {
      const created = await createCustomList({
        name: trimmed,
        description: description.trim() || null,
      });
      setLists((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName('');
      setDescription('');
      setIsCreateOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to create list',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(list: CustomList) {
    const confirmed = window.confirm(`Delete list “${list.name}”?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomList(list.id);
      setLists((prev) => prev.filter((entry) => entry.id !== list.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    }
  }

  const fieldClass =
    'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2';

  return (
    <AppShell width="wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-muted">
            Organization
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Custom lists
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Group titles however you like — Favorites, Marvel, Christmas, and
            more.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" onClick={openCreateModal}>
            Create a list
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-10 text-sm text-muted">Loading lists…</p>
      ) : null}

      {!isLoading && lists.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
          <p className="font-display text-xl text-foreground">No lists yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Create a list to start grouping titles.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-4"
            onClick={openCreateModal}
          >
            Create a list
          </Button>
        </div>
      ) : null}

      {!isLoading && lists.length > 0 ? (
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {lists.map((list) => (
            <li
              key={list.id}
              className="group relative flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link
                href={`/lists/${list.id}`}
                className="absolute inset-0 z-[1] rounded-sm transition hover:bg-[var(--overlay)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                aria-label={`Open ${list.name}`}
              />
              <div>
                <p className="font-display text-xl text-foreground transition group-hover:text-accent">
                  {list.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {list.itemCount} {list.itemCount === 1 ? 'title' : 'titles'}
                  {list.description ? ` · ${list.description}` : ''}
                </p>
              </div>
              <div className="relative z-[2]">
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
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Modal
        open={isCreateOpen}
        title="Create a list"
        onClose={closeCreateModal}
      >
        <form
          onSubmit={(event) => void handleCreate(event)}
          className="space-y-4"
        >
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
              placeholder="Favorites"
              maxLength={80}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              Description
            </span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={fieldClass}
              placeholder="Optional"
              maxLength={280}
            />
          </label>

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
              disabled={isCreating}
              onClick={closeCreateModal}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create list'}
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
