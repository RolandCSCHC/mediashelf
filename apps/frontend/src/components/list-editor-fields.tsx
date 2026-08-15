'use client';

import type {
  CreateCustomListRequest,
  CustomList,
  MediaStatus,
} from '@mediashelf/shared-types';
import { MEDIA_STATUS_OPTIONS } from '@/lib/media-status';

export type ListEditorValues = {
  name: string;
  description: string;
  defaultStatus: '' | MediaStatus;
  defaultDownloaded: '' | 'true' | 'false';
};

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2';

type ListEditorFieldsProps = {
  values: ListEditorValues;
  disabled?: boolean;
  onChange: (next: ListEditorValues) => void;
};

export function emptyListEditorValues(): ListEditorValues {
  return {
    name: '',
    description: '',
    defaultStatus: '',
    defaultDownloaded: '',
  };
}

export function listEditorValuesFromList(list: CustomList): ListEditorValues {
  return {
    name: list.name,
    description: list.description ?? '',
    defaultStatus: list.defaultStatus ?? '',
    defaultDownloaded:
      list.defaultDownloaded === null
        ? ''
        : list.defaultDownloaded
          ? 'true'
          : 'false',
  };
}

export function listEditorPayload(
  values: ListEditorValues,
): CreateCustomListRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    defaultStatus: values.defaultStatus || null,
    defaultDownloaded:
      values.defaultDownloaded === ''
        ? null
        : values.defaultDownloaded === 'true',
  };
}

export function ListEditorFields({
  values,
  disabled = false,
  onChange,
}: ListEditorFieldsProps) {
  function patch(partial: Partial<ListEditorValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-muted">Name</span>
        <input
          value={values.name}
          onChange={(event) => patch({ name: event.target.value })}
          className={fieldClass}
          placeholder="Downloaded movies"
          maxLength={80}
          required
          disabled={disabled}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-muted">
          Description
        </span>
        <input
          value={values.description}
          onChange={(event) => patch({ description: event.target.value })}
          className={fieldClass}
          placeholder="Optional"
          maxLength={280}
          disabled={disabled}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-muted">
          Set status when adding
        </span>
        <select
          value={values.defaultStatus}
          onChange={(event) =>
            patch({
              defaultStatus: event.target
                .value as ListEditorValues['defaultStatus'],
            })
          }
          className={fieldClass}
          disabled={disabled}
        >
          <option value="">Leave unchanged</option>
          {MEDIA_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-muted">
          Set downloaded when adding
        </span>
        <select
          value={values.defaultDownloaded}
          onChange={(event) =>
            patch({
              defaultDownloaded: event.target
                .value as ListEditorValues['defaultDownloaded'],
            })
          }
          className={fieldClass}
          disabled={disabled}
        >
          <option value="">Leave unchanged</option>
          <option value="true">Downloaded</option>
          <option value="false">Not downloaded</option>
        </select>
      </label>
      <p className="text-xs text-muted">
        New titles get this list’s status and downloaded flag on this list only.
        You can still switch a title to Watching in this list without changing
        its status in other lists.
      </p>
    </>
  );
}
