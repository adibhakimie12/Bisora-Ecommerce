import { createApiClient, resolveApiBaseUrl, type ApiClientOptions } from './http';

type ApiFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface ApiMediaIntent {
  id: number | string;
  upload_url: string;
  headers?: Record<string, string>;
}

interface ApiMediaAsset {
  id: number | string;
  status: string;
  public_url?: string | null;
}

export interface UploadMediaOptions extends ApiClientOptions {
  ownerType?: 'product' | 'category' | 'page' | 'theme' | 'blog' | 'store';
  ownerId?: string;
  visibility?: 'public' | 'private';
}

export interface UploadedMedia {
  id: string;
  publicUrl: string;
  status: string;
}

function resolveUploadUrl(uploadUrl: string, baseUrl: string) {
  if (/^https?:\/\//.test(uploadUrl)) {
    return uploadUrl;
  }

  const base = new URL(baseUrl);
  const normalizedPath = uploadUrl.startsWith('/api/')
    ? uploadUrl.slice('/api'.length)
    : uploadUrl;

  return `${base.origin}${base.pathname.replace(/\/$/, '')}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

export async function uploadMediaFile(file: File, options: UploadMediaOptions = {}): Promise<UploadedMedia> {
  const baseUrl = (options.baseUrl ?? resolveApiBaseUrl({ env: (import.meta as unknown as { env?: Record<string, string | boolean | undefined> }).env })).replace(/\/$/, '');
  const fetcher: ApiFetch = options.fetcher ?? fetch;
  const client = createApiClient({ ...options, baseUrl, fetcher });
  const ownerId = Number(options.ownerId);
  const presign = await client.request<{ data: ApiMediaIntent }>('/media/presign', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      owner_type: options.ownerType,
      ...(Number.isFinite(ownerId) && ownerId > 0 ? { owner_id: ownerId } : {}),
      visibility: options.visibility ?? 'public',
    }),
  });

  const uploadResponse = await fetcher(resolveUploadUrl(presign.data.upload_url, baseUrl), {
    method: 'PUT',
    headers: presign.data.headers ?? { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('File upload failed.');
  }

  const complete = await client.request<{ data: ApiMediaAsset }>('/media/complete', {
    method: 'POST',
    body: JSON.stringify({ media_asset_id: Number(presign.data.id) }),
  });

  return {
    id: String(complete.data.id),
    publicUrl: complete.data.public_url ?? '',
    status: complete.data.status,
  };
}
