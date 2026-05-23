export const API_STORAGE_KEYS = {
  token: 'bisora.apiToken',
  tenantId: 'bisora.tenantId',
} as const;

type ApiStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type ApiFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiTenant {
  id: number;
  name?: string;
  slug: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name?: string;
    email: string;
    is_platform_owner?: boolean;
  };
  tenants: ApiTenant[];
}

export interface ApiProductPayload {
  category_id?: number | null;
  title: string;
  slug: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  stock?: number;
  status?: 'active' | 'draft' | 'hidden' | 'unpublished';
  thumbnail_url?: string | null;
  description?: string | null;
  vendor?: string | null;
  product_type?: string | null;
  tags?: string[];
  variants?: unknown[];
  seo_title?: string | null;
  seo_description?: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiClientOptions {
  baseUrl?: string;
  token?: string;
  tenantId?: string;
  storage?: ApiStorage;
  fetcher?: ApiFetch;
}

function getDefaultBaseUrl() {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return env?.VITE_API_URL?.replace(/\/$/, '') || '/api';
}

function getStorage(options: ApiClientOptions): ApiStorage | undefined {
  if (options.storage) return options.storage;
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as Record<string, unknown>;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? getDefaultBaseUrl()).replace(/\/$/, '');
  const storage = getStorage(options);
  const fetcher = options.fetcher ?? fetch;

  async function request<T>(path: string, init: RequestInit & { tenant?: boolean } = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    };
    const token = options.token ?? storage?.getItem(API_STORAGE_KEYS.token);
    const tenantId = options.tenantId ?? storage?.getItem(API_STORAGE_KEYS.tenantId);

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
    const payload = await parseResponse(response);

    if (!response.ok) {
      const errorPayload = (payload ?? {}) as Record<string, unknown>;
      throw new ApiError((errorPayload.message as string | undefined) ?? 'API request failed', response.status, errorPayload);
    }

    return payload as T;
  }

  return {
    request,
    auth: {
      async login(credentials: LoginCredentials) {
        const result = await request<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
        storage?.setItem(API_STORAGE_KEYS.token, result.token);

        const firstTenant = result.tenants[0];
        if (firstTenant) {
          storage?.setItem(API_STORAGE_KEYS.tenantId, String(firstTenant.id));
        }

        return result;
      },
      async logout() {
        await request<void>('/auth/logout', { method: 'POST' });
        storage?.removeItem(API_STORAGE_KEYS.token);
        storage?.removeItem(API_STORAGE_KEYS.tenantId);
      },
    },
    catalog: {
      listProducts() {
        return request<{ data: unknown[] }>('/products');
      },
      createProduct(payload: ApiProductPayload) {
        return request<{ data: unknown }>('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      },
      listCategories() {
        return request<{ data: unknown[] }>('/categories');
      },
    },
  };
}
