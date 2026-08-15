'use client';

import type {
  CreateCustomListRequest,
  CustomList,
  MediaStatus,
} from '@mediashelf/shared-types';
import { MEDIA_STATUS_OPTIONS } from '@/lib/media-status';
import { useI18n } from '@/components/locale-provider';

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
  const { t } = useI18n();

  function patch(partial: Partial<ListEditorValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-muted">
          {t('listEditor.name')}
        </span>
        <input
          value={values.name}
          onChange={(event) => patch({ name: event.target.value })}
          className={fieldClass}
          placeholder={t('listEditor.namePlaceholder')}
          maxLength={80}
          required
          disabled={disabled}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-muted">
          {t('listEditor.description')}
        </span>
        <input
          value={values.description}
          onChange={(event) => patch({ description: event.target.value })}
          className={fieldClass}
          placeholder={t('listEditor.descriptionPlaceholder')}
          maxLength={280}
          disabled={disabled}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-muted">
          {t('listEditor.setStatus')}
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
          <option value="">{t('listEditor.leaveUnchanged')}</option>
          {MEDIA_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-muted">
          {t('listEditor.setDownloaded')}
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
          <option value="">{t('listEditor.leaveUnchanged')}</option>
          <option value="true">{t('common.downloaded')}</option>
          <option value="false">{t('common.notDownloaded')}</option>
        </select>
      </label>
      <p className="text-xs text-muted">{t('listEditor.help')}</p>
    </>
  );
}
