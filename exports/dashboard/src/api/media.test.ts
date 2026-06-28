import assert from 'node:assert/strict';
import { uploadMediaFile } from './media';
import { API_STORAGE_KEYS } from './http';

function createMemoryStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  };
}

async function testUploadMediaFilePresignsUploadsAndCompletes() {
  const storage = createMemoryStorage();
  storage.setItem(API_STORAGE_KEYS.token, 'token-abc');
  storage.setItem(API_STORAGE_KEYS.tenantId, '42');
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const file = new File(['image-binary'], 'hero.jpg', { type: 'image/jpeg' });

  const result = await uploadMediaFile(file, {
    baseUrl: 'https://api.bisora.test/api',
    storage,
    ownerType: 'product',
    ownerId: '7',
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });

      if (String(url).endsWith('/media/presign')) {
        return new Response(
          JSON.stringify({
            data: {
              id: 55,
              upload_url: '/api/media/local-upload-placeholder/55',
              headers: { 'Content-Type': 'image/jpeg', 'x-bisora-object-key': '42/public/hero.jpg' },
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (String(url) === 'https://api.bisora.test/api/media/local-upload-placeholder/55') {
        return new Response(JSON.stringify({ media_asset_id: 55 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          data: {
            id: 55,
            status: 'ready',
            public_url: 'https://cdn.bisora.test/42/public/hero.jpg',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    },
  });

  assert.equal(calls[0].url, 'https://api.bisora.test/api/media/presign');
  assert.equal(JSON.parse(calls[0].init.body as string).owner_id, 7);
  assert.equal(calls[1].init.method, 'PUT');
  assert.equal((calls[1].init.headers as Record<string, string>)['x-bisora-object-key'], '42/public/hero.jpg');
  assert.equal(calls[2].url, 'https://api.bisora.test/api/media/complete');
  assert.equal(result.publicUrl, 'https://cdn.bisora.test/42/public/hero.jpg');
}

await testUploadMediaFilePresignsUploadsAndCompletes();

console.log('media api tests passed');
