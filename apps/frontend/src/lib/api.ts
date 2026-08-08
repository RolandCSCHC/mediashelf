import type {
  AddListItemRequest,
  AddListItemsRequest,
  AuthUser,
  CreateCustomListRequest,
  CustomList,
  CustomListDetail,
  CustomListEntry,
  ImportConfirmRequest,
  ImportConfirmResponse,
  ImportMediaRequest,
  ImportPreviewRequest,
  ImportPreviewResponse,
  ListMediaQuery,
  LogoutResponse,
  MediaItem,
  MediaListMembership,
  TmdbSearchResponse,
  UpdateCustomListRequest,
  UpdateListItemRequest,
  UpdateMediaItemRequest,
} from '@mediashelf/shared-types';

const browserApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${browserApiUrl}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as {
        message?: string | string[];
      };
      if (typeof payload.message === 'string') {
        message = payload.message;
      } else if (Array.isArray(payload.message)) {
        message = payload.message.join(', ');
      }
    } catch {
      // Ignore JSON parse errors.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toQueryString(query: ListMediaQuery): string {
  const params = new URLSearchParams();

  if (query.status) {
    params.set('status', query.status);
  }
  if (query.type) {
    params.set('type', query.type);
  }
  if (query.genre) {
    params.set('genre', query.genre);
  }
  if (query.downloaded !== undefined) {
    params.set('downloaded', String(query.downloaded));
  }
  if (query.listId) {
    params.set('listId', query.listId);
  }
  if (query.sortBy) {
    params.set('sortBy', query.sortBy);
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function getGoogleLoginUrl(): string {
  return `${browserApiUrl}/auth/google`;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${browserApiUrl}/auth/me`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load session (${response.status})`);
    }

    return (await response.json()) as AuthUser;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiFetch<LogoutResponse>('/auth/logout', { method: 'POST' });
}

export async function searchTmdb(
  query: string,
  type: 'ALL' | 'MOVIE' | 'SERIES' = 'ALL',
): Promise<TmdbSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    type,
  });
  return apiFetch<TmdbSearchResponse>(`/tmdb/search?${params.toString()}`);
}

export async function listMedia(
  query: ListMediaQuery = {},
): Promise<MediaItem[]> {
  return apiFetch<MediaItem[]>(`/media${toQueryString(query)}`);
}

export async function getMedia(id: string): Promise<MediaItem> {
  return apiFetch<MediaItem>(`/media/${id}`);
}

export async function importMedia(
  payload: ImportMediaRequest,
): Promise<MediaItem> {
  return apiFetch<MediaItem>('/media', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMedia(
  id: string,
  payload: UpdateMediaItemRequest,
): Promise<MediaItem> {
  return apiFetch<MediaItem>(`/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteMedia(id: string): Promise<void> {
  await apiFetch<void>(`/media/${id}`, { method: 'DELETE' });
}

export async function previewLibraryImport(
  payload: ImportPreviewRequest,
): Promise<ImportPreviewResponse> {
  return apiFetch<ImportPreviewResponse>('/import/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmLibraryImport(
  payload: ImportConfirmRequest,
): Promise<ImportConfirmResponse> {
  return apiFetch<ImportConfirmResponse>('/import/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listCustomLists(): Promise<CustomList[]> {
  return apiFetch<CustomList[]>('/lists');
}

export async function getCustomList(id: string): Promise<CustomListDetail> {
  return apiFetch<CustomListDetail>(`/lists/${id}`);
}

export async function createCustomList(
  payload: CreateCustomListRequest,
): Promise<CustomList> {
  return apiFetch<CustomList>('/lists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomList(
  id: string,
  payload: UpdateCustomListRequest,
): Promise<CustomList> {
  return apiFetch<CustomList>(`/lists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomList(id: string): Promise<void> {
  await apiFetch<void>(`/lists/${id}`, { method: 'DELETE' });
}

export async function addMediaToList(
  listId: string,
  payload: AddListItemRequest,
): Promise<CustomListDetail> {
  return apiFetch<CustomListDetail>(`/lists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addMediaItemsToList(
  listId: string,
  payload: AddListItemsRequest,
): Promise<CustomListDetail> {
  return apiFetch<CustomListDetail>(`/lists/${listId}/items/bulk`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateListItem(
  listId: string,
  mediaItemId: string,
  payload: UpdateListItemRequest,
): Promise<CustomListEntry> {
  return apiFetch<CustomListEntry>(`/lists/${listId}/items/${mediaItemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function removeMediaFromList(
  listId: string,
  mediaItemId: string,
): Promise<void> {
  await apiFetch<void>(`/lists/${listId}/items/${mediaItemId}`, {
    method: 'DELETE',
  });
}

export async function listMediaMemberships(
  mediaItemId: string,
): Promise<MediaListMembership[]> {
  return apiFetch<MediaListMembership[]>(`/lists/for-media/${mediaItemId}`);
}
